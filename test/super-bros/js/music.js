// ─── Super Bros Music ─────────────────────────────────────────────────────────
// Procedural chiptune music via Web Audio API — no audio files needed.
// Two looping tracks: 'menu' (chill) and 'battle' (intense).
const Music = (() => {
    let _ctx = null;
    let _current = null;
    let _gain = null;
    let _loopTimer = null;
    let _loopStart = 0;
    let _vol = 0.09;
    let _hatBuf = null;

    const ac = () => {
        if (!_ctx) _ctx = new (window.AudioContext || window.webkitAudioContext)();
        if (_ctx.state === 'suspended') _ctx.resume();
        return _ctx;
    };

    const newMaster = () => {
        const c = ac(), g = c.createGain();
        g.gain.value = _vol;
        g.connect(c.destination);
        return g;
    };

    const fadeOut = (g) => {
        if (!g) return;
        try {
            const t = ac().currentTime;
            g.gain.setValueAtTime(g.gain.value, t);
            g.gain.linearRampToValueAtTime(0, t + 0.5);
            setTimeout(() => { try { g.disconnect(); } catch (_) {} }, 700);
        } catch (_) {}
    };

    const schedNote = (freq, t, dur, type, vol, g) => {
        if (!freq || !g) return;
        try {
            const c = ac(), ng = c.createGain(), o = c.createOscillator();
            o.type = type; o.frequency.value = freq;
            ng.gain.setValueAtTime(0, t);
            ng.gain.linearRampToValueAtTime(vol, t + 0.008);
            ng.gain.setValueAtTime(vol * 0.65, t + Math.max(dur - 0.04, 0.01));
            ng.gain.linearRampToValueAtTime(0, t + dur);
            o.connect(ng); ng.connect(g);
            o.start(t); o.stop(t + dur + 0.01);
        } catch (_) {}
    };

    const schedKick = (t, g) => {
        if (!g) return;
        try {
            const c = ac(), o = c.createOscillator(), ng = c.createGain();
            o.type = 'sine';
            o.frequency.setValueAtTime(160, t);
            o.frequency.exponentialRampToValueAtTime(52, t + 0.12);
            ng.gain.setValueAtTime(0.55, t);
            ng.gain.exponentialRampToValueAtTime(0.001, t + 0.14);
            o.connect(ng); ng.connect(g);
            o.start(t); o.stop(t + 0.15);
        } catch (_) {}
    };

    const getHatBuf = () => {
        if (_hatBuf) return _hatBuf;
        const c = ac(), n = Math.ceil(c.sampleRate * 0.05);
        _hatBuf = c.createBuffer(1, n, c.sampleRate);
        const d = _hatBuf.getChannelData(0);
        for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
        return _hatBuf;
    };

    const schedHat = (t, vol, g) => {
        if (!g) return;
        try {
            const c = ac(), src = c.createBufferSource();
            const filt = c.createBiquadFilter(), ng = c.createGain();
            filt.type = 'highpass'; filt.frequency.value = 8000;
            ng.gain.setValueAtTime(vol, t);
            ng.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
            src.buffer = getHatBuf();
            src.connect(filt); filt.connect(ng); ng.connect(g);
            src.start(t); src.stop(t + 0.06);
        } catch (_) {}
    };

    // Track format: voices = array of note arrays, each note = [freq, beatStart, beatDur, type, vol]
    // drums = array of [type('k'|'h'), beatStart, vol]
    const TRACKS = {
        menu: {
            bpm: 115, beats: 16,
            voices: [
                // Lead melody — A minor, hopeful chiptune feel
                [
                    [659, 0.5, 0.5, 'square', .13], [784, 1, 0.5, 'square', .13], [880, 1.5, 0.75, 'square', .15],
                    [784, 2.25, 0.25, 'square', .12], [659, 2.5, 1, 'square', .14],
                    [523, 3.5, 0.5, 'square', .12], [440, 4, 0.5, 'square', .11],
                    [523, 4.5, 0.5, 'square', .12], [659, 5, 0.5, 'square', .13],
                    [784, 5.5, 0.5, 'square', .14], [880, 6, 0.75, 'square', .15],
                    [784, 6.75, 0.25, 'square', .12], [659, 7, 1, 'square', .14],
                    [880, 8, 0.25, 'square', .16], [987, 8.25, 0.25, 'square', .16],
                    [1047, 8.5, 0.5, 'square', .18], [880, 9, 0.5, 'square', .16],
                    [784, 9.5, 0.5, 'square', .14], [659, 10, 0.5, 'square', .14],
                    [523, 10.5, 0.5, 'square', .12], [587, 11, 1, 'square', .14],
                    [659, 12, 0.5, 'square', .13], [523, 12.5, 0.5, 'square', .12],
                    [440, 13, 0.5, 'square', .11], [392, 13.5, 0.5, 'square', .10],
                    [440, 14, 2, 'square', .13],
                ],
                // Bass — root notes, triangle wave
                [
                    [220, 0, .38, 'triangle', .22], [220, 1, .38, 'triangle', .20],
                    [164, 2, .38, 'triangle', .20], [164, 3, .38, 'triangle', .20],
                    [130, 4, .38, 'triangle', .20], [130, 5, .38, 'triangle', .20],
                    [196, 6, .38, 'triangle', .20], [196, 7, .38, 'triangle', .20],
                    [220, 8, .38, 'triangle', .22], [220, 9, .38, 'triangle', .20],
                    [164, 10, .38, 'triangle', .20], [164, 11, .38, 'triangle', .20],
                    [130, 12, .38, 'triangle', .20], [130, 13, .38, 'triangle', .20],
                    [146, 14, .38, 'triangle', .20], [146, 15, .38, 'triangle', .20],
                ],
                // Arpeggios — sine, every 2 beats
                [
                    [440, 0, .12, 'sine', .07], [523, .25, .12, 'sine', .07], [659, .5, .12, 'sine', .07], [784, .75, .12, 'sine', .07],
                    [440, 2, .12, 'sine', .07], [523, 2.25, .12, 'sine', .07], [659, 2.5, .12, 'sine', .07], [784, 2.75, .12, 'sine', .07],
                    [392, 4, .12, 'sine', .07], [523, 4.25, .12, 'sine', .07], [659, 4.5, .12, 'sine', .07], [784, 4.75, .12, 'sine', .07],
                    [440, 6, .12, 'sine', .07], [523, 6.25, .12, 'sine', .07], [659, 6.5, .12, 'sine', .07], [784, 6.75, .12, 'sine', .07],
                    [440, 8, .12, 'sine', .07], [523, 8.25, .12, 'sine', .07], [659, 8.5, .12, 'sine', .07], [784, 8.75, .12, 'sine', .07],
                    [440, 10, .12, 'sine', .07], [523, 10.25, .12, 'sine', .07], [659, 10.5, .12, 'sine', .07], [784, 10.75, .12, 'sine', .07],
                    [349, 12, .12, 'sine', .07], [440, 12.25, .12, 'sine', .07], [523, 12.5, .12, 'sine', .07], [659, 12.75, .12, 'sine', .07],
                    [329, 14, .12, 'sine', .07], [440, 14.25, .12, 'sine', .07], [523, 14.5, .12, 'sine', .07], [659, 14.75, .12, 'sine', .07],
                ],
            ],
        },
        battle: {
            bpm: 165, beats: 16,
            voices: [
                // Lead riff — aggressive square
                [
                    [784, 0, .2, 'square', .17], [784, .25, .2, 'square', .17], [784, .75, .2, 'square', .17],
                    [622, 1.25, .25, 'square', .15], [784, 1.5, .35, 'square', .17],
                    [932, 2, .5, 'square', .19], [784, 2.75, .25, 'square', .17],
                    [659, 3, .25, 'square', .15], [466, 3.25, .25, 'square', .13], [523, 3.5, .5, 'square', .15],
                    [698, 4, .2, 'square', .17], [698, 4.25, .2, 'square', .17], [698, 4.75, .2, 'square', .17],
                    [587, 5.25, .25, 'square', .15], [698, 5.5, .35, 'square', .17],
                    [784, 6, .5, 'square', .17], [698, 6.75, .25, 'square', .15],
                    [659, 7, .25, 'square', .15], [440, 7.25, .25, 'square', .13], [494, 7.5, .5, 'square', .15],
                    [1047, 8, .25, 'square', .20], [987, 8.5, .25, 'square', .18],
                    [880, 9, .25, 'square', .17], [784, 9.5, .25, 'square', .16],
                    [698, 10, .5, 'square', .16], [587, 10.5, .5, 'square', .14], [622, 11, 1, 'square', .16],
                    [784, 12, .2, 'square', .17], [784, 12.25, .2, 'square', .17], [784, 12.75, .2, 'square', .17],
                    [932, 13, .5, 'square', .19], [784, 13.5, .5, 'square', .17],
                    [659, 14, .5, 'square', .15], [523, 14.5, .5, 'square', .13], [587, 15, .75, 'square', .15],
                ],
                // Bass — driving sawtooth
                [
                    [196, 0, .32, 'sawtooth', .16], [196, .75, .25, 'sawtooth', .14], [196, 1, .32, 'sawtooth', .14],
                    [174, 2, .32, 'sawtooth', .16], [174, 2.75, .25, 'sawtooth', .14], [164, 3, 1, 'sawtooth', .16],
                    [174, 4, .32, 'sawtooth', .16], [174, 4.75, .25, 'sawtooth', .14], [174, 5, .32, 'sawtooth', .14],
                    [155, 6, .32, 'sawtooth', .16], [155, 6.75, .25, 'sawtooth', .14], [146, 7, 1, 'sawtooth', .16],
                    [196, 8, .32, 'sawtooth', .16], [196, 8.75, .25, 'sawtooth', .14], [185, 9, .32, 'sawtooth', .14],
                    [164, 10, .32, 'sawtooth', .14], [155, 10.75, .25, 'sawtooth', .14], [146, 11, 1, 'sawtooth', .16],
                    [130, 12, .32, 'sawtooth', .16], [130, 12.75, .25, 'sawtooth', .14], [130, 13, .32, 'sawtooth', .14],
                    [130, 14, .32, 'sawtooth', .14], [123, 14.75, .25, 'sawtooth', .14], [98, 15, .75, 'sawtooth', .18],
                ],
            ],
            drums: [
                ['k', 0, .55], ['h', .5, .10], ['k', 1, .55], ['h', 1.5, .10],
                ['k', 2, .55], ['h', 2.5, .10], ['k', 3, .55], ['h', 3.5, .10],
                ['k', 4, .55], ['h', 4.5, .10], ['k', 5, .55], ['h', 5.5, .10],
                ['k', 6, .55], ['h', 6.5, .10], ['k', 7, .55], ['h', 7.5, .10],
                ['k', 8, .55], ['h', 8.5, .12], ['k', 9, .55], ['h', 9.5, .12],
                ['k', 10, .55], ['h', 10.5, .12], ['k', 11, .55], ['h', 11.5, .12],
                ['k', 12, .55], ['h', 12.5, .12], ['k', 13, .55], ['h', 13.5, .12],
                ['k', 14, .55], ['h', 14.5, .12], ['k', 15, .55],
                // Extra hi-hats on 8ths for intensity (second half)
                ['h', 8.25, .07], ['h', 8.75, .07], ['h', 9.25, .07], ['h', 9.75, .07],
                ['h', 12.25, .07], ['h', 12.75, .07], ['h', 13.25, .07], ['h', 13.75, .07],
            ],
        },
    };

    const scheduleLoop = (name, g) => {
        if (_current !== name || _gain !== g) return;
        const track = TRACKS[name];
        const bd = 60 / track.bpm;
        const loopDur = track.beats * bd;

        track.voices.forEach(voice => {
            voice.forEach(([freq, beat, dur, type, vol]) => {
                schedNote(freq || 0, _loopStart + beat * bd, dur * bd, type || 'square', vol || 0.1, g);
            });
        });

        if (track.drums) {
            track.drums.forEach(([type, beat, vol]) => {
                const t = _loopStart + beat * bd;
                if (type === 'k') schedKick(t, g);
                else schedHat(t, vol, g);
            });
        }

        _loopTimer = setTimeout(() => {
            _loopStart += loopDur;
            scheduleLoop(name, g);
        }, (loopDur - 0.15) * 1000);
    };

    return {
        play(name) {
            if (_current === name) return;
            clearTimeout(_loopTimer);
            fadeOut(_gain);
            _current = name;
            if (!name || !TRACKS[name]) { _current = null; _gain = null; return; }
            try {
                _gain = newMaster();
                _loopStart = ac().currentTime + 0.05;
                scheduleLoop(name, _gain);
            } catch (_) { _current = null; _gain = null; }
        },
        stop() {
            clearTimeout(_loopTimer);
            _current = null;
            fadeOut(_gain);
            _gain = null;
        },
        volume(v) {
            _vol = Math.max(0, Math.min(1, v));
            if (_gain) _gain.gain.value = _vol;
        },
        get current() { return _current; },
    };
})();
