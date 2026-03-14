// webaudio.c — Real-time Web Audio API synthesis engine
// Uses SDL2_mixer post-mix callback for zero-conflict audio output.
// Implements: AudioContext, OscillatorNode, GainNode, BiquadFilterNode,
// AudioBufferSourceNode with AudioParam automation (setValueAtTime,
// exponentialRampToValueAtTime, linearRampToValueAtTime).

#include "engine.h"
#include <math.h>
#include <string.h>

#ifndef M_PI
#define M_PI 3.14159265358979323846
#endif

#define WA_MAX_NODES    256
#define WA_MAX_EVENTS   32
#define WA_SAMPLE_RATE  44100

// ---------------------------------------------------------------------------
// Audio Parameter Automation
// ---------------------------------------------------------------------------

typedef enum {
    WA_EVT_SET_VALUE,
    WA_EVT_LINEAR_RAMP,
    WA_EVT_EXPO_RAMP,
} WAEventType;

typedef struct {
    WAEventType type;
    float value;
    double time;  // absolute AudioContext time (seconds)
} WAParamEvent;

typedef struct {
    float base_value;   // .value as set directly
    WAParamEvent events[WA_MAX_EVENTS];
    int event_count;
} WAParam;

// ---------------------------------------------------------------------------
// Audio Node Types
// ---------------------------------------------------------------------------

typedef enum {
    WA_NODE_NONE = 0,
    WA_NODE_OSCILLATOR,
    WA_NODE_GAIN,
    WA_NODE_BIQUAD,
    WA_NODE_BUFFER_SOURCE,
} WANodeType;

typedef struct {
    int id;
    WANodeType type;
    bool active;       // slot in use
    int output_id;     // connected node ID (-1 = none, 0 = destination)

    double start_time; // scheduled start (seconds)
    double stop_time;  // scheduled stop  (0 = not set)
    bool started;      // start() called
    bool playing;      // between start and stop
    bool finished;     // past stop_time, can be recycled

    union {
        struct {
            int waveform;  // 0=sine, 1=square, 2=sawtooth, 3=triangle
            WAParam frequency;
            double phase;
        } osc;

        struct {
            WAParam gain;
        } gain;

        struct {
            int filter_type;  // 0=lowpass, 1=highpass
            WAParam frequency;
            float q;
            // IIR state
            float x1, x2, y1, y2;
            // cached coefficients
            float b0, b1, b2, a1, a2;
            float coeff_freq;  // freq for which coefficients were computed
        } biquad;

        struct {
            float *data;      // mono sample data (allocated)
            int length;       // number of samples
            int sample_rate;
            int position;     // current read position
            bool loop;
        } buf_src;
    };
} WANode;

// ---------------------------------------------------------------------------
// Global State
// ---------------------------------------------------------------------------

static WANode   wa_nodes[WA_MAX_NODES];
static int      wa_next_id = 1;
static double   wa_time = 0.0;         // current AudioContext time
static bool     wa_running = false;     // context state == 'running'
static float    wa_master_gain = 0.28f; // master volume
static bool     wa_initialized = false;

// ---------------------------------------------------------------------------
// Param Processing
// ---------------------------------------------------------------------------

static float wa_compute_param(WAParam *p, double t) {
    float val = p->base_value;

    // Process events in order (they should be sorted by time)
    int consumed = 0;
    float prev_val = val;
    double prev_time = 0;

    for (int i = 0; i < p->event_count; i++) {
        WAParamEvent *e = &p->events[i];

        if (e->type == WA_EVT_SET_VALUE) {
            if (t >= e->time) {
                val = e->value;
                prev_val = val;
                prev_time = e->time;
                consumed = i + 1;
            } else {
                break; // future event
            }
        } else if (e->type == WA_EVT_LINEAR_RAMP) {
            if (t >= e->time) {
                val = e->value;
                prev_val = val;
                prev_time = e->time;
                consumed = i + 1;
            } else {
                // interpolate
                double dt = e->time - prev_time;
                if (dt > 0) {
                    float frac = (float)((t - prev_time) / dt);
                    val = prev_val + (e->value - prev_val) * frac;
                }
                break;
            }
        } else if (e->type == WA_EVT_EXPO_RAMP) {
            if (t >= e->time) {
                val = e->value;
                prev_val = val;
                prev_time = e->time;
                consumed = i + 1;
            } else {
                // exponential interpolation: v0 * (v1/v0)^((t-t0)/(t1-t0))
                double dt = e->time - prev_time;
                if (dt > 0 && prev_val > 0.00001f && e->value > 0.00001f) {
                    float frac = (float)((t - prev_time) / dt);
                    val = prev_val * powf(e->value / prev_val, frac);
                } else {
                    val = e->value;
                }
                break;
            }
        }
    }

    // Remove consumed events
    if (consumed > 0 && consumed <= p->event_count) {
        memmove(p->events, p->events + consumed,
                (p->event_count - consumed) * sizeof(WAParamEvent));
        p->event_count -= consumed;
    }

    return val;
}

static void wa_param_add_event(WAParam *p, WAEventType type, float value, double time) {
    if (p->event_count >= WA_MAX_EVENTS) {
        // Drop oldest
        memmove(p->events, p->events + 1, (WA_MAX_EVENTS - 1) * sizeof(WAParamEvent));
        p->event_count = WA_MAX_EVENTS - 1;
    }
    WAParamEvent *e = &p->events[p->event_count++];
    e->type = type;
    e->value = value;
    e->time = time;
}

// ---------------------------------------------------------------------------
// Waveform Generation
// ---------------------------------------------------------------------------

static float wa_oscillator_sample(WANode *n, double t, double dt) {
    float freq = wa_compute_param(&n->osc.frequency, t);
    if (freq < 0.01f) return 0.0f;  // rest note

    double phase = n->osc.phase;
    float sample = 0.0f;

    switch (n->osc.waveform) {
        case 0: // sine
            sample = sinf(2.0f * M_PI * phase);
            break;
        case 1: // square
            sample = (phase < 0.5) ? 1.0f : -1.0f;
            break;
        case 2: // sawtooth
            sample = 2.0f * (float)phase - 1.0f;
            break;
        case 3: // triangle
            sample = (phase < 0.5f)
                ? (4.0f * (float)phase - 1.0f)
                : (3.0f - 4.0f * (float)phase);
            break;
    }

    // Advance phase
    n->osc.phase += freq * dt;
    n->osc.phase -= floor(n->osc.phase);  // wrap [0, 1)

    return sample;
}

// ---------------------------------------------------------------------------
// Biquad Filter
// ---------------------------------------------------------------------------

static void wa_biquad_compute_coefficients(WANode *n, float freq) {
    float fs = (float)WA_SAMPLE_RATE;
    float f0 = freq;
    if (f0 < 1.0f) f0 = 1.0f;
    if (f0 > fs * 0.49f) f0 = fs * 0.49f;

    float Q = n->biquad.q;
    if (Q < 0.001f) Q = 0.7071f;

    float w0 = 2.0f * M_PI * f0 / fs;
    float cosw = cosf(w0);
    float sinw = sinf(w0);
    float alpha = sinw / (2.0f * Q);

    float a0;
    if (n->biquad.filter_type == 1) {
        // Highpass
        n->biquad.b0 = (1.0f + cosw) / 2.0f;
        n->biquad.b1 = -(1.0f + cosw);
        n->biquad.b2 = (1.0f + cosw) / 2.0f;
    } else {
        // Lowpass (default)
        n->biquad.b0 = (1.0f - cosw) / 2.0f;
        n->biquad.b1 = 1.0f - cosw;
        n->biquad.b2 = (1.0f - cosw) / 2.0f;
    }
    a0 = 1.0f + alpha;
    n->biquad.a1 = -2.0f * cosw;
    n->biquad.a2 = 1.0f - alpha;

    // Normalize
    n->biquad.b0 /= a0;
    n->biquad.b1 /= a0;
    n->biquad.b2 /= a0;
    n->biquad.a1 /= a0;
    n->biquad.a2 /= a0;

    n->biquad.coeff_freq = freq;
}

static float wa_biquad_process(WANode *n, float input, double t) {
    float freq = wa_compute_param(&n->biquad.frequency, t);

    // Recompute coefficients if frequency changed
    if (fabsf(freq - n->biquad.coeff_freq) > 0.5f) {
        wa_biquad_compute_coefficients(n, freq);
    }

    float output = n->biquad.b0 * input
                 + n->biquad.b1 * n->biquad.x1
                 + n->biquad.b2 * n->biquad.x2
                 - n->biquad.a1 * n->biquad.y1
                 - n->biquad.a2 * n->biquad.y2;

    n->biquad.x2 = n->biquad.x1;
    n->biquad.x1 = input;
    n->biquad.y2 = n->biquad.y1;
    n->biquad.y1 = output;

    return output;
}

// ---------------------------------------------------------------------------
// Buffer Source
// ---------------------------------------------------------------------------

static float wa_buffer_source_sample(WANode *n) {
    if (!n->buf_src.data || n->buf_src.length == 0) return 0.0f;

    if (n->buf_src.position >= n->buf_src.length) {
        if (n->buf_src.loop) {
            n->buf_src.position = 0;
        } else {
            n->finished = true;
            return 0.0f;
        }
    }

    float s = n->buf_src.data[n->buf_src.position++];
    return s;
}

// ---------------------------------------------------------------------------
// Node Graph Processing
// ---------------------------------------------------------------------------

// Process a single source node and follow its output chain, returning the
// final sample value that should be mixed into the output.
static float wa_process_source(WANode *src, double t, double dt) {
    // Generate source sample
    float sample = 0.0f;
    if (src->type == WA_NODE_OSCILLATOR) {
        sample = wa_oscillator_sample(src, t, dt);
    } else if (src->type == WA_NODE_BUFFER_SOURCE) {
        sample = wa_buffer_source_sample(src);
    }

    // Follow output chain
    int next_id = src->output_id;
    int chain_limit = 8;  // prevent infinite loops
    while (next_id > 0 && chain_limit-- > 0) {
        // Find node by ID
        WANode *n = NULL;
        for (int i = 0; i < WA_MAX_NODES; i++) {
            if (wa_nodes[i].active && wa_nodes[i].id == next_id) {
                n = &wa_nodes[i];
                break;
            }
        }
        if (!n) break;

        if (n->type == WA_NODE_GAIN) {
            float g = wa_compute_param(&n->gain.gain, t);
            sample *= g;
        } else if (n->type == WA_NODE_BIQUAD) {
            sample = wa_biquad_process(n, sample, t);
        }

        next_id = n->output_id;
    }

    return sample;
}

// ---------------------------------------------------------------------------
// SDL Post-Mix Callback
// ---------------------------------------------------------------------------

static void wa_post_mix_callback(void *udata, Uint8 *stream, int len) {
    (void)udata;
    if (!wa_running) return;

    // MIX_DEFAULT_FORMAT is AUDIO_S16LSB, stereo
    Sint16 *buf = (Sint16 *)stream;
    int frames = len / (2 * sizeof(Sint16));  // stereo frames
    double dt = 1.0 / (double)WA_SAMPLE_RATE;

    for (int f = 0; f < frames; f++) {
        double t = wa_time;
        float mix = 0.0f;

        // Process all source nodes
        for (int i = 0; i < WA_MAX_NODES; i++) {
            WANode *n = &wa_nodes[i];
            if (!n->active || n->finished) continue;
            if (n->type != WA_NODE_OSCILLATOR && n->type != WA_NODE_BUFFER_SOURCE) continue;
            if (!n->started) continue;

            // Check start/stop times
            if (t < n->start_time) continue;
            if (!n->playing) {
                n->playing = true;
            }
            if (n->stop_time > 0 && t >= n->stop_time) {
                n->playing = false;
                n->finished = true;
                continue;
            }

            mix += wa_process_source(n, t, dt);
        }

        // Apply master gain and clamp
        mix *= wa_master_gain;
        if (mix > 1.0f) mix = 1.0f;
        if (mix < -1.0f) mix = -1.0f;

        // Convert to Sint16 and ADD to existing stream (don't replace)
        Sint16 sample = (Sint16)(mix * 32000.0f);
        buf[f * 2 + 0] += sample;  // left
        buf[f * 2 + 1] += sample;  // right

        wa_time += dt;
    }

    // Garbage collect finished nodes
    for (int i = 0; i < WA_MAX_NODES; i++) {
        if (wa_nodes[i].active && wa_nodes[i].finished) {
            if (wa_nodes[i].type == WA_NODE_BUFFER_SOURCE && wa_nodes[i].buf_src.data) {
                free(wa_nodes[i].buf_src.data);
            }
            memset(&wa_nodes[i], 0, sizeof(WANode));
        }
    }
}

// ---------------------------------------------------------------------------
// Node Management (called from JS via native functions)
// ---------------------------------------------------------------------------

static WANode *wa_alloc_node(WANodeType type) {
    for (int i = 0; i < WA_MAX_NODES; i++) {
        if (!wa_nodes[i].active) {
            memset(&wa_nodes[i], 0, sizeof(WANode));
            wa_nodes[i].id = wa_next_id++;
            wa_nodes[i].type = type;
            wa_nodes[i].active = true;
            wa_nodes[i].output_id = -1;
            return &wa_nodes[i];
        }
    }
    return NULL;
}

static WANode *wa_find_node(int id) {
    for (int i = 0; i < WA_MAX_NODES; i++) {
        if (wa_nodes[i].active && wa_nodes[i].id == id)
            return &wa_nodes[i];
    }
    return NULL;
}

// ---------------------------------------------------------------------------
// Native Functions exposed to JS
// ---------------------------------------------------------------------------

// __waInit() — initialize the synthesis engine
static void native_wa_init(GPtrArray *args, gpointer user_data) {
    if (wa_initialized) return;
    memset(wa_nodes, 0, sizeof(wa_nodes));
    wa_time = 0.0;
    wa_running = true;
    wa_initialized = true;
    Mix_SetPostMix(wa_post_mix_callback, NULL);
    fprintf(stderr, "[WebAudio] Synthesis engine initialized (44100 Hz stereo)\n");
}

// __waGetTime() → double
static JSCValue *native_wa_get_time(GPtrArray *args, gpointer user_data) {
    return jsc_value_new_number(jsc_context_get_current(), wa_time);
}

// __waSetMasterGain(value)
static void native_wa_set_master_gain(GPtrArray *args, gpointer user_data) {
    if (args->len < 1) return;
    wa_master_gain = (float)jsc_value_to_double(g_ptr_array_index(args, 0));
}

// __waCreateOsc() → node ID
static JSCValue *native_wa_create_osc(GPtrArray *args, gpointer user_data) {
    SDL_LockAudio();
    WANode *n = wa_alloc_node(WA_NODE_OSCILLATOR);
    SDL_UnlockAudio();
    if (!n) return jsc_value_new_number(jsc_context_get_current(), 0);
    n->osc.frequency.base_value = 440.0f;
    return jsc_value_new_number(jsc_context_get_current(), n->id);
}

// __waCreateGain() → node ID
static JSCValue *native_wa_create_gain(GPtrArray *args, gpointer user_data) {
    SDL_LockAudio();
    WANode *n = wa_alloc_node(WA_NODE_GAIN);
    SDL_UnlockAudio();
    if (!n) return jsc_value_new_number(jsc_context_get_current(), 0);
    n->gain.gain.base_value = 1.0f;
    return jsc_value_new_number(jsc_context_get_current(), n->id);
}

// __waCreateBiquad() → node ID
static JSCValue *native_wa_create_biquad(GPtrArray *args, gpointer user_data) {
    SDL_LockAudio();
    WANode *n = wa_alloc_node(WA_NODE_BIQUAD);
    SDL_UnlockAudio();
    if (!n) return jsc_value_new_number(jsc_context_get_current(), 0);
    n->biquad.frequency.base_value = 350.0f;
    n->biquad.q = 1.0f;
    n->biquad.coeff_freq = -1.0f;  // force recompute
    return jsc_value_new_number(jsc_context_get_current(), n->id);
}

// __waCreateBufSrc() → node ID
static JSCValue *native_wa_create_buf_src(GPtrArray *args, gpointer user_data) {
    SDL_LockAudio();
    WANode *n = wa_alloc_node(WA_NODE_BUFFER_SOURCE);
    SDL_UnlockAudio();
    if (!n) return jsc_value_new_number(jsc_context_get_current(), 0);
    return jsc_value_new_number(jsc_context_get_current(), n->id);
}

// __waSetOscType(nodeId, type_string_as_int: 0=sine, 1=square, 2=sawtooth, 3=triangle)
static void native_wa_set_osc_type(GPtrArray *args, gpointer user_data) {
    if (args->len < 2) return;
    int id = jsc_value_to_int32(g_ptr_array_index(args, 0));
    int type = jsc_value_to_int32(g_ptr_array_index(args, 1));
    WANode *n = wa_find_node(id);
    if (n && n->type == WA_NODE_OSCILLATOR) n->osc.waveform = type;
}

// __waSetFilterType(nodeId, type: 0=lowpass, 1=highpass)
static void native_wa_set_filter_type(GPtrArray *args, gpointer user_data) {
    if (args->len < 2) return;
    int id = jsc_value_to_int32(g_ptr_array_index(args, 0));
    int type = jsc_value_to_int32(g_ptr_array_index(args, 1));
    WANode *n = wa_find_node(id);
    if (n && n->type == WA_NODE_BIQUAD) {
        n->biquad.filter_type = type;
        n->biquad.coeff_freq = -1.0f;  // force recompute
    }
}

// __waSetFilterQ(nodeId, q)
static void native_wa_set_filter_q(GPtrArray *args, gpointer user_data) {
    if (args->len < 2) return;
    int id = jsc_value_to_int32(g_ptr_array_index(args, 0));
    float q = (float)jsc_value_to_double(g_ptr_array_index(args, 1));
    WANode *n = wa_find_node(id);
    if (n && n->type == WA_NODE_BIQUAD) {
        n->biquad.q = q;
        n->biquad.coeff_freq = -1.0f;
    }
}

// __waParamSetValue(nodeId, paramIndex, value)
// paramIndex: 0 = primary param (frequency for osc/biquad, gain for gain)
static void native_wa_param_set_value(GPtrArray *args, gpointer user_data) {
    if (args->len < 3) return;
    int id = jsc_value_to_int32(g_ptr_array_index(args, 0));
    int pi = jsc_value_to_int32(g_ptr_array_index(args, 1));
    float val = (float)jsc_value_to_double(g_ptr_array_index(args, 2));

    WANode *n = wa_find_node(id);
    if (!n) return;

    WAParam *p = NULL;
    if (n->type == WA_NODE_OSCILLATOR && pi == 0) p = &n->osc.frequency;
    else if (n->type == WA_NODE_GAIN && pi == 0) p = &n->gain.gain;
    else if (n->type == WA_NODE_BIQUAD && pi == 0) p = &n->biquad.frequency;
    if (p) p->base_value = val;
}

// __waParamSetAtTime(nodeId, paramIndex, value, time)
static void native_wa_param_set_at_time(GPtrArray *args, gpointer user_data) {
    if (args->len < 4) return;
    int id = jsc_value_to_int32(g_ptr_array_index(args, 0));
    int pi = jsc_value_to_int32(g_ptr_array_index(args, 1));
    float val = (float)jsc_value_to_double(g_ptr_array_index(args, 2));
    double time = jsc_value_to_double(g_ptr_array_index(args, 3));

    WANode *n = wa_find_node(id);
    if (!n) return;

    WAParam *p = NULL;
    if (n->type == WA_NODE_OSCILLATOR && pi == 0) p = &n->osc.frequency;
    else if (n->type == WA_NODE_GAIN && pi == 0) p = &n->gain.gain;
    else if (n->type == WA_NODE_BIQUAD && pi == 0) p = &n->biquad.frequency;

    if (p) {
        SDL_LockAudio();
        wa_param_add_event(p, WA_EVT_SET_VALUE, val, time);
        SDL_UnlockAudio();
    }
}

// __waParamLinearRamp(nodeId, paramIndex, value, endTime)
static void native_wa_param_linear_ramp(GPtrArray *args, gpointer user_data) {
    if (args->len < 4) return;
    int id = jsc_value_to_int32(g_ptr_array_index(args, 0));
    int pi = jsc_value_to_int32(g_ptr_array_index(args, 1));
    float val = (float)jsc_value_to_double(g_ptr_array_index(args, 2));
    double time = jsc_value_to_double(g_ptr_array_index(args, 3));

    WANode *n = wa_find_node(id);
    if (!n) return;

    WAParam *p = NULL;
    if (n->type == WA_NODE_OSCILLATOR && pi == 0) p = &n->osc.frequency;
    else if (n->type == WA_NODE_GAIN && pi == 0) p = &n->gain.gain;
    else if (n->type == WA_NODE_BIQUAD && pi == 0) p = &n->biquad.frequency;

    if (p) {
        SDL_LockAudio();
        wa_param_add_event(p, WA_EVT_LINEAR_RAMP, val, time);
        SDL_UnlockAudio();
    }
}

// __waParamExpoRamp(nodeId, paramIndex, value, endTime)
static void native_wa_param_expo_ramp(GPtrArray *args, gpointer user_data) {
    if (args->len < 4) return;
    int id = jsc_value_to_int32(g_ptr_array_index(args, 0));
    int pi = jsc_value_to_int32(g_ptr_array_index(args, 1));
    float val = (float)jsc_value_to_double(g_ptr_array_index(args, 2));
    double time = jsc_value_to_double(g_ptr_array_index(args, 3));

    WANode *n = wa_find_node(id);
    if (!n) return;

    WAParam *p = NULL;
    if (n->type == WA_NODE_OSCILLATOR && pi == 0) p = &n->osc.frequency;
    else if (n->type == WA_NODE_GAIN && pi == 0) p = &n->gain.gain;
    else if (n->type == WA_NODE_BIQUAD && pi == 0) p = &n->biquad.frequency;

    if (p) {
        SDL_LockAudio();
        wa_param_add_event(p, WA_EVT_EXPO_RAMP, val, time);
        SDL_UnlockAudio();
    }
}

// __waConnect(srcNodeId, dstNodeId) — 0 means destination
static void native_wa_connect(GPtrArray *args, gpointer user_data) {
    if (args->len < 2) return;
    int src_id = jsc_value_to_int32(g_ptr_array_index(args, 0));
    int dst_id = jsc_value_to_int32(g_ptr_array_index(args, 1));

    WANode *n = wa_find_node(src_id);
    if (n) n->output_id = dst_id;
}

// __waStart(nodeId, time)
static void native_wa_start(GPtrArray *args, gpointer user_data) {
    if (args->len < 2) return;
    int id = jsc_value_to_int32(g_ptr_array_index(args, 0));
    double time = jsc_value_to_double(g_ptr_array_index(args, 1));

    WANode *n = wa_find_node(id);
    if (n) {
        n->start_time = time;
        n->started = true;
    }
}

// __waStop(nodeId, time)
static void native_wa_stop(GPtrArray *args, gpointer user_data) {
    if (args->len < 2) return;
    int id = jsc_value_to_int32(g_ptr_array_index(args, 0));
    double time = jsc_value_to_double(g_ptr_array_index(args, 1));

    WANode *n = wa_find_node(id);
    if (n) {
        n->stop_time = time;
    }
}

// __waSetBuffer(nodeId, float32Array, length, sampleRate)
static void native_wa_set_buffer(GPtrArray *args, gpointer user_data) {
    if (args->len < 4) return;
    int id = jsc_value_to_int32(g_ptr_array_index(args, 0));
    JSCValue *arr = g_ptr_array_index(args, 1);
    int length = jsc_value_to_int32(g_ptr_array_index(args, 2));
    int sr = jsc_value_to_int32(g_ptr_array_index(args, 3));

    WANode *n = wa_find_node(id);
    if (!n || n->type != WA_NODE_BUFFER_SOURCE) return;

    // Copy Float32Array data
    gsize byte_len = 0;
    float *data = (float *)jsc_value_typed_array_get_data(arr, &byte_len);
    if (!data || length <= 0) return;

    SDL_LockAudio();
    if (n->buf_src.data) free(n->buf_src.data);
    n->buf_src.data = malloc(length * sizeof(float));
    memcpy(n->buf_src.data, data, length * sizeof(float));
    n->buf_src.length = length;
    n->buf_src.sample_rate = sr;
    n->buf_src.position = 0;
    SDL_UnlockAudio();
}

// __waSetState(running: 0 or 1)
static void native_wa_set_state(GPtrArray *args, gpointer user_data) {
    if (args->len < 1) return;
    wa_running = jsc_value_to_int32(g_ptr_array_index(args, 0)) != 0;
}

// ---------------------------------------------------------------------------
// Registration
// ---------------------------------------------------------------------------

#define REG_FUNC_V(name, cb, ret_type) do { \
    JSCValue *fn = jsc_value_new_function_variadic(ctx, name, G_CALLBACK(cb), NULL, NULL, ret_type); \
    jsc_context_set_value(ctx, name, fn); \
    g_object_unref(fn); \
} while (0)

void register_webaudio_shim(JSCContext *ctx) {
    // Register native functions
    REG_FUNC_V("__waInit",            native_wa_init,            G_TYPE_NONE);
    REG_FUNC_V("__waGetTime",         native_wa_get_time,        JSC_TYPE_VALUE);
    REG_FUNC_V("__waSetMasterGain",   native_wa_set_master_gain, G_TYPE_NONE);
    REG_FUNC_V("__waCreateOsc",       native_wa_create_osc,      JSC_TYPE_VALUE);
    REG_FUNC_V("__waCreateGain",      native_wa_create_gain,     JSC_TYPE_VALUE);
    REG_FUNC_V("__waCreateBiquad",    native_wa_create_biquad,   JSC_TYPE_VALUE);
    REG_FUNC_V("__waCreateBufSrc",    native_wa_create_buf_src,  JSC_TYPE_VALUE);
    REG_FUNC_V("__waSetOscType",      native_wa_set_osc_type,    G_TYPE_NONE);
    REG_FUNC_V("__waSetFilterType",   native_wa_set_filter_type, G_TYPE_NONE);
    REG_FUNC_V("__waSetFilterQ",      native_wa_set_filter_q,    G_TYPE_NONE);
    REG_FUNC_V("__waParamSetValue",   native_wa_param_set_value, G_TYPE_NONE);
    REG_FUNC_V("__waParamSetAtTime",  native_wa_param_set_at_time,  G_TYPE_NONE);
    REG_FUNC_V("__waParamLinearRamp", native_wa_param_linear_ramp,  G_TYPE_NONE);
    REG_FUNC_V("__waParamExpoRamp",   native_wa_param_expo_ramp,    G_TYPE_NONE);
    REG_FUNC_V("__waConnect",         native_wa_connect,         G_TYPE_NONE);
    REG_FUNC_V("__waStart",           native_wa_start,           G_TYPE_NONE);
    REG_FUNC_V("__waStop",            native_wa_stop,            G_TYPE_NONE);
    REG_FUNC_V("__waSetBuffer",       native_wa_set_buffer,      G_TYPE_NONE);
    REG_FUNC_V("__waSetState",        native_wa_set_state,       G_TYPE_NONE);

    // JS wrapper: Web Audio API classes backed by native synthesis engine
    jsc_context_evaluate(ctx,
        // --- AudioParam wrapper ---
        "function _WAParam(nodeId, paramIdx, defaultVal) {"
        "  this._nid = nodeId; this._pi = paramIdx; this._v = defaultVal || 0;"
        "  Object.defineProperty(this, 'value', {"
        "    get: function() { return this._v; },"
        "    set: function(v) { this._v = v; __waParamSetValue(this._nid, this._pi, v); }"
        "  });"
        "}"
        "_WAParam.prototype.setValueAtTime = function(v, t) {"
        "  this._v = v; __waParamSetAtTime(this._nid, this._pi, v, t); return this;"
        "};"
        "_WAParam.prototype.linearRampToValueAtTime = function(v, t) {"
        "  __waParamLinearRamp(this._nid, this._pi, v, t); return this;"
        "};"
        "_WAParam.prototype.exponentialRampToValueAtTime = function(v, t) {"
        "  __waParamExpoRamp(this._nid, this._pi, v, t); return this;"
        "};"
        "_WAParam.prototype.setTargetAtTime = function(v, t, tc) {"
        "  __waParamExpoRamp(this._nid, this._pi, v, t + tc * 3); return this;"
        "};"
        "_WAParam.prototype.cancelScheduledValues = function() { return this; };"

        // --- OscillatorNode ---
        "function _WAOsc(id) {"
        "  this._id = id; this._type = 'sine';"
        "  this.frequency = new _WAParam(id, 0, 440);"
        "  this.detune = { value: 0, setValueAtTime: function(){}, linearRampToValueAtTime: function(){}, exponentialRampToValueAtTime: function(){}, cancelScheduledValues: function(){} };"
        "  Object.defineProperty(this, 'type', {"
        "    get: function() { return this._type; },"
        "    set: function(t) {"
        "      this._type = t;"
        "      var m = {sine:0,square:1,sawtooth:2,triangle:3};"
        "      __waSetOscType(this._id, m[t] || 0);"
        "    }"
        "  });"
        "}"
        "_WAOsc.prototype.connect = function(dest) { __waConnect(this._id, dest._id || 0); return dest; };"
        "_WAOsc.prototype.disconnect = function() { __waConnect(this._id, -1); };"
        "_WAOsc.prototype.start = function(t) { __waStart(this._id, t || 0); };"
        "_WAOsc.prototype.stop = function(t) { __waStop(this._id, t || 0); };"
        "_WAOsc.prototype.addEventListener = function() {};"
        "_WAOsc.prototype.removeEventListener = function() {};"

        // --- GainNode ---
        "function _WAGain(id) {"
        "  this._id = id;"
        "  this.gain = new _WAParam(id, 0, 1);"
        "}"
        "_WAGain.prototype.connect = function(dest) { __waConnect(this._id, dest._id || 0); return dest; };"
        "_WAGain.prototype.disconnect = function() { __waConnect(this._id, -1); };"

        // --- BiquadFilterNode ---
        "function _WABiquad(id) {"
        "  this._id = id; this._type = 'lowpass';"
        "  this.frequency = new _WAParam(id, 0, 350);"
        "  this.Q = { value: 1, setValueAtTime: function(){} };"
        "  this.gain = { value: 0, setValueAtTime: function(){} };"
        "  Object.defineProperty(this, 'type', {"
        "    get: function() { return this._type; },"
        "    set: function(t) {"
        "      this._type = t;"
        "      var m = {lowpass:0,highpass:1,bandpass:2};"
        "      __waSetFilterType(this._id, m[t] || 0);"
        "    }"
        "  });"
        "}"
        "_WABiquad.prototype.connect = function(dest) { __waConnect(this._id, dest._id || 0); return dest; };"
        "_WABiquad.prototype.disconnect = function() { __waConnect(this._id, -1); };"

        // --- AudioBufferSourceNode ---
        "function _WABufSrc(id) {"
        "  this._id = id; this._buf = null; this.loop = false;"
        "  this.playbackRate = { value: 1, setValueAtTime: function(){}, linearRampToValueAtTime: function(){}, exponentialRampToValueAtTime: function(){}, cancelScheduledValues: function(){} };"
        "  this.onended = null;"
        "  Object.defineProperty(this, 'buffer', {"
        "    get: function() { return this._buf; },"
        "    set: function(b) {"
        "      this._buf = b;"
        "      if (b && b._channels && b._channels[0]) {"
        "        __waSetBuffer(this._id, b._channels[0], b.length, b.sampleRate);"
        "      }"
        "    }"
        "  });"
        "}"
        "_WABufSrc.prototype.connect = function(dest) { __waConnect(this._id, dest._id || 0); return dest; };"
        "_WABufSrc.prototype.disconnect = function() { __waConnect(this._id, -1); };"
        "_WABufSrc.prototype.start = function(t) { __waStart(this._id, t || 0); };"
        "_WABufSrc.prototype.stop = function(t) { __waStop(this._id, t || 0); };"
        "_WABufSrc.prototype.addEventListener = function() {};"
        "_WABufSrc.prototype.removeEventListener = function() {};"

        // --- AudioContext ---
        "window.AudioContext = function() {"
        "  __waInit();"
        "  this.sampleRate = 44100;"
        "  this.state = 'running';"
        "  this.destination = { _id: 0, _type: 'destination' };"
        "  this.listener = { setPosition: function(){}, setOrientation: function(){} };"
        "};"
        "Object.defineProperty(window.AudioContext.prototype, 'currentTime', {"
        "  get: function() { return __waGetTime(); }"
        "});"
        "window.AudioContext.prototype.createOscillator = function() {"
        "  return new _WAOsc(__waCreateOsc());"
        "};"
        "window.AudioContext.prototype.createGain = function() {"
        "  return new _WAGain(__waCreateGain());"
        "};"
        "window.AudioContext.prototype.createBiquadFilter = function() {"
        "  return new _WABiquad(__waCreateBiquad());"
        "};"
        "window.AudioContext.prototype.createBufferSource = function() {"
        "  return new _WABufSrc(__waCreateBufSrc());"
        "};"
        "window.AudioContext.prototype.createBuffer = function(numCh, length, sr) {"
        "  var channels = [];"
        "  for (var i = 0; i < numCh; i++) channels.push(new Float32Array(length));"
        "  return {"
        "    numberOfChannels: numCh, length: length, sampleRate: sr,"
        "    duration: length / sr,"
        "    _channels: channels,"
        "    getChannelData: function(ch) { return channels[ch] || channels[0]; },"
        "    copyFromChannel: function(){}, copyToChannel: function(){}"
        "  };"
        "};"
        "window.AudioContext.prototype.resume = function() {"
        "  this.state = 'running'; __waSetState(1); return Promise.resolve();"
        "};"
        "window.AudioContext.prototype.suspend = function() {"
        "  this.state = 'suspended'; __waSetState(0); return Promise.resolve();"
        "};"
        "window.AudioContext.prototype.close = function() {"
        "  this.state = 'closed'; __waSetState(0); return Promise.resolve();"
        "};"
        "window.AudioContext.prototype.decodeAudioData = function(buf, ok, err) {"
        "  var nativeId = 0;"
        "  if (buf) { var u8 = new Uint8Array(buf.byteLength ? buf : (buf.buffer || buf)); nativeId = __audioLoadFromBuffer(u8); }"
        "  var ab = { duration: 1.0, length: 44100, numberOfChannels: 2, sampleRate: 44100, _nativeId: nativeId,"
        "    getChannelData: function() { return new Float32Array(44100); } };"
        "  if (ok) setTimeout(function(){ ok(ab); }, 0);"
        "  return Promise.resolve(ab);"
        "};"
        // Stub node types that aren't used for synthesis but shouldn't crash
        "window.AudioContext.prototype.createDynamicsCompressor = function() {"
        "  var g = new _WAGain(__waCreateGain()); g.threshold = {value:-24}; g.knee = {value:30};"
        "  g.ratio = {value:12}; g.attack = {value:0.003}; g.release = {value:0.25}; return g;"
        "};"
        "window.AudioContext.prototype.createStereoPanner = function() {"
        "  var g = new _WAGain(__waCreateGain()); g.pan = new _WAParam(g._id, 0, 0); return g;"
        "};"
        "window.AudioContext.prototype.createAnalyser = function() {"
        "  return { fftSize:2048, frequencyBinCount:1024,"
        "    getByteFrequencyData:function(){}, getByteTimeDomainData:function(){},"
        "    getFloatFrequencyData:function(){}, getFloatTimeDomainData:function(){},"
        "    connect:function(){return this;}, disconnect:function(){} };"
        "};"
        "window.AudioContext.prototype.createConvolver = function() {"
        "  return { buffer:null, normalize:true, connect:function(){return this;}, disconnect:function(){} };"
        "};"
        "window.AudioContext.prototype.createDelay = function(mt) {"
        "  var g = new _WAGain(__waCreateGain()); g.delayTime = new _WAParam(g._id, 0, 0); return g;"
        "};"
        "window.AudioContext.prototype.createChannelMerger = function() {"
        "  return { connect:function(){return this;}, disconnect:function(){} };"
        "};"
        "window.AudioContext.prototype.createChannelSplitter = function() {"
        "  return { connect:function(){return this;}, disconnect:function(){} };"
        "};"
        "window.AudioContext.prototype.createWaveShaper = function() {"
        "  return { curve:null, oversample:'none', connect:function(){return this;}, disconnect:function(){} };"
        "};"
        "window.webkitAudioContext = window.AudioContext;"
        , -1);
}
