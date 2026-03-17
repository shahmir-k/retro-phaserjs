// Pause Menu Scene
class PauseScene extends Phaser.Scene {
    constructor() {
        super({ key: 'PauseScene' });
    }

    init(data) {
        this.gameScene = data.gameScene;
    }

    create() {
        // Semi-transparent overlay
        this.overlay = this.add.rectangle(
            GAME_WIDTH / 2, GAME_HEIGHT / 2,
            GAME_WIDTH, GAME_HEIGHT,
            0x000000, 0.7
        );

        // Pause panel
        this.createPanel();

        // Input
        this.input.keyboard.on('keydown-ESC', () => {
            this.resumeGame();
        });
    }

    createPanel() {
        const panel = this.add.container(GAME_WIDTH / 2, GAME_HEIGHT / 2);

        // Background - Minecraft-Cyber style matching HUD
        const bg = this.add.graphics();

        // Outer cyan glow
        bg.fillStyle(0x00ffff, 0.15);
        bg.fillRect(-202, -182, 404, 364);

        // Dark background
        bg.fillStyle(0x000000, 0.9);
        bg.fillRect(-200, -180, 400, 360);

        // Inner area
        bg.fillStyle(0x0a0a15, 0.9);
        bg.fillRect(-196, -176, 392, 352);

        // Neon cyan borders
        bg.fillStyle(0x00ffff, 0.8);
        bg.fillRect(-196, -176, 392, 2); // Top
        bg.fillRect(-196, 174, 392, 2);   // Bottom
        bg.fillRect(-196, -176, 2, 352);  // Left
        bg.fillRect(194, -176, 2, 352);   // Right

        // Title - Minecraft blocky style
        const title = this.add.text(0, -130, 'PAUSED', {
            fontSize: '48px',
            fontFamily: 'Courier New, monospace',
            fontStyle: 'bold',
            color: '#00ffff'
        }).setOrigin(0.5);
        title.setStroke('#000000', 6);

        // Pulsing animation
        this.tweens.add({
            targets: title,
            alpha: 0.7,
            duration: 800,
            yoyo: true,
            repeat: -1
        });

        panel.add([bg, title]);

        // Menu buttons
        const buttonY = -40;
        const spacing = 60;

        this.createButton(panel, 0, buttonY, 'RESUME', () => this.resumeGame());
        this.createButton(panel, 0, buttonY + spacing, 'RESTART', () => this.restartGame());
        this.createButton(panel, 0, buttonY + spacing * 2, 'MAIN MENU', () => this.goToMenu());

        // Controls reminder
        const controlsText = this.add.text(0, 130, 'Press ESC to resume', {
            fontSize: '14px',
            fontFamily: 'Courier New, monospace',
            color: '#00ffff'
        }).setOrigin(0.5);

        panel.add(controlsText);
    }

    createButton(panel, x, y, text, callback) {
        const btn = this.add.container(x, y);

        // Background - Minecraft style panel
        const bg = this.add.graphics();

        // Outer glow
        bg.fillStyle(0x00ffff, 0.15);
        bg.fillRect(-122, -27, 244, 54);

        // Dark background
        bg.fillStyle(0x000000, 0.9);
        bg.fillRect(-120, -25, 240, 50);

        // Inner area
        bg.fillStyle(0x0a0a15, 0.9);
        bg.fillRect(-118, -23, 236, 46);

        // Neon border
        bg.fillStyle(0x00ffff, 0.6);
        bg.fillRect(-118, -23, 236, 2); // Top
        bg.fillRect(-118, 21, 236, 2);   // Bottom

        // Text
        const btnText = this.add.text(0, 0, text, {
            fontSize: '20px',
            fontFamily: 'Courier New, monospace',
            fontStyle: 'bold',
            color: '#ffffff'
        }).setOrigin(0.5);
        btnText.setStroke('#000000', 3);

        btn.add([bg, btnText]);
        panel.add(btn);

        // Hit area
        const hitArea = this.add.rectangle(
            GAME_WIDTH / 2 + x,
            GAME_HEIGHT / 2 + y,
            240, 50,
            0x000000, 0
        );
        hitArea.setInteractive({ useHandCursor: true });

        hitArea.on('pointerover', () => {
            SFX.menuHover();
            btn.setScale(1.05);
            btnText.setColor('#00ffff');
            bg.clear();

            // Brighter on hover
            bg.fillStyle(0x00ffff, 0.25);
            bg.fillRect(-122, -27, 244, 54);
            bg.fillStyle(0x000000, 0.9);
            bg.fillRect(-120, -25, 240, 50);
            bg.fillStyle(0x0a0a15, 0.9);
            bg.fillRect(-118, -23, 236, 46);
            bg.fillStyle(0x00ffff, 1);
            bg.fillRect(-118, -23, 236, 2);
            bg.fillRect(-118, 21, 236, 2);
        });

        hitArea.on('pointerout', () => {
            btn.setScale(1);
            btnText.setColor('#ffffff');
            bg.clear();

            // Normal state
            bg.fillStyle(0x00ffff, 0.15);
            bg.fillRect(-122, -27, 244, 54);
            bg.fillStyle(0x000000, 0.9);
            bg.fillRect(-120, -25, 240, 50);
            bg.fillStyle(0x0a0a15, 0.9);
            bg.fillRect(-118, -23, 236, 46);
            bg.fillStyle(0x00ffff, 0.6);
            bg.fillRect(-118, -23, 236, 2);
            bg.fillRect(-118, 21, 236, 2);
        });

        hitArea.on('pointerdown', () => {
            SFX.menuClick();
            callback();
        });
    }

    resumeGame() {
        SFX.resume();
        this.scene.get('GameScene').togglePause();
    }

    restartGame() {
        const gameScene = this.scene.get('GameScene');
        this.scene.stop('PauseScene');
        this.scene.stop('GameScene');
        this.scene.start('GameScene', {
            mode: gameScene.gameMode,
            player1: gameScene.player1Data,
            player2: gameScene.player2Data,
            arena: gameScene.currentArena,
            aiDifficulty: gameScene.aiDifficulty
        });
    }

    goToMenu() {
        this.scene.stop('PauseScene');
        this.scene.stop('GameScene');
        this.scene.start('MenuScene');
    }
}
