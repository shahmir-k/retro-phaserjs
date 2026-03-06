# PhaserQuest v2: JSC + SDL2 Native Phaser.js Runtime for muOS

## Project Overview

**Goal:** Run unmodified Phaser.js games natively on Allwinner H700-based muOS retro handhelds without a web browser.

**Engine:** WebKit's JavaScriptCore (JSCOnly port) — a production-grade, JIT-enabled JavaScript engine with full ARM64 support and a multi-tier compilation pipeline that delivers near-browser-speed JS execution.

**Why JSC over QuickJS:** QuickJS interprets bytecode ~5-20x slower than JIT engines. For Phaser games, game logic (physics, AI, state machines) runs in JS. JSC's JIT eliminates this bottleneck entirely, making physics-heavy games (Matter.js, Arcade Physics) viable on a 1.5GHz Cortex-A53.

---

## Target Hardware

| Spec | Value |
|------|-------|
| SoC | Allwinner H700 |
| CPU | Quad-core ARM Cortex-A53 @ 1.5GHz (ARMv8-A / AArch64) |
| GPU | Mali-G31 MP2 — OpenGL ES 3.2, Vulkan 1.1 |
| RAM | 1GB LPDDR4 (shared with system + GPU) |
| OS | muOS (custom Linux, kernel ~5.x) |
| Display | 640x480 or 720x720 IPS (device-dependent) |
| Input | D-pad, ABXY, L/R shoulders, start/select, analog sticks |

**RAM budget:** muOS + kernel ≈ 80-120MB. Target **≤200MB** for the full runtime + loaded game.

---

## Why JavaScriptCore

JSC has a 4-tier execution pipeline designed for exactly this kind of workload:

```
   Tier 0: LLInt (Low Level Interpreter)
      ↓  function called 6+ times
   Tier 1: Baseline JIT
      ↓  function called 66+ times / looped 1000+ times
   Tier 2: DFG JIT (Data Flow Graph — speculative optimizer)
      ↓  function invoked thousands of times
   Tier 3: FTL JIT (Faster Than Light — LLVM-grade optimizer)
```

For Phaser games, this means:

- **Frame 1-5:** Phaser's init code runs in the interpreter (fast enough for one-time setup)
- **Frame 6+:** Hot game loop functions (update, render, physics step) get baseline-JIT'd
- **Frame 60+:** The innermost physics/collision loops get DFG-optimized with type speculation
- **Steady state:** Critical paths run as native ARM64 machine code, not interpreted bytecode

On ARM64 benchmarks, JSC with DFG enabled is roughly **10x faster** than interpreter-only execution on compute-heavy workloads. This is the difference between Matter.js running at 15fps vs 60fps.

### JSCOnly Port

WebKit provides a `JSCOnly` build target specifically for embedding JSC without the rest of WebKit:

- **Single dependency:** ICU (International Components for Unicode) — for string handling
- **Build system:** CMake, with official cross-compilation support for ARM64 Linux
- **Static library output:** Links directly into our binary — no shared lib management
- **Proven on ARM64:** JSC powers every iPhone, iPad, and Apple Silicon Mac
- **C API:** Clean embedding API via `JavaScriptCore/JavaScript.h`

---

## Architecture

```
┌──────────────────────────────────────────────────────┐
│                  Phaser.js Game                       │
│             (unmodified JS source)                    │
├──────────────────────────────────────────────────────┤
│                   Phaser.js                           │
│              (unmodified ~1MB)                        │
├──────────────────────────────────────────────────────┤
│              Browser Shim Layer                       │
│                                                      │
│  ┌──────────┐  ┌───────────┐  ┌──────────┐          │
│  │ DOM Shim │  │ WebGL Shim│  │Audio Shim│          │
│  │(JS + C)  │  │   (C)     │  │  (C)     │          │
│  ├──────────┤  ├───────────┤  ├──────────┤          │
│  │window    │  │WebGLCtx   │  │AudioCtx  │          │
│  │document  │  │ → GLES2.0 │  │→SDL_mixer│          │
│  │navigator │  │           │  │          │          │
│  │Image     │  │Canvas2D   │  │HTMLAudio │          │
│  │XHR/fetch │  │ → nanovg  │  │→SDL_mixer│          │
│  │timers    │  │           │  │          │          │
│  └──────────┘  └───────────┘  └──────────┘          │
├──────────────────────────────────────────────────────┤
│           JavaScriptCore (JSCOnly)                    │
│  ┌────────────────────────────────────────────┐      │
│  │  LLInt → Baseline JIT → DFG JIT → FTL JIT │      │
│  │        ES2023+ · ARM64 native codegen      │      │
│  └────────────────────────────────────────────┘      │
├──────────────────────────────────────────────────────┤
│            Native C/C++ Platform Layer                │
│  ┌─────────┐  ┌──────────┐  ┌─────────┐             │
│  │  SDL2   │  │ EGL/GLES │  │stb_image│             │
│  │(window, │  │ (GPU     │  │(decode) │             │
│  │ input,  │  │ render)  │  │         │             │
│  │ audio)  │  │          │  │stb_true │             │
│  │         │  │          │  │type     │             │
│  └─────────┘  └──────────┘  └─────────┘             │
├──────────────────────────────────────────────────────┤
│          Linux / muOS / Mali-G31 Driver               │
└──────────────────────────────────────────────────────┘
```

---

## JSC Embedding API

Unlike QuickJS's plain C API, JSC provides a well-documented C API. Here's how the core integration works:

### Engine Initialization

```c
#include <JavaScriptCore/JavaScript.h>

// Create a VM and global context
JSContextGroupRef group = JSContextGroupCreate();
JSGlobalContextRef ctx = JSGlobalContextCreateInGroup(group, NULL);
JSObjectRef global = JSContextGetGlobalObject(ctx);

// Register a native function (e.g., console.log)
JSStringRef logName = JSStringCreateWithUTF8CString("log");
JSObjectRef logFunc = JSObjectMakeFunctionWithCallback(ctx, logName,
    &native_console_log);

// Create console object and attach log
JSStringRef consoleName = JSStringCreateWithUTF8CString("console");
JSObjectRef consoleObj = JSObjectMake(ctx, NULL, NULL);
JSObjectSetProperty(ctx, consoleObj, logName, logFunc, 0, NULL);
JSObjectSetProperty(ctx, global, consoleName, consoleObj, 0, NULL);

JSStringRelease(logName);
JSStringRelease(consoleName);
```

### Evaluating Scripts

```c
JSStringRef script = JSStringCreateWithUTF8CString(phaser_js_source);
JSValueRef exception = NULL;

JSValueRef result = JSEvaluateScript(ctx, script, NULL, NULL, 0, &exception);
if (exception) {
    // Handle error - extract message string
    JSStringRef errStr = JSValueToStringCopy(ctx, exception, NULL);
    // ... log error
    JSStringRelease(errStr);
}
JSStringRelease(script);
```

### Registering Native Classes (WebGL Context Example)

```c
// Define the WebGLRenderingContext class
JSClassDefinition webglClassDef = kJSClassDefinitionEmpty;
webglClassDef.className = "WebGLRenderingContext";
webglClassDef.staticFunctions = webgl_functions;  // array of function bindings
webglClassDef.staticValues = webgl_constants;       // GL enum values

JSClassRef webglClass = JSClassCreate(&webglClassDef);

// Static function table - each entry maps JS name → C callback
static JSStaticFunction webgl_functions[] = {
    { "bindTexture",        js_gl_bindTexture,        kJSPropertyAttributeReadOnly },
    { "bufferData",         js_gl_bufferData,         kJSPropertyAttributeReadOnly },
    { "clear",              js_gl_clear,              kJSPropertyAttributeReadOnly },
    { "clearColor",         js_gl_clearColor,         kJSPropertyAttributeReadOnly },
    { "compileShader",      js_gl_compileShader,      kJSPropertyAttributeReadOnly },
    { "createBuffer",       js_gl_createBuffer,       kJSPropertyAttributeReadOnly },
    { "createProgram",      js_gl_createProgram,      kJSPropertyAttributeReadOnly },
    { "createShader",       js_gl_createShader,       kJSPropertyAttributeReadOnly },
    { "createTexture",      js_gl_createTexture,      kJSPropertyAttributeReadOnly },
    { "drawArrays",         js_gl_drawArrays,         kJSPropertyAttributeReadOnly },
    { "drawElements",       js_gl_drawElements,       kJSPropertyAttributeReadOnly },
    { "enable",             js_gl_enable,             kJSPropertyAttributeReadOnly },
    { "enableVertexAttribArray", js_gl_enableVertexAttribArray, kJSPropertyAttributeReadOnly },
    { "getAttribLocation",  js_gl_getAttribLocation,  kJSPropertyAttributeReadOnly },
    { "getUniformLocation", js_gl_getUniformLocation, kJSPropertyAttributeReadOnly },
    { "linkProgram",        js_gl_linkProgram,        kJSPropertyAttributeReadOnly },
    { "shaderSource",       js_gl_shaderSource,       kJSPropertyAttributeReadOnly },
    { "texImage2D",         js_gl_texImage2D,         kJSPropertyAttributeReadOnly },
    { "uniform1f",          js_gl_uniform1f,          kJSPropertyAttributeReadOnly },
    { "uniform1i",          js_gl_uniform1i,          kJSPropertyAttributeReadOnly },
    { "uniformMatrix4fv",   js_gl_uniformMatrix4fv,   kJSPropertyAttributeReadOnly },
    { "useProgram",         js_gl_useProgram,         kJSPropertyAttributeReadOnly },
    { "vertexAttribPointer",js_gl_vertexAttribPointer,kJSPropertyAttributeReadOnly },
    { "viewport",           js_gl_viewport,           kJSPropertyAttributeReadOnly },
    // ... ~100 more WebGL functions
    { NULL, NULL, 0 }
};
```

### TypedArray Access (Zero-Copy Path for Vertex Data)

This is critical for performance — Phaser builds Float32Arrays for vertex buffers:

```c
// When Phaser calls gl.bufferData(gl.ARRAY_BUFFER, float32Array, gl.STATIC_DRAW)
JSValueRef js_gl_bufferData(JSContextRef ctx, JSObjectRef function,
                             JSObjectRef thisObj, size_t argc,
                             JSValueConst *argv, JSValueRef *exception) {
    int target = (int)JSValueToNumber(ctx, argv[0], NULL);
    
    // Get raw pointer to TypedArray data — no copy needed
    JSObjectRef typedArray = JSValueToObject(ctx, argv[1], NULL);
    size_t byteLength = 0;
    void *buffer = JSObjectGetTypedArrayBytesPtr(ctx, typedArray, exception);
    byteLength = JSObjectGetTypedArrayByteLength(ctx, typedArray, exception);
    
    int usage = (int)JSValueToNumber(ctx, argv[2], NULL);
    
    // Direct passthrough to OpenGL ES
    glBufferData(target, byteLength, buffer, usage);
    
    return JSValueMakeUndefined(ctx);
}
```

This zero-copy path means Phaser's sprite batching (which builds large vertex arrays every frame) goes straight from JSC's heap to the GPU with no intermediate copies.

---

## WebGL → OpenGL ES 2.0 Shim

### Why This Mapping Is Nearly 1:1

WebGL was deliberately designed as a thin wrapper over OpenGL ES 2.0. The Mali-G31 supports OpenGL ES 3.2 natively. So:

| WebGL | Native | Mapping Complexity |
|-------|--------|-------------------|
| `gl.bindTexture()` | `glBindTexture()` | Direct — identical signature |
| `gl.drawArrays()` | `glDrawArrays()` | Direct — identical signature |
| `gl.shaderSource()` | `glShaderSource()` | Direct — GLSL 100 passes through |
| `gl.texImage2D()` | `glTexImage2D()` | Minor — handle JS Image objects |
| `gl.bufferData()` | `glBufferData()` | Minor — unwrap TypedArray |
| `gl.getParameter()` | `glGetIntegerv()` etc. | Moderate — enum translation |
| `gl.getExtension()` | N/A | Stub — return null or minimal |
| `gl.pixelStorei()` | Custom | `UNPACK_FLIP_Y` needs manual flip |

### Function Categories

**Hot path (~30 functions, called per-frame, need maximum speed):**
`bindTexture`, `activeTexture`, `bindBuffer`, `bufferData`, `bufferSubData`, `drawArrays`, `drawElements`, `useProgram`, `uniformMatrix4fv`, `uniform1i`, `uniform1f`, `uniform2f`, `uniform3f`, `uniform4f`, `uniform2fv`, `uniform3fv`, `uniform4fv`, `vertexAttribPointer`, `enableVertexAttribArray`, `disableVertexAttribArray`, `blendFunc`, `blendFuncSeparate`, `enable`, `disable`, `viewport`, `scissor`, `clear`, `clearColor`, `colorMask`, `depthMask`

**Setup/teardown (~40 functions, called during init or asset loading):**
`createTexture`, `deleteTexture`, `texImage2D`, `texSubImage2D`, `texParameteri`, `generateMipmap`, `createBuffer`, `deleteBuffer`, `createShader`, `deleteShader`, `shaderSource`, `compileShader`, `getShaderParameter`, `getShaderInfoLog`, `createProgram`, `deleteProgram`, `attachShader`, `linkProgram`, `getProgramParameter`, `getProgramInfoLog`, `getAttribLocation`, `getUniformLocation`, `createFramebuffer`, `deleteFramebuffer`, `bindFramebuffer`, `framebufferTexture2D`, `checkFramebufferStatus`, `createRenderbuffer`, `bindRenderbuffer`, `renderbufferStorage`, `framebufferRenderbuffer`, `pixelStorei`, `readPixels`, `getError`

**Stubs (~50 functions, rarely or never used by Phaser):**
`getExtension` (return null), `getSupportedExtensions` (return []), `getContextAttributes`, `isContextLost`, `getShaderPrecisionFormat`, `hint`, `lineWidth`, `polygonOffset`, `sampleCoverage`, `stencilFunc`, `stencilMask`, `stencilOp`, and various `getParameter` queries (return hardcoded Mali-G31 values)

### GLSL Shader Passthrough

Phaser's WebGL renderer uses GLSL ES 1.00 (the `#version 100` shading language). This is exactly what OpenGL ES 2.0 expects. Shaders compile directly on the Mali-G31 with zero modification:

```glsl
// Phaser's default multi-texture pipeline vertex shader — runs as-is
precision mediump float;
attribute vec2 inPosition;
attribute vec2 inTexCoord;
attribute float inTexId;
attribute float inTintEffect;
attribute vec4 inTint;

uniform mat4 uProjectionMatrix;

varying vec2 outTexCoord;
varying float outTexId;
varying float outTintEffect;
varying vec4 outTint;

void main() {
    gl_Position = uProjectionMatrix * vec4(inPosition, 1.0, 1.0);
    outTexCoord = inTexCoord;
    outTexId = inTexId;
    outTint = inTint;
    outTintEffect = inTintEffect;
}
```

---

## DOM Shim Layer

### What Phaser Actually Touches

Phaser has a `customEnvironment: true` config flag that disables some browser detection. Combined with strategic stubbing, the DOM surface is manageable:

### `window` object

```c
// Properties (static or computed)
window.innerWidth          → SDL_GetWindowSize() width
window.innerHeight         → SDL_GetWindowSize() height
window.devicePixelRatio    → 1.0 (handheld screens are 1:1)
window.location            → { href: "file:///game/", protocol: "file:" }
window.navigator           → { userAgent: "PhaserQuest/1.0", language: "en" }
window.performance.now()   → SDL_GetPerformanceCounter() based, microsecond precision
window.document            → the document shim

// Methods
window.requestAnimationFrame(cb)  → queue cb, fire from main loop at vsync
window.cancelAnimationFrame(id)   → remove from queue
window.setTimeout(cb, ms)         → timer queue backed by SDL_GetTicks()
window.setInterval(cb, ms)        → repeating timer queue
window.clearTimeout(id)           → remove timer
window.clearInterval(id)          → remove timer
window.addEventListener(type, cb) → event registry (resize, focus, blur, etc.)
window.removeEventListener(...)   → event registry
window.focus()                    → no-op
window.scrollTo()                 → no-op
```

### `document` object

```c
document.createElement(tag)
  → "canvas":  return the primary canvas shim (backed by EGL surface)
  → "div":     return stub element (no rendering, absorb styles)
  → "img":     return Image shim
  → "audio":   return Audio shim
  → "style":   no-op (we don't do CSS layout)
  → other:     return stub element

document.getElementById(id)       → return primary canvas for known IDs
document.body                     → stub element with appendChild (no-op)
document.documentElement          → stub element
document.readyState               → "complete"
document.hidden                   → false
document.visibilityState          → "visible"
document.addEventListener(...)    → event registry
document.createTextNode(text)     → stub
document.head                     → stub
```

### `HTMLCanvasElement` shim

```c
canvas.getContext("webgl" | "webgl2" | "experimental-webgl")
  → return WebGLRenderingContext wrapping the EGL/GLES context

canvas.getContext("2d")
  → return CanvasRenderingContext2D (nanovg-backed or software)

canvas.width / canvas.height      → framebuffer dimensions
canvas.style                      → stub object that absorbs any writes
canvas.getBoundingClientRect()    → { left:0, top:0, width:W, height:H }
canvas.parentElement              → stub (document.body)
canvas.addEventListener(...)      → forward mouse/touch/pointer events
canvas.toDataURL()                → glReadPixels → base64 encode (for screenshots)
```

### `Image` / `HTMLImageElement`

```c
// Lifecycle:
// 1. JS: var img = new Image();
// 2. JS: img.onload = function() { ... };
// 3. JS: img.src = "assets/player.png";
// 4. C:  resolve path → load file → stb_image decode → RGBA buffer
// 5. C:  store {width, height, pixels} on native side
// 6. C:  queue img.onload() callback for next microtask
// 7. When gl.texImage2D(target, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img):
//    C:  glTexImage2D(target, 0, GL_RGBA, img.width, img.height, 0,
//                     GL_RGBA, GL_UNSIGNED_BYTE, img.pixels);

struct NativeImage {
    uint32_t width;
    uint32_t height;
    uint8_t *pixels;     // RGBA, allocated via stb_image
    bool complete;       // true after decode
    bool naturalWidth;   // alias for width
};
```

### `XMLHttpRequest` / `fetch`

All network requests in Phaser become local file reads:

```c
// XHR.open("GET", "assets/level1.json", true)
//   → resolve "assets/level1.json" relative to game root
//   → validate path doesn't escape game directory (security)
//
// XHR.send()
//   → read file into memory buffer
//   → based on responseType:
//       "text"/"":  set responseText = file contents as string
//       "json":     set response = file contents (Phaser parses itself)
//       "arraybuffer": set response = JSC ArrayBuffer wrapping file bytes
//       "blob":     set response = minimal Blob shim wrapping file bytes
//   → queue onload/onreadystatechange for next microtask
//
// XHR.status → always 200 for found files, 404 for missing
// XHR.readyState → 0→1→2→3→4 (simulated state transitions)
```

Fetch API can be implemented as a thin wrapper around XHR for simplicity. Phaser's loader uses XHR by default.

---

## Event Translation

### SDL2 → DOM Event Mapping

```c
void translate_sdl_event(JSGlobalContextRef ctx, SDL_Event *event) {
    switch (event->type) {
        case SDL_KEYDOWN:
        case SDL_KEYUP: {
            // Build KeyboardEvent-like object
            const char *key = sdl_keycode_to_dom_key(event->key.keysym.sym);
            const char *code = sdl_scancode_to_dom_code(event->key.keysym.scancode);
            bool repeat = event->key.repeat != 0;
            
            fire_dom_event(ctx, event->type == SDL_KEYDOWN ? "keydown" : "keyup",
                          key, code, repeat,
                          event->key.keysym.mod & KMOD_CTRL,
                          event->key.keysym.mod & KMOD_SHIFT,
                          event->key.keysym.mod & KMOD_ALT);
            break;
        }
        
        case SDL_MOUSEMOTION:
            fire_pointer_event(ctx, "pointermove",
                              event->motion.x, event->motion.y);
            break;
            
        case SDL_MOUSEBUTTONDOWN:
            fire_pointer_event(ctx, "pointerdown",
                              event->button.x, event->button.y);
            break;
            
        case SDL_MOUSEBUTTONUP:
            fire_pointer_event(ctx, "pointerup",
                              event->button.x, event->button.y);
            break;
            
        case SDL_JOYAXISMOTION:
        case SDL_JOYBUTTONDOWN:
        case SDL_JOYBUTTONUP:
            // Dual path: feed into Gamepad API shim AND
            // translate to keyboard events for games expecting WASD/arrows
            handle_gamepad_event(ctx, event);
            break;
    }
}
```

### Handheld Button → Keyboard Mapping (Configurable)

```
D-pad Up      →  ArrowUp
D-pad Down    →  ArrowDown
D-pad Left    →  ArrowLeft
D-pad Right   →  ArrowRight
A button      →  Space / KeyZ      (jump / confirm)
B button      →  KeyX / Escape     (action / back)
X button      →  KeyC / Shift      (secondary action)
Y button      →  KeyV / Control    (tertiary action)
Start         →  Enter / Escape    (pause / menu)
Select        →  Tab               (inventory / map)
L shoulder    →  KeyQ / PageUp
R shoulder    →  KeyE / PageDown
Left analog   →  ArrowKeys (with deadzone) or WASD
Right analog  →  Mouse movement (pointer games)
```

This mapping is saved per-game in a JSON config. The launcher UI lets users remap before starting a game.

---

## Audio Shim

### HTML5 Audio (Simple Path — Most Games)

```c
// new Audio("sfx/jump.ogg")
//   → Mix_LoadWAV("game_root/sfx/jump.ogg")
//   → store Mix_Chunk* on native side
//
// audio.play()     → Mix_PlayChannel(-1, chunk, 0)
// audio.pause()    → Mix_Pause(channel)
// audio.volume     → Mix_Volume(channel, (int)(volume * 128))
// audio.loop       → Mix_PlayChannel(-1, chunk, loops ? -1 : 0)
// audio.currentTime = 0  → restart playback

// Supported formats via SDL_mixer:
//   OGG Vorbis, MP3, WAV, FLAC, MOD, XM, MIDI
//   (covers everything Phaser games typically use)
```

### Web Audio API (Advanced — Phase 6+)

A subset sufficient for most Phaser games:

```
AudioContext                 → global audio state, SDL_mixer init
AudioContext.destination     → master output (implicit)
AudioContext.currentTime     → SDL_GetTicks() / 1000.0
AudioContext.createGain()    → GainNode → volume multiplier per channel
AudioContext.createBufferSource() → plays a decoded audio buffer
AudioContext.decodeAudioData()    → SDL_mixer decode → ArrayBuffer
AudioBufferSourceNode.start()     → Mix_PlayChannel with timing
AudioBufferSourceNode.stop()      → Mix_HaltChannel
AudioBufferSourceNode.connect()   → route through gain/destination chain
GainNode.gain.value              → Mix_Volume per channel
```

---

## Canvas 2D (nanovg Backend)

Phaser uses Canvas 2D primarily for text rendering and some bitmap manipulation. nanovg is ideal here — it's a small (~100KB), OpenGL ES-accelerated 2D vector graphics library.

```c
// Phaser creates a hidden canvas, draws text, then uploads as WebGL texture.
// Our flow:
//
// 1. ctx.font = "bold 24px Arial"
//    → nvgFontFace(vg, "Arial")
//    → nvgFontSize(vg, 24)
//
// 2. ctx.fillStyle = "#ffffff"
//    → nvgFillColor(vg, nvgRGBA(255, 255, 255, 255))
//
// 3. ctx.fillText("Score: 100", 10, 30)
//    → nvgText(vg, 10, 30, "Score: 100", NULL)
//
// 4. Phaser reads pixels back via getImageData() or passes canvas to texImage2D
//    → nvgReadPixels or render to FBO → glReadPixels → provide to texImage2D

// Canvas 2D functions needed for Phaser text:
ctx.fillText()
ctx.strokeText()
ctx.measureText()        → nvgTextBounds()
ctx.fillRect()
ctx.clearRect()
ctx.drawImage()          → render image quad
ctx.getImageData()       → glReadPixels from FBO
ctx.putImageData()       → glTexSubImage2D
ctx.save() / ctx.restore()
ctx.translate() / ctx.scale() / ctx.rotate()
ctx.globalAlpha
ctx.globalCompositeOperation
ctx.font
ctx.fillStyle / ctx.strokeStyle
ctx.textAlign / ctx.textBaseline
```

---

## Main Loop

```c
int main(int argc, char *argv[]) {
    const char *game_dir = argv[1];  // e.g., "/mnt/sdcard/games/mygame"
    
    // ── 1. SDL2 Init ──
    SDL_Init(SDL_INIT_VIDEO | SDL_INIT_AUDIO | SDL_INIT_JOYSTICK);
    
    // Request OpenGL ES 2.0 context
    SDL_GL_SetAttribute(SDL_GL_CONTEXT_PROFILE_MASK, SDL_GL_CONTEXT_PROFILE_ES);
    SDL_GL_SetAttribute(SDL_GL_CONTEXT_MAJOR_VERSION, 2);
    SDL_GL_SetAttribute(SDL_GL_CONTEXT_MINOR_VERSION, 0);
    SDL_GL_SetAttribute(SDL_GL_DOUBLEBUFFER, 1);
    
    int screen_w = 640, screen_h = 480;  // detect from muOS display config
    SDL_Window *win = SDL_CreateWindow("PhaserQuest",
        SDL_WINDOWPOS_CENTERED, SDL_WINDOWPOS_CENTERED,
        screen_w, screen_h,
        SDL_WINDOW_OPENGL | SDL_WINDOW_SHOWN | SDL_WINDOW_FULLSCREEN);
    SDL_GLContext gl_ctx = SDL_GL_CreateContext(win);
    SDL_GL_SetSwapInterval(1);  // vsync
    
    // Init audio
    Mix_OpenAudio(44100, MIX_DEFAULT_FORMAT, 2, 2048);
    Mix_AllocateChannels(32);
    
    // Init joystick
    if (SDL_NumJoysticks() > 0)
        SDL_JoystickOpen(0);
    
    // ── 2. JavaScriptCore Init ──
    JSContextGroupRef group = JSContextGroupCreate();
    JSGlobalContextRef ctx = JSGlobalContextCreateInGroup(group, NULL);
    
    // ── 3. Register All Shims ──
    register_window_shim(ctx, screen_w, screen_h);
    register_document_shim(ctx);
    register_console_shim(ctx);
    register_canvas_shim(ctx);
    register_webgl_shim(ctx);           // ~120 GL function bindings
    register_canvas2d_shim(ctx);        // nanovg-backed
    register_image_shim(ctx);           // stb_image-backed
    register_audio_shim(ctx);           // SDL_mixer-backed
    register_xhr_shim(ctx, game_dir);   // file I/O
    register_timers(ctx);               // setTimeout / setInterval
    register_performance_shim(ctx);     // performance.now()
    register_input_mapping(ctx);        // gamepad → keyboard translation
    
    // ── 4. Bootstrap ──
    // Load polyfills (TextDecoder, URL, Blob stubs, etc.)
    eval_file(ctx, "runtime/polyfills.js");
    
    // Parse index.html, extract <script> tags in order
    ScriptList scripts = parse_html_scripts(game_dir);
    
    // Evaluate each script (Phaser lib first, then game code)
    for (int i = 0; i < scripts.count; i++) {
        char *source = read_file(scripts.paths[i]);
        JSStringRef src = JSStringCreateWithUTF8CString(source);
        JSStringRef url = JSStringCreateWithUTF8CString(scripts.paths[i]);
        JSValueRef exc = NULL;
        
        JSEvaluateScript(ctx, src, NULL, url, 1, &exc);
        if (exc) handle_js_exception(ctx, exc, scripts.paths[i]);
        
        JSStringRelease(src);
        JSStringRelease(url);
        free(source);
    }
    
    // ── 5. Main Loop ──
    bool running = true;
    Uint64 perf_freq = SDL_GetPerformanceFrequency();
    Uint64 last_time = SDL_GetPerformanceCounter();
    
    while (running) {
        Uint64 now = SDL_GetPerformanceCounter();
        double dt = (double)(now - last_time) / (double)perf_freq;
        last_time = now;
        
        // 5a. Poll and translate SDL events
        SDL_Event ev;
        while (SDL_PollEvent(&ev)) {
            if (ev.type == SDL_QUIT) { running = false; break; }
            translate_sdl_event(ctx, &ev);
        }
        
        // 5b. Process timers (setTimeout, setInterval)
        double now_ms = (double)SDL_GetPerformanceCounter()
                       / (double)perf_freq * 1000.0;
        process_timers(ctx, now_ms);
        
        // 5c. Fire requestAnimationFrame callbacks
        // Phaser registers one rAF callback per frame that drives
        // the entire game loop (update → physics → render)
        fire_raf_callbacks(ctx, now_ms);
        
        // 5d. Swap buffers (presents the GL framebuffer to screen)
        SDL_GL_SwapWindow(win);
    }
    
    // ── 6. Cleanup ──
    JSGlobalContextRelease(ctx);
    JSContextGroupRelease(group);
    Mix_CloseAudio();
    SDL_GL_DeleteContext(gl_ctx);
    SDL_DestroyWindow(win);
    SDL_Quit();
    return 0;
}
```

---

## Memory Budget

| Component | Estimated RAM |
|-----------|--------------|
| JSC runtime + JIT code cache | 40-60 MB |
| Phaser.js compiled code | 8-15 MB |
| Game script compiled code | 2-10 MB |
| JS heap (game objects, arrays) | 15-30 MB |
| GL textures (Mali shared memory) | 20-60 MB (game dependent) |
| SDL2 + SDL_mixer audio buffers | 10-15 MB |
| Native code + stacks | 5-10 MB |
| nanovg context | ~2 MB |
| **Total estimate** | **~100-200 MB** |

JSC is heavier than QuickJS (~40-60MB vs ~5MB baseline), but the JIT code cache pays for itself in execution speed. On a 1GB device with ~120MB used by muOS, this leaves 680-780MB free — comfortably above our budget.

### Tuning JSC Memory

JSC exposes options to control JIT behavior and memory:

```c
// Limit JIT code cache size (default can be large)
// Set via environment variables before JSC init:
setenv("JSC_maxPerThreadStackUsage", "4194304", 1);     // 4MB stack
setenv("JSC_jitMemoryReservationSize", "16777216", 1);   // 16MB JIT cache

// Disable FTL tier if memory is tight (DFG alone gives most of the benefit)
setenv("JSC_useFTLJIT", "false", 1);

// Aggressive GC for memory-constrained environments
setenv("JSC_useGenerationSize", "1048576", 1);  // 1MB generations
```

---

## Build System

### Project Structure

```
phaserquest/
├── CMakeLists.txt              # Top-level: builds JSC, then our runtime
├── toolchain-aarch64-muos.cmake # Cross-compilation toolchain file
├── src/
│   ├── main.c                   # Entry point, main loop
│   ├── bootstrap.c              # JSC init, script loading, HTML parsing
│   ├── shims/
│   │   ├── window.c             # window/navigator/location/performance
│   │   ├── document.c           # document/Element stubs
│   │   ├── canvas.c             # HTMLCanvasElement
│   │   ├── webgl.c              # WebGLRenderingContext → GLES 2.0 (~2000 LOC)
│   │   ├── canvas2d.c           # CanvasRenderingContext2D → nanovg
│   │   ├── image.c              # Image element → stb_image
│   │   ├── audio.c              # Audio + Web Audio → SDL_mixer
│   │   ├── xhr.c                # XMLHttpRequest → file I/O
│   │   ├── fetch.c              # fetch() → wrapper around XHR
│   │   ├── events.c             # SDL → DOM event translation
│   │   ├── timers.c             # setTimeout/setInterval/rAF
│   │   └── gamepad.c            # Gamepad API + button remapping
│   ├── js/
│   │   ├── polyfills.js         # TextDecoder, URL, Blob, atob/btoa
│   │   └── phaser_compat.js     # Phaser-specific environment patches
│   └── util/
│       ├── html_parser.c        # Minimal <script> tag extractor
│       ├── path_resolver.c      # URL → local path, security sandbox
│       └── input_config.c       # Per-game button mapping JSON
├── third_party/
│   ├── WebKit/                  # WebKit checkout (for JSCOnly build)
│   ├── stb/                     # stb_image.h, stb_truetype.h
│   └── nanovg/                  # GPU-accelerated Canvas2D
├── runtime/
│   ├── polyfills.js             # Bundled JS polyfills
│   └── fonts/                   # Default fonts (for Canvas2D text)
└── games/                       # Game directories
    └── example/
        ├── index.html
        ├── js/phaser.min.js
        ├── js/game.js
        └── assets/...
```

### Cross-Compilation Toolchain

```cmake
# toolchain-aarch64-muos.cmake
set(CMAKE_SYSTEM_NAME Linux)
set(CMAKE_SYSTEM_PROCESSOR aarch64)

# Point to your cross-compiler (from muOS SDK or Buildroot)
set(CMAKE_C_COMPILER   aarch64-linux-gnu-gcc)
set(CMAKE_CXX_COMPILER aarch64-linux-gnu-g++)

# Sysroot containing target libraries (glibc, ICU, SDL2, etc.)
set(CMAKE_SYSROOT /path/to/muos-sysroot)
set(CMAKE_FIND_ROOT_PATH ${CMAKE_SYSROOT})

set(CMAKE_FIND_ROOT_PATH_MODE_PROGRAM NEVER)
set(CMAKE_FIND_ROOT_PATH_MODE_LIBRARY ONLY)
set(CMAKE_FIND_ROOT_PATH_MODE_INCLUDE ONLY)

# ARM64 optimizations
set(CMAKE_C_FLAGS   "-march=armv8-a+crc -mtune=cortex-a53 -O2")
set(CMAKE_CXX_FLAGS "-march=armv8-a+crc -mtune=cortex-a53 -O2")
```

### Building JSC for ARM64

```bash
# Clone WebKit
git clone https://github.com/WebKit/WebKit.git --depth 1

# Set up cross-compilation environment
export CC=aarch64-linux-gnu-gcc
export CXX=aarch64-linux-gnu-g++

# Build JSCOnly port
cd WebKit
Tools/Scripts/build-jsc --jsc-only --release \
    --cmakeargs="-DCMAKE_TOOLCHAIN_FILE=/path/to/toolchain-aarch64-muos.cmake \
                 -DENABLE_STATIC_JSC=ON \
                 -DUSE_SYSTEM_MALLOC=ON"

# Output: WebKitBuild/Release/lib/libJavaScriptCore.a
# Output: WebKitBuild/Release/include/JavaScriptCore/
```

### Dependencies

| Library | Purpose | Size (ARM64) | Source |
|---------|---------|-------------|--------|
| JavaScriptCore | JS engine with JIT | ~15-20 MB (static lib) | WebKit JSCOnly build |
| ICU | Unicode support (JSC dependency) | ~5-8 MB | System or bundled |
| SDL2 | Window, input, audio framework | ~1-2 MB | Already on muOS |
| SDL_mixer | Audio format decoding | ~500 KB | Compile or muOS |
| stb_image | PNG/JPG/BMP decode | ~60 KB | Header-only |
| stb_truetype | TTF font rasterization | ~40 KB | Header-only |
| nanovg | GPU Canvas 2D renderer | ~100 KB | Source |
| libEGL + libGLESv2 | OpenGL ES 2.0 | System | Mali driver on muOS |

**Total binary size estimate: ~20-25MB** (stripped). Larger than QuickJS (~5MB) but still small for what you get.

---

## Development Roadmap

### Phase 1: JSC on muOS (2-3 weeks)
- [ ] Set up aarch64 cross-compilation toolchain for muOS
- [ ] Build JSCOnly static library for ARM64
- [ ] Build ICU for ARM64 (or use muOS system ICU if available)
- [ ] Create minimal SDL2 app that initializes JSC and evaluates JS
- [ ] Verify JIT works (check `JSC_dumpJITStatistics` output)
- [ ] Register `console.log`, `performance.now()`
- [ ] **Milestone:** `console.log("Hello from JSC JIT on muOS!")` running on device

### Phase 2: WebGL Shim (4-6 weeks)
- [ ] EGL/GLES2 context creation within SDL2 window on Mali-G31
- [ ] Implement WebGLRenderingContext class with ~30 hot-path functions
- [ ] `canvas.getContext("webgl")` returns the context
- [ ] Shader compilation passthrough
- [ ] Buffer + texture management
- [ ] `drawArrays` and `drawElements`
- [ ] TypedArray zero-copy path for `bufferData`
- [ ] Framebuffer object support
- [ ] **Milestone:** Orange triangle renders via JS WebGL calls on device

### Phase 3: Asset Pipeline (2-3 weeks)
- [ ] `Image` element with `src` → stb_image → `onload`
- [ ] `XMLHttpRequest` with text/json/arraybuffer responseTypes
- [ ] File path resolution + sandboxing
- [ ] HTML `<script>` tag parser
- [ ] **Milestone:** Load a PNG, create GL texture, draw textured quad from JS

### Phase 4: Phaser Boot (3-4 weeks)
- [ ] Load `phaser.min.js` — iterate on missing stubs until it initializes
- [ ] `customEnvironment: true` + feature detection stubs
- [ ] DOM event system (keyboard, pointer)
- [ ] Canvas2D via nanovg (for Phaser text rendering)
- [ ] `requestAnimationFrame` driving Phaser's game loop
- [ ] **Milestone:** `new Phaser.Game({ type: Phaser.WEBGL, ... })` without crash

### Phase 5: First Game (2-4 weeks)
- [ ] Test with Phaser "Making your first game" tutorial
- [ ] Debug rendering (sprite batching, blend modes, camera)
- [ ] Input: D-pad → arrow keys working in-game
- [ ] Audio: HTML5 Audio path for sound effects
- [ ] **Milestone:** Playable Phaser game with sprites, input, and sound

### Phase 6: Compatibility + Distribution (ongoing)
- [ ] Test 10+ diverse Phaser games, fix issues
- [ ] Gamepad API for analog stick support
- [ ] Per-game input mapping config UI
- [ ] Web Audio API (for games that need it)
- [ ] Physics engine stress testing (Matter.js, Arcade)
- [ ] Game launcher / browser integration with muOS
- [ ] PortMaster packaging for easy installation
- [ ] Performance profiling + JIT tuning
- [ ] Memory leak hunting
- [ ] Community testing + bug reports

---

## JSC vs QuickJS: Side-by-Side for This Project

| Aspect | QuickJS | JavaScriptCore |
|--------|---------|----------------|
| JS execution speed | Interpreter only (1x) | JIT: Baseline 3-5x, DFG 8-12x, FTL 15-20x |
| Binary size | ~200 KB | ~20 MB |
| RAM baseline | ~5 MB | ~40-60 MB |
| Build complexity | `make` (trivial) | CMake + Ruby + Perl + ICU (complex) |
| Cross-compile | Trivial | Documented but fiddly |
| ES spec coverage | ES2023 (~100%) | ES2024+ (~100%) |
| TypedArray perf | Good | Excellent (JIT-optimized) |
| C embedding API | Simple, clean | More verbose but well-documented |
| ARM64 maturity | Good | Battle-tested (billions of iOS devices) |
| Matter.js physics | Likely 15-25 fps | Likely 50-60 fps |
| Startup time | ~10ms | ~50-200ms (JIT warmup) |
| Community | Small | Massive (WebKit project) |

**The tradeoff is clear:** JSC costs ~15MB more disk and ~40MB more RAM, but delivers 5-15x faster JS execution on the code paths that matter for games. On a 1GB device, that RAM cost is affordable. The disk cost is trivial on an SD card.

---

## Risk Mitigation

### 1. JSC build fails for aarch64-muos
**Risk:** WebKit's build system is complex and may have undocumented assumptions.
**Mitigation:** Start with the documented Buildroot cross-compilation path from WebKit's own wiki. The RaspberryPi ARM64 build path is well-trodden. If JSCOnly fails, the WPE port (used for embedded WebKit on ARM) shares the same JSC.

### 2. JIT disabled on older kernels
**Risk:** JSC's JIT needs `mmap` with `PROT_EXEC` and possibly `memfd_create`. Some muOS kernels might restrict this.
**Mitigation:** JSC gracefully falls back to LLInt (interpreter) if JIT can't allocate executable memory. Test with `JSC_useJIT=false` first, then enable. muOS runs a standard Linux kernel — JIT should work.

### 3. ICU dependency adds bloat
**Risk:** ICU is large (~25MB unstripped). Shipping it per-game is wasteful.
**Mitigation:** Build ICU as a shared library installed once on the muOS system partition, or use the minimal ICU data file (~2MB). muOS may already have ICU installed for other software.

### 4. Phaser games assuming specific screen sizes
**Risk:** Handheld screens (640x480, 720x720) differ from typical web targets (800x600, 1280x720).
**Mitigation:** Phaser has built-in scale modes (`Phaser.Scale.FIT`, `Phaser.Scale.ENVELOP`). Report `window.innerWidth/Height` honestly and let Phaser handle scaling. Offer a runtime override for games that hardcode dimensions.

### 5. Memory pressure from texture-heavy games
**Risk:** Mali-G31 shares system RAM. Large spritesheets could push total usage over 700MB+.
**Mitigation:** Implement `gl.deleteTexture` properly. Add a texture memory counter. Warn/refuse to load if estimated texture memory exceeds a threshold. Consider on-the-fly texture downscaling (half-res) for memory-critical situations.
