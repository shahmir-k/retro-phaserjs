// ─── Super Bros SFX ──────────────────────────────────────────────────────────
// Procedural sound effects via Web Audio API — no audio files needed.
// All sounds are generated in real-time from oscillators and noise.
const SFX = (() => {
    let _ctx = null;

    const ctx = () => {
        if (!_ctx) _ctx = new (window.AudioContext || window.webkitAudioContext)();
        if (_ctx.state === 'suspended') _ctx.resume();
        return _ctx;
    };

    /** Single oscillator tone with exponential decay */
    const tone = (freq, dur, type = 'square', vol = 0.25, delay = 0) => {
        try {
            const c = ctx(), t = c.currentTime + delay;
            const osc = c.createOscillator(), g = c.createGain();
            osc.connect(g); g.connect(c.destination);
            osc.type = type;
            osc.frequency.setValueAtTime(freq, t);
            g.gain.setValueAtTime(vol, t);
            g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
            osc.start(t); osc.stop(t + dur + 0.01);
        } catch (_) {}
    };

    /** Bandpass-filtered white noise burst */
    const noise = (dur, fc = 1000, vol = 0.2, delay = 0) => {
        try {
            const c = ctx(), t = c.currentTime + delay;
            const n = Math.ceil(c.sampleRate * dur);
            const buf = c.createBuffer(1, n, c.sampleRate);
            const d = buf.getChannelData(0);
            for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
            const src = c.createBufferSource(), filt = c.createBiquadFilter(), g = c.createGain();
            filt.type = 'bandpass'; filt.frequency.value = fc; filt.Q.value = 0.8;
            g.gain.setValueAtTime(vol, t);
            g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
            src.buffer = buf;
            src.connect(filt); filt.connect(g); g.connect(c.destination);
            src.start(t); src.stop(t + dur + 0.01);
        } catch (_) {}
    };

    return {
        // ── HTML UI ──────────────────────────────────────────────────────────
        hover()        { tone(880,  0.04, 'sine',     0.07); },
        click()        { tone(660,  0.04, 'square',   0.18); tone(1000, 0.07, 'square',   0.12, 0.03); },
        open()         { [200, 400, 700].forEach((f, i) => tone(f, 0.10, 'sine', 0.14, i * 0.05)); },
        close()        { [700, 400, 200].forEach((f, i) => tone(f, 0.09, 'sine', 0.12, i * 0.04)); },
        themeChange()  { [300, 500, 800, 1100].forEach((f, i) => tone(f, 0.12, 'sine', 0.13, i * 0.06)); },

        // ── Phaser Menus ─────────────────────────────────────────────────────
        menuHover()    { tone(700,  0.04, 'sine',     0.09); },
        menuClick()    { tone(500,  0.04, 'square',   0.20); tone(800,  0.08, 'square',   0.14, 0.04); },
        select()       { tone(660,  0.06, 'sine',     0.22); tone(880,  0.10, 'sine',     0.16, 0.05); },
        back()         { tone(440,  0.06, 'sine',     0.15); tone(300,  0.10, 'sine',     0.12, 0.05); },
        confirm()      { [523, 659, 784].forEach((f, i) => tone(f, 0.12, 'square', 0.22, i * 0.08)); },
        reject()       { tone(200,  0.08, 'sawtooth', 0.18); tone(150,  0.14, 'sawtooth', 0.14, 0.08); },
        pause()        { tone(300,  0.06, 'sine',     0.18); tone(200,  0.12, 'sine',     0.14, 0.06); },
        resume()       { tone(200,  0.06, 'sine',     0.14); tone(400,  0.12, 'sine',     0.18, 0.06); },
        victory()      { [523, 523, 784, 784, 880, 880, 1047].forEach((f, i) => tone(f, 0.18, 'square', 0.26, i * 0.14)); },

        // ── Fight ────────────────────────────────────────────────────────────
        jump()         { tone(200, 0.08, 'sine', 0.15); tone(380, 0.12, 'sine', 0.10, 0.04); },
        doubleJump()   { tone(380, 0.06, 'sine', 0.18); tone(620, 0.09, 'sine', 0.14, 0.04); tone(880, 0.07, 'sine', 0.10, 0.08); },
        attack()       { noise(0.06, 3200, 0.38); tone(110, 0.10, 'square', 0.22); },
        special()      { noise(0.11, 1400, 0.44); tone(75,  0.16, 'sawtooth', 0.30); tone(200, 0.10, 'square', 0.20, 0.06); },
        hit(dmg) {
            if (dmg < 30)       { noise(0.05, 2600, 0.32); tone(180, 0.08, 'square', 0.22); }
            else if (dmg < 80)  { noise(0.08, 1800, 0.46); tone(130, 0.12, 'square', 0.28); tone(200, 0.09, 'sine', 0.18, 0.04); }
            else                { noise(0.13, 1100, 0.56); tone(80,  0.18, 'sawtooth', 0.32); tone(120, 0.14, 'square', 0.26, 0.06); tone(55, 0.22, 'sine', 0.22, 0.11); }
        },
        ko()           { [420, 310, 200, 100].forEach((f, i) => tone(f, 0.22, 'sawtooth', 0.32, i * 0.13)); noise(0.16, 700, 0.42, 0.22); },
        respawn()      { [400, 550, 750, 950, 1200].forEach((f, i) => tone(f, 0.10, 'sine', 0.18, i * 0.07)); },

        // ── Whack-a-Mole ─────────────────────────────────────────────────────
        moleUp()       { tone(350,  0.05, 'sine',     0.18); tone(550,  0.10, 'sine',     0.22, 0.04); },
        whack()        { noise(0.07, 2500, 0.50); tone(160, 0.12, 'square', 0.28); },
        miss()         { tone(180,  0.08, 'sawtooth', 0.16); tone(130,  0.16, 'sawtooth', 0.12, 0.07); },
        scoreUp()      { tone(1000, 0.05, 'sine',     0.18); tone(1300, 0.08, 'sine',     0.14, 0.05); },
        moleEscape()   { tone(380,  0.06, 'sawtooth', 0.10); tone(220,  0.14, 'sawtooth', 0.08, 0.06); },
        countdown()    { tone(440,  0.12, 'square',   0.22); },
        countdownGo()  { [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.16, 'square', 0.28, i * 0.10)); },
        gameOver()     { [500, 380, 280, 180].forEach((f, i) => tone(f, 0.22, 'sawtooth', 0.22, i * 0.14)); },
        newHighScore() { [523, 523, 784, 784, 880, 880, 784].forEach((f, i) => tone(f, 0.18, 'square', 0.24, i * 0.12)); },
    };
})();
