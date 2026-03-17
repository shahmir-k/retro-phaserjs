// Victory Screen Scene
class VictoryScene extends Phaser.Scene {
    constructor() {
        super({ key: 'VictoryScene' });
    }

    init(data) {
        this.winner = data.winner;
        this.gameMode = data.mode;
        this.player1Data = data.player1;
        this.player2Data = data.player2;
        this.arena = data.arena;
        this.aiDifficulty = data.aiDifficulty;
    }

    create() {
        Music.stop();
        this.createCyberBackground();
        this.createDigitalRain();
        this.createGlitchOverlay();
        this.createWinnerDisplay();
        this.createButtons();
        this.playVictoryAnimation();
    }

    createCyberBackground() {
        // Dark cyber gradient
        const bg = this.add.graphics();
        bg.fillGradientStyle(0x0a0015, 0x0a0015, 0x1a0030, 0x2a0050, 1);
        bg.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

        const winnerColor = this.winner.characterData.color;

        // Animated hexagon grid
        this.hexagons = [];
        for (let i = 0; i < 15; i++) {
            const hex = this.add.graphics();
            const x = Math.random() * GAME_WIDTH;
            const y = Math.random() * GAME_HEIGHT;
            const size = 20 + Math.random() * 40;

            hex.lineStyle(2, winnerColor, 0.3);
            this.drawHexagon(hex, 0, 0, size);
            hex.setPosition(x, y);
            hex.setAlpha(0);

            this.tweens.add({
                targets: hex,
                alpha: { from: 0, to: 0.4 },
                angle: 360,
                duration: 8000 + Math.random() * 4000,
                delay: Math.random() * 1000,
                repeat: -1,
                yoyo: true
            });

            this.hexagons.push(hex);
        }

        // Scan lines
        const scanLines = this.add.graphics();
        scanLines.setAlpha(0.1);
        for (let i = 0; i < GAME_HEIGHT; i += 4) {
            scanLines.fillStyle(0x00ffff, 1);
            scanLines.fillRect(0, i, GAME_WIDTH, 2);
        }

        // Animated scan line
        this.scanLine = this.add.graphics();
        this.scanLine.fillStyle(winnerColor, 0.3);
        this.scanLine.fillRect(0, 0, GAME_WIDTH, 3);
        this.scanLine.setBlendMode('ADD');

        this.tweens.add({
            targets: this.scanLine,
            y: GAME_HEIGHT,
            duration: 3000,
            repeat: -1,
            ease: 'Linear'
        });

        // Data streams
        this.createDataStreams();
    }

    drawHexagon(graphics, x, y, size) {
        graphics.beginPath();
        for (let i = 0; i < 6; i++) {
            const angle = (Math.PI / 3) * i;
            const px = x + size * Math.cos(angle);
            const py = y + size * Math.sin(angle);
            if (i === 0) {
                graphics.moveTo(px, py);
            } else {
                graphics.lineTo(px, py);
            }
        }
        graphics.closePath();
        graphics.strokePath();
    }

    createDataStreams() {
        const winnerColor = this.winner.characterData.color;

        for (let i = 0; i < 20; i++) {
            this.time.delayedCall(i * 200, () => {
                const x = Math.random() * GAME_WIDTH;
                const chars = '01';
                const text = this.add.text(x, -20, chars[Math.floor(Math.random() * chars.length)], {
                    fontSize: '14px',
                    fontFamily: 'Courier New',
                    color: Phaser.Display.Color.IntegerToColor(winnerColor).rgba
                });
                text.setAlpha(0.6);
                text.setBlendMode('ADD');

                this.tweens.add({
                    targets: text,
                    y: GAME_HEIGHT + 20,
                    alpha: 0,
                    duration: 3000 + Math.random() * 2000,
                    onComplete: () => text.destroy()
                });
            });
        }

        // Continuous data stream
        this.time.addEvent({
            delay: 200,
            callback: () => {
                const x = Math.random() * GAME_WIDTH;
                const chars = '01';
                const text = this.add.text(x, -20, chars[Math.floor(Math.random() * chars.length)], {
                    fontSize: '14px',
                    fontFamily: 'Courier New',
                    color: Phaser.Display.Color.IntegerToColor(winnerColor).rgba
                });
                text.setAlpha(0.6);
                text.setBlendMode('ADD');

                this.tweens.add({
                    targets: text,
                    y: GAME_HEIGHT + 20,
                    alpha: 0,
                    duration: 3000 + Math.random() * 2000,
                    onComplete: () => text.destroy()
                });
            },
            repeat: -1
        });
    }

    createDigitalRain() {
        // Matrix-style particles
        const winnerColor = this.winner.characterData.color;

        this.digitalParticles = this.add.particles(0, 0, 'particle_star', {
            x: { min: 0, max: GAME_WIDTH },
            y: -20,
            lifespan: 3000,
            speedY: { min: 50, max: 150 },
            scale: { start: 0.3, end: 0.1 },
            alpha: { start: 0.8, end: 0 },
            tint: winnerColor,
            frequency: 100,
            blendMode: 'ADD'
        });
    }

    createGlitchOverlay() {
        // Periodic glitch effect
        this.time.addEvent({
            delay: 2000 + Math.random() * 3000,
            callback: () => {
                const glitch = this.add.graphics();
                glitch.fillStyle(0xff00ff, 0.1);
                glitch.fillRect(0, Math.random() * GAME_HEIGHT, GAME_WIDTH, 50);
                glitch.setBlendMode('ADD');

                this.tweens.add({
                    targets: glitch,
                    alpha: 0,
                    duration: 100,
                    onComplete: () => glitch.destroy()
                });

                this.cameras.main.shake(50, 0.002);
            },
            repeat: -1
        });
    }

    createWinnerDisplay() {
        const winnerData = this.winner.characterData;
        const isPlayer1 = this.winner.playerNum === 1;
        const labelText = isPlayer1 ? 'PLAYER 1' : (this.gameMode === 'single' ? 'CPU' : 'PLAYER 2');

        this.winnerContainer = this.add.container(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 50);

        // Holographic platform
        const platform = this.add.graphics();
        platform.lineStyle(3, winnerData.color, 0.8);
        for (let i = 0; i < 5; i++) {
            const offset = i * 8;
            platform.strokeEllipse(0, 120, 200 - offset, 40 - offset);
        }
        platform.setAlpha(0.5);
        platform.setBlendMode('ADD');

        // Character sprite with hologram effect
        const sprite = this.add.image(0, 30, `char_${winnerData.id}`);
        sprite.setScale(5);

        // Multiple glowing layers for hologram effect
        const glow1 = this.add.image(0, 30, `char_${winnerData.id}`);
        glow1.setScale(5.3);
        glow1.setTint(winnerData.color);
        glow1.setAlpha(0.3);
        glow1.setBlendMode('ADD');

        const glow2 = this.add.image(0, 30, `char_${winnerData.id}`);
        glow2.setScale(5.6);
        glow2.setTint(winnerData.color);
        glow2.setAlpha(0.15);
        glow2.setBlendMode('ADD');

        // Pulsing glow animation
        this.tweens.add({
            targets: [glow1, glow2],
            alpha: { from: 0.3, to: 0.6 },
            duration: 1000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // Energy rings around character
        this.createEnergyRings(winnerData.color);

        // "VICTORY ACHIEVED" header with glitch
        const headerText = this.add.text(0, -150, '>>> VICTORY ACHIEVED <<<', {
            fontSize: '32px',
            fontFamily: 'Courier New, monospace',
            color: '#00ffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        headerText.setStroke('#000000', 4);
        headerText.setBlendMode('ADD');

        // Glitch effect on header
        this.time.addEvent({
            delay: 3000,
            callback: () => {
                headerText.x = (Math.random() - 0.5) * 10;
                this.time.delayedCall(50, () => { headerText.x = 0; });
            },
            repeat: -1
        });

        // Character name with cyber style
        const nameText = this.add.text(0, 140, `[ ${winnerData.name.toUpperCase()} ]`, {
            fontSize: '42px',
            fontFamily: 'Courier New, monospace',
            fontStyle: 'bold',
            color: Phaser.Display.Color.IntegerToColor(winnerData.color).rgba
        }).setOrigin(0.5);
        nameText.setStroke('#000000', 6);

        // Player label with brackets
        const playerLabel = this.add.text(0, 185, `< ${labelText} >`, {
            fontSize: '22px',
            fontFamily: 'Courier New, monospace',
            color: '#00ff00'
        }).setOrigin(0.5);
        playerLabel.setAlpha(0.8);

        // Stats display
        const statsText = this.add.text(0, 220, 'STATUS: OPERATIONAL | THREAT: NEUTRALIZED', {
            fontSize: '14px',
            fontFamily: 'Courier New, monospace',
            color: '#888888'
        }).setOrigin(0.5);

        this.winnerContainer.add([platform, glow2, glow1, sprite, headerText, nameText, playerLabel, statsText]);
        this.winnerContainer.setScale(0);
        this.winnerContainer.setAlpha(0);
    }

    createEnergyRings(color) {
        for (let i = 0; i < 3; i++) {
            const ring = this.add.graphics();
            ring.lineStyle(2, color, 0.6);
            ring.strokeCircle(0, 30, 80 + i * 30);
            ring.setBlendMode('ADD');

            this.winnerContainer.add(ring);

            this.tweens.add({
                targets: ring,
                angle: 360,
                duration: 4000 - i * 500,
                repeat: -1,
                ease: 'Linear'
            });
        }
    }

    playVictoryAnimation() {
        // Victory fanfare
        SFX.victory();
        // Screen flash
        this.cameras.main.flash(500, 0, 255, 255);

        // Dramatic entrance with fade and scale
        this.tweens.add({
            targets: this.winnerContainer,
            scale: 1,
            alpha: 1,
            duration: 1000,
            ease: 'Power3.out',
            onComplete: () => {
                // Floating animation
                this.tweens.add({
                    targets: this.winnerContainer,
                    y: this.winnerContainer.y - 15,
                    duration: 2000,
                    yoyo: true,
                    repeat: -1,
                    ease: 'Sine.easeInOut'
                });
            }
        });

        // Burst particles
        const winnerColor = this.winner.characterData.color;
        for (let i = 0; i < 30; i++) {
            this.time.delayedCall(i * 30, () => {
                const angle = Math.random() * Math.PI * 2;
                const dist = 100 + Math.random() * 100;
                const x = GAME_WIDTH / 2 + Math.cos(angle) * dist;
                const y = GAME_HEIGHT / 2 + Math.sin(angle) * dist;

                const particle = this.add.circle(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 20, 3, winnerColor);
                particle.setBlendMode('ADD');

                this.tweens.add({
                    targets: particle,
                    x: x,
                    y: y,
                    alpha: 0,
                    scale: 0,
                    duration: 800,
                    ease: 'Power2',
                    onComplete: () => particle.destroy()
                });
            });
        }
    }

    createButtons() {
        const buttonY = GAME_HEIGHT - 100;

        // Rematch button
        this.createCyberButton(GAME_WIDTH / 2 - 180, buttonY, '> REMATCH <', () => {
            this.cameras.main.fade(300, 0, 0, 0);
            this.time.delayedCall(300, () => {
                this.scene.start('GameScene', {
                    mode: this.gameMode,
                    player1: this.player1Data,
                    player2: this.player2Data,
                    arena: this.arena,
                    aiDifficulty: this.aiDifficulty
                });
            });
        });

        // New game button
        this.createCyberButton(GAME_WIDTH / 2 + 180, buttonY, '> NEW GAME <', () => {
            this.cameras.main.fade(300, 0, 0, 0);
            this.time.delayedCall(300, () => {
                this.scene.start('CharacterSelectScene', { mode: this.gameMode });
            });
        });

        // Main menu button
        const menuBtn = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 40, '[ MAIN MENU ]', {
            fontSize: '16px',
            fontFamily: 'Courier New, monospace',
            color: '#666666'
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        menuBtn.on('pointerover', () => {
            SFX.menuHover();
            menuBtn.setColor('#00ffff');
            menuBtn.setScale(1.1);
        });
        menuBtn.on('pointerout', () => {
            menuBtn.setColor('#666666');
            menuBtn.setScale(1);
        });
        menuBtn.on('pointerdown', () => {
            SFX.back();
            this.cameras.main.fade(300, 0, 0, 0);
            this.time.delayedCall(300, () => {
                this.scene.start('MenuScene');
            });
        });
    }

    createCyberButton(x, y, text, callback) {
        const container = this.add.container(x, y);

        // Background with glitch corners
        const bg = this.add.graphics();
        bg.fillStyle(0x1a1a3a, 0.9);
        bg.fillRect(-120, -30, 240, 60);

        // Cyber border
        const border = this.add.graphics();
        border.lineStyle(2, 0x00ffff, 0.8);
        border.strokeRect(-120, -30, 240, 60);

        // Corner accents
        border.lineStyle(3, 0x00ffff, 1);
        border.lineBetween(-120, -30, -105, -30);
        border.lineBetween(-120, -30, -120, -15);
        border.lineBetween(120, -30, 105, -30);
        border.lineBetween(120, -30, 120, -15);
        border.lineBetween(-120, 30, -105, 30);
        border.lineBetween(-120, 30, -120, 15);
        border.lineBetween(120, 30, 105, 30);
        border.lineBetween(120, 30, 120, 15);

        // Inner glow
        const glow = this.add.graphics();
        glow.fillStyle(0x00ffff, 0.1);
        glow.fillRect(-118, -28, 236, 56);
        glow.setBlendMode('ADD');

        // Text
        const btnText = this.add.text(0, 0, text, {
            fontSize: '20px',
            fontFamily: 'Courier New, monospace',
            fontStyle: 'bold',
            color: '#00ffff'
        }).setOrigin(0.5);
        btnText.setStroke('#000000', 3);

        container.add([bg, glow, border, btnText]);

        // Hit area
        const hitArea = this.add.rectangle(x, y, 240, 60, 0x000000, 0);
        hitArea.setInteractive({ useHandCursor: true });

        hitArea.on('pointerover', () => {
            SFX.menuHover();
            container.setScale(1.05);
            glow.clear();
            glow.fillStyle(0x00ffff, 0.3);
            glow.fillRect(-118, -28, 236, 56);
            btnText.setColor('#ffffff');
        });

        hitArea.on('pointerout', () => {
            container.setScale(1);
            glow.clear();
            glow.fillStyle(0x00ffff, 0.1);
            glow.fillRect(-118, -28, 236, 56);
            btnText.setColor('#00ffff');
        });

        hitArea.on('pointerdown', () => {
            SFX.menuClick();
            this.cameras.main.flash(50, 0, 255, 255);
            callback();
        });

        return container;
    }
}
