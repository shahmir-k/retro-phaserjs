// Stage Selection Scene
class StageSelectScene extends Phaser.Scene {
    constructor() {
        super({ key: 'StageSelectScene' });
    }

    init(data) {
        this.gameMode = data.mode;
        this.player1 = data.player1;
        this.player2 = data.player2;
        this.aiDifficulty = data.aiDifficulty;
        this.selectedStage = null;
    }

    create() {
        this.createBackground();
        this.createTitle();
        this.createStageGrid();
        this.createPreviewPanel();
        this.createButtons();
        this.setupInput();
    }

    createBackground() {
        const graphics = this.add.graphics();
        graphics.fillGradientStyle(0x1a1a2e, 0x0f3460, 0x16213e, 0x1a1a2e, 1);
        graphics.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

        // Animated hexagon pattern
        this.hexGraphics = this.add.graphics();
        this.hexPhase = 0;

        this.time.addEvent({
            delay: 100,
            callback: () => this.animateHexPattern(),
            loop: true
        });
    }

    animateHexPattern() {
        this.hexPhase += 0.02;
        this.hexGraphics.clear();
        this.hexGraphics.lineStyle(1, 0xe94560, 0.1);

        const size = 50;
        for (let row = 0; row < 15; row++) {
            for (let col = 0; col < 25; col++) {
                const x = col * size * 1.5;
                const y = row * size * 1.73 + (col % 2) * size * 0.866;
                const alpha = 0.05 + Math.sin(this.hexPhase + row * 0.3 + col * 0.2) * 0.05;
                this.hexGraphics.lineStyle(1, 0xe94560, alpha);
                this.drawHexagon(x, y, size * 0.4);
            }
        }
    }

    drawHexagon(x, y, size) {
        this.hexGraphics.beginPath();
        for (let i = 0; i < 6; i++) {
            const angle = (Math.PI / 3) * i - Math.PI / 6;
            const px = x + size * Math.cos(angle);
            const py = y + size * Math.sin(angle);
            if (i === 0) {
                this.hexGraphics.moveTo(px, py);
            } else {
                this.hexGraphics.lineTo(px, py);
            }
        }
        this.hexGraphics.closePath();
        this.hexGraphics.strokePath();
    }

    createTitle() {
        const title = this.add.text(GAME_WIDTH / 2, 40, 'SELECT ARENA', {
            fontSize: '42px',
            fontFamily: 'Arial Black',
            color: '#ffffff'
        }).setOrigin(0.5);
        title.setStroke('#e94560', 6);
        title.setShadow(3, 3, '#000000', 5);
    }

    createStageGrid() {
        this.stageBoxes = [];
        const startX = 120;
        const startY = 130;
        const boxWidth = 180;
        const boxHeight = 120;
        const spacing = 20;
        const cols = 4;

        ARENA_LIST.forEach((arena, index) => {
            const col = index % cols;
            const row = Math.floor(index / cols);
            const x = startX + col * (boxWidth + spacing);
            const y = startY + row * (boxHeight + spacing);

            const box = this.createStageBox(x, y, arena, boxWidth, boxHeight);
            this.stageBoxes.push(box);
        });
    }

    createStageBox(x, y, arena, width, height) {
        const container = this.add.container(x, y);

        // Background with arena theme colors
        const bg = this.add.graphics();
        const bgColor = arena.background.colors[0];
        bg.fillStyle(bgColor, 1);
        bg.fillRoundedRect(0, 0, width, height, 10);

        // Gradient overlay
        const overlay = this.add.graphics();
        overlay.fillGradientStyle(
            arena.background.colors[0], arena.background.colors[1],
            arena.background.colors[1], arena.background.colors[2], 0.8
        );
        overlay.fillRoundedRect(0, 0, width, height, 10);

        // Mini platform preview
        this.drawMiniPlatforms(overlay, arena, width, height);

        // Name banner
        const banner = this.add.graphics();
        banner.fillStyle(0x000000, 0.7);
        banner.fillRect(0, height - 30, width, 30);

        const name = this.add.text(width / 2, height - 15, arena.name, {
            fontSize: '14px',
            fontFamily: 'Arial Black',
            color: '#ffffff'
        }).setOrigin(0.5);

        // Selection border
        const border = this.add.graphics();
        border.lineStyle(4, 0xe94560, 1);
        border.strokeRoundedRect(0, 0, width, height, 10);
        border.setVisible(false);

        container.add([bg, overlay, banner, name, border]);

        // Interactive
        const hitArea = this.add.rectangle(x + width/2, y + height/2, width, height, 0x000000, 0);
        hitArea.setInteractive({ useHandCursor: true });

        hitArea.on('pointerover', () => {
            this.tweens.add({
                targets: container,
                scaleX: 1.05,
                scaleY: 1.05,
                duration: 100
            });
            this.updatePreview(arena);
        });

        hitArea.on('pointerout', () => {
            this.tweens.add({
                targets: container,
                scaleX: 1,
                scaleY: 1,
                duration: 100
            });
        });

        hitArea.on('pointerdown', () => {
            this.selectStage(arena);
        });

        return { container, arena, border };
    }

    drawMiniPlatforms(graphics, arena, width, height) {
        graphics.fillStyle(0xffffff, 0.3);

        arena.platforms.forEach(plat => {
            const scaleX = width / GAME_WIDTH;
            const scaleY = (height - 30) / GAME_HEIGHT;
            const px = plat.x * scaleX - (plat.width * scaleX) / 2;
            const py = plat.y * scaleY - 3;
            const pw = plat.width * scaleX;
            const ph = 6;

            graphics.fillRoundedRect(px, py, pw, ph, 2);
        });
    }

    createPreviewPanel() {
        this.previewPanel = this.add.container(950, 350);

        // Panel background
        const bg = this.add.graphics();
        bg.fillStyle(0x16213e, 1);
        bg.fillRoundedRect(-200, -170, 400, 340, 15);
        bg.lineStyle(3, 0xe94560, 1);
        bg.strokeRoundedRect(-200, -170, 400, 340, 15);

        // Title
        this.previewTitle = this.add.text(0, -140, 'SELECT A STAGE', {
            fontSize: '24px',
            fontFamily: 'Arial Black',
            color: '#e94560'
        }).setOrigin(0.5);

        // Preview area
        this.previewArea = this.add.graphics();

        // Info text
        this.previewInfo = this.add.text(0, 100, '', {
            fontSize: '14px',
            fontFamily: 'Arial',
            color: '#aaaaaa',
            align: 'center',
            wordWrap: { width: 360 }
        }).setOrigin(0.5);

        // Effects list
        this.effectsText = this.add.text(0, 140, '', {
            fontSize: '12px',
            fontFamily: 'Arial',
            color: '#888888'
        }).setOrigin(0.5);

        this.previewPanel.add([bg, this.previewTitle, this.previewArea, this.previewInfo, this.effectsText]);
    }

    updatePreview(arena) {
        this.previewTitle.setText(arena.name);

        // Draw larger preview
        this.previewArea.clear();

        // Background
        this.previewArea.fillGradientStyle(
            arena.background.colors[0], arena.background.colors[1],
            arena.background.colors[1], arena.background.colors[2], 1
        );
        this.previewArea.fillRoundedRect(-180, -100, 360, 180, 8);

        // Platforms
        this.previewArea.fillStyle(0xffffff, 0.4);
        arena.platforms.forEach(plat => {
            const scaleX = 360 / GAME_WIDTH;
            const scaleY = 180 / GAME_HEIGHT;
            const px = -180 + plat.x * scaleX - (plat.width * scaleX) / 2;
            const py = -100 + plat.y * scaleY - 4;
            const pw = plat.width * scaleX;
            const ph = 8;

            this.previewArea.fillRoundedRect(px, py, pw, ph, 3);
        });

        // Info
        const platformCount = arena.platforms.length;
        const hasFloating = arena.platforms.filter(p => p.type === 'floating').length;
        this.previewInfo.setText(
            `${platformCount} platforms (${hasFloating} floating)\n` +
            `Theme: ${arena.theme.toUpperCase()}`
        );

        this.effectsText.setText(`Effects: ${arena.effects.join(', ')}`);
    }

    selectStage(arena) {
        this.selectedStage = arena;
        this.cameras.main.flash(50, 233, 69, 96);

        // Update borders
        this.stageBoxes.forEach(box => {
            box.border.setVisible(box.arena === arena);
        });
    }

    createButtons() {
        // Start button
        const startBtn = this.add.container(950, 560);

        const bg = this.add.graphics();
        bg.fillStyle(0x00aa44, 1);
        bg.fillRoundedRect(-100, -25, 200, 50, 12);

        const highlight = this.add.graphics();
        highlight.fillStyle(0x00dd66, 0.5);
        highlight.fillRoundedRect(-95, -22, 190, 20, 10);

        const text = this.add.text(0, 0, 'FIGHT!', {
            fontSize: '26px',
            fontFamily: 'Arial Black',
            color: '#ffffff'
        }).setOrigin(0.5);

        startBtn.add([bg, highlight, text]);

        const hitArea = this.add.rectangle(950, 560, 200, 50, 0x000000, 0);
        hitArea.setInteractive({ useHandCursor: true });

        hitArea.on('pointerover', () => startBtn.setScale(1.05));
        hitArea.on('pointerout', () => startBtn.setScale(1));
        hitArea.on('pointerdown', () => this.startGame());

        // Random button
        const randomBtn = this.add.text(950, 620, '🎲 RANDOM STAGE', {
            fontSize: '16px',
            fontFamily: 'Arial',
            color: '#e94560'
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        randomBtn.on('pointerover', () => randomBtn.setScale(1.1));
        randomBtn.on('pointerout', () => randomBtn.setScale(1));
        randomBtn.on('pointerdown', () => {
            const randomArena = ARENA_LIST[Math.floor(Math.random() * ARENA_LIST.length)];
            this.selectStage(randomArena);
            this.updatePreview(randomArena);
        });

        // Back button
        const backBtn = this.add.text(50, 30, '← BACK', {
            fontSize: '20px',
            fontFamily: 'Arial Black',
            color: '#e94560'
        }).setInteractive({ useHandCursor: true });

        backBtn.on('pointerover', () => backBtn.setScale(1.1));
        backBtn.on('pointerout', () => backBtn.setScale(1));
        backBtn.on('pointerdown', () => {
            this.scene.start('CharacterSelectScene', { mode: this.gameMode });
        });
    }

    setupInput() {
        this.input.keyboard.on('keydown-ESC', () => {
            this.scene.start('CharacterSelectScene', { mode: this.gameMode });
        });
    }

    startGame() {
        if (!this.selectedStage) {
            // Select random stage if none selected
            this.selectedStage = ARENA_LIST[Math.floor(Math.random() * ARENA_LIST.length)];
        }

        // Epic transition
        this.cameras.main.flash(200, 255, 255, 255);
        this.cameras.main.fade(500, 0, 0, 0);

        this.time.delayedCall(500, () => {
            this.scene.start('GameScene', {
                mode: this.gameMode,
                player1: this.player1,
                player2: this.player2,
                arena: this.selectedStage,
                aiDifficulty: this.aiDifficulty
            });
        });
    }
}
