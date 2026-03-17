// Main Menu Scene - Cyber Minecraft Style UI
class MenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MenuScene' });
    }

    create() {
        Music.play('menu');
        // Cyber-Minecraft background
        this.createCyberBackground();

        // Title with neon glow
        this.createTitle();

        // Cyber-style menu buttons
        this.createMenuButtons();

        // Floating character previews
        this.createFloatingCharacters();

        // Version text
        this.add.text(GAME_WIDTH - 10, GAME_HEIGHT - 10, 'v2.0 CYBER', {
            fontSize: '14px',
            fontFamily: 'Courier New, monospace',
            color: '#00ffff'
        }).setOrigin(1, 1);
    }

    createCyberBackground() {
        // Dark cyber background
        const bg = this.add.graphics();
        bg.fillStyle(0x0a0a15, 1);
        bg.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

        // Grid pattern (cyber style)
        bg.lineStyle(1, 0x00ffff, 0.1);
        for (let x = 0; x < GAME_WIDTH; x += 32) {
            bg.moveTo(x, 0);
            bg.lineTo(x, GAME_HEIGHT);
        }
        for (let y = 0; y < GAME_HEIGHT; y += 32) {
            bg.moveTo(0, y);
            bg.lineTo(GAME_WIDTH, y);
        }
        bg.strokePath();

        // Blocky pixel noise overlay
        for (let x = 0; x < GAME_WIDTH; x += 16) {
            for (let y = 0; y < GAME_HEIGHT; y += 16) {
                if (Math.random() > 0.85) {
                    const colors = [0xff00ff, 0x00ffff, 0x00ff00];
                    bg.fillStyle(colors[Math.floor(Math.random() * colors.length)], 0.05);
                    bg.fillRect(x, y, 16, 16);
                }
            }
        }

        // Neon glow orbs
        for (let i = 0; i < 5; i++) {
            const orb = this.add.circle(
                Math.random() * GAME_WIDTH,
                Math.random() * GAME_HEIGHT,
                30 + Math.random() * 40,
                [0xff00ff, 0x00ffff, 0x00ff88][i % 3],
                0.08
            );
            orb.setBlendMode('ADD');

            this.tweens.add({
                targets: orb,
                x: Math.random() * GAME_WIDTH,
                y: Math.random() * GAME_HEIGHT,
                alpha: { from: 0.05, to: 0.15 },
                duration: 4000 + Math.random() * 3000,
                repeat: -1,
                yoyo: true
            });
        }
    }

    createTitle() {
        // Glitch shadow layers
        for (let i = 3; i > 0; i--) {
            const offset = i * 2;
            this.add.text(GAME_WIDTH / 2 - offset, 80, 'SUPER BROS', {
                fontSize: '64px',
                fontFamily: 'Courier New, monospace',
                fontStyle: 'bold',
                color: '#ff00ff'
            }).setOrigin(0.5).setAlpha(0.3);

            this.add.text(GAME_WIDTH / 2 + offset, 80, 'SUPER BROS', {
                fontSize: '64px',
                fontFamily: 'Courier New, monospace',
                fontStyle: 'bold',
                color: '#00ffff'
            }).setOrigin(0.5).setAlpha(0.3);
        }

        // Main title - neon cyan
        const title = this.add.text(GAME_WIDTH / 2, 80, 'SUPER BROS', {
            fontSize: '64px',
            fontFamily: 'Courier New, monospace',
            fontStyle: 'bold',
            color: '#ffffff'
        }).setOrigin(0.5);
        title.setStroke('#00ffff', 4);

        // Subtitle - "CYBER EDITION"
        const subtitle = this.add.text(GAME_WIDTH / 2, 140, '[ CYBER EDITION ]', {
            fontSize: '24px',
            fontFamily: 'Courier New, monospace',
            color: '#ff00ff'
        }).setOrigin(0.5);

        // Blinking effect
        this.tweens.add({
            targets: subtitle,
            alpha: { from: 0.6, to: 1 },
            duration: 500,
            yoyo: true,
            repeat: -1
        });

        // Splash text
        const splashes = ['>> LOADING FIGHTERS...', '>> NEON MODE ACTIVE', '>> SYSTEM ONLINE', '>> COMBO READY!'];
        const splash = this.add.text(GAME_WIDTH / 2 + 180, 115, splashes[Math.floor(Math.random() * splashes.length)], {
            fontSize: '14px',
            fontFamily: 'Courier New, monospace',
            color: '#00ff00'
        }).setOrigin(0.5).setRotation(-0.2);

        this.tweens.add({
            targets: splash,
            scaleX: 1.05,
            scaleY: 1.05,
            duration: 400,
            yoyo: true,
            repeat: -1
        });
    }

    createMenuButtons() {
        const buttonY = 280;
        const buttonSpacing = 70;

        const buttons = [
            { text: '> SINGLEPLAYER', scene: 'CharacterSelectScene', mode: 'single' },
            { text: '> MULTIPLAYER', scene: 'CharacterSelectScene', mode: 'versus' },
            { text: '> HOW TO PLAY', action: 'controls' }
        ];

        buttons.forEach((btn, index) => {
            this.createCyberButton(
                GAME_WIDTH / 2,
                buttonY + index * buttonSpacing,
                btn.text,
                () => {
                    if (btn.action === 'controls') {
                        this.showControls();
                    } else {
                        this.scene.start(btn.scene, { mode: btn.mode });
                    }
                }
            );
        });
    }

    createCyberButton(x, y, text, callback) {
        const container = this.add.container(x, y);
        const width = 320;
        const height = 50;

        // Button background - cyber blocky style
        const bg = this.add.graphics();
        this.drawCyberButton(bg, -width/2, -height/2, width, height, false);

        // Text
        const btnText = this.add.text(0, 0, text, {
            fontSize: '22px',
            fontFamily: 'Courier New, monospace',
            fontStyle: 'bold',
            color: '#00ffff'
        }).setOrigin(0.5);

        container.add([bg, btnText]);

        // Make interactive
        const hitArea = this.add.rectangle(x, y, width, height, 0x000000, 0);
        hitArea.setInteractive({ useHandCursor: true });

        hitArea.on('pointerover', () => {
            SFX.menuHover();
            bg.clear();
            this.drawCyberButton(bg, -width/2, -height/2, width, height, true);
            btnText.setColor('#ffffff');
            btnText.setText(text.replace('>', '>>'));
        });

        hitArea.on('pointerout', () => {
            bg.clear();
            this.drawCyberButton(bg, -width/2, -height/2, width, height, false);
            btnText.setColor('#00ffff');
            btnText.setText(text);
        });

        hitArea.on('pointerdown', () => {
            SFX.menuClick();
            this.cameras.main.flash(100, 0, 255, 255);
            callback();
        });

        return container;
    }

    drawCyberButton(graphics, x, y, width, height, hovered) {
        const mainColor = hovered ? 0x00ffff : 0x1a1a2e;
        const borderColor = hovered ? 0xff00ff : 0x00ffff;
        const glowAlpha = hovered ? 0.4 : 0.2;

        // Outer glow
        graphics.fillStyle(borderColor, glowAlpha);
        graphics.fillRect(x - 2, y - 2, width + 4, height + 4);

        // Black border
        graphics.fillStyle(0x000000, 1);
        graphics.fillRect(x, y, width, height);

        // Main body with blocky edges
        graphics.fillStyle(mainColor, 1);
        graphics.fillRect(x + 3, y + 3, width - 6, height - 6);

        // Neon border lines
        graphics.fillStyle(borderColor, 1);
        graphics.fillRect(x + 3, y + 3, width - 6, 2);  // Top
        graphics.fillRect(x + 3, y + height - 5, width - 6, 2);  // Bottom
        graphics.fillRect(x + 3, y + 3, 2, height - 6);  // Left
        graphics.fillRect(x + width - 5, y + 3, 2, height - 6);  // Right

        // Corner pixels (blocky look)
        graphics.fillStyle(borderColor, 0.5);
        graphics.fillRect(x, y, 3, 3);
        graphics.fillRect(x + width - 3, y, 3, 3);
        graphics.fillRect(x, y + height - 3, 3, 3);
        graphics.fillRect(x + width - 3, y + height - 3, 3, 3);

        // Scanline effect
        if (hovered) {
            for (let i = y + 6; i < y + height - 6; i += 4) {
                graphics.fillStyle(0x000000, 0.1);
                graphics.fillRect(x + 5, i, width - 10, 2);
            }
        }
    }

    createFloatingCharacters() {
        const positions = [
            { x: 150, y: 500 },
            { x: 1050, y: 480 },
            { x: 200, y: 280 },
            { x: 1000, y: 300 }
        ];

        positions.forEach((pos, i) => {
            const char = CHARACTER_LIST[i % CHARACTER_LIST.length];
            const sprite = this.add.image(pos.x, pos.y, `char_${char.id}`);
            sprite.setAlpha(0.4);
            sprite.setScale(1.5);
            sprite.setTint(0x00ffff);

            this.tweens.add({
                targets: sprite,
                y: pos.y + 15,
                alpha: { from: 0.3, to: 0.5 },
                duration: 2000 + i * 500,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        });
    }

    showControls() {
        const overlay = this.add.rectangle(
            GAME_WIDTH / 2, GAME_HEIGHT / 2,
            GAME_WIDTH, GAME_HEIGHT,
            0x000000, 0.85
        );

        const panel = this.add.container(GAME_WIDTH / 2, GAME_HEIGHT / 2);

        // Cyber panel background
        const panelBg = this.add.graphics();
        this.drawCyberPanel(panelBg, -300, -220, 600, 440);

        // Title
        const title = this.add.text(0, -180, '[ CONTROLS ]', {
            fontSize: '28px',
            fontFamily: 'Courier New, monospace',
            fontStyle: 'bold',
            color: '#00ffff'
        }).setOrigin(0.5);

        // Controls info
        const controlsText = [
            'PLAYER 1:',
            'Move: W A S D',
            'Attack: G',
            'Special: H',
            '',
            'PLAYER 2:',
            'Move: Arrow Keys',
            'Attack: Numpad 1',
            'Special: Numpad 2',
            '',
            'GENERAL:',
            'Pause: ESC'
        ];

        const textContent = this.add.text(0, 20, controlsText.join('\n'), {
            fontSize: '16px',
            fontFamily: 'Courier New, monospace',
            color: '#aaffaa',
            align: 'center',
            lineSpacing: 6
        }).setOrigin(0.5);

        // Close button
        const closeBg = this.add.graphics();
        this.drawCyberButton(closeBg, -60, -18, 120, 36, false);
        const closeText = this.add.text(0, 0, '[ CLOSE ]', {
            fontSize: '16px',
            fontFamily: 'Courier New, monospace',
            color: '#00ffff'
        }).setOrigin(0.5);

        const closeContainer = this.add.container(0, 180, [closeBg, closeText]);

        const closeHit = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 180, 120, 36, 0x000000, 0);
        closeHit.setInteractive({ useHandCursor: true });

        closeHit.on('pointerover', () => {
            SFX.menuHover();
            closeBg.clear();
            this.drawCyberButton(closeBg, -60, -18, 120, 36, true);
            closeText.setColor('#ffffff');
        });

        closeHit.on('pointerout', () => {
            closeBg.clear();
            this.drawCyberButton(closeBg, -60, -18, 120, 36, false);
            closeText.setColor('#00ffff');
        });

        closeHit.on('pointerdown', () => {
            SFX.close();
            panel.destroy();
            overlay.destroy();
            closeHit.destroy();
        });

        panel.add([panelBg, title, textContent, closeContainer]);
    }

    drawCyberPanel(graphics, x, y, width, height) {
        // Outer glow
        graphics.fillStyle(0x00ffff, 0.2);
        graphics.fillRect(x - 4, y - 4, width + 8, height + 8);

        // Black background
        graphics.fillStyle(0x0a0a15, 1);
        graphics.fillRect(x, y, width, height);

        // Inner panel
        graphics.fillStyle(0x1a1a2e, 1);
        graphics.fillRect(x + 4, y + 4, width - 8, height - 8);

        // Neon border
        graphics.fillStyle(0x00ffff, 1);
        graphics.fillRect(x + 4, y + 4, width - 8, 2);
        graphics.fillRect(x + 4, y + height - 6, width - 8, 2);
        graphics.fillRect(x + 4, y + 4, 2, height - 8);
        graphics.fillRect(x + width - 6, y + 4, 2, height - 8);

        // Corner accents
        graphics.fillStyle(0xff00ff, 1);
        graphics.fillRect(x, y, 8, 8);
        graphics.fillRect(x + width - 8, y, 8, 8);
        graphics.fillRect(x, y + height - 8, 8, 8);
        graphics.fillRect(x + width - 8, y + height - 8, 8, 8);
    }
}
