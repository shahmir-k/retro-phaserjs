// Main Game Scene - The Battle Arena
class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }

    init(data) {
        this.gameMode = data.mode;
        this.player1Data = data.player1;
        this.player2Data = data.player2;
        this.currentArena = data.arena;
        this.aiDifficulty = data.aiDifficulty || 'MEDIUM';
    }

    create() {
        // Initialize game state
        this.gameOver = false;
        this.isPaused = false;
        this.countdownActive = true; // Set IMMEDIATELY to prevent any update logic before countdown starts

        // Create arena
        this.createArenaBackground();
        this.createPlatforms();
        this.createParticleEffects();

        // Create fighters
        this.createFighters();

        // Setup collisions IMMEDIATELY after fighters (before they fall)
        this.setupCollisions();

        // Create UI
        this.createHUD();

        // Setup input
        this.setupInput();

        // Setup AI if single player
        if (this.gameMode === 'single') {
            this.aiController = new AIController(
                this,
                this.player2,
                this.player1,
                this.aiDifficulty
            );
        }

        // Start game with countdown
        this.startCountdown();
    }

    createArenaBackground() {
        const arena = this.currentArena;
        const theme = arena.theme;

        // Determine if bright or dark theme
        this.isDarkTheme = ['cosmic', 'fire', 'cyber'].includes(theme);

        // Create pixelated background
        this.bgGraphics = this.add.graphics();
        this.createPixelatedSky(theme);

        // Create theme-specific background effects
        this.createThemeEffects();

        // Start sky animation
        this.skyTime = 0;
    }

    // PIXELATED SKY GENERATOR
    createPixelatedSky(theme) {
        const pixelSize = 8; // Size of each "pixel" in the sky
        const cols = Math.ceil(GAME_WIDTH / pixelSize);
        const rows = Math.ceil(GAME_HEIGHT / pixelSize);

        // Theme color palettes (gradient from top to bottom)
        const palettes = {
            cosmic: {
                colors: [0x0a0015, 0x150030, 0x200045, 0x1a0030, 0x0f0020],
                bright: false
            },
            fire: {
                colors: [0x1a0500, 0x331100, 0x552200, 0x773300, 0x440000],
                bright: false
            },
            ice: {
                colors: [0xaaddff, 0x88ccee, 0x66aadd, 0x4488cc, 0x3366aa],
                bright: true
            },
            cyber: {
                colors: [0x000022, 0x001133, 0x002244, 0x001133, 0x000022],
                bright: false
            },
            sky: {
                colors: [0x4488ff, 0x55aaff, 0x77ccff, 0x99ddff, 0xaaeeff],
                bright: true
            },
            nature: {
                colors: [0x1a3a1a, 0x2a5a2a, 0x3a7a3a, 0x4a9a4a, 0x3a6a3a],
                bright: true
            },
            epic: {
                colors: [0x1a1a2e, 0x252545, 0x16213e, 0x1f2f4f, 0x0f1a2e],
                bright: false
            },
            ancient: {
                colors: [0x2d1b0e, 0x3d2b1e, 0x4d3b2e, 0x3d2b1e, 0x2d1b0e],
                bright: false
            },
            default: {
                colors: [0x222244, 0x333355, 0x444466, 0x333355, 0x222244],
                bright: false
            }
        };

        const palette = palettes[theme] || palettes.default;

        // Draw pixelated gradient sky
        for (let row = 0; row < rows; row++) {
            const t = row / rows;
            const colorIndex = Math.floor(t * (palette.colors.length - 1));
            const nextIndex = Math.min(colorIndex + 1, palette.colors.length - 1);
            const blend = (t * (palette.colors.length - 1)) - colorIndex;

            for (let col = 0; col < cols; col++) {
                // Add some noise/variation
                const noise = (Math.sin(col * 0.3 + row * 0.2) + 1) * 0.1;
                const color = this.lerpColor(palette.colors[colorIndex], palette.colors[nextIndex], blend + noise * 0.2);

                this.bgGraphics.fillStyle(color, 1);
                this.bgGraphics.fillRect(col * pixelSize, row * pixelSize, pixelSize, pixelSize);
            }
        }
    }

    // Color interpolation helper
    lerpColor(color1, color2, t) {
        const r1 = (color1 >> 16) & 0xff;
        const g1 = (color1 >> 8) & 0xff;
        const b1 = color1 & 0xff;
        const r2 = (color2 >> 16) & 0xff;
        const g2 = (color2 >> 8) & 0xff;
        const b2 = color2 & 0xff;

        const r = Math.floor(r1 + (r2 - r1) * Math.max(0, Math.min(1, t)));
        const g = Math.floor(g1 + (g2 - g1) * Math.max(0, Math.min(1, t)));
        const b = Math.floor(b1 + (b2 - b1) * Math.max(0, Math.min(1, t)));

        return (r << 16) | (g << 8) | b;
    }

    createThemeEffects() {
        const theme = this.currentArena.theme;

        switch (theme) {
            case 'cosmic':
                this.createPixelCosmicBackground();
                break;
            case 'fire':
                this.createPixelFireBackground();
                break;
            case 'ice':
                this.createPixelIceBackground();
                break;
            case 'cyber':
                this.createPixelCyberBackground();
                break;
            case 'sky':
                this.createPixelSkyBackground();
                break;
            case 'nature':
                this.createPixelNatureBackground();
                break;
            case 'epic':
            case 'ancient':
                this.createPixelEpicBackground();
                break;
            default:
                this.createPixelDefaultBackground();
        }
    }

    // COSMIC - Dark with twinkling pixel stars
    createPixelCosmicBackground() {
        this.pixelStars = [];

        // Create pixel stars
        for (let i = 0; i < 80; i++) {
            const size = Math.random() > 0.8 ? 4 : 2;
            const star = this.add.rectangle(
                Math.random() * GAME_WIDTH,
                Math.random() * GAME_HEIGHT,
                size, size,
                [0xffffff, 0xaaaaff, 0xffaaff, 0xaaffff][Math.floor(Math.random() * 4)]
            );
            star.baseAlpha = 0.3 + Math.random() * 0.7;
            star.twinkleSpeed = 0.5 + Math.random() * 2;
            star.twinkleOffset = Math.random() * Math.PI * 2;
            this.pixelStars.push(star);
        }

        // Pixel nebula blobs
        for (let i = 0; i < 3; i++) {
            const nebula = this.add.graphics();
            const nx = 100 + Math.random() * (GAME_WIDTH - 200);
            const ny = 50 + Math.random() * (GAME_HEIGHT - 200);
            const color = [0xff00ff, 0x00ffff, 0xff6600][i];

            // Draw pixelated nebula
            for (let px = -5; px <= 5; px++) {
                for (let py = -5; py <= 5; py++) {
                    const dist = Math.sqrt(px * px + py * py);
                    if (dist < 5) {
                        nebula.fillStyle(color, 0.1 * (1 - dist / 5));
                        nebula.fillRect(nx + px * 12, ny + py * 12, 12, 12);
                    }
                }
            }
            nebula.setBlendMode('ADD');
        }
    }

    // FIRE - Dark with animated pixel embers
    createPixelFireBackground() {
        // Pixel lava at bottom
        const lavaGraphics = this.add.graphics();
        for (let x = 0; x < GAME_WIDTH; x += 8) {
            const height = 80 + Math.sin(x * 0.05) * 30;
            for (let y = 0; y < height; y += 8) {
                const t = y / height;
                const color = this.lerpColor(0xff6600, 0xff0000, t);
                lavaGraphics.fillStyle(color, 0.6 - t * 0.4);
                lavaGraphics.fillRect(x, GAME_HEIGHT - height + y, 8, 8);
            }
        }

        // Animated pixel embers
        this.pixelEmbers = [];
        for (let i = 0; i < 30; i++) {
            const ember = this.add.rectangle(
                Math.random() * GAME_WIDTH,
                GAME_HEIGHT + Math.random() * 50,
                4, 4,
                [0xff4400, 0xff6600, 0xffaa00, 0xffff00][Math.floor(Math.random() * 4)]
            );
            ember.setBlendMode('ADD');
            ember.vx = (Math.random() - 0.5) * 0.5;
            ember.vy = -1 - Math.random() * 2;
            this.pixelEmbers.push(ember);
        }
    }

    // ICE - Bright with pixel aurora and snowflakes
    createPixelIceBackground() {
        // Pixel aurora bands
        this.auroraGraphics = this.add.graphics();
        this.auroraPhase = 0;

        // Initial aurora draw
        this.drawPixelAurora();

        // Pixel snowflakes
        this.pixelSnow = [];
        for (let i = 0; i < 40; i++) {
            const snow = this.add.rectangle(
                Math.random() * GAME_WIDTH,
                Math.random() * GAME_HEIGHT,
                Math.random() > 0.7 ? 4 : 2,
                Math.random() > 0.7 ? 4 : 2,
                0xffffff,
                0.7 + Math.random() * 0.3
            );
            snow.vx = (Math.random() - 0.5) * 0.3;
            snow.vy = 0.5 + Math.random() * 1;
            this.pixelSnow.push(snow);
        }
    }

    drawPixelAurora() {
        this.auroraGraphics.clear();
        const colors = [0x00ff88, 0x00ffaa, 0x44ffcc, 0x88ffdd];

        for (let band = 0; band < 3; band++) {
            const baseY = 30 + band * 50;
            for (let x = 0; x < GAME_WIDTH; x += 8) {
                const wave = Math.sin(x * 0.02 + this.auroraPhase + band) * 20;
                const height = 30 + Math.sin(x * 0.01 + this.auroraPhase * 0.5) * 15;

                for (let y = 0; y < height; y += 8) {
                    const t = y / height;
                    this.auroraGraphics.fillStyle(colors[band], 0.15 * (1 - t));
                    this.auroraGraphics.fillRect(x, baseY + wave + y, 8, 8);
                }
            }
        }
    }

    // CYBER - Dark with pixel grid and neon scanlines
    createPixelCyberBackground() {
        // Pixel grid
        const gridGraphics = this.add.graphics();
        gridGraphics.fillStyle(0x00ffff, 0.15);

        for (let x = 0; x < GAME_WIDTH; x += 40) {
            for (let y = 0; y < GAME_HEIGHT; y += 8) {
                gridGraphics.fillRect(x, y, 2, 2);
            }
        }
        for (let y = 0; y < GAME_HEIGHT; y += 40) {
            for (let x = 0; x < GAME_WIDTH; x += 8) {
                gridGraphics.fillRect(x, y, 2, 2);
            }
        }

        // Neon scanlines
        this.scanlineY = 0;
        this.scanlineGraphics = this.add.graphics();

        // Data streams
        this.dataStreams = [];
        for (let i = 0; i < 8; i++) {
            const stream = {
                x: Math.random() * GAME_WIDTH,
                chars: [],
                speed: 2 + Math.random() * 3
            };
            for (let c = 0; c < 10; c++) {
                stream.chars.push({
                    y: -c * 20,
                    alpha: 1 - c * 0.1
                });
            }
            this.dataStreams.push(stream);
        }
        this.dataGraphics = this.add.graphics();
    }

    // SKY - Bright with pixel sun and clouds
    createPixelSkyBackground() {
        // Pixel sun
        const sunGraphics = this.add.graphics();
        const sunX = 150, sunY = 80;

        // Sun core
        for (let px = -4; px <= 4; px++) {
            for (let py = -4; py <= 4; py++) {
                const dist = Math.sqrt(px * px + py * py);
                if (dist <= 4) {
                    const color = dist < 2 ? 0xffffaa : (dist < 3 ? 0xffdd44 : 0xffaa00);
                    sunGraphics.fillStyle(color, 1);
                    sunGraphics.fillRect(sunX + px * 8, sunY + py * 8, 8, 8);
                }
            }
        }

        // Sun rays (pixelated)
        for (let r = 0; r < 8; r++) {
            const angle = (r / 8) * Math.PI * 2;
            for (let d = 5; d < 10; d++) {
                const rx = sunX + Math.cos(angle) * d * 8;
                const ry = sunY + Math.sin(angle) * d * 8;
                sunGraphics.fillStyle(0xffff00, 0.3);
                sunGraphics.fillRect(rx - 2, ry - 2, 4, 4);
            }
        }
        sunGraphics.setBlendMode('ADD');

        // Pixel clouds
        this.pixelClouds = [];
        for (let i = 0; i < 4; i++) {
            const cloud = this.createPixelCloud(
                -100 + Math.random() * (GAME_WIDTH + 100),
                40 + Math.random() * 120
            );
            cloud.vx = 0.3 + Math.random() * 0.5;
            this.pixelClouds.push(cloud);
        }
    }

    createPixelCloud(x, y) {
        const cloudGraphics = this.add.graphics();
        const cloudData = [];

        // Generate cloud shape
        const puffs = 4 + Math.floor(Math.random() * 3);
        for (let p = 0; p < puffs; p++) {
            const px = p * 20 - puffs * 10;
            const py = Math.sin(p * 0.8) * 8;
            const size = 2 + Math.floor(Math.random() * 2);

            for (let dx = -size; dx <= size; dx++) {
                for (let dy = -size; dy <= size; dy++) {
                    if (Math.abs(dx) + Math.abs(dy) <= size + 1) {
                        cloudData.push({ x: px + dx * 6, y: py + dy * 6 });
                    }
                }
            }
        }

        // Draw cloud pixels
        cloudData.forEach(pixel => {
            cloudGraphics.fillStyle(0xffffff, 0.8);
            cloudGraphics.fillRect(pixel.x, pixel.y, 6, 6);
        });

        cloudGraphics.setPosition(x, y);
        return cloudGraphics;
    }

    // NATURE - Bright jungle with pixel leaves and fireflies
    createPixelNatureBackground() {
        // Pixel trees in background
        const treeGraphics = this.add.graphics();
        for (let t = 0; t < 6; t++) {
            const tx = 80 + t * 150 + Math.random() * 50;
            const ty = GAME_HEIGHT - 100;

            // Tree trunk
            treeGraphics.fillStyle(0x4a3520, 1);
            for (let i = 0; i < 8; i++) {
                treeGraphics.fillRect(tx - 8 + (i % 2) * 2, ty - i * 12, 12, 12);
            }

            // Tree leaves (pixel circles)
            const leafColors = [0x2a6a2a, 0x3a8a3a, 0x4aaa4a];
            for (let lx = -3; lx <= 3; lx++) {
                for (let ly = -3; ly <= 1; ly++) {
                    const dist = Math.sqrt(lx * lx + ly * ly);
                    if (dist < 3.5) {
                        treeGraphics.fillStyle(leafColors[Math.floor(Math.random() * 3)], 0.9);
                        treeGraphics.fillRect(tx + lx * 14, ty - 90 + ly * 12, 12, 12);
                    }
                }
            }
        }

        // Pixel fireflies
        this.pixelFireflies = [];
        for (let i = 0; i < 15; i++) {
            const firefly = this.add.rectangle(
                Math.random() * GAME_WIDTH,
                100 + Math.random() * (GAME_HEIGHT - 200),
                3, 3,
                0xffff44
            );
            firefly.setBlendMode('ADD');
            firefly.baseX = firefly.x;
            firefly.baseY = firefly.y;
            firefly.phase = Math.random() * Math.PI * 2;
            firefly.glowPhase = Math.random() * Math.PI * 2;
            this.pixelFireflies.push(firefly);
        }

        // Falling leaves
        this.pixelLeaves = [];
        for (let i = 0; i < 12; i++) {
            const leaf = this.add.rectangle(
                Math.random() * GAME_WIDTH,
                Math.random() * GAME_HEIGHT,
                6, 4,
                [0x88aa44, 0x66882a, 0xaacc66][Math.floor(Math.random() * 3)]
            );
            leaf.setAngle(Math.random() * 360);
            leaf.vx = (Math.random() - 0.5) * 0.5;
            leaf.vy = 0.3 + Math.random() * 0.5;
            leaf.spin = (Math.random() - 0.5) * 2;
            this.pixelLeaves.push(leaf);
        }
    }

    // EPIC/ANCIENT - Dark dramatic with floating particles and light rays
    createPixelEpicBackground() {
        // Dramatic light rays from above
        const rayGraphics = this.add.graphics();
        for (let r = 0; r < 5; r++) {
            const rx = 100 + r * 180;
            const rayWidth = 30 + Math.random() * 20;

            for (let y = 0; y < GAME_HEIGHT; y += 8) {
                const spread = y * 0.15;
                const alpha = 0.1 * (1 - y / GAME_HEIGHT);
                rayGraphics.fillStyle(0xffffcc, alpha);
                rayGraphics.fillRect(rx - rayWidth/2 - spread/2, y, rayWidth + spread, 8);
            }
        }
        rayGraphics.setBlendMode('ADD');

        // Floating dust motes
        this.epicDust = [];
        for (let i = 0; i < 25; i++) {
            const dust = this.add.rectangle(
                Math.random() * GAME_WIDTH,
                Math.random() * GAME_HEIGHT,
                2, 2,
                0xffffaa,
                0.4 + Math.random() * 0.3
            );
            dust.setBlendMode('ADD');
            dust.vx = (Math.random() - 0.5) * 0.3;
            dust.vy = -0.1 - Math.random() * 0.2;
            dust.wobblePhase = Math.random() * Math.PI * 2;
            this.epicDust.push(dust);
        }

        // Pixel pillars/ruins in background
        const ruinGraphics = this.add.graphics();
        const pillarPositions = [50, 200, 600, 950, 1100];
        pillarPositions.forEach((px, idx) => {
            const height = 150 + Math.random() * 100;
            const broken = Math.random() > 0.5;

            for (let py = 0; py < height; py += 8) {
                const shade = 0x333344 + (py % 16 === 0 ? 0x111111 : 0);
                ruinGraphics.fillStyle(shade, 0.5);
                ruinGraphics.fillRect(px, GAME_HEIGHT - py - 8, 24, 8);

                if (broken && py > height - 40) {
                    if (Math.random() > 0.3) continue; // Skip some blocks for broken look
                }
            }
        });
    }

    createPixelDefaultBackground() {
        // Simple animated pixel particles
        this.defaultParticles = [];
        for (let i = 0; i < 20; i++) {
            const particle = this.add.rectangle(
                Math.random() * GAME_WIDTH,
                Math.random() * GAME_HEIGHT,
                4, 4,
                0x666688,
                0.3
            );
            particle.vx = (Math.random() - 0.5) * 0.5;
            particle.vy = (Math.random() - 0.5) * 0.5;
            this.defaultParticles.push(particle);
        }
    }

    // Update animated backgrounds (call in update loop)
    updatePixelBackgrounds() {
        this.skyTime = (this.skyTime || 0) + 0.016;

        // Update star twinkle
        if (this.pixelStars) {
            this.pixelStars.forEach(star => {
                star.setAlpha(star.baseAlpha * (0.5 + 0.5 * Math.sin(this.skyTime * star.twinkleSpeed + star.twinkleOffset)));
            });
        }

        // Update embers
        if (this.pixelEmbers) {
            this.pixelEmbers.forEach(ember => {
                ember.y += ember.vy;
                ember.x += ember.vx + Math.sin(this.skyTime * 2 + ember.x * 0.01) * 0.3;
                if (ember.y < -10) {
                    ember.y = GAME_HEIGHT + 10;
                    ember.x = Math.random() * GAME_WIDTH;
                }
            });
        }

        // Update snow
        if (this.pixelSnow) {
            this.pixelSnow.forEach(snow => {
                snow.y += snow.vy;
                snow.x += snow.vx + Math.sin(this.skyTime + snow.y * 0.01) * 0.2;
                if (snow.y > GAME_HEIGHT + 10) {
                    snow.y = -10;
                    snow.x = Math.random() * GAME_WIDTH;
                }
            });
        }

        // Update aurora
        if (this.auroraGraphics) {
            this.auroraPhase += 0.02;
            if (Math.floor(this.skyTime * 10) % 3 === 0) {
                this.drawPixelAurora();
            }
        }

        // Update cyber scanlines and data
        if (this.scanlineGraphics) {
            this.scanlineGraphics.clear();
            this.scanlineY = (this.scanlineY + 3) % GAME_HEIGHT;
            this.scanlineGraphics.fillStyle(0x00ffff, 0.2);
            this.scanlineGraphics.fillRect(0, this.scanlineY, GAME_WIDTH, 2);
            this.scanlineGraphics.fillStyle(0xff00ff, 0.1);
            this.scanlineGraphics.fillRect(0, (this.scanlineY + 100) % GAME_HEIGHT, GAME_WIDTH, 2);
        }

        if (this.dataStreams && this.dataGraphics) {
            this.dataGraphics.clear();
            this.dataStreams.forEach(stream => {
                stream.chars.forEach((char, i) => {
                    char.y += stream.speed;
                    if (char.y > GAME_HEIGHT) char.y = -20;
                    this.dataGraphics.fillStyle(0x00ff00, char.alpha * 0.5);
                    this.dataGraphics.fillRect(stream.x, char.y, 4, 8);
                });
            });
        }

        // Update clouds
        if (this.pixelClouds) {
            this.pixelClouds.forEach(cloud => {
                cloud.x += cloud.vx;
                if (cloud.x > GAME_WIDTH + 150) {
                    cloud.x = -150;
                }
            });
        }

        // Update default particles
        if (this.defaultParticles) {
            this.defaultParticles.forEach(p => {
                p.x += p.vx;
                p.y += p.vy;
                if (p.x < 0 || p.x > GAME_WIDTH) p.vx *= -1;
                if (p.y < 0 || p.y > GAME_HEIGHT) p.vy *= -1;
            });
        }

        // Update fireflies (nature theme)
        if (this.pixelFireflies) {
            this.pixelFireflies.forEach(ff => {
                ff.x = ff.baseX + Math.sin(this.skyTime * 0.5 + ff.phase) * 30;
                ff.y = ff.baseY + Math.cos(this.skyTime * 0.7 + ff.phase) * 20;
                ff.setAlpha(0.3 + 0.7 * Math.abs(Math.sin(this.skyTime * 2 + ff.glowPhase)));
            });
        }

        // Update falling leaves (nature theme)
        if (this.pixelLeaves) {
            this.pixelLeaves.forEach(leaf => {
                leaf.x += leaf.vx + Math.sin(this.skyTime + leaf.y * 0.02) * 0.3;
                leaf.y += leaf.vy;
                leaf.angle += leaf.spin;
                if (leaf.y > GAME_HEIGHT + 10) {
                    leaf.y = -10;
                    leaf.x = Math.random() * GAME_WIDTH;
                }
            });
        }

        // Update epic dust motes
        if (this.epicDust) {
            this.epicDust.forEach(dust => {
                dust.x += dust.vx + Math.sin(this.skyTime * 0.3 + dust.wobblePhase) * 0.2;
                dust.y += dust.vy;
                if (dust.y < -10) {
                    dust.y = GAME_HEIGHT + 10;
                    dust.x = Math.random() * GAME_WIDTH;
                }
            });
        }
    }

    createDefaultBackground() {
        // Generic particle effect
        this.add.particles(0, 0, 'particle_star', {
            x: { min: 0, max: GAME_WIDTH },
            y: { min: 0, max: GAME_HEIGHT },
            lifespan: 5000,
            speed: 20,
            scale: { start: 0.4, end: 0 },
            alpha: { start: 0.6, end: 0 },
            frequency: 200,
            blendMode: 'ADD'
        });
    }

    createPlatforms() {
        this.platforms = this.physics.add.staticGroup();

        this.currentArena.platforms.forEach(platData => {
            const plat = this.createPlatform(platData);
            this.platforms.add(plat);
        });
    }

    createPlatform(x, y, width, height, isMain = false) {
        const g = this.add.graphics();
        const S = 8; // pixel block size

        if (isMain) {
            // Grass top row
            const grassColors = [0x4caf50, 0x43a047, 0x388e3c];
            for (let bx = 0; bx < width; bx += S) {
                g.fillStyle(grassColors[Math.floor(bx / S) % grassColors.length], 1);
                g.fillRect(x + bx, y, Math.min(S, width - bx), S);
            }
            // Dirt rows
            const dirtColors = [0x8d6e63, 0x795548, 0x6d4c41];
            for (let by = S; by < height; by += S) {
                for (let bx = 0; bx < width; bx += S) {
                    g.fillStyle(dirtColors[Math.floor((bx + by) / S) % dirtColors.length], 1);
                    g.fillRect(x + bx, y + by, Math.min(S, width - bx), Math.min(S, height - by));
                }
            }
            // Stone brick pattern (every 2 rows, staggered)
            for (let row = 1; row * S * 2 < height; row++) {
                const by = row * S * 2;
                const offset = (row % 2) * S * 2;
                for (let bx = -offset; bx < width; bx += S * 4) {
                    g.lineStyle(1, 0x4a3728, 0.35);
                    g.strokeRect(x + bx, y + by, S * 4, S * 2);
                }
            }
        } else {
            // Floating platform: cyan shimmer top + blue crystal blocks
            const topColors = [0x00e5ff, 0x00bcd4, 0x0097a7];
            for (let bx = 0; bx < width; bx += S) {
                g.fillStyle(topColors[Math.floor(bx / S) % topColors.length], 1);
                g.fillRect(x + bx, y, Math.min(S, width - bx), S);
            }
            const blockColors = [0x1565c0, 0x1976d2, 0x1e88e5, 0x2196f3];
            for (let by = S; by < height; by += S) {
                for (let bx = 0; bx < width; bx += S) {
                    g.fillStyle(blockColors[Math.floor((bx / S + by / S)) % blockColors.length], 1);
                    g.fillRect(x + bx, y + by, Math.min(S, width - bx), Math.min(S, height - by));
                }
            }
            // Shimmer highlight dots
            g.fillStyle(0xffffff, 0.55);
            for (let bx = S; bx < width; bx += S * 3) {
                g.fillRect(x + bx, y + 2, 3, 3);
            }
        }

        // Physics body
        const body = this.physics.add.staticGroup();
        const rect = body.create(x + width / 2, y + height / 2, null, null, false);
        rect.setVisible(false);
        rect.body.setSize(width, height);
        rect.body.reset(x + width / 2, y + height / 2);
        return body;
    }

    createParticleEffects() {
        // Hit effect emitter
        this.hitEmitter = this.add.particles(0, 0, 'particle_spark', {
            speed: { min: 100, max: 300 },
            scale: { start: 1, end: 0 },
            alpha: { start: 1, end: 0 },
            lifespan: 300,
            blendMode: 'ADD',
            emitting: false
        });

        // Trail emitter for fast movement
        this.trailEmitter = this.add.particles(0, 0, 'particle_trail', {
            speed: 10,
            scale: { start: 0.5, end: 0 },
            alpha: { start: 0.5, end: 0 },
            lifespan: 200,
            blendMode: 'ADD',
            emitting: false
        });
    }

    createFighters() {
        // Find main platform to calculate spawn positions
        const mainPlatform = this.currentArena.platforms.find(p => p.type === 'main');
        const spawnY = mainPlatform.y - 60; // Spawn 60 pixels above main platform

        // Calculate spawn X positions based on platform width
        const platformLeft = mainPlatform.x - mainPlatform.width / 2;
        const platformRight = mainPlatform.x + mainPlatform.width / 2;
        const spawnOffset = Math.min(200, mainPlatform.width / 3); // Safe distance from edges

        const p1SpawnX = platformLeft + spawnOffset;
        const p2SpawnX = platformRight - spawnOffset;

        // Create Player 1 - left side of platform
        this.player1 = this.createFighter(p1SpawnX, spawnY, this.player1Data, 1);

        // Create Player 2 - right side of platform
        this.player2 = this.createFighter(p2SpawnX, spawnY, this.player2Data, 2);

        // Set up fighter references for combat
        this.player1.opponent = this.player2;
        this.player2.opponent = this.player1;
    }

    createFighter(x, y, charData, playerNum) {
        const fighter = this.add.container(x, y);

        // Character sprite - use sprite for animations
        const sprite = this.add.sprite(0, 0, `char_${charData.id}`, 0);
        sprite.setScale(1.5);

        // Direction indicator (facing)
        fighter.facingRight = playerNum === 1;
        if (!fighter.facingRight) sprite.setFlipX(true);

        // Shield effect (hidden initially)
        const shield = this.add.image(0, 0, 'effect_shield');
        shield.setScale(1.5);
        shield.setAlpha(0);
        shield.setBlendMode('ADD');

        // Add to container
        fighter.add([sprite, shield]);

        // Physics
        this.physics.add.existing(fighter);
        fighter.body.setSize(charData.size.width, charData.size.height);
        fighter.body.setOffset(-charData.size.width/2, -charData.size.height/2);
        fighter.body.setCollideWorldBounds(false);
        fighter.body.setGravityY(GRAVITY);
        fighter.body.setMaxVelocity(500, 800);

        // Start with gravity disabled - will be enabled after countdown
        fighter.body.setAllowGravity(false);
        fighter.body.setImmovable(true);

        // Fighter properties
        fighter.characterData = charData;
        fighter.playerNum = playerNum;
        fighter.sprite = sprite;
        fighter.shield = shield;
        fighter.damage = 0;
        fighter.stocks = STARTING_STOCKS;
        fighter.isGrounded = false;
        fighter.canDoubleJump = true;
        fighter.isAttacking = false;
        fighter.isInvincible = true; // Start invincible for spawn protection
        fighter.attackCooldown = 0;
        fighter.specialCooldown = 0;
        fighter.hitstun = 0;
        fighter.currentAnim = 'idle';
        fighter.inputState = {
            left: false, right: false, up: false, down: false,
            jump: false, attack: false, special: false
        };

        // Combo tracking
        fighter.comboCount = 0;
        fighter.lastHitTime = 0;
        fighter.comboText = null;

        // Create projectiles group
        fighter.projectiles = this.physics.add.group();

        // Start idle animation
        sprite.play(`${charData.id}_idle`);

        return fighter;
    }

    createHUD() {
        // Player 1 HUD (left side)
        this.p1HUD = this.createPlayerHUD(30, 20, this.player1, 0x55ff55);

        // Player 2 HUD (right side)
        this.p2HUD = this.createPlayerHUD(GAME_WIDTH - 230, 20, this.player2, 0xff5555);

        // Timer (center) - Minecraft style
        this.timerText = this.add.text(GAME_WIDTH / 2, 30, '∞', {
            fontSize: '28px',
            fontFamily: 'Courier New, monospace',
            fontStyle: 'bold',
            color: '#ffffff'
        }).setOrigin(0.5);
        this.timerText.setStroke('#3f3f3f', 3);
    }

    createPlayerHUD(x, y, fighter, color) {
        const container = this.add.container(x, y);

        // Minecraft-style inventory panel background
        const bg = this.add.graphics();
        this.drawMinecraftHUDPanel(bg, 0, 0, 200, 80);

        // Player label - blocky style
        const label = this.add.text(10, 8, `P${fighter.playerNum}`, {
            fontSize: '14px',
            fontFamily: 'Courier New, monospace',
            fontStyle: 'bold',
            color: Phaser.Display.Color.IntegerToColor(color).rgba
        });
        label.setStroke('#000000', 2);

        // Character name
        const name = this.add.text(40, 8, fighter.characterData.name, {
            fontSize: '12px',
            fontFamily: 'Courier New, monospace',
            color: '#3f3f3f'
        });

        // Damage percentage - large blocky text
        const damageText = this.add.text(100, 32, '0%', {
            fontSize: '24px',
            fontFamily: 'Courier New, monospace',
            fontStyle: 'bold',
            color: '#55ff55'
        }).setOrigin(0.5, 0);
        damageText.setStroke('#003300', 3);

        // Stock icons - Minecraft heart style
        const stockContainer = this.add.container(10, 58);
        const stockIcons = [];
        for (let i = 0; i < fighter.stocks; i++) {
            // Draw pixelated heart
            const heart = this.add.graphics();
            this.drawPixelHeart(heart, i * 22, 0, 0xff0000);
            stockContainer.add(heart);
            stockIcons.push(heart);
        }

        container.add([bg, label, name, damageText, stockContainer]);

        return {
            container,
            damageText,
            stockIcons,
            fighter
        };
    }

    drawMinecraftHUDPanel(graphics, x, y, width, height) {
        // BRIGHTER Cyber-Minecraft style panel
        const bgColor = 0x2a2a4e;  // Much brighter!
        const borderColor = 0x00ffff;

        // Outer BRIGHT glow - multiple layers
        graphics.fillStyle(borderColor, 0.3);
        graphics.fillRect(x - 4, y - 4, width + 8, height + 8);
        graphics.fillStyle(borderColor, 0.2);
        graphics.fillRect(x - 3, y - 3, width + 6, height + 6);
        graphics.fillStyle(borderColor, 0.1);
        graphics.fillRect(x - 2, y - 2, width + 4, height + 4);

        // Brighter background
        graphics.fillStyle(0x1a1a3e, 0.9);
        graphics.fillRect(x, y, width, height);

        // BRIGHT inner area
        graphics.fillStyle(bgColor, 0.95);
        graphics.fillRect(x + 2, y + 2, width - 4, height - 4);

        // BRIGHT neon border
        graphics.fillStyle(borderColor, 1);
        graphics.fillRect(x + 2, y + 2, width - 4, 3);  // Thicker
        graphics.fillRect(x + 2, y + height - 5, width - 4, 3);
        graphics.fillRect(x + 2, y + 2, 3, height - 4);
        graphics.fillRect(x + width - 5, y + 2, 3, height - 4);

        // BRIGHT corner accents
        graphics.fillStyle(0xff00ff, 1);
        graphics.fillRect(x, y, 6, 6);  // Bigger
        graphics.fillRect(x + width - 6, y, 6, 6);
        graphics.fillRect(x, y + height - 6, 6, 6);
        graphics.fillRect(x + width - 6, y + height - 6, 6, 6);

        // Add inner glow
        graphics.fillStyle(0xffffff, 0.1);
        graphics.fillRect(x + 4, y + 4, width - 8, height - 8);
    }

    drawPixelHeart(graphics, x, y, color) {
        // 8x8 pixel heart - cyber neon style
        const pixels = [
            [0,1,1,0,0,1,1,0],
            [1,1,1,1,1,1,1,1],
            [1,1,1,1,1,1,1,1],
            [1,1,1,1,1,1,1,1],
            [0,1,1,1,1,1,1,0],
            [0,0,1,1,1,1,0,0],
            [0,0,0,1,1,0,0,0],
            [0,0,0,0,0,0,0,0]
        ];

        const size = 2;

        // Glow effect
        graphics.fillStyle(0xff00ff, 0.3);
        for (let py = 0; py < pixels.length; py++) {
            for (let px = 0; px < pixels[py].length; px++) {
                if (pixels[py][px] === 1) {
                    graphics.fillRect(x + px * size - 1, y + py * size - 1, size + 2, size + 2);
                }
            }
        }

        // Main heart
        graphics.fillStyle(0xff00ff, 1);
        for (let py = 0; py < pixels.length; py++) {
            for (let px = 0; px < pixels[py].length; px++) {
                if (pixels[py][px] === 1) {
                    graphics.fillRect(x + px * size, y + py * size, size, size);
                }
            }
        }

        // Highlight
        graphics.fillStyle(0xffffff, 0.5);
        graphics.fillRect(x + 2, y + 2, 2, 2);
    }

    setupInput() {
        // Player 1 controls (WASD + F/Shift, E/Right Ctrl)
        this.p1Keys = {
            up: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
            down: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
            left: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
            right: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
            attack: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.F),
            attackAlt: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT),
            special: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E),
            specialAlt: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT_CONTROL)
        };

        // Player 2 controls (IJKL + U/O for attack, H/Y for special)
        this.p2Keys = {
            up: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.I),
            down: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.K),
            left: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.J),
            right: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.L),
            attack: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.U),
            attackAlt: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.O),
            special: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.H),
            specialAlt: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Y)
        };

        // Pause
        this.input.keyboard.on('keydown-ESC', () => {
            if (!this.gameOver) {
                this.togglePause();
            }
        });
    }

    setupCollisions() {
        // Fighters with platforms
        this.physics.add.collider(this.player1, this.platforms, this.handlePlatformCollision, null, this);
        this.physics.add.collider(this.player2, this.platforms, this.handlePlatformCollision, null, this);

        // Projectile collisions - set up separately to avoid confusion
        // Player 1's projectiles hit Player 2
        this.physics.add.overlap(
            this.player1.projectiles,
            this.player2,
            (projectile, fighter) => this.handleProjectileHit(projectile, fighter),
            null,
            this
        );

        // Player 2's projectiles hit Player 1
        this.physics.add.overlap(
            this.player2.projectiles,
            this.player1,
            (projectile, fighter) => this.handleProjectileHit(projectile, fighter),
            null,
            this
        );
    }

    handlePlatformCollision(fighter, platform) {
        // Check if it's a passthrough platform
        if (platform.isPassthrough) {
            // Only collide from above
            if (fighter.body.velocity.y < 0 || fighter.inputState.down) {
                platform.body.checkCollision.none = true;
                this.time.delayedCall(100, () => {
                    platform.body.checkCollision.none = false;
                });
                return false;
            }
        }

        fighter.isGrounded = true;
        fighter.canDoubleJump = true;
    }

    handleProjectileHit(obj1, obj2) {
        try {
            // Safety check - make sure both objects exist
            if (!obj1 || !obj2) return;

            // Phaser can swap arguments - identify which is which
            let projectile, fighter;

            if (obj1 && obj1.isProjectile) {
                projectile = obj1;
                fighter = obj2;
            } else if (obj2 && obj2.isProjectile) {
                projectile = obj2;
                fighter = obj1;
            } else {
                // Neither is a projectile, skip
                return;
            }

            // Extra safety checks
            if (!projectile || !projectile.active) return;
            if (!fighter || !fighter.body) return;
            if (!fighter.active) return;
            if (projectile.hasHit) return;

            // Don't hit the owner of the projectile
            if (projectile.owner === fighter) return;

            // Don't hit invincible fighters
            if (fighter.isInvincible) return;

            // Check fighter has characterData (is actually a fighter)
            if (!fighter.characterData) return;

            // Mark as hit BEFORE applying damage to prevent double-hits
            projectile.hasHit = true;

            try {
                // Get attack data from projectile with safe defaults
                const damage = (typeof projectile.attackDamage === 'number' && projectile.attackDamage > 0) ? projectile.attackDamage : 15;
                const knockback = (typeof projectile.attackKnockback === 'number' && projectile.attackKnockback > 0) ? projectile.attackKnockback : 1.2;
                const direction = (typeof projectile.x === 'number' && typeof fighter.x === 'number') ? (projectile.x < fighter.x ? 1 : -1) : 1;

                // Apply damage properly
                this.applyDamage(fighter, damage, knockback, direction);
            } catch (e) {
                console.warn('Error applying projectile damage:', e);
            }

            try {
                if (projectile && projectile.active && projectile.destroy) {
                    projectile.destroy();
                }
            } catch (e) {
                console.warn('Error destroying projectile:', e);
            }
        } catch (e) {
            console.error('Collision error:', e);
        }
    }

    startCountdown() {
        this.countdownActive = true;

        // Completely freeze players during countdown - disable gravity and movement
        [this.player1, this.player2].forEach(fighter => {
            fighter.body.setAllowGravity(false);
            fighter.body.setVelocity(0, 0);
            fighter.body.setImmovable(true);

            // Visual spawn protection effect during countdown
            this.tweens.add({
                targets: fighter.sprite,
                alpha: { from: 0.5, to: 1 },
                duration: 150,
                repeat: 15,
                yoyo: true
            });
        });

        const countdownText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2, '3', {
            fontSize: '120px',
            fontFamily: 'Arial Black',
            color: '#ffffff'
        }).setOrigin(0.5);
        countdownText.setStroke('#e94560', 8);

        // Countdown animation
        let count = 3;
        const countdownTimer = this.time.addEvent({
            delay: 800,
            callback: () => {
                count--;
                if (count > 0) {
                    SFX.countdown();
                    countdownText.setText(count.toString());
                    this.tweens.add({
                        targets: countdownText,
                        scaleX: 1.5,
                        scaleY: 1.5,
                        duration: 100,
                        yoyo: true
                    });
                } else if (count === 0) {
                    SFX.countdownGo();
                    countdownText.setText('FIGHT!');
                    countdownText.setFontSize(80);
                } else {
                    countdownText.destroy();
                    this.countdownActive = false;

                    // Re-enable physics for both players
                    [this.player1, this.player2].forEach(fighter => {
                        fighter.body.setImmovable(false);
                        fighter.body.setAllowGravity(true);
                        fighter.body.setVelocity(0, 0);
                    });

                    // Start spawn protection timer after countdown
                    this.startSpawnProtection(this.player1);
                    this.startSpawnProtection(this.player2);
                }
            },
            repeat: 4
        });
    }

    startSpawnProtection(fighter) {
        fighter.isInvincible = true;
        fighter.sprite.setAlpha(1);

        // Show shield visual during spawn protection
        if (fighter.shield) {
            fighter.shield.setAlpha(0.5);
            fighter.shield.setScale(1.8);
        }

        // Flashing effect for spawn protection
        this.tweens.add({
            targets: fighter.sprite,
            alpha: { from: 0.4, to: 1 },
            duration: 150,
            repeat: Math.floor(RESPAWN_INVINCIBILITY / 150),
            yoyo: true,
            onComplete: () => {
                fighter.isInvincible = false;
                fighter.sprite.setAlpha(1);
                if (fighter.shield) {
                    fighter.shield.setAlpha(0);
                }
            }
        });

        // Backup timer to ensure invincibility ends
        this.time.delayedCall(RESPAWN_INVINCIBILITY + 100, () => {
            fighter.isInvincible = false;
            fighter.sprite.setAlpha(1);
            if (fighter.shield) {
                fighter.shield.setAlpha(0);
            }
        });
    }

    update(time, delta) {
        // Always update animated backgrounds (even during countdown)
        this.updatePixelBackgrounds();

        if (this.gameOver || this.isPaused || this.countdownActive) return;

        // Update cooldowns
        this.updateCooldowns(delta);

        // Process input
        this.processInput();

        // Update fighters
        this.updateFighter(this.player1, delta);
        this.updateFighter(this.player2, delta);

        // Update AI
        if (this.aiController) {
            this.aiController.update(time, delta);
        }

        // Check blast zones
        this.checkBlastZones();

        // Update HUD
        this.updateHUD();

        // Check combat
        this.checkCombat();
    }

    updateCooldowns(delta) {
        const currentTime = this.time.now;
        const COMBO_WINDOW = 2000;

        [this.player1, this.player2].forEach(fighter => {
            if (fighter.attackCooldown > 0) fighter.attackCooldown -= delta;
            if (fighter.specialCooldown > 0) fighter.specialCooldown -= delta;
            if (fighter.hitstun > 0) fighter.hitstun -= delta;

            // Reset combo if window expired
            if (fighter.comboCount > 0 && currentTime - fighter.lastHitTime > COMBO_WINDOW) {
                fighter.comboCount = 0;
            }
        });
    }

    processInput() {
        // Player 1
        this.player1.inputState = {
            left: this.p1Keys.left.isDown,
            right: this.p1Keys.right.isDown,
            up: this.p1Keys.up.isDown,
            down: this.p1Keys.down.isDown,
            jump: Phaser.Input.Keyboard.JustDown(this.p1Keys.up),
            attack: Phaser.Input.Keyboard.JustDown(this.p1Keys.attack) || Phaser.Input.Keyboard.JustDown(this.p1Keys.attackAlt),
            special: Phaser.Input.Keyboard.JustDown(this.p1Keys.special) || Phaser.Input.Keyboard.JustDown(this.p1Keys.specialAlt)
        };

        // Player 2 (if not AI)
        if (this.gameMode !== 'single') {
            this.player2.inputState = {
                left: this.p2Keys.left.isDown,
                right: this.p2Keys.right.isDown,
                up: this.p2Keys.up.isDown,
                down: this.p2Keys.down.isDown,
                jump: Phaser.Input.Keyboard.JustDown(this.p2Keys.up),
                attack: Phaser.Input.Keyboard.JustDown(this.p2Keys.attack) || Phaser.Input.Keyboard.JustDown(this.p2Keys.attackAlt),
                special: Phaser.Input.Keyboard.JustDown(this.p2Keys.special) || Phaser.Input.Keyboard.JustDown(this.p2Keys.specialAlt)
            };
        }
    }

    updateFighter(fighter, delta) {
        const input = fighter.inputState;
        const char = fighter.characterData;
        const charId = char.id;

        // Skip if in hitstun
        if (fighter.hitstun > 0) {
            fighter.sprite.setTint(0xff0000);
            this.playAnimation(fighter, 'hurt');
            return;
        } else {
            fighter.sprite.clearTint();
        }

        // Movement
        const speed = char.speed * (fighter.isGrounded ? 1 : AIR_CONTROL);

        if (input.left) {
            fighter.body.setVelocityX(-speed);
            fighter.facingRight = false;
            fighter.sprite.setFlipX(true);
        } else if (input.right) {
            fighter.body.setVelocityX(speed);
            fighter.facingRight = true;
            fighter.sprite.setFlipX(false);
        } else {
            // Apply friction
            fighter.body.setVelocityX(fighter.body.velocity.x * GROUND_FRICTION);
        }

        // Jumping
        if (input.jump || input.up) {
            if (fighter.isGrounded) {
                fighter.body.setVelocityY(JUMP_VELOCITY * char.jumpPower);
                fighter.isGrounded = false;
                SFX.jump();
                this.createJumpEffect(fighter);
                this.playAnimation(fighter, 'jump');
            } else if (fighter.canDoubleJump) {
                fighter.body.setVelocityY(DOUBLE_JUMP_VELOCITY * char.jumpPower);
                fighter.canDoubleJump = false;
                SFX.doubleJump();
                this.createJumpEffect(fighter);
                this.playAnimation(fighter, 'jump');
            }
        }

        // Fast fall
        if (input.down && !fighter.isGrounded && fighter.body.velocity.y > 0) {
            fighter.body.setVelocityY(fighter.body.velocity.y + 20);
        }

        // Attacks
        if (input.attack && fighter.attackCooldown <= 0) {
            this.performAttack(fighter, 'normal');
        }

        if (input.special && fighter.specialCooldown <= 0) {
            this.performAttack(fighter, 'special');
        }

        // Check if grounded
        fighter.isGrounded = fighter.body.blocked.down || fighter.body.touching.down;

        // Update animation based on state (if not attacking)
        if (!fighter.isAttacking) {
            if (!fighter.isGrounded) {
                this.playAnimation(fighter, 'jump');
            } else if (Math.abs(fighter.body.velocity.x) > 20) {
                this.playAnimation(fighter, 'walk');
            } else {
                this.playAnimation(fighter, 'idle');
            }
        }

        // Movement trail for fast movement
        if (Math.abs(fighter.body.velocity.x) > 200 || Math.abs(fighter.body.velocity.y) > 300) {
            this.trailEmitter.setPosition(fighter.x, fighter.y);
            this.trailEmitter.setParticleTint(fighter.characterData.color);
            this.trailEmitter.emitParticle(1);
        }
    }

    playAnimation(fighter, animName) {
        const charId = fighter.characterData.id;
        const animKey = `${charId}_${animName}`;

        if (fighter.currentAnim !== animName) {
            fighter.currentAnim = animName;
            fighter.sprite.play(animKey, true);
        }
    }

    createJumpEffect(fighter) {
        // Dust particles
        for (let i = 0; i < 5; i++) {
            const dust = this.add.circle(
                fighter.x + (Math.random() - 0.5) * 30,
                fighter.y + 30,
                5 + Math.random() * 5,
                0xffffff,
                0.6
            );

            this.tweens.add({
                targets: dust,
                y: dust.y + 20,
                alpha: 0,
                scale: 0,
                duration: 300,
                onComplete: () => dust.destroy()
            });
        }
    }

    performAttack(fighter, type) {
        const attack = fighter.characterData.attacks[type];
        fighter.isAttacking = true;

        if (type === 'normal') {
            fighter.attackCooldown = ATTACK_COOLDOWN;
            this.playAnimation(fighter, 'attack');
            SFX.attack();
            this.createMeleeAttack(fighter, attack);
        } else {
            fighter.specialCooldown = SPECIAL_COOLDOWN;
            this.playAnimation(fighter, 'special');
            SFX.special();
            this.createSpecialAttack(fighter, attack);
        }

        // End attack after duration
        this.time.delayedCall(attack.duration * 16, () => {
            fighter.isAttacking = false;
            fighter.currentAnim = ''; // Force animation update
        });
    }

    createMeleeAttack(fighter, attack) {
        const direction = fighter.facingRight ? 1 : -1;
        const effectType = fighter.characterData.attackEffect || 'slash_default';

        // Create varied visual effects based on character
        this.createMeleeEffect(fighter, direction, effectType);

        // Check hit
        const hitbox = {
            x: fighter.x + direction * attack.range / 2,
            y: fighter.y,
            width: attack.range,
            height: 50
        };

        const opponent = fighter.opponent;
        if (opponent && this.checkHitbox(hitbox, opponent) && !opponent.isInvincible) {
            this.applyDamage(opponent, attack.damage, attack.knockback, direction);
        }
    }

    // Check if two fighters overlap
    checkOverlap(fighter1, fighter2) {
        try {
            if (!fighter1 || !fighter2) return false;
            if (!fighter1.body || !fighter2.body) return false;
            if (!fighter1.active || !fighter2.active) return false;

            const bounds1 = fighter1.body.getBounds();
            const bounds2 = fighter2.body.getBounds();

            if (!bounds1 || !bounds2) return false;

            return Phaser.Geom.Rectangle.Overlaps(bounds1, bounds2);
        } catch (e) {
            console.warn('checkOverlap error:', e);
            return false;
        }
    }

    // Create pixelated particles
    createPixelParticles(x, y, color, count, spread, speed, gravity = 0) {
        const particles = [];
        for (let i = 0; i < count; i++) {
            const size = 2 + Math.floor(Math.random() * 4);
            const particle = this.add.rectangle(x, y, size, size, color);
            particle.setBlendMode('ADD');

            const angle = Math.random() * Math.PI * 2;
            const velocity = speed * (0.5 + Math.random() * 0.5);
            const vx = Math.cos(angle) * velocity * spread;
            const vy = Math.sin(angle) * velocity * spread - speed * 0.5;

            particles.push({ obj: particle, vx, vy, gravity });
        }

        // Animate particles
        let frame = 0;
        const updateParticles = () => {
            frame++;
            particles.forEach(p => {
                p.obj.x += p.vx;
                p.obj.y += p.vy;
                p.vy += p.gravity;
                p.obj.alpha = Math.max(0, 1 - frame / 15);
            });

            if (frame < 15) {
                this.time.delayedCall(16, updateParticles);
            } else {
                particles.forEach(p => p.obj.destroy());
            }
        };
        updateParticles();
    }

    // Screen shake effect - gentle version
    doScreenShake(intensity = 5, duration = 100) {
        // Much more subtle - reduced by 70%
        this.cameras.main.shake(duration * 0.5, intensity / 4000);
    }

    // Hitstop effect (freeze frame) - subtle version
    doHitstop(duration = 50) {
        // Cap at 25ms for subtle effect
        const reducedDuration = Math.min(duration * 0.4, 25);
        this.physics.world.pause();
        this.time.delayedCall(reducedDuration, () => {
            this.physics.world.resume();
        });
    }

    // Create pixelated slash trail
    createPixelSlash(fighter, direction) {
        const x = fighter.sprite.x + direction * 60;
        const y = fighter.sprite.y - 20;
        const g = this.add.graphics();

        // Three arc layers: outer ghost trail, mid, inner
        const layers = [
            { r: 72, lw: 6, color: 0xffffff, alpha: 0.18 },
            { r: 58, lw: 9, color: 0x88eeff, alpha: 0.55 },
            { r: 44, lw: 7, color: 0xffffff, alpha: 0.90 },
        ];
        layers.forEach(({ r, lw, color, alpha }) => {
            g.lineStyle(lw, color, alpha);
            const startA = direction > 0 ? Math.PI * 0.85 : Math.PI * 0.15;
            const endA   = direction > 0 ? Math.PI * 0.15 : Math.PI * 0.85;
            g.beginPath();
            g.arc(x, y, r, startA, endA, direction > 0);
            g.strokePath();
        });

        // Speed lines
        for (let i = 0; i < 5; i++) {
            const ang = (direction > 0 ? Math.PI : 0) + (Math.random() - 0.5) * 0.9;
            const len = 18 + Math.random() * 28;
            g.lineStyle(2, 0xffffff, 0.45);
            g.beginPath();
            g.moveTo(x, y + (Math.random() - 0.5) * 60);
            g.lineTo(x + Math.cos(ang) * len, y + Math.sin(ang) * len);
            g.strokePath();
        }

        this.tweens.add({
            targets: g,
            alpha: 0,
            scaleX: 1.3,
            scaleY: 1.3,
            duration: 220,
            ease: 'Power2',
            onComplete: () => g.destroy()
        });
    }

    // Create pixelated hit impact effect when damage is taken
    createPixelHitEffect(x, y) {
        const g = this.add.graphics();

        // Ground shadow
        g.fillStyle(0x000000, 0.18);
        g.fillEllipse(x, y + 55, 90, 22);

        // Fire blobs: red -> orange -> yellow -> white core
        const blobs = [
            { color: 0xcc1100, r: 38, alpha: 0.85 },
            { color: 0xff4400, r: 30, alpha: 0.90 },
            { color: 0xff9900, r: 22, alpha: 0.95 },
            { color: 0xffee44, r: 13, alpha: 1.00 },
            { color: 0xffffff, r:  6, alpha: 1.00 },
        ];
        blobs.forEach(({ color, r, alpha }) => {
            g.fillStyle(color, alpha);
            // Irregular blob via multiple offset circles
            for (let i = 0; i < 5; i++) {
                const ox = (Math.random() - 0.5) * r * 0.7;
                const oy = (Math.random() - 0.5) * r * 0.7 - r * 0.15;
                g.fillCircle(x + ox, y + oy, r * (0.55 + Math.random() * 0.45));
            }
        });

        // Lightning bolts
        for (let b = 0; b < 4; b++) {
            const ang = (b / 4) * Math.PI * 2 + Math.random() * 0.4;
            const len = 36 + Math.random() * 24;
            g.lineStyle(3, 0xffffff, 0.80);
            g.beginPath();
            let cx = x, cy = y;
            for (let s = 0; s < 4; s++) {
                const nx = cx + Math.cos(ang) * (len / 4) + (Math.random() - 0.5) * 14;
                const ny = cy + Math.sin(ang) * (len / 4) + (Math.random() - 0.5) * 14;
                g.lineTo(nx, ny);
                cx = nx; cy = ny;
            }
            g.strokePath();
        }

        // Center white flash
        g.fillStyle(0xffffff, 0.95);
        g.fillCircle(x, y, 10);

        // Upward sparks
        for (let i = 0; i < 7; i++) {
            const sx = x + (Math.random() - 0.5) * 50;
            const sy = y - 10 - Math.random() * 40;
            g.fillStyle(Math.random() > 0.5 ? 0xffee44 : 0xff9900, 0.90);
            g.fillRect(sx, sy, 4, 4);
        }

        this.tweens.add({
            targets: g,
            alpha: 0,
            scaleX: 1.5,
            scaleY: 1.5,
            y: g.y - 20,
            duration: 320,
            ease: 'Power2',
            onComplete: () => g.destroy()
        });

        // POW text
        const words = ['POW!', 'BAM!', 'ZAP!'];
        const word = words[Math.floor(Math.random() * words.length)];
        const txt = this.add.text(x + (Math.random() - 0.5) * 40, y - 50, word, {
            fontSize: '28px', fontFamily: 'monospace',
            color: '#ffee44', stroke: '#cc4400', strokeThickness: 5
        }).setOrigin(0.5);
        this.tweens.add({
            targets: txt, y: txt.y - 40, alpha: 0, duration: 500,
            ease: 'Power2', onComplete: () => txt.destroy()
        });
    }

    createMeleeEffect(fighter, direction, effectType) {
        const x = fighter.x + direction * 30;
        const y = fighter.y;
        const color = fighter.characterData.color;

        // No screen shake on basic attacks - only visual effects
        // (shake is reserved for actual hits in applyDamage)

        switch (effectType) {
            case 'slash_purple':
            case 'katana_red':
                // Pixelated arc slash effect with trail
                this.createPixelSlash(x, y, direction, color, 40);
                this.createPixelParticles(x, y, color, 6, 1, 3);

                // Add speed lines
                for (let i = 0; i < 3; i++) {
                    const line = this.add.rectangle(x - direction * 20, y - 10 + i * 10, 25, 2, 0xffffff);
                    line.setBlendMode('ADD');
                    line.setAlpha(0.7);
                    this.tweens.add({
                        targets: line,
                        x: x + direction * 30,
                        alpha: 0,
                        duration: 80,
                        onComplete: () => line.destroy()
                    });
                }
                break;

            case 'punch_orange':
            case 'rage_red':
                // PIXELATED FIST IMPACT - comic book style POW!
                // Screen shake removed - too intense

                // Create impact star burst
                const impactG = this.add.graphics();
                impactG.setBlendMode('ADD');

                // Draw pixelated star burst
                for (let i = 0; i < 8; i++) {
                    const angle = (i / 8) * Math.PI * 2;
                    const len = 20 + Math.random() * 15;
                    impactG.fillStyle(i % 2 === 0 ? color : 0xffffff, 1);
                    impactG.fillRect(
                        x + Math.cos(angle) * 8 - 2,
                        y + Math.sin(angle) * 8 - 2,
                        4 + Math.cos(angle) * len * 0.3,
                        4 + Math.sin(angle) * len * 0.3
                    );
                }

                // Center flash
                impactG.fillStyle(0xffffff, 1);
                impactG.fillRect(x - 6, y - 6, 12, 12);
                impactG.fillStyle(0xffff00, 1);
                impactG.fillRect(x - 4, y - 4, 8, 8);

                this.createPixelParticles(x, y, color, 10, 1.5, 5, 0.3);

                this.tweens.add({
                    targets: impactG,
                    alpha: 0,
                    scaleX: 1.8,
                    scaleY: 1.8,
                    duration: 120,
                    onComplete: () => impactG.destroy()
                });
                break;

            case 'shot_yellow':
            case 'rail_red':
                // PIXELATED MUZZLE FLASH
                // Shake removed

                const muzzleG = this.add.graphics();
                muzzleG.setBlendMode('ADD');

                // Flash core
                muzzleG.fillStyle(0xffffff, 1);
                muzzleG.fillRect(x - 4, y - 4, 8, 8);
                muzzleG.fillStyle(0xffff00, 1);
                muzzleG.fillRect(x - 6, y - 2, 12, 4);
                muzzleG.fillRect(x - 2, y - 6, 4, 12);

                // Bullet trail pixels
                for (let i = 0; i < 6; i++) {
                    const trailX = x + direction * (i * 8);
                    muzzleG.fillStyle(color, 0.9 - i * 0.1);
                    muzzleG.fillRect(trailX, y - 2, 6, 4);
                }

                this.createPixelParticles(x, y, 0xffaa00, 6, 0.8, 4);

                this.tweens.add({
                    targets: muzzleG,
                    alpha: 0,
                    x: direction * 20,
                    duration: 100,
                    onComplete: () => muzzleG.destroy()
                });
                break;

            case 'beam_cyan':
            case 'data_green':
                // PIXELATED ENERGY BEAM
                const beamG = this.add.graphics();
                beamG.setBlendMode('ADD');

                // Segmented beam
                for (let i = 0; i < 8; i++) {
                    const segX = x + direction * (i * 6);
                    const height = 8 - Math.abs(i - 4);
                    beamG.fillStyle(i % 2 === 0 ? color : 0xffffff, 0.9);
                    beamG.fillRect(segX - 3, y - height/2, 6, height);
                }

                // Energy core
                beamG.fillStyle(0xffffff, 1);
                beamG.fillRect(x - 4, y - 3, 8, 6);

                this.createPixelParticles(x + direction * 25, y, color, 5, 0.5, 2);

                this.tweens.add({
                    targets: beamG,
                    alpha: 0,
                    scaleX: 1.5,
                    duration: 150,
                    onComplete: () => beamG.destroy()
                });
                break;

            case 'dash_green':
            case 'phase_purple':
                // PIXELATED SPEED DASH
                const dashG = this.add.graphics();
                dashG.setBlendMode('ADD');

                // Motion blur lines
                for (let i = 0; i < 6; i++) {
                    const lineY = y - 15 + i * 6;
                    const lineLen = 30 - Math.abs(i - 2.5) * 4;
                    dashG.fillStyle(color, 0.8 - i * 0.1);
                    dashG.fillRect(x - direction * 20, lineY, lineLen, 3);
                }

                // Afterimage pixels
                for (let j = 0; j < 3; j++) {
                    const afterX = x - direction * (j * 15 + 10);
                    dashG.fillStyle(color, 0.5 - j * 0.15);
                    dashG.fillRect(afterX - 4, y - 8, 8, 16);
                }

                this.tweens.add({
                    targets: dashG,
                    x: direction * 40,
                    alpha: 0,
                    duration: 100,
                    onComplete: () => dashG.destroy()
                });
                break;

            case 'kunai_purple':
            case 'poison_yellow':
                // PIXELATED THROWING STARS
                const kunaiG = this.add.graphics();
                kunaiG.setBlendMode('ADD');

                // Spinning star shape
                for (let i = 0; i < 4; i++) {
                    const angle = (i / 4) * Math.PI * 2;
                    kunaiG.fillStyle(color, 1);
                    kunaiG.fillRect(
                        x + Math.cos(angle) * 6 - 2,
                        y + Math.sin(angle) * 6 - 2,
                        4, 4
                    );
                }
                kunaiG.fillStyle(0xffffff, 1);
                kunaiG.fillRect(x - 2, y - 2, 4, 4);

                // Trail
                for (let t = 0; t < 4; t++) {
                    kunaiG.fillStyle(color, 0.6 - t * 0.15);
                    kunaiG.fillRect(x - direction * (t * 6 + 8), y - 1, 4, 2);
                }

                this.tweens.add({
                    targets: kunaiG,
                    x: direction * 50,
                    angle: 360,
                    alpha: 0,
                    duration: 150,
                    onComplete: () => kunaiG.destroy()
                });
                break;

            case 'void_dark':
                // PIXELATED DARK VOID - swirling darkness
                // Shake removed
                const voidG = this.add.graphics();
                voidG.setBlendMode('ADD');

                // Concentric pixel rings
                for (let r = 0; r < 4; r++) {
                    const radius = 8 + r * 6;
                    for (let i = 0; i < 8; i++) {
                        const angle = (i / 8) * Math.PI * 2 + r * 0.3;
                        voidG.fillStyle([0x220044, 0x440066, 0x660088, 0x8800aa][r], 0.9 - r * 0.2);
                        voidG.fillRect(
                            x + Math.cos(angle) * radius - 2,
                            y + Math.sin(angle) * radius - 2,
                            4, 4
                        );
                    }
                }
                // Dark center
                voidG.fillStyle(0x000000, 1);
                voidG.fillRect(x - 4, y - 4, 8, 8);

                this.tweens.add({
                    targets: voidG,
                    scale: 2,
                    angle: 90,
                    alpha: 0,
                    duration: 200,
                    onComplete: () => voidG.destroy()
                });
                break;

            case 'spark_yellow':
                // PIXELATED LIGHTNING SPARKS
                // Shake removed
                const sparkG = this.add.graphics();
                sparkG.setBlendMode('ADD');

                // Zigzag lightning bolts
                for (let b = 0; b < 4; b++) {
                    const angle = (b / 4) * Math.PI * 2 + Math.random() * 0.5;
                    let bx = x, by = y;
                    for (let s = 0; s < 4; s++) {
                        const nextX = bx + Math.cos(angle) * 8 + (Math.random() - 0.5) * 8;
                        const nextY = by + Math.sin(angle) * 8 + (Math.random() - 0.5) * 8;
                        sparkG.fillStyle(s % 2 === 0 ? 0xffff00 : 0xffffff, 1);
                        sparkG.fillRect(nextX - 2, nextY - 2, 4, 4);
                        bx = nextX;
                        by = nextY;
                    }
                }
                // Central flash
                sparkG.fillStyle(0xffffff, 1);
                sparkG.fillRect(x - 3, y - 3, 6, 6);

                this.createPixelParticles(x, y, 0xffff00, 8, 1.2, 4);

                this.tweens.add({
                    targets: sparkG,
                    alpha: 0,
                    scaleX: 1.5,
                    scaleY: 1.5,
                    duration: 100,
                    onComplete: () => sparkG.destroy()
                });
                break;

            case 'crush_blue':
            case 'quake_gray':
            case 'stomp_blue':
                // PIXELATED GROUND POUND - earthquake effect
                // Shake removed
                const quakeG = this.add.graphics();
                quakeG.setBlendMode('ADD');

                // Impact crater
                quakeG.fillStyle(0xffffff, 1);
                quakeG.fillRect(x - 6, y + 5, 12, 6);
                quakeG.fillStyle(color, 1);
                quakeG.fillRect(x - 8, y + 8, 16, 4);

                // Flying debris pixels
                for (let d = 0; d < 8; d++) {
                    const debrisX = x - 20 + d * 5;
                    const debrisY = y + 10;
                    quakeG.fillStyle(color, 0.9);
                    quakeG.fillRect(debrisX, debrisY, 3, 3);
                }

                // Shockwave rings
                for (let w = 0; w < 3; w++) {
                    quakeG.fillStyle(color, 0.6 - w * 0.15);
                    quakeG.fillRect(x - 15 - w * 10, y + 12, 30 + w * 20, 3);
                }

                this.createPixelParticles(x, y + 10, color, 12, 1.5, 6, 0.5);

                this.tweens.add({
                    targets: quakeG,
                    alpha: 0,
                    scaleX: 1.8,
                    duration: 200,
                    onComplete: () => quakeG.destroy()
                });
                break;

            case 'shield_gold':
            case 'trident_gold':
                // PIXELATED SHIELD BASH - sparks fly!
                // Shake removed
                const shieldG = this.add.graphics();
                shieldG.setBlendMode('ADD');

                // Shield shape (pixelated)
                shieldG.fillStyle(color, 1);
                shieldG.fillRect(x + direction * 5 - 4, y - 12, 8, 24);
                shieldG.fillStyle(0xffffff, 0.8);
                shieldG.fillRect(x + direction * 5 - 2, y - 10, 4, 4);
                shieldG.fillRect(x + direction * 5 - 2, y + 4, 4, 4);

                // Impact sparks
                for (let s = 0; s < 5; s++) {
                    shieldG.fillStyle(0xffff00, 1);
                    shieldG.fillRect(
                        x + direction * (15 + s * 4),
                        y - 8 + s * 4,
                        3, 3
                    );
                }

                this.tweens.add({
                    targets: shieldG,
                    x: direction * 20,
                    alpha: 0,
                    duration: 120,
                    onComplete: () => shieldG.destroy()
                });
                break;

            case 'claw_green':
                // PIXELATED CLAW SWIPE - three savage marks
                // Shake removed
                const clawG = this.add.graphics();
                clawG.setBlendMode('ADD');

                // Three diagonal claw marks
                for (let c = 0; c < 3; c++) {
                    const startX = x + direction * (c * 6 - 6);
                    const startY = y - 15 + c * 8;
                    for (let p = 0; p < 5; p++) {
                        clawG.fillStyle(p < 2 ? 0xffffff : color, 1 - p * 0.15);
                        clawG.fillRect(
                            startX + direction * p * 4,
                            startY + p * 3,
                            4, 6
                        );
                    }
                }

                this.createPixelParticles(x + direction * 15, y, 0xff4444, 6, 1, 3);

                this.tweens.add({
                    targets: clawG,
                    x: direction * 25,
                    alpha: 0,
                    duration: 100,
                    onComplete: () => clawG.destroy()
                });
                break;

            case 'magic_pink':
            case 'mind_pink':
            case 'psi':
                // PIXELATED PSYCHIC BURST - mind explosion
                // Shake removed
                const psiG = this.add.graphics();
                psiG.setBlendMode('ADD');

                // Expanding rings of pixels
                for (let ring = 0; ring < 3; ring++) {
                    const radius = 10 + ring * 10;
                    for (let i = 0; i < 12; i++) {
                        const angle = (i / 12) * Math.PI * 2;
                        psiG.fillStyle([color, 0xffffff, 0xff88ff][ring], 0.9 - ring * 0.2);
                        psiG.fillRect(
                            x + Math.cos(angle) * radius - 2,
                            y + Math.sin(angle) * radius - 2,
                            4, 4
                        );
                    }
                }

                // Central eye
                psiG.fillStyle(0xffffff, 1);
                psiG.fillRect(x - 4, y - 4, 8, 8);
                psiG.fillStyle(color, 1);
                psiG.fillRect(x - 2, y - 2, 4, 4);

                this.tweens.add({
                    targets: psiG,
                    scale: 1.8,
                    alpha: 0,
                    duration: 180,
                    onComplete: () => psiG.destroy()
                });
                break;

            case 'frost_blue':
                // PIXELATED ICE CRYSTALS - freezing shards
                const iceG = this.add.graphics();
                iceG.setBlendMode('ADD');

                // Multiple ice shards
                for (let s = 0; s < 5; s++) {
                    const shardX = x + direction * (s * 8);
                    const shardY = y - 10 + (s % 3) * 8;
                    // Diamond shape
                    iceG.fillStyle(0xffffff, 1);
                    iceG.fillRect(shardX, shardY - 4, 4, 4);
                    iceG.fillStyle(0x88ddff, 1);
                    iceG.fillRect(shardX - 2, shardY, 8, 4);
                    iceG.fillRect(shardX, shardY + 4, 4, 4);
                    iceG.fillStyle(0x4488ff, 0.8);
                    iceG.fillRect(shardX + 1, shardY + 1, 2, 2);
                }

                this.createPixelParticles(x + direction * 20, y, 0x88ddff, 8, 1, 3);

                this.tweens.add({
                    targets: iceG,
                    x: direction * 30,
                    alpha: 0,
                    duration: 150,
                    onComplete: () => iceG.destroy()
                });
                break;

            case 'fire_red':
            case 'bomb_orange':
                // PIXELATED FIRE EXPLOSION - flames everywhere!
                // Shake removed
                const fireG = this.add.graphics();
                fireG.setBlendMode('ADD');

                // Layered fire burst
                const fireColors = [0xffff00, 0xffaa00, 0xff6600, 0xff2200];
                for (let layer = 0; layer < 4; layer++) {
                    const layerRadius = 25 - layer * 5;
                    for (let f = 0; f < 8; f++) {
                        const angle = (f / 8) * Math.PI * 2 + layer * 0.2;
                        const dist = layerRadius * (0.7 + Math.random() * 0.3);
                        fireG.fillStyle(fireColors[layer], 1 - layer * 0.15);
                        fireG.fillRect(
                            x + Math.cos(angle) * dist - 3,
                            y + Math.sin(angle) * dist - 3 - layer * 2,
                            6 - layer, 6 - layer
                        );
                    }
                }

                // White-hot center
                fireG.fillStyle(0xffffff, 1);
                fireG.fillRect(x - 4, y - 4, 8, 8);

                this.createPixelParticles(x, y, 0xff6600, 15, 1.5, 5, -0.2);

                this.tweens.add({
                    targets: fireG,
                    scale: 1.5,
                    y: -10,
                    alpha: 0,
                    duration: 180,
                    onComplete: () => fireG.destroy()
                });
                break;

            case 'holy_white':
            case 'heal_green':
                // PIXELATED HOLY LIGHT - divine radiance
                const holyG = this.add.graphics();
                holyG.setBlendMode('ADD');

                // Radiating light beams
                for (let beam = 0; beam < 8; beam++) {
                    const angle = (beam / 8) * Math.PI * 2;
                    for (let p = 0; p < 4; p++) {
                        const dist = 8 + p * 6;
                        holyG.fillStyle(p < 2 ? 0xffffff : color, 1 - p * 0.2);
                        holyG.fillRect(
                            x + Math.cos(angle) * dist - 2,
                            y + Math.sin(angle) * dist - 2,
                            4, 4
                        );
                    }
                }

                // Pixelated cross
                holyG.fillStyle(0xffffff, 1);
                holyG.fillRect(x - 2, y - 12, 4, 24);
                holyG.fillRect(x - 10, y - 2, 20, 4);

                // Sparkles
                this.createPixelParticles(x, y, 0xffffaa, 10, 1.2, 2, -0.1);

                this.tweens.add({
                    targets: holyG,
                    scale: 1.6,
                    alpha: 0,
                    duration: 200,
                    onComplete: () => holyG.destroy()
                });
                break;

            case 'vine_green':
                // PIXELATED VINE WHIP - thorny lash
                const vineG = this.add.graphics();
                vineG.setBlendMode('ADD');

                // Segmented vine
                for (let seg = 0; seg < 8; seg++) {
                    const segX = x + direction * (seg * 6);
                    const segY = y + Math.sin(seg * 0.8) * 8;
                    vineG.fillStyle(seg % 2 === 0 ? color : 0x88ff88, 1);
                    vineG.fillRect(segX - 3, segY - 2, 6, 4);

                    // Thorns
                    if (seg % 2 === 0) {
                        vineG.fillStyle(0x44aa44, 1);
                        vineG.fillRect(segX, segY - 5, 2, 3);
                        vineG.fillRect(segX, segY + 2, 2, 3);
                    }
                }

                // Leaf at end
                vineG.fillStyle(0x44ff44, 1);
                vineG.fillRect(x + direction * 48 - 2, y - 4, 6, 8);

                this.tweens.add({
                    targets: vineG,
                    x: direction * 15,
                    alpha: 0,
                    duration: 150,
                    onComplete: () => vineG.destroy()
                });
                break;

            case 'wrench_yellow':
                // PIXELATED WRENCH SWING - mechanical mayhem
                // Shake removed
                const wrenchG = this.add.graphics();
                wrenchG.setBlendMode('ADD');

                // Wrench shape (pixelated)
                wrenchG.fillStyle(0xaaaaaa, 1);
                wrenchG.fillRect(x - 2, y - 12, 4, 24);
                wrenchG.fillStyle(0xffff00, 1);
                wrenchG.fillRect(x - 5, y - 14, 10, 4);
                wrenchG.fillRect(x - 5, y + 10, 10, 4);
                wrenchG.fillStyle(0xffffff, 0.8);
                wrenchG.fillRect(x - 1, y - 13, 2, 2);

                // Sparks
                for (let sp = 0; sp < 4; sp++) {
                    wrenchG.fillStyle(0xffff00, 1);
                    wrenchG.fillRect(
                        x + direction * (10 + sp * 5),
                        y - 5 + sp * 3,
                        3, 3
                    );
                }

                this.tweens.add({
                    targets: wrenchG,
                    angle: direction * 120,
                    x: direction * 20,
                    alpha: 0,
                    duration: 130,
                    onComplete: () => wrenchG.destroy()
                });
                break;

            case 'drain_red':
                // PIXELATED BLOOD DRAIN - life steal
                const drainG = this.add.graphics();
                drainG.setBlendMode('ADD');

                // Blood droplets flowing inward
                for (let d = 0; d < 6; d++) {
                    const angle = (d / 6) * Math.PI * 2;
                    const startDist = 25 + Math.random() * 10;
                    drainG.fillStyle(0xff0044, 0.9);
                    drainG.fillRect(
                        x + Math.cos(angle) * startDist - 2,
                        y + Math.sin(angle) * startDist - 2,
                        4, 4
                    );
                    // Trail
                    drainG.fillStyle(0xaa0033, 0.6);
                    drainG.fillRect(
                        x + Math.cos(angle) * (startDist + 8) - 1,
                        y + Math.sin(angle) * (startDist + 8) - 1,
                        2, 2
                    );
                }

                // Central absorption point
                drainG.fillStyle(0xff0000, 1);
                drainG.fillRect(x - 3, y - 3, 6, 6);
                drainG.fillStyle(0xffffff, 0.8);
                drainG.fillRect(x - 1, y - 1, 2, 2);

                this.tweens.add({
                    targets: drainG,
                    scale: 0.3,
                    alpha: 0,
                    duration: 180,
                    onComplete: () => drainG.destroy()
                });
                break;

            case 'dagger_black':
                // ASSASSIN - Black dagger with blood trail
                const daggerG = this.add.graphics();
                daggerG.setBlendMode('ADD');

                // Dagger blade
                for (let i = 0; i < 5; i++) {
                    daggerG.fillStyle(i < 2 ? 0x222222 : 0xff0000, 1 - i * 0.15);
                    daggerG.fillRect(x + direction * (i * 4), y - 2, 4, 4);
                }
                // Red trail
                this.createPixelParticles(x, y, 0xff0000, 8, 1, 2);

                this.tweens.add({
                    targets: daggerG,
                    x: direction * 40,
                    alpha: 0,
                    duration: 120,
                    onComplete: () => daggerG.destroy()
                });
                break;

            case 'arcane_blue':
                // WIZARD - Mystical arcane energy
                const arcaneG = this.add.graphics();
                arcaneG.setBlendMode('ADD');

                // Floating runes
                for (let r = 0; r < 4; r++) {
                    const rx = x + direction * (r * 10);
                    const ry = y + Math.sin(r) * 8;
                    arcaneG.fillStyle(0x4444ff, 1);
                    arcaneG.fillRect(rx - 3, ry - 3, 6, 6);
                    arcaneG.fillStyle(0xffffaa, 1);
                    arcaneG.fillRect(rx - 1, ry - 1, 2, 2);
                }
                this.createPixelParticles(x, y, 0x4444ff, 10, 1.2, 4);

                this.tweens.add({
                    targets: arcaneG,
                    x: direction * 35,
                    alpha: 0,
                    duration: 150,
                    onComplete: () => arcaneG.destroy()
                });
                break;

            case 'arrow_green':
                // RANGER - Green arrow
                const arrowG = this.add.graphics();
                arrowG.setBlendMode('ADD');

                // Arrow shaft
                arrowG.fillStyle(0x664422, 1);
                arrowG.fillRect(x, y - 1, 16 * direction, 2);
                // Arrowhead
                arrowG.fillStyle(0x888888, 1);
                arrowG.fillRect(x + direction * 16, y - 2, 4, 4);
                // Green glow
                arrowG.fillStyle(0x88ff44, 0.6);
                arrowG.fillRect(x + direction * 14, y - 1, 6, 2);

                this.tweens.add({
                    targets: arrowG,
                    x: direction * 60,
                    alpha: 0,
                    duration: 140,
                    onComplete: () => arrowG.destroy()
                });
                break;

            case 'skull_purple':
                // NECROMANCER - Floating skull
                const skullG = this.add.graphics();
                skullG.setBlendMode('ADD');

                // Skull shape
                skullG.fillStyle(0xcccccc, 1);
                skullG.fillRect(x - 4, y - 4, 8, 8);
                skullG.fillStyle(0x00ff44, 1);
                skullG.fillRect(x - 3, y - 3, 2, 2);
                skullG.fillRect(x + 1, y - 3, 2, 2);
                skullG.fillStyle(0x000000, 1);
                skullG.fillRect(x - 1, y + 1, 2, 2);
                this.createPixelParticles(x, y, 0x440088, 6, 0.8, 3);

                this.tweens.add({
                    targets: skullG,
                    x: direction * 30,
                    y: -10,
                    alpha: 0,
                    duration: 180,
                    onComplete: () => skullG.destroy()
                });
                break;

            case 'charge_red':
                // JUGGERNAUT - Charging impact
                const chargeG = this.add.graphics();
                chargeG.setBlendMode('ADD');

                // Impact shockwave
                chargeG.fillStyle(0xff4444, 1);
                chargeG.fillRect(x - 8, y - 12, 16, 24);
                chargeG.fillStyle(0xff8844, 1);
                chargeG.fillRect(x - 6, y - 10, 12, 20);
                chargeG.fillStyle(0xffffff, 1);
                chargeG.fillRect(x - 4, y - 6, 8, 12);
                this.createPixelParticles(x, y, 0xff4444, 12, 1.5, 5);

                this.tweens.add({
                    targets: chargeG,
                    scaleX: 1.5,
                    alpha: 0,
                    duration: 150,
                    onComplete: () => chargeG.destroy()
                });
                break;

            case 'trick_rainbow':
                // TRICKSTER - Rainbow sparkles
                const trickG = this.add.graphics();
                trickG.setBlendMode('ADD');

                const rainbowColors = [0xff0000, 0xff8800, 0xffff00, 0x00ff00, 0x0088ff, 0xff00ff];
                for (let i = 0; i < 6; i++) {
                    const tx = x + direction * (i * 5);
                    const ty = y + Math.sin(i * 0.8) * 10;
                    trickG.fillStyle(rainbowColors[i], 1);
                    trickG.fillRect(tx - 3, ty - 3, 6, 6);
                }
                this.createPixelParticles(x, y, 0xff88ff, 8, 1, 4);

                this.tweens.add({
                    targets: trickG,
                    x: direction * 30,
                    alpha: 0,
                    angle: 360,
                    duration: 160,
                    onComplete: () => trickG.destroy()
                });
                break;

            case 'chi_orange':
                // MONK - Chi energy burst
                const chiG = this.add.graphics();
                chiG.setBlendMode('ADD');

                // Radiating chi waves
                for (let w = 0; w < 3; w++) {
                    const radius = 8 + w * 8;
                    chiG.fillStyle(0xff8800, 0.8 - w * 0.2);
                    chiG.fillRect(x + direction * radius - 3, y - 3, 6, 6);
                }
                chiG.fillStyle(0xffffaa, 1);
                chiG.fillRect(x - 4, y - 4, 8, 8);
                this.createPixelParticles(x, y, 0xffffaa, 10, 1.2, 3);

                this.tweens.add({
                    targets: chiG,
                    scale: 1.5,
                    alpha: 0,
                    duration: 130,
                    onComplete: () => chiG.destroy()
                });
                break;

            case 'flame_red':
                // DRAGON - Fire breath (reuse fire_red style)
                const dragonFireG = this.add.graphics();
                dragonFireG.setBlendMode('ADD');

                const dragonFireColors = [0xffff00, 0xffaa00, 0xff6600, 0xff2200];
                for (let layer = 0; layer < 4; layer++) {
                    for (let f = 0; f < 6; f++) {
                        const fx = x + direction * (f * 8 + layer * 4);
                        const fy = y - 8 + Math.random() * 16;
                        dragonFireG.fillStyle(dragonFireColors[layer], 1 - layer * 0.15);
                        dragonFireG.fillRect(fx - 2, fy - 2, 4, 4);
                    }
                }
                this.createPixelParticles(x, y, 0xff6600, 12, 1.3, 4);

                this.tweens.add({
                    targets: dragonFireG,
                    x: direction * 40,
                    alpha: 0,
                    duration: 140,
                    onComplete: () => dragonFireG.destroy()
                });
                break;

            case 'potion_green':
                // ALCHEMIST - Potion splash
                const potionG = this.add.graphics();
                potionG.setBlendMode('ADD');

                // Potion bottle
                potionG.fillStyle(0x44ff88, 1);
                potionG.fillRect(x - 3, y - 4, 6, 8);
                potionG.fillStyle(0xff44ff, 0.7);
                potionG.fillRect(x - 2, y - 3, 4, 6);
                // Splash particles
                for (let s = 0; s < 8; s++) {
                    const angle = (s / 8) * Math.PI * 2;
                    potionG.fillStyle(0x44ff88, 0.8);
                    potionG.fillRect(x + Math.cos(angle) * 12 - 1, y + Math.sin(angle) * 12 - 1, 2, 2);
                }
                this.createPixelParticles(x, y, 0x44ff88, 10, 1.2, 4);

                this.tweens.add({
                    targets: potionG,
                    scale: 1.4,
                    alpha: 0,
                    duration: 150,
                    onComplete: () => potionG.destroy()
                });
                break;

            case 'shield_cyan':
                // SENTINEL - Energy shield
                const sentinelG = this.add.graphics();
                sentinelG.setBlendMode('ADD');

                // Hexagonal shield pattern
                sentinelG.fillStyle(0x00ffff, 0.7);
                sentinelG.fillRect(x + direction * 5 - 6, y - 10, 12, 20);
                sentinelG.fillStyle(0x0088ff, 0.8);
                sentinelG.fillRect(x + direction * 5 - 4, y - 8, 8, 16);
                sentinelG.fillStyle(0x00ffff, 1);
                sentinelG.fillRect(x + direction * 5 - 2, y - 6, 4, 12);
                this.createPixelParticles(x, y, 0x00ffff, 8, 0.8, 3);

                this.tweens.add({
                    targets: sentinelG,
                    alpha: 0,
                    duration: 140,
                    onComplete: () => sentinelG.destroy()
                });
                break;

            case 'scythe_black':
                // REAPER - Dark scythe swing
                const scytheG = this.add.graphics();
                scytheG.setBlendMode('ADD');

                // Scythe arc
                for (let a = 0; a < 6; a++) {
                    const angle = (a / 6) * Math.PI;
                    const radius = 20;
                    scytheG.fillStyle(0x111111, 1);
                    scytheG.fillRect(x + Math.cos(angle) * radius - 2, y + Math.sin(angle) * radius - 10 - 2, 4, 4);
                }
                scytheG.fillStyle(0x00ff00, 0.7);
                for (let a = 0; a < 6; a++) {
                    const angle = (a / 6) * Math.PI;
                    const radius = 18;
                    scytheG.fillRect(x + Math.cos(angle) * radius - 1, y + Math.sin(angle) * radius - 10 - 1, 2, 2);
                }
                this.createPixelParticles(x, y, 0x00ff00, 10, 1, 3);

                this.tweens.add({
                    targets: scytheG,
                    angle: direction * 90,
                    alpha: 0,
                    duration: 150,
                    onComplete: () => scytheG.destroy()
                });
                break;

            case 'time_purple':
                // CHRONOMANCER - Time distortion
                const timeG = this.add.graphics();
                timeG.setBlendMode('ADD');

                // Clock face with hands
                for (let h = 0; h < 12; h++) {
                    const angle = (h / 12) * Math.PI * 2;
                    const radius = 12;
                    timeG.fillStyle(0x44ffff, 0.8);
                    timeG.fillRect(x + Math.cos(angle) * radius - 1, y + Math.sin(angle) * radius - 1, 2, 2);
                }
                timeG.fillStyle(0x8844ff, 1);
                timeG.fillRect(x - 4, y - 4, 8, 8);
                timeG.fillStyle(0x44ffff, 1);
                timeG.fillRect(x - 1, y - 1, 2, 6);
                this.createPixelParticles(x, y, 0x8844ff, 8, 0.9, 3);

                this.tweens.add({
                    targets: timeG,
                    angle: -360,
                    alpha: 0,
                    duration: 180,
                    onComplete: () => timeG.destroy()
                });
                break;

            case 'hammer_gold':
                // CRUSADER - Holy hammer
                const hammerG = this.add.graphics();
                hammerG.setBlendMode('ADD');

                // Hammer head
                hammerG.fillStyle(0xffdd00, 1);
                hammerG.fillRect(x + direction * 10 - 6, y - 8, 12, 6);
                hammerG.fillStyle(0xffffaa, 1);
                hammerG.fillRect(x + direction * 10 - 4, y - 6, 8, 2);
                // Handle
                hammerG.fillStyle(0x664422, 1);
                hammerG.fillRect(x, y - 2, direction * 10, 2);
                // Divine glow
                hammerG.fillStyle(0xffffff, 0.8);
                hammerG.fillRect(x + direction * 10 - 5, y - 7, 10, 4);
                this.createPixelParticles(x, y, 0xffffaa, 8, 1, 3);

                this.tweens.add({
                    targets: hammerG,
                    angle: direction * 180,
                    alpha: 0,
                    duration: 140,
                    onComplete: () => hammerG.destroy()
                });
                break;

            case 'dual_brown':
                // BANDIT - Dual daggers
                const dualG = this.add.graphics();
                dualG.setBlendMode('ADD');

                // Two crossing blades
                dualG.fillStyle(0x888888, 1);
                dualG.fillRect(x + direction * 8 - 2, y - 8, 4, 16);
                dualG.fillRect(x + direction * 12 - 2, y - 6, 4, 12);
                dualG.fillStyle(0xff8800, 0.6);
                dualG.fillRect(x + direction * 8 - 1, y - 6, 2, 12);
                dualG.fillRect(x + direction * 12 - 1, y - 4, 2, 8);
                this.createPixelParticles(x, y, 0x664422, 8, 1, 3);

                this.tweens.add({
                    targets: dualG,
                    x: direction * 25,
                    alpha: 0,
                    duration: 120,
                    onComplete: () => dualG.destroy()
                });
                break;

            case 'element_rainbow':
                // ELEMENTALIST - Cycling elements
                const elemG = this.add.graphics();
                elemG.setBlendMode('ADD');

                const elemColors = [0xff4444, 0x4444ff, 0xffff44];
                for (let e = 0; e < 3; e++) {
                    const ex = x + direction * (e * 10);
                    elemG.fillStyle(elemColors[e], 1);
                    elemG.fillRect(ex - 4, y - 4, 8, 8);
                    elemG.fillStyle(0xffffff, 0.7);
                    elemG.fillRect(ex - 2, y - 2, 4, 4);
                }
                this.createPixelParticles(x, y, 0xff44ff, 12, 1.2, 4);

                this.tweens.add({
                    targets: elemG,
                    x: direction * 35,
                    alpha: 0,
                    duration: 150,
                    onComplete: () => elemG.destroy()
                });
                break;

            case 'axe_red':
                // WARLORD - Battle axe
                const warlordAxeG = this.add.graphics();
                warlordAxeG.setBlendMode('ADD');

                // Axe blade
                warlordAxeG.fillStyle(0x888888, 1);
                warlordAxeG.fillRect(x + direction * 10 - 8, y - 8, 12, 8);
                warlordAxeG.fillStyle(0xff0000, 0.7);
                warlordAxeG.fillRect(x + direction * 10 - 6, y - 6, 8, 4);
                // Handle
                warlordAxeG.fillStyle(0x664422, 1);
                warlordAxeG.fillRect(x, y - 1, direction * 10, 2);
                this.createPixelParticles(x, y, 0xff0000, 10, 1.3, 4);

                this.tweens.add({
                    targets: warlordAxeG,
                    angle: direction * 180,
                    alpha: 0,
                    duration: 140,
                    onComplete: () => warlordAxeG.destroy()
                });
                break;

            case 'cyber_gray':
                // CYBORG - Laser beam
                const cyberG = this.add.graphics();
                cyberG.setBlendMode('ADD');

                // Laser beam
                for (let i = 0; i < 8; i++) {
                    cyberG.fillStyle(i % 2 === 0 ? 0xff4444 : 0xffffff, 1);
                    cyberG.fillRect(x + direction * (i * 6), y - 1, 6, 2);
                }
                cyberG.fillStyle(0xff0000, 1);
                cyberG.fillRect(x - 2, y - 2, 4, 4);
                this.createPixelParticles(x, y, 0xff0000, 8, 0.8, 2);

                this.tweens.add({
                    targets: cyberG,
                    alpha: 0,
                    duration: 100,
                    onComplete: () => cyberG.destroy()
                });
                break;

            case 'spirit_green':
                // SHAMAN - Spirit energy
                const spiritG = this.add.graphics();
                spiritG.setBlendMode('ADD');

                // Floating spirits
                for (let s = 0; s < 3; s++) {
                    const sx = x + direction * (s * 12);
                    const sy = y + Math.sin(s * 1.5) * 8;
                    spiritG.fillStyle(0xaaffaa, 0.8);
                    spiritG.fillRect(sx - 4, sy - 4, 8, 8);
                    spiritG.fillStyle(0x448866, 1);
                    spiritG.fillRect(sx - 2, sy - 2, 4, 4);
                }
                this.createPixelParticles(x, y, 0xaaffaa, 10, 1, 3);

                this.tweens.add({
                    targets: spiritG,
                    x: direction * 30,
                    y: -15,
                    alpha: 0,
                    duration: 170,
                    onComplete: () => spiritG.destroy()
                });
                break;

            case 'spear_blue':
                // VANGUARD - Spear thrust
                const spearG = this.add.graphics();
                spearG.setBlendMode('ADD');

                // Spear shaft
                spearG.fillStyle(0x664422, 1);
                spearG.fillRect(x, y - 1, direction * 20, 2);
                // Spearhead
                spearG.fillStyle(0x888888, 1);
                spearG.fillRect(x + direction * 18, y - 3, 6, 6);
                spearG.fillStyle(0x4488ff, 0.8);
                spearG.fillRect(x + direction * 19, y - 2, 4, 4);
                this.createPixelParticles(x, y, 0x4488ff, 6, 0.8, 2);

                this.tweens.add({
                    targets: spearG,
                    x: direction * 40,
                    alpha: 0,
                    duration: 120,
                    onComplete: () => spearG.destroy()
                });
                break;

            case 'curse_purple':
                // WARLOCK - Dark curse
                const curseG = this.add.graphics();
                curseG.setBlendMode('ADD');

                // Spiraling curse
                for (let c = 0; c < 8; c++) {
                    const angle = (c / 8) * Math.PI * 2;
                    const radius = 10 + c * 2;
                    curseG.fillStyle(0xff00ff, 0.9 - c * 0.1);
                    curseG.fillRect(x + Math.cos(angle) * radius - 2, y + Math.sin(angle) * radius - 2, 4, 4);
                }
                curseG.fillStyle(0x440044, 1);
                curseG.fillRect(x - 4, y - 4, 8, 8);
                this.createPixelParticles(x, y, 0xff00ff, 10, 1, 3);

                this.tweens.add({
                    targets: curseG,
                    angle: -180,
                    alpha: 0,
                    duration: 160,
                    onComplete: () => curseG.destroy()
                });
                break;

            case 'rapier_blue':
                // DUELIST - Quick rapier thrust
                const rapierG = this.add.graphics();
                rapierG.setBlendMode('ADD');

                // Thin rapier
                rapierG.fillStyle(0xaaaaaa, 1);
                rapierG.fillRect(x, y, direction * 24, 1);
                rapierG.fillStyle(0xaaddff, 1);
                rapierG.fillRect(x + direction * 22, y - 1, 2, 3);
                // Speed lines
                for (let i = 0; i < 4; i++) {
                    rapierG.fillStyle(0xffffff, 0.6 - i * 0.1);
                    rapierG.fillRect(x + direction * (i * 6), y - 1, 4, 1);
                }
                this.createPixelParticles(x, y, 0xaaddff, 6, 0.7, 2);

                this.tweens.add({
                    targets: rapierG,
                    x: direction * 30,
                    alpha: 0,
                    duration: 100,
                    onComplete: () => rapierG.destroy()
                });
                break;

            case 'summon_purple':
                // SUMMONER - Portal/summon effect
                const summonG = this.add.graphics();
                summonG.setBlendMode('ADD');

                // Portal rings
                for (let r = 0; r < 3; r++) {
                    const radius = 8 + r * 6;
                    for (let i = 0; i < 8; i++) {
                        const angle = (i / 8) * Math.PI * 2 + r * 0.5;
                        summonG.fillStyle(0xcc88ff, 0.9 - r * 0.2);
                        summonG.fillRect(x + Math.cos(angle) * radius - 2, y + Math.sin(angle) * radius - 2, 4, 4);
                    }
                }
                summonG.fillStyle(0x8844aa, 1);
                summonG.fillRect(x - 4, y - 4, 8, 8);
                this.createPixelParticles(x, y, 0xcc88ff, 12, 1, 4);

                this.tweens.add({
                    targets: summonG,
                    scale: 1.6,
                    angle: 180,
                    alpha: 0,
                    duration: 170,
                    onComplete: () => summonG.destroy()
                });
                break;

            case 'revolver_orange':
                // GUNSLINGER - Bullet with muzzle flash
                const revolverG = this.add.graphics();
                revolverG.setBlendMode('ADD');

                // Muzzle flash
                revolverG.fillStyle(0xffffff, 1);
                revolverG.fillRect(x - 4, y - 4, 8, 8);
                revolverG.fillStyle(0xffaa44, 1);
                revolverG.fillRect(x - 6, y - 2, 12, 4);
                // Bullet trail
                for (let i = 0; i < 6; i++) {
                    revolverG.fillStyle(0xffaa44, 0.9 - i * 0.1);
                    revolverG.fillRect(x + direction * (i * 6), y - 1, 4, 2);
                }
                this.createPixelParticles(x, y, 0xffaa44, 8, 1, 3);

                this.tweens.add({
                    targets: revolverG,
                    alpha: 0,
                    duration: 90,
                    onComplete: () => revolverG.destroy()
                });
                break;

            case 'disease_green':
                // PLAGUE - Toxic cloud
                const plagueG = this.add.graphics();
                plagueG.setBlendMode('ADD');

                // Expanding toxic cloud
                for (let c = 0; c < 12; c++) {
                    const angle = (c / 12) * Math.PI * 2;
                    const radius = 8 + Math.random() * 8;
                    plagueG.fillStyle(0x88ff44, 0.7);
                    plagueG.fillRect(x + Math.cos(angle) * radius - 3, y + Math.sin(angle) * radius - 3, 6, 6);
                }
                plagueG.fillStyle(0x448844, 0.9);
                plagueG.fillRect(x - 6, y - 6, 12, 12);
                this.createPixelParticles(x, y, 0x88ff44, 10, 1, 4);

                this.tweens.add({
                    targets: plagueG,
                    scale: 1.5,
                    alpha: 0,
                    duration: 160,
                    onComplete: () => plagueG.destroy()
                });
                break;

            case 'lance_purple':
                // LANCER - Long lance
                const lanceG = this.add.graphics();
                lanceG.setBlendMode('ADD');

                // Lance shaft (extra long)
                lanceG.fillStyle(0x664422, 1);
                lanceG.fillRect(x, y - 1, direction * 28, 2);
                // Lance tip
                lanceG.fillStyle(0x888888, 1);
                lanceG.fillRect(x + direction * 26, y - 4, 6, 8);
                lanceG.fillStyle(0x9999ff, 0.8);
                lanceG.fillRect(x + direction * 27, y - 3, 4, 6);
                this.createPixelParticles(x, y, 0x9999ff, 6, 0.8, 2);

                this.tweens.add({
                    targets: lanceG,
                    x: direction * 45,
                    alpha: 0,
                    duration: 130,
                    onComplete: () => lanceG.destroy()
                });
                break;

            case 'construct_orange':
                // ARTIFICER - Mechanical construct
                const constructG = this.add.graphics();
                constructG.setBlendMode('ADD');

                // Blocky construct
                constructG.fillStyle(0x888888, 1);
                constructG.fillRect(x - 4, y - 6, 8, 12);
                constructG.fillStyle(0xff8844, 1);
                constructG.fillRect(x - 2, y - 4, 4, 2);
                constructG.fillStyle(0x44ffff, 1);
                constructG.fillRect(x - 3, y - 2, 2, 2);
                constructG.fillRect(x + 1, y - 2, 2, 2);
                this.createPixelParticles(x, y, 0xff8844, 8, 1, 3);

                this.tweens.add({
                    targets: constructG,
                    x: direction * 25,
                    alpha: 0,
                    duration: 150,
                    onComplete: () => constructG.destroy()
                });
                break;

            case 'demolish_red':
                // DESTROYER - Massive impact
                const demolishG = this.add.graphics();
                demolishG.setBlendMode('ADD');

                // Huge explosion
                demolishG.fillStyle(0xff0000, 1);
                demolishG.fillRect(x - 12, y - 12, 24, 24);
                demolishG.fillStyle(0xff6666, 1);
                demolishG.fillRect(x - 10, y - 10, 20, 20);
                demolishG.fillStyle(0xffffff, 1);
                demolishG.fillRect(x - 6, y - 6, 12, 12);
                this.createPixelParticles(x, y, 0xff0000, 20, 2, 6);

                this.tweens.add({
                    targets: demolishG,
                    scale: 1.8,
                    alpha: 0,
                    duration: 180,
                    onComplete: () => demolishG.destroy()
                });
                break;

            case 'illusion_purple':
                // ILLUSIONIST - Shimmering illusion
                const illusionG = this.add.graphics();
                illusionG.setBlendMode('ADD');

                // Multiple overlapping images
                for (let i = 0; i < 4; i++) {
                    const offset = i * 6;
                    illusionG.fillStyle(0xaa44ff, 0.6 - i * 0.1);
                    illusionG.fillRect(x + direction * offset - 3, y - 6, 6, 12);
                }
                illusionG.fillStyle(0xffffaa, 0.8);
                illusionG.fillRect(x - 4, y - 6, 8, 12);
                this.createPixelParticles(x, y, 0xaa44ff, 12, 1.2, 4);

                this.tweens.add({
                    targets: illusionG,
                    x: direction * 30,
                    alpha: 0,
                    duration: 140,
                    onComplete: () => illusionG.destroy()
                });
                break;

            case 'cleave_brown':
                // BARBARIAN - Wide cleave
                const cleaveG = this.add.graphics();
                cleaveG.setBlendMode('ADD');

                // Wide arc swing
                for (let a = 0; a < 8; a++) {
                    const angle = (a / 8) * Math.PI - Math.PI / 2;
                    const radius = 22;
                    cleaveG.fillStyle(0x888888, 1 - a * 0.1);
                    cleaveG.fillRect(x + Math.cos(angle) * radius - 2, y + Math.sin(angle) * radius - 2, 4, 4);
                }
                cleaveG.fillStyle(0xff9944, 0.7);
                for (let a = 0; a < 8; a++) {
                    const angle = (a / 8) * Math.PI - Math.PI / 2;
                    const radius = 20;
                    cleaveG.fillRect(x + Math.cos(angle) * radius - 1, y + Math.sin(angle) * radius - 1, 2, 2);
                }
                this.createPixelParticles(x, y, 0xff9944, 12, 1.5, 5);

                this.tweens.add({
                    targets: cleaveG,
                    angle: direction * 120,
                    alpha: 0,
                    duration: 150,
                    onComplete: () => cleaveG.destroy()
                });
                break;

            case 'zero_g_white':
                // ASTRONAUT - Zero gravity effect
                const zeroGG = this.add.graphics();
                zeroGG.setBlendMode('ADD');

                // Gravity waves
                for (let w = 0; w < 4; w++) {
                    const waveY = y - 12 + w * 8;
                    zeroGG.fillStyle(0xffffff, 0.8 - w * 0.15);
                    zeroGG.fillRect(x - 10, waveY, 20, 2);
                    zeroGG.fillStyle(0x4444ff, 0.6 - w * 0.1);
                    zeroGG.fillRect(x - 8, waveY + 2, 16, 2);
                }
                zeroGG.fillStyle(0xeeeeee, 1);
                zeroGG.fillRect(x - 4, y - 4, 8, 8);
                this.createPixelParticles(x, y, 0x4444ff, 10, 1, 3);

                this.tweens.add({
                    targets: zeroGG,
                    y: -20,
                    alpha: 0,
                    duration: 160,
                    onComplete: () => zeroGG.destroy()
                });
                break;

            default:
                // PIXELATED DEFAULT SLASH - universal attack
                this.createPixelSlash(x, y, direction, color, 35);
                this.createPixelParticles(x, y, color, 5, 1, 3);
        }
    }

    createSpecialAttack(fighter, attack) {
        try {
            if (!fighter || !attack) return;
            if (!fighter.body) return;

            const direction = fighter.facingRight ? 1 : -1;
            const attackType = attack.type || 'default';

            // Execute unique attack based on type
            switch (attackType) {
            case 'dash':
                this.createDashAttack(fighter, attack, direction);
                break;
            case 'smash':
                this.createSmashAttack(fighter, attack, direction);
                break;
            case 'uppercut':
                this.createUppercutAttack(fighter, attack, direction);
                break;
            case 'shuriken':
                this.createShurikenAttack(fighter, attack, direction);
                break;
            case 'fireball':
                this.createFireballAttack(fighter, attack, direction);
                break;
            case 'laser':
                this.createLaserAttack(fighter, attack, direction);
                break;
            case 'pistol':
                this.createPistolAttack(fighter, attack, direction);
                break;
            case 'ice':
                this.createIceAttack(fighter, attack, direction);
                break;
            case 'inferno':
                this.createInfernoAttack(fighter, attack, direction);
                break;
            case 'holy':
                this.createHolyAttack(fighter, attack, direction);
                break;
            case 'shadow':
                this.createShadowAttack(fighter, attack, direction);
                break;
            case 'roar':
                this.createRoarAttack(fighter, attack, direction);
                break;
            case 'nature':
                this.createNatureAttack(fighter, attack, direction);
                break;
            case 'shield':
                this.createShieldAttack(fighter, attack, direction);
                break;
            case 'hack':
                this.createHackAttack(fighter, attack, direction);
                break;
            case 'railgun':
                this.createRailgunAttack(fighter, attack, direction);
                break;
            case 'bomb':
                this.createBombAttack(fighter, attack, direction);
                break;
            case 'lightning':
                this.createLightningAttack(fighter, attack, direction);
                break;
            case 'earthquake':
                this.createEarthquakeAttack(fighter, attack, direction);
                break;
            case 'slash':
                this.createSlashAttack(fighter, attack, direction);
                break;
            // NEW CHARACTER SPECIALS
            case 'iai':
                this.createIaiAttack(fighter, attack, direction);
                break;
            case 'heal':
                this.createHealAttack(fighter, attack, direction);
                break;
            case 'phase':
                this.createPhaseAttack(fighter, attack, direction);
                break;
            case 'arena':
                this.createArenaAttack(fighter, attack, direction);
                break;
            case 'psi':
                this.createPsiAttack(fighter, attack, direction);
                break;
            case 'rage':
                this.createRageAttack(fighter, attack, direction);
                break;
            case 'turret':
                this.createTurretAttack(fighter, attack, direction);
                break;
            case 'drain':
                this.createDrainAttack(fighter, attack, direction);
                break;
            case 'sting':
                this.createStingAttack(fighter, attack, direction);
                break;
            case 'titan':
                this.createTitanAttack(fighter, attack, direction);
                break;
            // NEW CHARACTER SPECIALS (30 more)
            case 'backstab':
                this.createBackstabAttack(fighter, attack, direction);
                break;
            case 'meteor':
                this.createMeteorAttack(fighter, attack, direction);
                break;
            case 'multishot':
                this.createMultishotAttack(fighter, attack, direction);
                break;
            case 'summon':
                this.createSummonAttack(fighter, attack, direction);
                break;
            case 'charge':
                this.createChargeAttack(fighter, attack, direction);
                break;
            case 'chaos':
                this.createChaosAttack(fighter, attack, direction);
                break;
            case 'palm':
                this.createPalmAttack(fighter, attack, direction);
                break;
            case 'breath':
                this.createBreathAttack(fighter, attack, direction);
                break;
            case 'potion':
                this.createPotionAttack(fighter, attack, direction);
                break;
            case 'barrier':
                this.createBarrierAttack(fighter, attack, direction);
                break;
            case 'reap':
                this.createReapAttack(fighter, attack, direction);
                break;
            case 'slow':
                this.createSlowAttack(fighter, attack, direction);
                break;
            case 'smite':
                this.createSmiteAttack(fighter, attack, direction);
                break;
            case 'steal':
                this.createStealAttack(fighter, attack, direction);
                break;
            case 'elements':
                this.createElementsAttack(fighter, attack, direction);
                break;
            case 'rally':
                this.createRallyAttack(fighter, attack, direction);
                break;
            case 'upgrade':
                this.createUpgradeAttack(fighter, attack, direction);
                break;
            case 'totem':
                this.createTotemAttack(fighter, attack, direction);
                break;
            case 'thrust':
                this.createThrustAttack(fighter, attack, direction);
                break;
            case 'curse':
                this.createCurseAttack(fighter, attack, direction);
                break;
            case 'riposte':
                this.createRiposteAttack(fighter, attack, direction);
                break;
            case 'demon':
                this.createDemonAttack(fighter, attack, direction);
                break;
            case 'sixshot':
                this.createSixshotAttack(fighter, attack, direction);
                break;
            case 'plague':
                this.createPlagueAttack(fighter, attack, direction);
                break;
            case 'joust':
                this.createJoustAttack(fighter, attack, direction);
                break;
            case 'construct':
                this.createConstructAttack(fighter, attack, direction);
                break;
            case 'demolish':
                this.createDemolishAttack(fighter, attack, direction);
                break;
            case 'clone':
                this.createCloneAttack(fighter, attack, direction);
                break;
            case 'whirlwind':
                this.createWhirlwindAttack(fighter, attack, direction);
                break;
            case 'gravity':
                this.createGravityAttack(fighter, attack, direction);
                break;
            default:
                this.createDefaultProjectile(fighter, attack, direction);
            }
        } catch (e) {
            console.error('Error creating special attack:', e);
        }
    }

    // DASH - Speed burst with afterimages
    createDashAttack(fighter, attack, direction) {
        const startX = fighter.x;
        const dashDistance = attack.range;

        // Create afterimages
        for (let i = 0; i < 5; i++) {
            this.time.delayedCall(i * 30, () => {
                const afterimage = this.add.image(fighter.x, fighter.y, `char_${fighter.characterData.id}`);
                afterimage.setScale(1.5);
                afterimage.setAlpha(0.6 - i * 0.1);
                afterimage.setTint(0x00ffff);
                afterimage.setBlendMode('ADD');
                afterimage.setFlipX(!fighter.facingRight);

                this.tweens.add({
                    targets: afterimage,
                    alpha: 0,
                    duration: 200,
                    onComplete: () => afterimage.destroy()
                });
            });
        }

        // Dash movement
        fighter.body.setVelocityX(direction * 800);
        this.time.delayedCall(150, () => {
            fighter.body.setVelocityX(direction * 100);
        });

        // Hit detection during dash
        const checkHits = this.time.addEvent({
            delay: 30,
            repeat: 4,
            callback: () => {
                const opponent = fighter.opponent;
                if (opponent && !opponent.isInvincible && !opponent.dashHit) {
                    const dist = Phaser.Math.Distance.Between(fighter.x, fighter.y, opponent.x, opponent.y);
                    if (dist < 60) {
                        opponent.dashHit = true;
                        this.applyDamage(opponent, attack.damage / 3, attack.knockback * 0.5, direction);
                        this.createHitSpark(opponent.x, opponent.y, 0x00ffff);
                    }
                }
            }
        });

        this.time.delayedCall(200, () => {
            if (fighter.opponent) fighter.opponent.dashHit = false;
        });
    }

    // SMASH - Ground pound with shockwave
    createSmashAttack(fighter, attack, direction) {
        // Jump up first
        fighter.body.setVelocityY(-300);

        this.time.delayedCall(200, () => {
            // Slam down
            fighter.body.setVelocityY(600);

            // Wait for ground impact
            this.time.delayedCall(150, () => {
                // Shockwave effect
                const shockwave = this.add.circle(fighter.x, fighter.y + 30, 10, 0x4488ff, 0.8);
                shockwave.setBlendMode('ADD');

                this.tweens.add({
                    targets: shockwave,
                    scaleX: 15,
                    scaleY: 3,
                    alpha: 0,
                    duration: 400,
                    onComplete: () => shockwave.destroy()
                });

                // Ground crack lines
                for (let i = 0; i < 8; i++) {
                    const crack = this.add.rectangle(
                        fighter.x + (i - 4) * 30,
                        fighter.y + 35,
                        4, 20, 0xffff00
                    );
                    crack.setBlendMode('ADD');
                    this.tweens.add({
                        targets: crack,
                        y: crack.y - 30,
                        alpha: 0,
                        duration: 300,
                        onComplete: () => crack.destroy()
                    });
                }

                // Camera shake
                this.cameras.main.shake(200, 0.02);

                // Damage in area
                const opponent = fighter.opponent;
                if (opponent && !opponent.isInvincible) {
                    const dist = Math.abs(opponent.x - fighter.x);
                    if (dist < attack.range && opponent.y > fighter.y - 50) {
                        this.applyDamage(opponent, attack.damage, attack.knockback, opponent.x > fighter.x ? 1 : -1);
                    }
                }
            });
        });
    }

    // UPPERCUT - Rising attack with fire trail
    createUppercutAttack(fighter, attack, direction) {
        // Launch upward
        fighter.body.setVelocityY(-500);
        fighter.body.setVelocityX(direction * 200);

        // Fire trail
        const trailEvent = this.time.addEvent({
            delay: 30,
            repeat: 8,
            callback: () => {
                const flame = this.add.circle(
                    fighter.x + (Math.random() - 0.5) * 20,
                    fighter.y + 20,
                    8 + Math.random() * 8,
                    0xff8800
                );
                flame.setBlendMode('ADD');

                this.tweens.add({
                    targets: flame,
                    y: flame.y + 40,
                    scaleX: 0,
                    scaleY: 0,
                    alpha: 0,
                    duration: 300,
                    onComplete: () => flame.destroy()
                });
            }
        });

        // Hit detection
        const hitCheck = this.time.addEvent({
            delay: 50,
            repeat: 5,
            callback: () => {
                const opponent = fighter.opponent;
                if (opponent && !opponent.isInvincible && !opponent.uppercutHit) {
                    const dist = Phaser.Math.Distance.Between(fighter.x, fighter.y, opponent.x, opponent.y);
                    if (dist < 70) {
                        opponent.uppercutHit = true;
                        opponent.body.setVelocityY(-400);
                        this.applyDamage(opponent, attack.damage, attack.knockback, direction);
                    }
                }
            }
        });

        this.time.delayedCall(400, () => {
            if (fighter.opponent) fighter.opponent.uppercutHit = false;
        });
    }

    // SHURIKEN - Multiple throwing stars in spread
    createShurikenAttack(fighter, attack, direction) {
        const angles = [-20, 0, 20];

        angles.forEach((angle, i) => {
            this.time.delayedCall(i * 80, () => {
                const shuriken = this.add.star(fighter.x + direction * 30, fighter.y, 4, 5, 12, 0xaa00ff);
                this.physics.add.existing(shuriken);

                shuriken.isProjectile = true;
                shuriken.hasHit = false;
                shuriken.owner = fighter;
                shuriken.attackDamage = attack.damage / 2;
                shuriken.attackKnockback = attack.knockback * 0.7;
                shuriken.setBlendMode('ADD');

                fighter.projectiles.add(shuriken);

                const rad = Phaser.Math.DegToRad(angle);
                const speed = 450;
                shuriken.body.setAllowGravity(false);
                shuriken.body.setVelocity(
                    Math.cos(rad) * speed * direction,
                    Math.sin(rad) * speed
                );

                // Spin animation
                this.tweens.add({
                    targets: shuriken,
                    angle: 720 * direction,
                    duration: 500
                });

                this.time.delayedCall(1500, () => {
                    if (shuriken && shuriken.active) shuriken.destroy();
                });
            });
        });
    }

    // FIREBALL - Big exploding projectile
    createFireballAttack(fighter, attack, direction) {
        const fireball = this.add.circle(fighter.x + direction * 40, fighter.y, 20, 0xff00ff);
        this.physics.add.existing(fireball);

        fireball.isProjectile = true;
        fireball.hasHit = false;
        fireball.owner = fighter;
        fireball.attackDamage = attack.damage;
        fireball.attackKnockback = attack.knockback;
        fireball.setBlendMode('ADD');

        // Inner glow
        const inner = this.add.circle(0, 0, 12, 0xffffff);
        inner.setBlendMode('ADD');

        fighter.projectiles.add(fireball);
        fireball.body.setAllowGravity(false);
        fireball.body.setVelocityX(direction * 300);

        // Pulsing effect
        this.tweens.add({
            targets: fireball,
            scaleX: 1.3,
            scaleY: 1.3,
            duration: 100,
            yoyo: true,
            repeat: -1
        });

        // Trail particles
        const trailEvent = this.time.addEvent({
            delay: 50,
            repeat: 30,
            callback: () => {
                if (!fireball.active) return;
                const trail = this.add.circle(fireball.x, fireball.y, 8 + Math.random() * 8, 0x8800ff);
                trail.setBlendMode('ADD');
                this.tweens.add({
                    targets: trail,
                    scale: 0,
                    alpha: 0,
                    duration: 200,
                    onComplete: () => trail.destroy()
                });
            }
        });

        // Explosion on hit or timeout
        const explode = () => {
            if (!fireball.active) return;
            // Explosion circle
            const explosion = this.add.circle(fireball.x, fireball.y, 20, 0xff00ff, 0.8);
            explosion.setBlendMode('ADD');
            this.tweens.add({
                targets: explosion,
                scale: 4,
                alpha: 0,
                duration: 300,
                onComplete: () => explosion.destroy()
            });

            // Damage nearby
            const opponent = fighter.opponent;
            if (opponent && !opponent.isInvincible) {
                const dist = Phaser.Math.Distance.Between(fireball.x, fireball.y, opponent.x, opponent.y);
                if (dist < 80) {
                    this.applyDamage(opponent, attack.damage * 0.5, attack.knockback * 0.8, direction);
                }
            }

            this.cameras.main.shake(100, 0.01);
            fireball.destroy();
        };

        fireball.explode = explode;
        this.time.delayedCall(2000, explode);
    }

    // LASER - Instant piercing beam
    createLaserAttack(fighter, attack, direction) {
        const beamLength = attack.range;

        // Charge up effect
        const charge = this.add.circle(fighter.x + direction * 30, fighter.y, 5, 0x00ffff);
        charge.setBlendMode('ADD');

        this.tweens.add({
            targets: charge,
            scale: 3,
            duration: 200,
            onComplete: () => {
                charge.destroy();

                // Fire beam
                const beam = this.add.rectangle(
                    fighter.x + direction * (beamLength / 2 + 30),
                    fighter.y,
                    beamLength,
                    8,
                    0x00ffff
                );
                beam.setBlendMode('ADD');

                // Beam glow
                const beamGlow = this.add.rectangle(
                    beam.x, beam.y,
                    beamLength, 20,
                    0x00ffff, 0.3
                );
                beamGlow.setBlendMode('ADD');

                // Hit detection along beam
                const opponent = fighter.opponent;
                if (opponent && !opponent.isInvincible) {
                    const inBeamX = direction > 0
                        ? (opponent.x > fighter.x && opponent.x < fighter.x + beamLength)
                        : (opponent.x < fighter.x && opponent.x > fighter.x - beamLength);
                    const inBeamY = Math.abs(opponent.y - fighter.y) < 40;

                    if (inBeamX && inBeamY) {
                        this.applyDamage(opponent, attack.damage, attack.knockback, direction);
                        this.createHitSpark(opponent.x, opponent.y, 0x00ffff);
                    }
                }

                // Beam fade
                this.tweens.add({
                    targets: [beam, beamGlow],
                    alpha: 0,
                    scaleY: 0,
                    duration: 150,
                    onComplete: () => {
                        beam.destroy();
                        beamGlow.destroy();
                    }
                });
            }
        });
    }

    // PISTOL - Rapid fire shots
    createPistolAttack(fighter, attack, direction) {
        for (let i = 0; i < 5; i++) {
            this.time.delayedCall(i * 80, () => {
                const bullet = this.add.rectangle(
                    fighter.x + direction * 40,
                    fighter.y + (Math.random() - 0.5) * 10,
                    12, 4, 0xffff00
                );
                this.physics.add.existing(bullet);

                bullet.isProjectile = true;
                bullet.hasHit = false;
                bullet.owner = fighter;
                bullet.attackDamage = attack.damage / 4;
                bullet.attackKnockback = attack.knockback * 0.3;
                bullet.setBlendMode('ADD');

                fighter.projectiles.add(bullet);
                bullet.body.setAllowGravity(false);
                bullet.body.setVelocityX(direction * 600);

                // Muzzle flash
                const flash = this.add.circle(fighter.x + direction * 35, fighter.y, 15, 0xffff00, 0.8);
                flash.setBlendMode('ADD');
                this.tweens.add({
                    targets: flash,
                    scale: 0,
                    alpha: 0,
                    duration: 100,
                    onComplete: () => flash.destroy()
                });

                this.time.delayedCall(1000, () => {
                    if (bullet && bullet.active) bullet.destroy();
                });
            });
        }
    }

    // ICE - Freezing projectile
    createIceAttack(fighter, attack, direction) {
        const iceSpike = this.add.polygon(fighter.x + direction * 40, fighter.y, [
            0, -15, 10, 15, -10, 15
        ], 0x00ddff);
        iceSpike.setRotation(direction > 0 ? Math.PI / 2 : -Math.PI / 2);
        this.physics.add.existing(iceSpike);

        iceSpike.isProjectile = true;
        iceSpike.hasHit = false;
        iceSpike.owner = fighter;
        iceSpike.attackDamage = attack.damage;
        iceSpike.attackKnockback = attack.knockback;
        iceSpike.isIce = true;
        iceSpike.setBlendMode('ADD');

        fighter.projectiles.add(iceSpike);
        iceSpike.body.setAllowGravity(false);
        iceSpike.body.setVelocityX(direction * 350);

        // Ice trail
        const trailEvent = this.time.addEvent({
            delay: 40,
            repeat: 25,
            callback: () => {
                if (!iceSpike.active) return;
                const crystal = this.add.star(iceSpike.x, iceSpike.y, 6, 3, 6, 0xaaffff);
                crystal.setBlendMode('ADD');
                crystal.setAlpha(0.6);
                this.tweens.add({
                    targets: crystal,
                    scale: 0,
                    alpha: 0,
                    angle: 180,
                    duration: 300,
                    onComplete: () => crystal.destroy()
                });
            }
        });

        this.time.delayedCall(2000, () => {
            if (iceSpike && iceSpike.active) iceSpike.destroy();
        });
    }

    // INFERNO - Explosive area burst
    createInfernoAttack(fighter, attack, direction) {
        // Charge effect
        const chargeRing = this.add.circle(fighter.x, fighter.y, 20, 0xff0044, 0);
        chargeRing.setStrokeStyle(3, 0xff0044);

        this.tweens.add({
            targets: chargeRing,
            scale: 2,
            alpha: 1,
            duration: 300,
            onComplete: () => {
                chargeRing.destroy();

                // Explosion burst
                for (let i = 0; i < 12; i++) {
                    const angle = (i / 12) * Math.PI * 2;
                    const flame = this.add.circle(fighter.x, fighter.y, 15, 0xff4400);
                    flame.setBlendMode('ADD');

                    this.tweens.add({
                        targets: flame,
                        x: fighter.x + Math.cos(angle) * attack.range,
                        y: fighter.y + Math.sin(angle) * attack.range,
                        scale: 0.3,
                        alpha: 0,
                        duration: 400,
                        onComplete: () => flame.destroy()
                    });
                }

                // Center explosion
                const explosion = this.add.circle(fighter.x, fighter.y, 30, 0xff8800);
                explosion.setBlendMode('ADD');
                this.tweens.add({
                    targets: explosion,
                    scale: 4,
                    alpha: 0,
                    duration: 400,
                    onComplete: () => explosion.destroy()
                });

                this.cameras.main.shake(200, 0.015);

                // Damage in radius
                const opponent = fighter.opponent;
                if (opponent && !opponent.isInvincible) {
                    const dist = Phaser.Math.Distance.Between(fighter.x, fighter.y, opponent.x, opponent.y);
                    if (dist < attack.range) {
                        const knockDir = opponent.x > fighter.x ? 1 : -1;
                        this.applyDamage(opponent, attack.damage, attack.knockback, knockDir);
                    }
                }
            }
        });
    }

    // HOLY - Light beam with heal
    createHolyAttack(fighter, attack, direction) {
        // Heal self slightly
        fighter.damage = Math.max(0, fighter.damage - 5);

        // Light pillar on opponent
        const opponent = fighter.opponent;
        if (!opponent) return;

        const targetX = opponent.x;

        // Warning circle
        const warning = this.add.circle(targetX, opponent.y + 30, 40, 0xffffff, 0.3);

        this.tweens.add({
            targets: warning,
            alpha: 0.8,
            duration: 400,
            yoyo: true,
            onComplete: () => {
                warning.destroy();

                // Light beam from above
                const beam = this.add.rectangle(targetX, -100, 60, 800, 0xaaffff, 0.8);
                beam.setBlendMode('ADD');

                this.tweens.add({
                    targets: beam,
                    y: 300,
                    duration: 200,
                    onComplete: () => {
                        // Hit check
                        if (opponent && !opponent.isInvincible && Math.abs(opponent.x - targetX) < 50) {
                            this.applyDamage(opponent, attack.damage, attack.knockback, direction);
                        }

                        this.tweens.add({
                            targets: beam,
                            alpha: 0,
                            duration: 200,
                            onComplete: () => beam.destroy()
                        });
                    }
                });

                // Sparkles
                for (let i = 0; i < 10; i++) {
                    const sparkle = this.add.star(
                        targetX + (Math.random() - 0.5) * 80,
                        300 + Math.random() * 200,
                        4, 3, 8, 0xffffff
                    );
                    sparkle.setBlendMode('ADD');
                    this.tweens.add({
                        targets: sparkle,
                        y: sparkle.y - 100,
                        alpha: 0,
                        duration: 500,
                        onComplete: () => sparkle.destroy()
                    });
                }
            }
        });
    }

    // SHADOW - Teleport behind and strike
    createShadowAttack(fighter, attack, direction) {
        const opponent = fighter.opponent;
        const startX = fighter.x;
        const startY = fighter.y;

        // Vanish effect
        fighter.sprite.setAlpha(0);
        const vanishEffect = this.add.circle(startX, startY, 30, 0x8800ff);
        vanishEffect.setBlendMode('ADD');
        this.tweens.add({
            targets: vanishEffect,
            scale: 0,
            duration: 200,
            onComplete: () => vanishEffect.destroy()
        });

        // Teleport behind opponent
        this.time.delayedCall(200, () => {
            const behindX = opponent.x - direction * 60;
            fighter.x = behindX;
            fighter.y = opponent.y;

            // Reappear effect
            const appearEffect = this.add.circle(fighter.x, fighter.y, 5, 0x8800ff);
            appearEffect.setBlendMode('ADD');
            this.tweens.add({
                targets: appearEffect,
                scale: 6,
                alpha: 0,
                duration: 200,
                onComplete: () => appearEffect.destroy()
            });

            fighter.sprite.setAlpha(1);
            fighter.facingRight = opponent.x > fighter.x;
            fighter.sprite.setFlipX(!fighter.facingRight);

            // Strike
            if (opponent && !opponent.isInvincible) {
                const newDir = fighter.facingRight ? 1 : -1;
                this.applyDamage(opponent, attack.damage, attack.knockback, newDir);
                this.createHitSpark(opponent.x, opponent.y, 0x8800ff);
            }
        });
    }

    // ROAR - Area knockback wave
    createRoarAttack(fighter, attack, direction) {
        // Roar rings
        for (let i = 0; i < 4; i++) {
            this.time.delayedCall(i * 80, () => {
                const ring = this.add.circle(fighter.x, fighter.y, 20, 0x00ff44, 0);
                ring.setStrokeStyle(4, 0x00ff44);
                ring.setBlendMode('ADD');

                this.tweens.add({
                    targets: ring,
                    scale: 5,
                    alpha: 0,
                    duration: 400,
                    onComplete: () => ring.destroy()
                });
            });
        }

        // Screen shake
        this.cameras.main.shake(300, 0.015);

        // Knockback in radius
        const opponent = fighter.opponent;
        if (opponent && !opponent.isInvincible) {
            const dist = Phaser.Math.Distance.Between(fighter.x, fighter.y, opponent.x, opponent.y);
            if (dist < attack.range) {
                const knockDir = opponent.x > fighter.x ? 1 : -1;
                this.applyDamage(opponent, attack.damage, attack.knockback * 1.5, knockDir);
                opponent.body.setVelocityY(-300);
            }
        }
    }

    // NATURE - Vine trap
    createNatureAttack(fighter, attack, direction) {
        const trapX = fighter.x + direction * 100;

        // Seed projectile
        const seed = this.add.circle(fighter.x + direction * 30, fighter.y, 8, 0x00ff88);
        this.physics.add.existing(seed);
        seed.body.setVelocityX(direction * 300);
        seed.body.setGravityY(500);

        this.tweens.add({
            targets: seed,
            angle: 360 * direction,
            duration: 500,
            repeat: -1
        });

        // Check for ground contact
        const groundCheck = this.time.addEvent({
            delay: 50,
            repeat: 20,
            callback: () => {
                if (seed.y > 520) {
                    groundCheck.remove();
                    seed.destroy();

                    // Spawn vines
                    for (let i = 0; i < 5; i++) {
                        const vine = this.add.rectangle(
                            seed.x + (i - 2) * 15,
                            520,
                            6, 0, 0x00ff44
                        );
                        vine.setOrigin(0.5, 1);

                        this.tweens.add({
                            targets: vine,
                            height: 60 + Math.random() * 30,
                            duration: 200,
                            delay: i * 50
                        });

                        this.time.delayedCall(2000, () => {
                            this.tweens.add({
                                targets: vine,
                                height: 0,
                                alpha: 0,
                                duration: 200,
                                onComplete: () => vine.destroy()
                            });
                        });
                    }

                    // Trap damage check
                    const trapCheck = this.time.addEvent({
                        delay: 100,
                        repeat: 18,
                        callback: () => {
                            const opponent = fighter.opponent;
                            if (opponent && !opponent.isInvincible && !opponent.vineHit) {
                                if (Math.abs(opponent.x - seed.x) < 50 && opponent.y > 480) {
                                    opponent.vineHit = true;
                                    this.applyDamage(opponent, attack.damage, attack.knockback * 0.5, direction);
                                    opponent.body.setVelocityX(0);
                                    this.time.delayedCall(500, () => { opponent.vineHit = false; });
                                }
                            }
                        }
                    });
                }
            }
        });

        this.time.delayedCall(1500, () => {
            if (seed && seed.active) seed.destroy();
        });
    }

    // SHIELD - Reflective shield bash
    createShieldAttack(fighter, attack, direction) {
        // Shield visual
        const shield = this.add.ellipse(
            fighter.x + direction * 35,
            fighter.y,
            25, 50, 0xffaa00
        );
        shield.setStrokeStyle(4, 0xffffff);

        // Shield glow
        const glow = this.add.ellipse(
            shield.x, shield.y,
            35, 60, 0xffaa00, 0.3
        );
        glow.setBlendMode('ADD');

        // Shield active period
        fighter.hasShield = true;

        // Check for projectile reflection
        const reflectCheck = this.time.addEvent({
            delay: 50,
            repeat: 10,
            callback: () => {
                // Check opponent projectiles
                const opponent = fighter.opponent;
                opponent.projectiles.getChildren().forEach(proj => {
                    if (proj.active && !proj.reflected) {
                        const dist = Phaser.Math.Distance.Between(shield.x, shield.y, proj.x, proj.y);
                        if (dist < 50) {
                            proj.reflected = true;
                            proj.owner = fighter;
                            proj.body.setVelocityX(-proj.body.velocity.x * 1.5);
                            proj.setTint(0xffaa00);

                            // Reflection flash
                            const flash = this.add.circle(proj.x, proj.y, 20, 0xffffff);
                            flash.setBlendMode('ADD');
                            this.tweens.add({
                                targets: flash,
                                scale: 0,
                                duration: 100,
                                onComplete: () => flash.destroy()
                            });
                        }
                    }
                });
            }
        });

        // Bash forward
        this.time.delayedCall(300, () => {
            fighter.hasShield = false;

            this.tweens.add({
                targets: [shield, glow],
                x: shield.x + direction * 60,
                duration: 100,
                onComplete: () => {
                    // Bash damage
                    const opponent = fighter.opponent;
                    if (opponent && !opponent.isInvincible) {
                        const dist = Phaser.Math.Distance.Between(shield.x, shield.y, opponent.x, opponent.y);
                        if (dist < 70) {
                            this.applyDamage(opponent, attack.damage, attack.knockback, direction);
                        }
                    }

                    this.tweens.add({
                        targets: [shield, glow],
                        alpha: 0,
                        duration: 150,
                        onComplete: () => {
                            shield.destroy();
                            glow.destroy();
                        }
                    });
                }
            });
        });
    }

    // HACK - Deploy trap
    createHackAttack(fighter, attack, direction) {
        const trapX = fighter.x + direction * 80;

        // Deploy animation
        const deployEffect = this.add.circle(fighter.x, fighter.y, 10, 0x00ff00);
        deployEffect.setBlendMode('ADD');

        this.tweens.add({
            targets: deployEffect,
            x: trapX,
            y: 520,
            duration: 300,
            onComplete: () => {
                deployEffect.destroy();

                // Trap visual - glitchy square
                const trap = this.add.rectangle(trapX, 520, 40, 10, 0x00ff00, 0.6);
                const trapGlow = this.add.rectangle(trapX, 520, 50, 15, 0x00ff00, 0.2);
                trapGlow.setBlendMode('ADD');

                // Glitch effect
                this.tweens.add({
                    targets: trap,
                    scaleX: { from: 0.9, to: 1.1 },
                    duration: 100,
                    yoyo: true,
                    repeat: -1
                });

                // Trap trigger check
                const trapCheck = this.time.addEvent({
                    delay: 100,
                    repeat: 50,
                    callback: () => {
                        const opponent = fighter.opponent;
                        if (opponent && !opponent.isInvincible && !opponent.hacked) {
                            if (Math.abs(opponent.x - trapX) < 40 && opponent.y > 480) {
                                opponent.hacked = true;

                                // Hack effect - glitch on opponent
                                this.applyDamage(opponent, attack.damage, attack.knockback * 0.3, direction);

                                // Stun with glitch visuals
                                opponent.body.setVelocity(0, 0);
                                opponent.hitstun = 800;

                                for (let i = 0; i < 8; i++) {
                                    this.time.delayedCall(i * 80, () => {
                                        const glitch = this.add.rectangle(
                                            opponent.x + (Math.random() - 0.5) * 40,
                                            opponent.y + (Math.random() - 0.5) * 60,
                                            20 + Math.random() * 30, 4, 0x00ff00
                                        );
                                        glitch.setBlendMode('ADD');
                                        this.tweens.add({
                                            targets: glitch,
                                            alpha: 0,
                                            duration: 100,
                                            onComplete: () => glitch.destroy()
                                        });
                                    });
                                }

                                trap.destroy();
                                trapGlow.destroy();
                                trapCheck.remove();

                                this.time.delayedCall(1000, () => { opponent.hacked = false; });
                            }
                        }
                    }
                });

                // Trap expires
                this.time.delayedCall(5000, () => {
                    if (trap.active) {
                        this.tweens.add({
                            targets: [trap, trapGlow],
                            alpha: 0,
                            duration: 200,
                            onComplete: () => {
                                trap.destroy();
                                trapGlow.destroy();
                            }
                        });
                    }
                });
            }
        });
    }

    // RAILGUN - Super fast piercing shot
    createRailgunAttack(fighter, attack, direction) {
        // Long charge up
        const chargeBar = this.add.rectangle(fighter.x, fighter.y - 50, 0, 8, 0xff4400);

        // Charge particles
        const chargeEvent = this.time.addEvent({
            delay: 30,
            repeat: 15,
            callback: () => {
                const particle = this.add.circle(
                    fighter.x + (Math.random() - 0.5) * 60,
                    fighter.y + (Math.random() - 0.5) * 60,
                    4, 0xff4400
                );
                particle.setBlendMode('ADD');
                this.tweens.add({
                    targets: particle,
                    x: fighter.x + direction * 30,
                    y: fighter.y,
                    scale: 0,
                    duration: 200,
                    onComplete: () => particle.destroy()
                });
            }
        });

        this.tweens.add({
            targets: chargeBar,
            width: 60,
            duration: 500,
            onComplete: () => {
                chargeBar.destroy();

                // Fire railgun
                const beam = this.add.rectangle(
                    fighter.x + direction * 250,
                    fighter.y,
                    500, 6, 0xff4400
                );
                beam.setBlendMode('ADD');

                // Wider glow beam
                const beamGlow = this.add.rectangle(
                    beam.x, beam.y,
                    500, 20, 0xff4400, 0.4
                );
                beamGlow.setBlendMode('ADD');

                // Screen shake
                this.cameras.main.shake(200, 0.02);

                // Instant hit check
                const opponent = fighter.opponent;
                if (opponent && !opponent.isInvincible) {
                    const inBeam = direction > 0
                        ? opponent.x > fighter.x
                        : opponent.x < fighter.x;
                    const inHeight = Math.abs(opponent.y - fighter.y) < 30;

                    if (inBeam && inHeight) {
                        this.applyDamage(opponent, attack.damage, attack.knockback, direction);
                        this.createHitSpark(opponent.x, opponent.y, 0xff4400);
                    }
                }

                // Beam fade
                this.tweens.add({
                    targets: [beam, beamGlow],
                    alpha: 0,
                    scaleY: 0,
                    duration: 100,
                    onComplete: () => {
                        beam.destroy();
                        beamGlow.destroy();
                    }
                });
            }
        });
    }

    // BOMB - Arcing explosive
    createBombAttack(fighter, attack, direction) {
        const bomb = this.add.circle(fighter.x + direction * 30, fighter.y - 20, 15, 0xff6600);
        this.physics.add.existing(bomb);

        // Fuse glow
        const fuse = this.add.circle(bomb.x, bomb.y - 12, 4, 0xffff00);
        fuse.setBlendMode('ADD');

        bomb.body.setVelocity(direction * 250, -300);
        bomb.body.setGravityY(600);
        bomb.body.setBounce(0.4);

        // Update fuse position
        const fuseUpdate = this.time.addEvent({
            delay: 16,
            repeat: -1,
            callback: () => {
                if (bomb.active) {
                    fuse.x = bomb.x;
                    fuse.y = bomb.y - 12;
                }
            }
        });

        // Fuse flicker
        this.tweens.add({
            targets: fuse,
            scale: { from: 0.8, to: 1.5 },
            duration: 100,
            yoyo: true,
            repeat: -1
        });

        // Explode after delay or on contact
        const explode = () => {
            if (!bomb.active) return;
            fuseUpdate.remove();

            // Big explosion
            const explosion = this.add.circle(bomb.x, bomb.y, 20, 0xff6600);
            explosion.setBlendMode('ADD');

            this.tweens.add({
                targets: explosion,
                scale: 6,
                alpha: 0,
                duration: 400,
                onComplete: () => explosion.destroy()
            });

            // Debris
            for (let i = 0; i < 12; i++) {
                const debris = this.add.circle(
                    bomb.x, bomb.y,
                    4 + Math.random() * 6,
                    [0xff6600, 0xffff00, 0xff0000][i % 3]
                );
                const angle = (i / 12) * Math.PI * 2;
                const speed = 200 + Math.random() * 200;

                this.tweens.add({
                    targets: debris,
                    x: bomb.x + Math.cos(angle) * speed,
                    y: bomb.y + Math.sin(angle) * speed,
                    alpha: 0,
                    duration: 400,
                    onComplete: () => debris.destroy()
                });
            }

            this.cameras.main.shake(250, 0.025);

            // Area damage
            const opponent = fighter.opponent;
            if (opponent && !opponent.isInvincible) {
                const dist = Phaser.Math.Distance.Between(bomb.x, bomb.y, opponent.x, opponent.y);
                if (dist < 100) {
                    const knockDir = opponent.x > bomb.x ? 1 : -1;
                    this.applyDamage(opponent, attack.damage, attack.knockback, knockDir);
                }
            }

            bomb.destroy();
            fuse.destroy();
        };

        this.time.delayedCall(1500, explode);
    }

    // LIGHTNING - Chain lightning
    createLightningAttack(fighter, attack, direction) {
        const opponent = fighter.opponent;

        // Initial bolt to opponent
        this.createLightningBolt(fighter.x, fighter.y, opponent.x, opponent.y, 0xffff00);

        // Hit
        if (opponent && !opponent.isInvincible) {
            this.applyDamage(opponent, attack.damage, attack.knockback, direction);
        }

        // Chain effect - sparks around opponent
        for (let i = 0; i < 3; i++) {
            this.time.delayedCall(i * 100, () => {
                const spark = this.add.star(
                    opponent.x + (Math.random() - 0.5) * 40,
                    opponent.y + (Math.random() - 0.5) * 60,
                    4, 5, 15, 0xffff00
                );
                spark.setBlendMode('ADD');
                this.tweens.add({
                    targets: spark,
                    scale: 0,
                    angle: 180,
                    duration: 200,
                    onComplete: () => spark.destroy()
                });
            });
        }

        // Flash removed to prevent errors
    }

    createLightningBolt(x1, y1, x2, y2, color) {
        const graphics = this.add.graphics();
        graphics.lineStyle(3, color, 1);
        graphics.setBlendMode('ADD');

        // Jagged lightning path
        const segments = 8;
        let prevX = x1, prevY = y1;

        graphics.beginPath();
        graphics.moveTo(x1, y1);

        for (let i = 1; i <= segments; i++) {
            const t = i / segments;
            const nextX = x1 + (x2 - x1) * t + (Math.random() - 0.5) * 40;
            const nextY = y1 + (y2 - y1) * t + (Math.random() - 0.5) * 30;
            graphics.lineTo(nextX, nextY);
            prevX = nextX;
            prevY = nextY;
        }

        graphics.lineTo(x2, y2);
        graphics.strokePath();

        // Glow
        graphics.lineStyle(8, color, 0.3);
        graphics.beginPath();
        graphics.moveTo(x1, y1);
        graphics.lineTo(x2, y2);
        graphics.strokePath();

        this.tweens.add({
            targets: graphics,
            alpha: 0,
            duration: 150,
            onComplete: () => graphics.destroy()
        });
    }

    // EARTHQUAKE - Ground shockwave
    createEarthquakeAttack(fighter, attack, direction) {
        // Big stomp
        fighter.body.setVelocityY(400);

        this.time.delayedCall(150, () => {
            // Shockwaves in both directions
            for (let dir = -1; dir <= 1; dir += 2) {
                for (let i = 0; i < 6; i++) {
                    this.time.delayedCall(i * 60, () => {
                        const pillar = this.add.rectangle(
                            fighter.x + dir * (50 + i * 40),
                            520,
                            30, 0, 0x888888
                        );
                        pillar.setOrigin(0.5, 1);

                        this.tweens.add({
                            targets: pillar,
                            height: 50 + Math.random() * 40,
                            duration: 100,
                            yoyo: true,
                            hold: 100,
                            onComplete: () => pillar.destroy()
                        });
                    });
                }
            }

            // Dust clouds
            for (let i = 0; i < 10; i++) {
                const dust = this.add.circle(
                    fighter.x + (Math.random() - 0.5) * 200,
                    530,
                    15 + Math.random() * 15,
                    0x888888, 0.6
                );
                this.tweens.add({
                    targets: dust,
                    y: dust.y - 40,
                    alpha: 0,
                    scale: 2,
                    duration: 500,
                    onComplete: () => dust.destroy()
                });
            }

            // Heavy screen shake
            this.cameras.main.shake(400, 0.03);

            // Damage grounded opponents
            const opponent = fighter.opponent;
            if (opponent && !opponent.isInvincible && opponent.isGrounded) {
                const dist = Math.abs(opponent.x - fighter.x);
                if (dist < attack.range) {
                    opponent.body.setVelocityY(-350);
                    this.applyDamage(opponent, attack.damage, attack.knockback, opponent.x > fighter.x ? 1 : -1);
                }
            }
        });
    }

    // SLASH - Wide plasma arc
    createSlashAttack(fighter, attack, direction) {
        // Create arc slash effect
        const arc = this.add.graphics();
        arc.lineStyle(6, 0xff00ff, 1);
        arc.setBlendMode('ADD');

        const arcX = fighter.x + direction * 40;
        const startAngle = direction > 0 ? -0.8 : Math.PI - 0.8;
        const endAngle = direction > 0 ? 0.8 : Math.PI + 0.8;

        arc.beginPath();
        arc.arc(arcX, fighter.y, 60, startAngle, endAngle);
        arc.strokePath();

        // Glow arc
        const glowArc = this.add.graphics();
        glowArc.lineStyle(15, 0xff00ff, 0.4);
        glowArc.setBlendMode('ADD');
        glowArc.beginPath();
        glowArc.arc(arcX, fighter.y, 60, startAngle, endAngle);
        glowArc.strokePath();

        // Slash particles
        for (let i = 0; i < 8; i++) {
            const angle = startAngle + (endAngle - startAngle) * (i / 7);
            const particle = this.add.circle(
                arcX + Math.cos(angle) * 60,
                fighter.y + Math.sin(angle) * 60,
                5, 0x00ffff
            );
            particle.setBlendMode('ADD');

            this.tweens.add({
                targets: particle,
                x: particle.x + Math.cos(angle) * 30,
                y: particle.y + Math.sin(angle) * 30,
                alpha: 0,
                duration: 200,
                onComplete: () => particle.destroy()
            });
        }

        // Fade arc
        this.tweens.add({
            targets: [arc, glowArc],
            alpha: 0,
            duration: 200,
            onComplete: () => {
                arc.destroy();
                glowArc.destroy();
            }
        });

        // Hit detection
        const opponent = fighter.opponent;
        if (opponent && !opponent.isInvincible) {
            const dist = Phaser.Math.Distance.Between(fighter.x, fighter.y, opponent.x, opponent.y);
            if (dist < attack.range) {
                this.applyDamage(opponent, attack.damage, attack.knockback, direction);
                this.createHitSpark(opponent.x, opponent.y, 0xff00ff);
            }
        }
    }

    // IAI - Samurai quick draw (instant slash in a line)
    createIaiAttack(fighter, attack, direction) {
        // Instant dash-slash
        const startX = fighter.x;
        const endX = fighter.x + direction * attack.range;

        // Slash line effect
        const slashLine = this.add.graphics();
        slashLine.lineStyle(4, 0xff2222, 1);
        slashLine.setBlendMode('ADD');
        slashLine.beginPath();
        slashLine.moveTo(startX, fighter.y);
        slashLine.lineTo(endX, fighter.y);
        slashLine.strokePath();

        // Blade trail
        for (let i = 0; i < 6; i++) {
            const trailX = startX + direction * (i * attack.range / 6);
            const trail = this.add.rectangle(trailX, fighter.y, 8, 40, 0xffffff);
            trail.setBlendMode('ADD');
            trail.setAlpha(0.8 - i * 0.1);
            this.tweens.add({
                targets: trail,
                alpha: 0,
                scaleY: 0.5,
                duration: 150,
                delay: i * 20,
                onComplete: () => trail.destroy()
            });
        }

        // Move fighter instantly
        fighter.x = Math.min(Math.max(endX, 50), 750);

        this.tweens.add({
            targets: slashLine,
            alpha: 0,
            duration: 200,
            onComplete: () => slashLine.destroy()
        });

        // Hit detection along the line
        const opponent = fighter.opponent;
        if (opponent && !opponent.isInvincible) {
            const oppX = opponent.x;
            if ((direction > 0 && oppX > startX && oppX < endX) ||
                (direction < 0 && oppX < startX && oppX > endX)) {
                this.applyDamage(opponent, attack.damage, attack.knockback, direction);
                this.createHitSpark(opponent.x, opponent.y, 0xff2222);
            }
        }
    }

    // HEAL - Medic healing burst
    createHealAttack(fighter, attack, direction) {
        // Healing aura
        const healAura = this.add.circle(fighter.x, fighter.y, 60, 0x44ff44, 0.3);
        healAura.setBlendMode('ADD');

        // Healing particles rising
        for (let i = 0; i < 12; i++) {
            const angle = (i / 12) * Math.PI * 2;
            const particle = this.add.rectangle(
                fighter.x + Math.cos(angle) * 30,
                fighter.y + Math.sin(angle) * 30,
                6, 6, 0x44ff44
            );
            particle.setBlendMode('ADD');
            this.tweens.add({
                targets: particle,
                y: particle.y - 40,
                alpha: 0,
                duration: 400,
                onComplete: () => particle.destroy()
            });
        }

        // Heal the fighter (reduce damage)
        fighter.damage = Math.max(0, fighter.damage - 15);

        // Also create a damaging projectile
        const healBolt = this.add.circle(fighter.x + direction * 30, fighter.y, 10, 0x44ff44);
        this.physics.add.existing(healBolt);
        healBolt.isProjectile = true;
        healBolt.hasHit = false;
        healBolt.owner = fighter;
        healBolt.attackDamage = attack.damage;
        healBolt.attackKnockback = attack.knockback;
        healBolt.body.setVelocityX(direction * 350);
        healBolt.body.setCircle(10);
        healBolt.setBlendMode('ADD');

        this.projectiles.add(healBolt);

        this.time.delayedCall(1500, () => {
            if (healBolt.active) healBolt.destroy();
        });

        this.tweens.add({
            targets: healAura,
            scale: 2,
            alpha: 0,
            duration: 400,
            onComplete: () => healAura.destroy()
        });
    }

    // PHASE - Phantom teleport attack
    createPhaseAttack(fighter, attack, direction) {
        const startX = fighter.x;
        const startY = fighter.y;

        // Disappear effect
        const ghostStart = this.add.rectangle(startX, startY, 30, 50, 0x6600aa, 0.6);
        ghostStart.setBlendMode('ADD');

        // Teleport to opponent or forward
        const opponent = fighter.opponent;
        let targetX = fighter.x + direction * attack.range;
        if (Math.abs(opponent.x - fighter.x) < attack.range) {
            targetX = opponent.x + direction * 50;
        }
        targetX = Math.min(Math.max(targetX, 50), 750);

        // Ghost trail
        for (let i = 0; i < 5; i++) {
            const t = i / 4;
            const ghostX = startX + (targetX - startX) * t;
            const ghost = this.add.rectangle(ghostX, startY, 25, 45, 0xaa00ff, 0.4 - i * 0.08);
            ghost.setBlendMode('ADD');
            this.tweens.add({
                targets: ghost,
                alpha: 0,
                duration: 200,
                delay: i * 30,
                onComplete: () => ghost.destroy()
            });
        }

        // Move fighter
        fighter.x = targetX;

        // Appear effect
        const ghostEnd = this.add.rectangle(targetX, startY, 30, 50, 0xcc00ff, 0.8);
        ghostEnd.setBlendMode('ADD');

        this.tweens.add({
            targets: [ghostStart, ghostEnd],
            alpha: 0,
            duration: 300,
            onComplete: () => { ghostStart.destroy(); ghostEnd.destroy(); }
        });

        // Hit if passed through opponent
        if (opponent && !opponent.isInvincible) {
            const dist = Math.abs(opponent.x - targetX);
            if (dist < 60) {
                this.applyDamage(opponent, attack.damage, attack.knockback, direction);
                this.createHitSpark(opponent.x, opponent.y, 0xaa00ff);
            }
        }
    }

    // ARENA - Gladiator multi-hit combo
    createArenaAttack(fighter, attack, direction) {
        // Multi-hit combo
        const hits = 4;
        for (let h = 0; h < hits; h++) {
            this.time.delayedCall(h * 100, () => {
                // Slash effect
                const slash = this.add.graphics();
                slash.lineStyle(5, 0xffcc00, 1);
                slash.setBlendMode('ADD');
                const angle = (h % 2 === 0) ? -0.5 : 0.5;
                slash.beginPath();
                slash.arc(fighter.x + direction * 30, fighter.y, 40, angle - 0.8, angle + 0.8);
                slash.strokePath();

                this.tweens.add({
                    targets: slash,
                    alpha: 0,
                    scale: 1.3,
                    duration: 150,
                    onComplete: () => slash.destroy()
                });

                // Hit detection
                const opponent = fighter.opponent;
                if (opponent && !opponent.isInvincible) {
                    const dist = Phaser.Math.Distance.Between(fighter.x, fighter.y, opponent.x, opponent.y);
                    if (dist < attack.range) {
                        this.applyDamage(opponent, attack.damage / hits, attack.knockback * 0.5, direction);
                        this.createHitSpark(opponent.x, opponent.y, 0xffcc00);
                    }
                }
            });
        }
    }

    // PSI - Psychic wave attack
    createPsiAttack(fighter, attack, direction) {
        // Expanding psychic rings
        for (let r = 0; r < 3; r++) {
            this.time.delayedCall(r * 100, () => {
                const ring = this.add.circle(fighter.x, fighter.y, 20, 0xff44ff, 0);
                ring.setStrokeStyle(4, 0xff44ff);
                ring.setBlendMode('ADD');

                this.tweens.add({
                    targets: ring,
                    scale: 4,
                    alpha: 0,
                    duration: 400,
                    onComplete: () => ring.destroy()
                });
            });
        }

        // Psychic projectile
        const psiBall = this.add.circle(fighter.x + direction * 30, fighter.y, 15, 0xff44ff);
        this.physics.add.existing(psiBall);
        psiBall.isProjectile = true;
        psiBall.hasHit = false;
        psiBall.owner = fighter;
        psiBall.attackDamage = attack.damage;
        psiBall.attackKnockback = attack.knockback;
        psiBall.body.setVelocityX(direction * 300);
        psiBall.body.setCircle(15);
        psiBall.setBlendMode('ADD');

        this.projectiles.add(psiBall);

        // Psi trail
        this.time.addEvent({
            delay: 50,
            repeat: 20,
            callback: () => {
                if (psiBall.active) {
                    const trail = this.add.circle(psiBall.x, psiBall.y, 8, 0xaa00ff, 0.5);
                    trail.setBlendMode('ADD');
                    this.tweens.add({
                        targets: trail,
                        alpha: 0,
                        scale: 0.5,
                        duration: 200,
                        onComplete: () => trail.destroy()
                    });
                }
            }
        });

        this.time.delayedCall(2000, () => {
            if (psiBall.active) psiBall.destroy();
        });
    }

    // RAGE - Berserker fury mode
    createRageAttack(fighter, attack, direction) {
        // Rage aura
        const rageAura = this.add.circle(fighter.x, fighter.y, 50, 0xff0000, 0.4);
        rageAura.setBlendMode('ADD');

        // Rage particles
        for (let i = 0; i < 15; i++) {
            const particle = this.add.rectangle(
                fighter.x + (Math.random() - 0.5) * 60,
                fighter.y + (Math.random() - 0.5) * 60,
                4, 8, 0xff4400
            );
            particle.setBlendMode('ADD');
            particle.setAngle(Math.random() * 360);
            this.tweens.add({
                targets: particle,
                y: particle.y - 50,
                alpha: 0,
                duration: 300,
                onComplete: () => particle.destroy()
            });
        }

        // Forward rush
        fighter.body.setVelocityX(direction * 400);

        // Powerful hit
        this.time.delayedCall(100, () => {
            const opponent = fighter.opponent;
            if (opponent && !opponent.isInvincible) {
                const dist = Phaser.Math.Distance.Between(fighter.x, fighter.y, opponent.x, opponent.y);
                if (dist < attack.range) {
                    // Damage bonus based on fighter's own damage
                    const bonusDamage = Math.floor(fighter.damage / 10);
                    this.applyDamage(opponent, attack.damage + bonusDamage, attack.knockback, direction);
                    this.createHitSpark(opponent.x, opponent.y, 0xff0000);
                }
            }
        });

        this.tweens.add({
            targets: rageAura,
            scale: 2,
            alpha: 0,
            duration: 300,
            onComplete: () => rageAura.destroy()
        });
    }

    // TURRET - Engineer deploys auto-turret
    createTurretAttack(fighter, attack, direction) {
        // Create turret
        const turretX = fighter.x + direction * 60;
        const turretY = fighter.y + 20;

        const turretBase = this.add.rectangle(turretX, turretY, 20, 15, 0x888800);
        const turretGun = this.add.rectangle(turretX + direction * 10, turretY - 5, 15, 6, 0xffff00);
        turretGun.setBlendMode('ADD');

        // Turret fires for a duration
        let shotsFired = 0;
        const maxShots = 6;
        const fireEvent = this.time.addEvent({
            delay: 300,
            repeat: maxShots - 1,
            callback: () => {
                if (!turretBase.active) return;

                // Fire bullet
                const bullet = this.add.circle(turretX + direction * 20, turretY - 5, 5, 0xffff00);
                this.physics.add.existing(bullet);
                bullet.isProjectile = true;
                bullet.hasHit = false;
                bullet.owner = fighter;
                bullet.attackDamage = attack.damage / 3;
                bullet.attackKnockback = attack.knockback * 0.5;
                bullet.body.setVelocityX(direction * 500);
                bullet.body.setCircle(5);
                bullet.setBlendMode('ADD');

                this.projectiles.add(bullet);

                // Muzzle flash
                const flash = this.add.circle(turretX + direction * 22, turretY - 5, 8, 0xffffff);
                flash.setBlendMode('ADD');
                this.tweens.add({
                    targets: flash,
                    alpha: 0,
                    scale: 0.5,
                    duration: 50,
                    onComplete: () => flash.destroy()
                });

                this.time.delayedCall(1000, () => {
                    if (bullet.active) bullet.destroy();
                });

                shotsFired++;
            }
        });

        // Destroy turret after duration
        this.time.delayedCall(2500, () => {
            fireEvent.remove();
            if (turretBase.active) {
                this.tweens.add({
                    targets: [turretBase, turretGun],
                    alpha: 0,
                    duration: 200,
                    onComplete: () => {
                        turretBase.destroy();
                        turretGun.destroy();
                    }
                });
            }
        });
    }

    // DRAIN - Vampire life steal
    createDrainAttack(fighter, attack, direction) {
        // Dark aura
        const drainAura = this.add.circle(fighter.x, fighter.y, 40, 0x880022, 0.5);
        drainAura.setBlendMode('ADD');

        // Blood particles toward fighter
        const opponent = fighter.opponent;
        if (opponent && !opponent.isInvincible) {
            const dist = Phaser.Math.Distance.Between(fighter.x, fighter.y, opponent.x, opponent.y);
            if (dist < attack.range) {
                // Create blood drain effect
                for (let i = 0; i < 8; i++) {
                    this.time.delayedCall(i * 50, () => {
                        const blood = this.add.circle(opponent.x, opponent.y, 4, 0xff0044);
                        blood.setBlendMode('ADD');
                        this.tweens.add({
                            targets: blood,
                            x: fighter.x,
                            y: fighter.y,
                            alpha: 0,
                            duration: 300,
                            onComplete: () => blood.destroy()
                        });
                    });
                }

                this.applyDamage(opponent, attack.damage, attack.knockback, direction);
                // Heal fighter
                fighter.damage = Math.max(0, fighter.damage - attack.damage * 0.5);
                this.createHitSpark(opponent.x, opponent.y, 0xff0044);
            }
        }

        this.tweens.add({
            targets: drainAura,
            scale: 1.5,
            alpha: 0,
            duration: 400,
            onComplete: () => drainAura.destroy()
        });
    }

    // STING - Scorpion poison attack
    createStingAttack(fighter, attack, direction) {
        // Tail strike animation
        const tail = this.add.graphics();
        tail.fillStyle(0xaaaa00, 1);
        tail.fillRect(fighter.x, fighter.y - 30, direction * 40, 6);
        tail.fillStyle(0x00ff00, 1);
        tail.fillRect(fighter.x + direction * 38, fighter.y - 32, 8, 10);
        tail.setBlendMode('ADD');

        // Poison projectile
        const stinger = this.add.circle(fighter.x + direction * 50, fighter.y - 20, 8, 0x00ff00);
        this.physics.add.existing(stinger);
        stinger.isProjectile = true;
        stinger.hasHit = false;
        stinger.owner = fighter;
        stinger.attackDamage = attack.damage;
        stinger.attackKnockback = attack.knockback;
        stinger.body.setVelocityX(direction * 400);
        stinger.body.setVelocityY(100);
        stinger.body.setCircle(8);
        stinger.setBlendMode('ADD');

        this.projectiles.add(stinger);

        // Poison trail
        this.time.addEvent({
            delay: 80,
            repeat: 10,
            callback: () => {
                if (stinger.active) {
                    const poison = this.add.circle(stinger.x, stinger.y, 4, 0x88ff00, 0.6);
                    poison.setBlendMode('ADD');
                    this.tweens.add({
                        targets: poison,
                        alpha: 0,
                        scale: 0.3,
                        duration: 300,
                        onComplete: () => poison.destroy()
                    });
                }
            }
        });

        this.tweens.add({
            targets: tail,
            alpha: 0,
            duration: 200,
            onComplete: () => tail.destroy()
        });

        this.time.delayedCall(1500, () => {
            if (stinger.active) stinger.destroy();
        });
    }

    // TITAN - Colossus meteor strike
    createTitanAttack(fighter, attack, direction) {
        // Jump up
        fighter.body.setVelocityY(-300);

        // Meteors fall after delay
        this.time.delayedCall(400, () => {
            for (let m = 0; m < 3; m++) {
                this.time.delayedCall(m * 150, () => {
                    const meteorX = fighter.x + direction * (30 + m * 40);
                    const meteor = this.add.circle(meteorX, 0, 15, 0x446688);
                    this.physics.add.existing(meteor);
                    meteor.isProjectile = true;
                    meteor.hasHit = false;
                    meteor.owner = fighter;
                    meteor.attackDamage = attack.damage / 3;
                    meteor.attackKnockback = attack.knockback;
                    meteor.body.setVelocityY(600);
                    meteor.body.setCircle(15);
                    meteor.setBlendMode('ADD');

                    // Meteor trail
                    this.time.addEvent({
                        delay: 30,
                        repeat: 15,
                        callback: () => {
                            if (meteor.active) {
                                const trail = this.add.circle(meteor.x, meteor.y - 10, 8, 0xff6600, 0.6);
                                trail.setBlendMode('ADD');
                                this.tweens.add({
                                    targets: trail,
                                    alpha: 0,
                                    scale: 0.3,
                                    duration: 150,
                                    onComplete: () => trail.destroy()
                                });
                            }
                        }
                    });

                    this.projectiles.add(meteor);

                    // Destroy on ground hit
                    this.time.delayedCall(1000, () => {
                        if (meteor.active) {
                            // Impact explosion
                            const impact = this.add.circle(meteor.x, meteor.y, 30, 0xff6600, 0.6);
                            impact.setBlendMode('ADD');
                            this.tweens.add({
                                targets: impact,
                                scale: 2,
                                alpha: 0,
                                duration: 200,
                                onComplete: () => impact.destroy()
                            });
                            meteor.destroy();
                        }
                    });
                });
            }
        });
    }

    // BACKSTAB - Assassin quick dash attack
    createBackstabAttack(fighter, attack, direction) {
        const opponent = fighter === this.player1 ? this.player2 : this.player1;

        // Quick dash forward
        fighter.body.setVelocityX(direction * 600);
        this.createPixelParticles(fighter.x, fighter.y, 0x222222, 15, 1.5, 5);

        // Check for collision during dash
        const checkCollision = () => {
            if (fighter.isAttacking && this.checkOverlap(fighter, opponent)) {
                this.applyDamage(opponent, attack.damage, attack.knockback, direction);
                fighter.isAttacking = false; // Only hit once
            }
        };

        // Check every frame during dash
        const collisionCheck = this.time.addEvent({
            delay: 16,
            callback: checkCollision,
            repeat: 12
        });

        this.time.delayedCall(200, () => {
            fighter.body.setVelocityX(0);
            this.createPixelParticles(fighter.x, fighter.y, 0xff0000, 15, 1.5, 5);
            collisionCheck.remove();
        });
    }

    // METEOR - Wizard summons falling meteors
    createMeteorAttack(fighter, attack, direction) {
        const opponent = fighter === this.player1 ? this.player2 : this.player1;

        // Summon 3 meteors above opponent
        for (let i = 0; i < 3; i++) {
            this.time.delayedCall(i * 200, () => {
                const meteor = this.add.circle(
                    opponent.x + (i - 1) * 80,
                    -50,
                    16,
                    0xff6600
                );
                this.physics.add.existing(meteor);

                meteor.isProjectile = true;
                meteor.hasHit = false;
                meteor.owner = fighter;
                meteor.attackDamage = attack.damage;
                meteor.attackKnockback = attack.knockback;
                meteor.setBlendMode('ADD');

                fighter.projectiles.add(meteor);
                meteor.body.setAllowGravity(false);
                meteor.body.setVelocityY(400);

                this.time.delayedCall(2000, () => {
                    if (meteor && meteor.active) meteor.destroy();
                });
            });
        }
    }

    // MULTISHOT - Ranger fires multiple arrows
    createMultishotAttack(fighter, attack, direction) {
        const angles = [-15, -7, 0, 7, 15];

        angles.forEach((angle, i) => {
            this.time.delayedCall(i * 50, () => {
                const arrow = this.add.rectangle(
                    fighter.x + direction * 40,
                    fighter.y,
                    16, 4,
                    0x88ff44
                );
                this.physics.add.existing(arrow);

                arrow.isProjectile = true;
                arrow.hasHit = false;
                arrow.owner = fighter;
                arrow.attackDamage = attack.damage / 3;
                arrow.attackKnockback = attack.knockback / 3;
                arrow.setBlendMode('ADD');

                fighter.projectiles.add(arrow);
                arrow.body.setAllowGravity(false);

                const rad = angle * Math.PI / 180;
                const vx = Math.cos(rad) * direction * 500;
                const vy = Math.sin(rad) * 500;
                arrow.body.setVelocity(vx, vy);

                this.time.delayedCall(2000, () => {
                    if (arrow && arrow.active) arrow.destroy();
                });
            });
        });
    }

    // SUMMON - Necromancer summons ghost minion
    createSummonAttack(fighter, attack, direction) {
        const opponent = fighter === this.player1 ? this.player2 : this.player1;

        const ghost = this.add.circle(
            fighter.x + direction * 60,
            fighter.y,
            12,
            0x440088
        );
        this.physics.add.existing(ghost);

        ghost.isProjectile = true;
        ghost.hasHit = false;
        ghost.owner = fighter;
        ghost.attackDamage = attack.damage;
        ghost.attackKnockback = attack.knockback;
        ghost.setBlendMode('ADD');
        ghost.setAlpha(0.7);

        fighter.projectiles.add(ghost);
        ghost.body.setAllowGravity(false);

        // Move toward opponent
        const angle = Phaser.Math.Angle.Between(ghost.x, ghost.y, opponent.x, opponent.y);
        ghost.body.setVelocity(Math.cos(angle) * 300, Math.sin(angle) * 300);

        this.time.delayedCall(2000, () => {
            if (ghost && ghost.active) ghost.destroy();
        });
    }

    // CHARGE - Juggernaut charges forward
    createChargeAttack(fighter, attack, direction) {
        try {
            if (!fighter || !fighter.body) return;

            const opponent = fighter === this.player1 ? this.player2 : this.player1;
            if (!opponent || !opponent.body) return;

            const startX = fighter.x;
            const chargeDistance = attack.range;

            // Charge forward with super armor
            fighter.body.setVelocityX(direction * 600);

            // Check for collision during charge
            let hasHit = false;
            const checkCollision = () => {
                try {
                    if (!hasHit && fighter && fighter.isAttacking && opponent && opponent.active && this.checkOverlap(fighter, opponent)) {
                        this.applyDamage(opponent, attack.damage, attack.knockback, direction);
                        hasHit = true;
                    }
                } catch (e) {
                    console.warn('Charge collision check error:', e);
                }
            };

            // Check every frame during charge
            const collisionCheck = this.time.addEvent({
                delay: 16,
                callback: checkCollision,
                repeat: 15
            });

            this.time.delayedCall(250, () => {
                try {
                    if (fighter && fighter.body) {
                        fighter.body.setVelocityX(0);
                    }
                    if (collisionCheck) {
                        collisionCheck.remove();
                    }
                } catch (e) {}
            });

            // Trail effect
            for (let i = 0; i < 10; i++) {
                this.time.delayedCall(i * 25, () => {
                    try {
                        if (fighter && typeof fighter.x === 'number' && typeof fighter.y === 'number') {
                            this.createPixelParticles(fighter.x, fighter.y, 0xff4444, 8, 1, 4);
                        }
                    } catch (e) {}
                });
            }
        } catch (e) {
            console.error('Charge attack error:', e);
        }
    }

    // CHAOS - Trickster random effect
    createChaosAttack(fighter, attack, direction) {
        try {
            if (!fighter) return;

            const effects = ['teleport', 'confuse', 'damage'];
            const effect = Phaser.Utils.Array.GetRandom(effects);
            const opponent = fighter === this.player1 ? this.player2 : this.player1;

            if (!opponent) return;

            if (effect === 'teleport') {
                // Swap positions
                const tempX = fighter.x;
                const tempY = fighter.y;
                fighter.setPosition(opponent.x, opponent.y);
                opponent.setPosition(tempX, tempY);
                this.createPixelParticles(fighter.x, fighter.y, 0xff88ff, 20, 1.5, 5);
                this.createPixelParticles(opponent.x, opponent.y, 0xffff00, 20, 1.5, 5);
            } else if (effect === 'confuse') {
                // Reverse opponent controls briefly
                this.createPixelParticles(opponent.x, opponent.y, 0xff00ff, 15, 1.5, 5);
            } else {
                // Random damage burst
                this.applyDamage(opponent, attack.damage, attack.knockback, direction);
                this.createPixelParticles(opponent.x, opponent.y, 0xffff00, 20, 2, 6);
            }
        } catch (e) {
            console.error('Chaos attack error:', e);
        }
    }

    // PALM - Monk chi blast
    createPalmAttack(fighter, attack, direction) {
        const palm = this.add.circle(
            fighter.x + direction * 40,
            fighter.y,
            14,
            0xffffaa
        );
        this.physics.add.existing(palm);

        palm.isProjectile = true;
        palm.hasHit = false;
        palm.owner = fighter;
        palm.attackDamage = attack.damage;
        palm.attackKnockback = attack.knockback;
        palm.setBlendMode('ADD');

        fighter.projectiles.add(palm);
        palm.body.setAllowGravity(false);
        palm.body.setVelocityX(direction * 400);

        this.tweens.add({
            targets: palm,
            scaleX: 1.5,
            scaleY: 1.5,
            duration: 400
        });

        this.time.delayedCall(1500, () => {
            if (palm && palm.active) palm.destroy();
        });
    }

    // BREATH - Dragon fire breath
    createBreathAttack(fighter, attack, direction) {
        for (let i = 0; i < 10; i++) {
            this.time.delayedCall(i * 40, () => {
                const fireColors = [0xffff00, 0xff8800, 0xff4400];
                const color = Phaser.Utils.Array.GetRandom(fireColors);

                const flame = this.add.circle(
                    fighter.x + direction * 50,
                    fighter.y + (Math.random() - 0.5) * 30,
                    8,
                    color
                );
                this.physics.add.existing(flame);

                flame.isProjectile = true;
                flame.hasHit = false;
                flame.owner = fighter;
                flame.attackDamage = attack.damage / 5;
                flame.attackKnockback = attack.knockback / 5;
                flame.setBlendMode('ADD');

                fighter.projectiles.add(flame);
                flame.body.setAllowGravity(false);
                flame.body.setVelocityX(direction * 400);

                this.tweens.add({
                    targets: flame,
                    alpha: 0,
                    scaleX: 1.5,
                    scaleY: 1.5,
                    duration: 400
                });

                this.time.delayedCall(500, () => {
                    if (flame && flame.active) flame.destroy();
                });
            });
        }
    }

    // POTION - Alchemist throws explosive potion
    createPotionAttack(fighter, attack, direction) {
        const potion = this.add.circle(
            fighter.x + direction * 40,
            fighter.y,
            10,
            0x44ff88
        );
        this.physics.add.existing(potion);

        potion.isProjectile = true;
        potion.hasHit = false;
        potion.owner = fighter;
        potion.attackDamage = attack.damage;
        potion.attackKnockback = attack.knockback;
        potion.setBlendMode('ADD');

        fighter.projectiles.add(potion);
        potion.body.setAllowGravity(true);
        potion.body.setGravityY(600);
        potion.body.setVelocity(direction * 350, -200);

        this.time.delayedCall(1200, () => {
            if (potion && potion.active) {
                this.createPixelParticles(potion.x, potion.y, 0x44ff88, 20, 2, 6);
                potion.destroy();
            }
        });
    }

    // BARRIER - Sentinel creates shield
    createBarrierAttack(fighter, attack, direction) {
        const barrier = this.add.graphics();
        barrier.x = fighter.x + direction * 50;
        barrier.y = fighter.y;
        barrier.setBlendMode('ADD');

        // Draw hexagonal barrier
        barrier.fillStyle(0x00ffff, 0.5);
        for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2;
            const radius = 40;
            barrier.fillRect(
                Math.cos(angle) * radius - 4,
                Math.sin(angle) * radius - 4,
                8, 8
            );
        }
        barrier.fillStyle(0x0088ff, 0.3);
        barrier.fillRect(-35, -35, 70, 70);

        // Lasts 2 seconds
        this.time.delayedCall(2000, () => barrier.destroy());
    }

    // REAP - Reaper life drain scythe
    createReapAttack(fighter, attack, direction) {
        const arc = this.add.graphics();
        arc.setBlendMode('ADD');

        // Scythe arc animation
        for (let a = 0; a < 8; a++) {
            const angle = (a / 8) * Math.PI * direction;
            const radius = attack.range;
            arc.fillStyle(0x111111, 1 - a * 0.1);
            arc.fillRect(
                fighter.x + Math.cos(angle) * radius - 3,
                fighter.y + Math.sin(angle) * radius - 3,
                6, 6
            );
            arc.fillStyle(0x00ff00, 0.6);
            arc.fillRect(
                fighter.x + Math.cos(angle) * radius - 1,
                fighter.y + Math.sin(angle) * radius - 1,
                2, 2
            );
        }

        const opponent = fighter === this.player1 ? this.player2 : this.player1;
        const dist = Phaser.Math.Distance.Between(fighter.x, fighter.y, opponent.x, opponent.y);
        if (dist < attack.range) {
            this.applyDamage(opponent, attack.damage, attack.knockback, direction);
            // Heal fighter
            fighter.health = Math.min(fighter.maxHealth, fighter.health + 10);
        }

        this.tweens.add({
            targets: arc,
            alpha: 0,
            duration: 200,
            onComplete: () => arc.destroy()
        });
    }

    // SLOW - Chronomancer time slow
    createSlowAttack(fighter, attack, direction) {
        const opponent = fighter === this.player1 ? this.player2 : this.player1;

        // Time bubble
        const bubble = this.add.graphics();
        bubble.x = opponent.x;
        bubble.y = opponent.y;
        bubble.setBlendMode('ADD');

        // Clock rings
        for (let r = 0; r < 3; r++) {
            const radius = 20 + r * 15;
            for (let i = 0; i < 12; i++) {
                const angle = (i / 12) * Math.PI * 2;
                bubble.fillStyle(0x8844ff, 0.7 - r * 0.2);
                bubble.fillRect(
                    Math.cos(angle) * radius - 2,
                    Math.sin(angle) * radius - 2,
                    4, 4
                );
            }
        }

        // Slow opponent briefly
        const originalSpeed = opponent.characterData.speed;
        opponent.characterData.speed *= 0.5;

        this.time.delayedCall(2000, () => {
            opponent.characterData.speed = originalSpeed;
            bubble.destroy();
        });

        this.applyDamage(opponent, attack.damage, attack.knockback, 0);
    }

    // SMITE - Crusader divine hammer
    createSmiteAttack(fighter, attack, direction) {
        const opponent = fighter === this.player1 ? this.player2 : this.player1;

        // Hammer from above
        const hammer = this.add.graphics();
        hammer.x = opponent.x;
        hammer.y = -50;
        hammer.setBlendMode('ADD');

        // Draw golden hammer
        hammer.fillStyle(0xffdd00, 1);
        hammer.fillRect(-8, -12, 16, 24);
        hammer.fillStyle(0xffffaa, 1);
        hammer.fillRect(-6, -10, 12, 20);
        hammer.fillStyle(0xffffff, 1);
        hammer.fillRect(-4, -6, 8, 12);

        // Fall and smite
        this.tweens.add({
            targets: hammer,
            y: opponent.y,
            duration: 400,
            ease: 'Quad.easeIn',
            onComplete: () => {
                const dist = Phaser.Math.Distance.Between(hammer.x, hammer.y, opponent.x, opponent.y);
                if (dist < 50) {
                    this.applyDamage(opponent, attack.damage, attack.knockback, 0);
                }
                this.createPixelParticles(hammer.x, hammer.y, 0xffffaa, 20, 2, 6);
                hammer.destroy();
            }
        });
    }

    // STEAL - Bandit steals temp buff
    createStealAttack(fighter, attack, direction) {
        const opponent = fighter === this.player1 ? this.player2 : this.player1;

        // Steal projectile
        const steal = this.add.graphics();
        steal.x = fighter.x + direction * 40;
        steal.y = fighter.y;
        steal.setBlendMode('ADD');

        steal.fillStyle(0xff8800, 1);
        steal.fillRect(-6, -6, 12, 12);
        steal.fillStyle(0xffffff, 0.8);
        steal.fillRect(-3, -3, 6, 6);

        steal.hasHit = false;

        this.tweens.add({
            targets: steal,
            x: opponent.x,
            y: opponent.y,
            duration: 300,
            onUpdate: () => {
                const dist = Phaser.Math.Distance.Between(steal.x, steal.y, opponent.x, opponent.y);
                if (dist < 30 && !steal.hasHit) {
                    steal.hasHit = true;
                    this.applyDamage(opponent, attack.damage, attack.knockback, direction);
                    // Temp speed boost for fighter
                    const origSpeed = fighter.characterData.speed;
                    fighter.characterData.speed *= 1.5;
                    this.time.delayedCall(3000, () => {
                        fighter.characterData.speed = origSpeed;
                    });
                }
            },
            onComplete: () => steal.destroy()
        });
    }

    // ELEMENTS - Elementalist cycling elements
    createElementsAttack(fighter, attack, direction) {
        const elements = [
            { color: 0xff4444, name: 'fire' },
            { color: 0x4444ff, name: 'ice' },
            { color: 0xffff44, name: 'lightning' }
        ];

        elements.forEach((elem, i) => {
            this.time.delayedCall(i * 200, () => {
                const ball = this.add.graphics();
                ball.x = fighter.x + direction * 40;
                ball.y = fighter.y + (i - 1) * 30;
                ball.setBlendMode('ADD');

                ball.fillStyle(elem.color, 1);
                ball.fillRect(-6, -6, 12, 12);
                ball.fillStyle(0xffffff, 0.7);
                ball.fillRect(-4, -4, 8, 8);

                ball.hasHit = false;

                this.tweens.add({
                    targets: ball,
                    x: ball.x + direction * attack.range,
                    duration: 600,
                    onUpdate: () => {
                        const opponent = fighter === this.player1 ? this.player2 : this.player1;
                        const dist = Phaser.Math.Distance.Between(ball.x, ball.y, opponent.x, opponent.y);
                        if (dist < 30 && !ball.hasHit) {
                            ball.hasHit = true;
                            this.applyDamage(opponent, attack.damage / 3, attack.knockback / 3, direction);
                        }
                    },
                    onComplete: () => ball.destroy()
                });
            });
        });
    }

    // RALLY - Warlord war cry buff
    createRallyAttack(fighter, attack, direction) {
        // War cry visual
        const cry = this.add.graphics();
        cry.setBlendMode('ADD');

        for (let r = 0; r < 4; r++) {
            const radius = 30 + r * 20;
            cry.lineStyle(3, 0xff0000, 1 - r * 0.2);
            cry.strokeCircle(fighter.x, fighter.y, radius);
        }

        // Damage nearby opponent
        const opponent = fighter === this.player1 ? this.player2 : this.player1;
        const dist = Phaser.Math.Distance.Between(fighter.x, fighter.y, opponent.x, opponent.y);
        if (dist < attack.range) {
            this.applyDamage(opponent, attack.damage, attack.knockback, direction);
        }

        // Temp attack boost
        this.tweens.add({
            targets: cry,
            alpha: 0,
            duration: 300,
            onComplete: () => cry.destroy()
        });
    }

    // UPGRADE - Cyborg weapon upgrade
    createUpgradeAttack(fighter, attack, direction) {
        // Laser barrage
        for (let i = 0; i < 5; i++) {
            this.time.delayedCall(i * 100, () => {
                const laser = this.add.graphics();
                laser.x = fighter.x + direction * 40;
                laser.y = fighter.y;
                laser.setBlendMode('ADD');

                laser.fillStyle(0xff0000, 1);
                for (let j = 0; j < 10; j++) {
                    laser.fillRect(direction * (j * 8), -1, 6, 2);
                }

                laser.hasHit = false;

                this.tweens.add({
                    targets: laser,
                    alpha: 0,
                    duration: 150,
                    onUpdate: () => {
                        const opponent = fighter === this.player1 ? this.player2 : this.player1;
                        const lx = laser.x + direction * 40;
                        const dist = Phaser.Math.Distance.Between(lx, laser.y, opponent.x, opponent.y);
                        if (dist < 40 && !laser.hasHit) {
                            laser.hasHit = true;
                            this.applyDamage(opponent, attack.damage / 5, attack.knockback / 5, direction);
                        }
                    },
                    onComplete: () => laser.destroy()
                });
            });
        }
    }

    // TOTEM - Shaman spirit totem
    createTotemAttack(fighter, attack, direction) {
        const totem = this.add.graphics();
        totem.x = fighter.x + direction * 80;
        totem.y = fighter.y + 20;
        totem.setBlendMode('ADD');

        // Draw totem
        totem.fillStyle(0x664422, 1);
        totem.fillRect(-4, -20, 8, 40);
        totem.fillStyle(0xaaffaa, 1);
        totem.fillRect(-6, -24, 12, 8);
        totem.fillStyle(0x448866, 1);
        totem.fillRect(-3, -22, 6, 4);

        // Pulse healing/damage
        for (let i = 0; i < 5; i++) {
            this.time.delayedCall(i * 500, () => {
                this.createPixelParticles(totem.x, totem.y - 10, 0xaaffaa, 10, 1, 3);

                const opponent = fighter === this.player1 ? this.player2 : this.player1;
                const dist = Phaser.Math.Distance.Between(totem.x, totem.y, opponent.x, opponent.y);
                if (dist < 100) {
                    this.applyDamage(opponent, attack.damage / 5, 0.2, 0);
                }
            });
        }

        this.time.delayedCall(3000, () => totem.destroy());
    }

    // THRUST - Vanguard long spear thrust
    createThrustAttack(fighter, attack, direction) {
        fighter.body.setVelocityX(direction * 500);

        // Long spear visual
        const spear = this.add.graphics();
        spear.setBlendMode('ADD');

        spear.fillStyle(0x664422, 1);
        spear.fillRect(fighter.x, fighter.y - 1, direction * 80, 2);
        spear.fillStyle(0x888888, 1);
        spear.fillRect(fighter.x + direction * 78, fighter.y - 4, 6, 8);
        spear.fillStyle(0x4488ff, 0.8);
        spear.fillRect(fighter.x + direction * 79, fighter.y - 3, 4, 6);

        this.time.delayedCall(200, () => {
            fighter.body.setVelocityX(0);
            spear.destroy();
        });
    }

    // CURSE - Warlock dark curse
    createCurseAttack(fighter, attack, direction) {
        const opponent = fighter === this.player1 ? this.player2 : this.player1;

        const curse = this.add.graphics();
        curse.x = fighter.x + direction * 40;
        curse.y = fighter.y;
        curse.setBlendMode('ADD');

        // Spiral curse
        for (let s = 0; s < 12; s++) {
            const angle = (s / 12) * Math.PI * 2;
            const radius = 15;
            curse.fillStyle(0xff00ff, 0.9 - s * 0.05);
            curse.fillRect(
                Math.cos(angle) * radius - 2,
                Math.sin(angle) * radius - 2,
                4, 4
            );
        }

        curse.hasHit = false;

        this.tweens.add({
            targets: curse,
            x: opponent.x,
            y: opponent.y,
            angle: -360,
            duration: 800,
            onUpdate: () => {
                const dist = Phaser.Math.Distance.Between(curse.x, curse.y, opponent.x, opponent.y);
                if (dist < 30 && !curse.hasHit) {
                    curse.hasHit = true;
                    this.applyDamage(opponent, attack.damage, attack.knockback, direction);
                    // Weaken opponent temporarily
                }
            },
            onComplete: () => curse.destroy()
        });
    }

    // RIPOSTE - Duelist counter stance
    createRiposteAttack(fighter, attack, direction) {
        // Counter stance visual
        const stance = this.add.graphics();
        stance.x = fighter.x;
        stance.y = fighter.y;
        stance.setBlendMode('ADD');

        stance.lineStyle(2, 0xaaddff, 1);
        stance.strokeCircle(0, 0, 40);
        stance.strokeCircle(0, 0, 35);

        // If opponent attacks during this window, counter
        this.time.delayedCall(500, () => stance.destroy());

        // Quick counter stab
        this.time.delayedCall(100, () => {
            const opponent = fighter === this.player1 ? this.player2 : this.player1;
            const dist = Phaser.Math.Distance.Between(fighter.x, fighter.y, opponent.x, opponent.y);
            if (dist < attack.range) {
                this.applyDamage(opponent, attack.damage, attack.knockback, direction);
            }
        });
    }

    // DEMON - Summoner demon ally
    createDemonAttack(fighter, attack, direction) {
        const demon = this.add.graphics();
        demon.x = fighter.x + direction * 60;
        demon.y = fighter.y;
        demon.setBlendMode('ADD');

        // Draw demon
        demon.fillStyle(0x880088, 1);
        demon.fillRect(-8, -12, 16, 24);
        demon.fillStyle(0xcc88ff, 1);
        demon.fillRect(-6, -10, 12, 20);
        // Horns
        demon.fillStyle(0xff0000, 1);
        demon.fillRect(-10, -14, 4, 4);
        demon.fillRect(6, -14, 4, 4);

        const opponent = fighter === this.player1 ? this.player2 : this.player1;

        // Demon attacks multiple times
        for (let i = 0; i < 3; i++) {
            this.time.delayedCall(i * 400, () => {
                const dist = Phaser.Math.Distance.Between(demon.x, demon.y, opponent.x, opponent.y);
                if (dist < 100) {
                    this.applyDamage(opponent, attack.damage / 3, attack.knockback / 3, direction);
                    this.createPixelParticles(opponent.x, opponent.y, 0xcc88ff, 10, 1, 3);
                }
            });
        }

        this.time.delayedCall(1500, () => demon.destroy());
    }

    // SIXSHOT - Gunslinger rapid fire
    createSixshotAttack(fighter, attack, direction) {
        for (let i = 0; i < 6; i++) {
            this.time.delayedCall(i * 80, () => {
                this.createPixelParticles(fighter.x + direction * 30, fighter.y, 0xffaa44, 8, 1, 3);

                const bullet = this.add.circle(
                    fighter.x + direction * 40,
                    fighter.y + (Math.random() - 0.5) * 20,
                    5,
                    0xffaa44
                );
                this.physics.add.existing(bullet);

                bullet.isProjectile = true;
                bullet.hasHit = false;
                bullet.owner = fighter;
                bullet.attackDamage = attack.damage / 6;
                bullet.attackKnockback = attack.knockback / 6;
                bullet.setBlendMode('ADD');

                fighter.projectiles.add(bullet);
                bullet.body.setAllowGravity(false);
                bullet.body.setVelocityX(direction * 600);

                this.time.delayedCall(1000, () => {
                    if (bullet && bullet.active) bullet.destroy();
                });
            });
        }
    }

    // PLAGUE - Disease cloud
    createPlagueAttack(fighter, attack, direction) {
        const cloud = this.add.graphics();
        cloud.x = fighter.x + direction * 60;
        cloud.y = fighter.y;
        cloud.setBlendMode('ADD');

        // Toxic cloud
        for (let c = 0; c < 20; c++) {
            const angle = Math.random() * Math.PI * 2;
            const radius = Math.random() * 40;
            cloud.fillStyle(0x88ff44, 0.6);
            cloud.fillRect(
                Math.cos(angle) * radius - 4,
                Math.sin(angle) * radius - 4,
                8, 8
            );
        }

        const opponent = fighter === this.player1 ? this.player2 : this.player1;

        // DoT effect
        for (let i = 0; i < 5; i++) {
            this.time.delayedCall(i * 300, () => {
                const dist = Phaser.Math.Distance.Between(cloud.x, cloud.y, opponent.x, opponent.y);
                if (dist < 60) {
                    this.applyDamage(opponent, attack.damage / 5, 0, 0);
                }
            });
        }

        this.time.delayedCall(2000, () => cloud.destroy());
    }

    // JOUST - Lancer charging attack
    createJoustAttack(fighter, attack, direction) {
        fighter.body.setVelocityX(direction * 700);

        // Long lance
        const lance = this.add.graphics();
        lance.setBlendMode('ADD');

        lance.fillStyle(0x664422, 1);
        lance.fillRect(fighter.x, fighter.y - 1, direction * 100, 2);
        lance.fillStyle(0x888888, 1);
        lance.fillRect(fighter.x + direction * 98, fighter.y - 5, 6, 10);
        lance.fillStyle(0x9999ff, 0.8);
        lance.fillRect(fighter.x + direction * 99, fighter.y - 4, 4, 8);

        this.time.delayedCall(250, () => {
            fighter.body.setVelocityX(0);
            lance.destroy();
        });
    }

    // CONSTRUCT - Artificer spawns construct
    createConstructAttack(fighter, attack, direction) {
        const construct = this.add.graphics();
        construct.x = fighter.x + direction * 70;
        construct.y = fighter.y;
        construct.setBlendMode('ADD');

        // Mechanical construct
        construct.fillStyle(0x888888, 1);
        construct.fillRect(-6, -10, 12, 20);
        construct.fillStyle(0xff8844, 1);
        construct.fillRect(-4, -8, 8, 4);
        construct.fillStyle(0x44ffff, 1);
        construct.fillRect(-5, -6, 3, 3);
        construct.fillRect(2, -6, 3, 3);

        const opponent = fighter === this.player1 ? this.player2 : this.player1;

        // Shoots laser
        this.time.delayedCall(500, () => {
            const laser = this.add.graphics();
            laser.setBlendMode('ADD');

            laser.fillStyle(0x44ffff, 1);
            laser.fillRect(construct.x, construct.y, direction * 200, 2);

            const dist = Phaser.Math.Distance.Between(construct.x, construct.y, opponent.x, opponent.y);
            if (dist < 200) {
                this.applyDamage(opponent, attack.damage, attack.knockback, direction);
            }

            this.time.delayedCall(200, () => laser.destroy());
        });

        this.time.delayedCall(2000, () => construct.destroy());
    }

    // DEMOLISH - Destroyer massive explosion
    createDemolishAttack(fighter, attack, direction) {
        const explosion = this.add.graphics();
        explosion.x = fighter.x + direction * 60;
        explosion.y = fighter.y;
        explosion.setBlendMode('ADD');

        // Huge explosion
        for (let layer = 0; layer < 5; layer++) {
            const radius = 20 + layer * 15;
            for (let i = 0; i < 12; i++) {
                const angle = (i / 12) * Math.PI * 2;
                const dist = radius * (0.8 + Math.random() * 0.4);
                const colors = [0xffffff, 0xff0000, 0xff6666, 0xff8888, 0xffaaaa];
                explosion.fillStyle(colors[layer], 1 - layer * 0.15);
                explosion.fillRect(
                    Math.cos(angle) * dist - 6,
                    Math.sin(angle) * dist - 6,
                    12, 12
                );
            }
        }

        const opponent = fighter === this.player1 ? this.player2 : this.player1;
        const dist = Phaser.Math.Distance.Between(explosion.x, explosion.y, opponent.x, opponent.y);
        if (dist < 120) {
            this.applyDamage(opponent, attack.damage, attack.knockback, direction);
        }

        this.createPixelParticles(explosion.x, explosion.y, 0xff0000, 30, 2.5, 8);

        this.tweens.add({
            targets: explosion,
            alpha: 0,
            scaleX: 1.8,
            scaleY: 1.8,
            duration: 300,
            onComplete: () => explosion.destroy()
        });
    }

    // CLONE - Illusionist creates decoy
    createCloneAttack(fighter, attack, direction) {
        const opponent = fighter === this.player1 ? this.player2 : this.player1;

        // Create 2 clones
        for (let i = 0; i < 2; i++) {
            const clone = this.add.graphics();
            clone.x = fighter.x + (i === 0 ? -50 : 50);
            clone.y = fighter.y;
            clone.setBlendMode('ADD');

            // Semi-transparent clone
            clone.fillStyle(0xaa44ff, 0.5);
            clone.fillRect(-4, -10, 8, 20);
            clone.fillStyle(0xffffaa, 0.6);
            clone.fillRect(-3, -9, 6, 18);

            // Clones move toward opponent
            this.tweens.add({
                targets: clone,
                x: opponent.x + (i === 0 ? -30 : 30),
                y: opponent.y,
                duration: 800,
                onComplete: () => {
                    const dist = Phaser.Math.Distance.Between(clone.x, clone.y, opponent.x, opponent.y);
                    if (dist < 50) {
                        this.applyDamage(opponent, attack.damage / 2, attack.knockback / 2, direction);
                        this.createPixelParticles(clone.x, clone.y, 0xaa44ff, 15, 1.5, 5);
                    }
                    clone.destroy();
                }
            });
        }
    }

    // WHIRLWIND - Barbarian spinning attack
    createWhirlwindAttack(fighter, attack, direction) {
        fighter.body.setAngularVelocity(720);

        // Spinning slashes
        for (let i = 0; i < 8; i++) {
            this.time.delayedCall(i * 60, () => {
                const angle = (i / 8) * Math.PI * 2;
                const slash = this.add.graphics();
                slash.setBlendMode('ADD');

                slash.fillStyle(0x888888, 1);
                const radius = 50;
                for (let s = 0; s < 5; s++) {
                    const sa = angle + (s * Math.PI / 20);
                    slash.fillRect(
                        fighter.x + Math.cos(sa) * radius - 2,
                        fighter.y + Math.sin(sa) * radius - 2,
                        4, 4
                    );
                }

                const opponent = fighter === this.player1 ? this.player2 : this.player1;
                const dist = Phaser.Math.Distance.Between(fighter.x, fighter.y, opponent.x, opponent.y);
                if (dist < 60 && i % 2 === 0) {
                    this.applyDamage(opponent, attack.damage / 4, attack.knockback / 4, direction);
                }

                this.time.delayedCall(100, () => slash.destroy());
            });
        }

        this.time.delayedCall(500, () => {
            fighter.body.setAngularVelocity(0);
            fighter.setAngle(0);
        });
    }

    // GRAVITY - Astronaut gravity manipulation
    createGravityAttack(fighter, attack, direction) {
        const opponent = fighter === this.player1 ? this.player2 : this.player1;

        // Gravity well
        const well = this.add.graphics();
        well.x = opponent.x;
        well.y = opponent.y;
        well.setBlendMode('ADD');

        // Concentric rings
        for (let r = 0; r < 4; r++) {
            const radius = 20 + r * 15;
            for (let i = 0; i < 16; i++) {
                const angle = (i / 16) * Math.PI * 2;
                well.fillStyle(r % 2 === 0 ? 0xffffff : 0x4444ff, 0.8 - r * 0.15);
                well.fillRect(
                    Math.cos(angle) * radius - 2,
                    Math.sin(angle) * radius - 2,
                    4, 4
                );
            }
        }

        // Pull opponent and slow
        opponent.body.setVelocityY(-200);
        this.time.delayedCall(100, () => {
            opponent.body.setVelocityY(300);
        });

        this.time.delayedCall(200, () => {
            const dist = Phaser.Math.Distance.Between(well.x, well.y, opponent.x, opponent.y);
            if (dist < 80) {
                this.applyDamage(opponent, attack.damage, attack.knockback, 0);
            }
        });

        this.tweens.add({
            targets: well,
            alpha: 0,
            scaleX: 1.5,
            scaleY: 1.5,
            duration: 500,
            onComplete: () => well.destroy()
        });
    }

    // Default projectile for any unhandled types
    createDefaultProjectile(fighter, attack, direction) {
        const projectile = this.add.circle(
            fighter.x + direction * 40,
            fighter.y,
            12,
            fighter.characterData.color
        );
        this.physics.add.existing(projectile);

        projectile.isProjectile = true;
        projectile.hasHit = false;
        projectile.owner = fighter;
        projectile.attackDamage = attack.damage;
        projectile.attackKnockback = attack.knockback;
        projectile.setBlendMode('ADD');

        fighter.projectiles.add(projectile);
        projectile.body.setAllowGravity(false);
        projectile.body.setVelocityX(direction * 350);

        this.time.delayedCall(3000, () => {
            if (projectile && projectile.active) projectile.destroy();
        });
    }

    // Helper: Create hit spark effect
    createHitSpark(x, y, color) {
        for (let i = 0; i < 8; i++) {
            const spark = this.add.circle(x, y, 4, color);
            spark.setBlendMode('ADD');
            const angle = (i / 8) * Math.PI * 2;

            this.tweens.add({
                targets: spark,
                x: x + Math.cos(angle) * 40,
                y: y + Math.sin(angle) * 40,
                alpha: 0,
                scale: 0,
                duration: 200,
                onComplete: () => spark.destroy()
            });
        }
    }

    checkHitbox(hitbox, target) {
        const targetBounds = {
            x: target.x - target.characterData.size.width / 2,
            y: target.y - target.characterData.size.height / 2,
            width: target.characterData.size.width,
            height: target.characterData.size.height
        };

        return Phaser.Geom.Rectangle.Overlaps(
            new Phaser.Geom.Rectangle(hitbox.x - hitbox.width/2, hitbox.y - hitbox.height/2, hitbox.width, hitbox.height),
            new Phaser.Geom.Rectangle(targetBounds.x, targetBounds.y, targetBounds.width, targetBounds.height)
        );
    }

    applyDamage(fighter, damage, knockbackMult, direction) {
        try {
            if (!fighter) return;
            if (!fighter.active) return;
            if (!fighter.body) return;
            if (fighter.isInvincible) return;
            if (typeof damage !== 'number' || damage <= 0) return;
            if (typeof knockbackMult !== 'number' || knockbackMult <= 0) knockbackMult = 1;
            if (typeof direction !== 'number') direction = 1;

            // Initialize damage if not set
            if (typeof fighter.damage !== 'number') {
                fighter.damage = 0;
            }

            fighter.damage += damage;
            SFX.hit(fighter.damage);

            // Combo tracking - update attacker's combo
            const attacker = fighter.opponent;
            if (attacker && attacker.active && typeof attacker.comboCount !== 'undefined') {
                const currentTime = this.time.now;
                const COMBO_WINDOW = 2000; // 2 seconds to continue combo

                if (currentTime - attacker.lastHitTime < COMBO_WINDOW) {
                    attacker.comboCount++;
                } else {
                    attacker.comboCount = 1;
                }
                attacker.lastHitTime = currentTime;

                // Show combo counter
                this.showComboText(attacker, fighter);
            }

            // Calculate knockback based on damage
            const knockbackForce = BASE_KNOCKBACK + (fighter.damage * KNOCKBACK_GROWTH * 100);
            const totalKnockback = knockbackForce * knockbackMult;

            // Apply knockback
            try {
                fighter.body.setVelocityX(direction * totalKnockback);
                fighter.body.setVelocityY(-totalKnockback * 0.5);
            } catch (e) {
                console.warn('Error applying knockback:', e);
            }

            // Hitstun
            fighter.hitstun = HITSTUN_BASE + (fighter.damage * HITSTUN_GROWTH);

            // PIXELATED HIT IMPACT EFFECT
            try {
                this.createPixelHitEffect(fighter.x, fighter.y, damage, direction);
            } catch (e) {
                // Fallback to simple effect
                try {
                    if (this.hitEmitter && fighter.x && fighter.y) {
                        this.hitEmitter.emitParticleAt(fighter.x, fighter.y, 15);
                    }
                } catch (e2) {}
            }

            // Camera effects - GENTLE version (won't hurt your eyes)
            try {
                // Very subtle shake - reduced by 80%
                const shakeIntensity = Math.min(damage * 0.0004, 0.003);
                if (this.cameras && this.cameras.main) {
                    this.cameras.main.shake(40, shakeIntensity);

                    // Subtle hitstop only on really big hits
                    if (damage >= 18) {
                        this.doHitstop(20);
                    }

                    // Flash removed to prevent errors
                }
            } catch (e) {
                // Silently fail if camera effects don't work
            }
        } catch (e) {
            console.error('Error in applyDamage:', e);
        }
    }

    showComboText(attacker, target) {
        try {
            // Safety checks
            if (!attacker || !target) return;
            if (typeof attacker.comboCount !== 'number') return;
            if (typeof target.x !== 'number' || typeof target.y !== 'number') return;

            // Only show combo text for combos of 2 or more
            if (attacker.comboCount < 2) return;

            // Remove old combo text if exists
            if (attacker.comboText && attacker.comboText.active) {
                try {
                    attacker.comboText.destroy();
                } catch (e) {}
            }

            // Determine combo text and color based on combo count
            let comboLabel = '';
            let comboColor = '#ffffff';

            if (attacker.comboCount >= 10) {
                comboLabel = 'UNSTOPPABLE!';
                comboColor = '#ff0000';
            } else if (attacker.comboCount >= 7) {
                comboLabel = 'DOMINATING!';
                comboColor = '#ff4400';
            } else if (attacker.comboCount >= 5) {
                comboLabel = 'BRUTAL!';
                comboColor = '#ff8800';
            } else if (attacker.comboCount >= 3) {
                comboLabel = 'NICE!';
                comboColor = '#ffff00';
            }

            // Create combo counter text near the target - Minecraft style
            const comboText = this.add.text(target.x, target.y - 60, `${attacker.comboCount} HIT COMBO!`, {
            fontSize: '20px',
            fontFamily: 'Courier New, monospace',
            fontStyle: 'bold',
            color: comboColor
        }).setOrigin(0.5);
        comboText.setStroke('#000000', 3);

        // Add label below if earned
        if (comboLabel) {
            const labelText = this.add.text(target.x, target.y - 35, comboLabel, {
                fontSize: '14px',
                fontFamily: 'Courier New, monospace',
                fontStyle: 'bold',
                color: comboColor
            }).setOrigin(0.5);
            labelText.setStroke('#000000', 3);

            this.tweens.add({
                targets: labelText,
                y: labelText.y - 30,
                alpha: 0,
                scale: 1.3,
                duration: 800,
                ease: 'Power2',
                onComplete: () => labelText.destroy()
            });
        }

        attacker.comboText = comboText;

        // Animate and destroy
        this.tweens.add({
            targets: comboText,
            y: comboText.y - 40,
            alpha: 0,
            scale: 1.2,
            duration: 1000,
            ease: 'Power2',
            onComplete: () => {
                if (comboText && comboText.active) {
                    comboText.destroy();
                }
            }
        });

            // Bonus damage for high combos
            if (attacker.comboCount >= 5) {
                // Screen shake for big combos
                this.cameras.main.shake(150, 0.01 * Math.min(attacker.comboCount, 10));
            }
        } catch (e) {
            console.warn('Error showing combo text:', e);
        }
    }

    checkBlastZones() {
        const zones = this.currentArena.blastZones;

        [this.player1, this.player2].forEach(fighter => {
            // Skip if fighter is invincible (spawn protection)
            if (fighter.isInvincible) return;

            if (fighter.x < zones.left || fighter.x > zones.right ||
                fighter.y < zones.top || fighter.y > zones.bottom) {
                this.handleKO(fighter);
            }
        });
    }

    handleKO(fighter) {
        if (fighter.isInvincible) return;

        fighter.stocks--;
        SFX.ko();

        // Check game over first
        if (fighter.stocks <= 0) {
            // Final stock lost - trigger full KO cutscene
            this.endGame(fighter.opponent);
            return;
        }

        // Stock lost but not game over - CINEMATIC KO ZOOM
        try {
            // Capture fighter position before any changes
            const koX = fighter.x;
            const koY = fighter.y;

            // Extreme slow motion
            this.physics.world.timeScale = 0.15;

            // Slow, dramatic zoom and pan to defeated fighter
            this.cameras.main.pan(koX, koY, 1000, 'Power2');
            this.cameras.main.zoomTo(1.8, 1000, 'Power2');

            // Cyber glitch flash effect (staggered)
            this.time.delayedCall(200, () => {
                this.cameras.main.flash(120, 255, 0, 0, true);
            });
            this.time.delayedCall(350, () => {
                this.cameras.main.flash(100, 255, 0, 0, true);
            });
            this.time.delayedCall(500, () => {
                this.cameras.main.flash(80, 255, 0, 0, true);
            });

            // Massive impact shockwaves
            for (let r = 0; r < 5; r++) {
                this.time.delayedCall(r * 80, () => {
                    const ring1 = this.add.circle(koX, koY, 15, 0x00ffff, 0);
                    ring1.setStrokeStyle(3, 0x00ffff, 0.9);
                    ring1.setDepth(998);

                    const ring2 = this.add.circle(koX, koY, 15, 0xff0000, 0);
                    ring2.setStrokeStyle(2, 0xff0000, 0.7);
                    ring2.setDepth(998);

                    this.tweens.add({
                        targets: ring1,
                        radius: 120 + r * 25,
                        alpha: 0,
                        duration: 600,
                        ease: 'Power2',
                        onComplete: () => ring1.destroy()
                    });

                    this.tweens.add({
                        targets: ring2,
                        radius: 130 + r * 25,
                        alpha: 0,
                        duration: 650,
                        ease: 'Power2',
                        onComplete: () => ring2.destroy()
                    });
                });
            }

            // Pixel disintegration effect
            for (let i = 0; i < 8; i++) {
                this.time.delayedCall(i * 50, () => {
                    this.createPixelParticles(koX, koY, 0xff0000, 25, 2.5 + i * 0.2, 7);
                    this.createPixelParticles(koX, koY, 0x00ffff, 20, 2.2 + i * 0.2, 6);
                    this.createPixelParticles(koX, koY, 0xffffff, 15, 1.8 + i * 0.2, 5);
                });
            }

            // Lightning strike effect
            this.time.delayedCall(250, () => {
                const lightning = this.add.graphics();
                lightning.setDepth(999);
                lightning.lineStyle(4, 0x00ffff, 0.9);
                lightning.lineBetween(koX, koY - 200, koX, koY + 50);
                lightning.lineStyle(2, 0xffffff, 1);
                lightning.lineBetween(koX, koY - 200, koX, koY + 50);

                this.tweens.add({
                    targets: lightning,
                    alpha: 0,
                    duration: 400,
                    onComplete: () => lightning.destroy()
                });
            });

            // Reset camera and time after effect, THEN respawn
            this.time.delayedCall(1200, () => {
                this.physics.world.timeScale = 1;
                this.cameras.main.pan(GAME_WIDTH / 2, GAME_HEIGHT / 2, 500, 'Power2');
                this.cameras.main.zoomTo(1.0, 500, 'Power2');

                // Respawn AFTER animation and physics are back to normal
                this.respawnFighter(fighter);
            });
        } catch (e) {
            // If animation fails, still respawn
            this.physics.world.timeScale = 1;
            this.respawnFighter(fighter);
        }

        // Make fighter temporarily invincible and hidden during KO animation
        fighter.isInvincible = true;
        fighter.body.enable = false;
        fighter.setAlpha(0);
    }

    respawnFighter(fighter) {
        // Calculate spawn position based on main platform
        const mainPlatform = this.currentArena.platforms.find(p => p.type === 'main');
        const spawnY = mainPlatform.y - 60;

        const platformLeft = mainPlatform.x - mainPlatform.width / 2;
        const platformRight = mainPlatform.x + mainPlatform.width / 2;
        const spawnOffset = Math.min(200, mainPlatform.width / 3);

        // Reset position - spawn on appropriate side of platform
        fighter.x = fighter.playerNum === 1 ? platformLeft + spawnOffset : platformRight - spawnOffset;
        fighter.y = spawnY;
        fighter.body.setVelocity(0, 0);
        fighter.damage = 0;

        // Reset combo
        fighter.comboCount = 0;

        // Ensure fighter is active, visible, and physics body works
        fighter.setAlpha(1);
        SFX.respawn();
        fighter.body.enable = true;
        fighter.body.setAllowGravity(true);

        // Use shared spawn protection
        this.startSpawnProtection(fighter);
    }

    checkCombat() {
        // Check melee range combat (already handled in attack functions)
    }

    updateHUD() {
        // Update damage displays - Minecraft style colors
        [this.p1HUD, this.p2HUD].forEach(hud => {
            const damage = Math.floor(hud.fighter.damage);
            hud.damageText.setText(`${damage}%`);

            // Color based on damage - Minecraft-ish colors
            if (damage < 50) {
                hud.damageText.setColor('#55ff55');  // Green
                hud.damageText.setStroke('#005500', 3);
            } else if (damage < 100) {
                hud.damageText.setColor('#ffff55');  // Yellow
                hud.damageText.setStroke('#555500', 3);
            } else if (damage < 150) {
                hud.damageText.setColor('#ffaa00');  // Gold/Orange
                hud.damageText.setStroke('#553300', 3);
            } else {
                hud.damageText.setColor('#ff5555');  // Red
                hud.damageText.setStroke('#550000', 3);
            }

            // Update stock icons (hearts)
            hud.stockIcons.forEach((icon, i) => {
                icon.setVisible(i < hud.fighter.stocks);
            });
        });
    }

    togglePause() {
        this.isPaused = !this.isPaused;

        if (this.isPaused) {
            this.physics.pause();
            this.scene.launch('PauseScene', { gameScene: this });
        } else {
            this.physics.resume();
            this.scene.stop('PauseScene');
        }
    }

    endGame(winner) {
        this.gameOver = true;

        // Start dramatic KO cutscene
        this.playKOCutscene(winner);
    }

    playKOCutscene(winner) {
        const loser = winner === this.player1 ? this.player2 : this.player1;

        // Extreme slow motion for dramatic effect
        this.physics.world.timeScale = 0.1;

        // Intense camera shake
        this.cameras.main.shake(800, 0.04);

        // Dark red flash (not yellow/gold)
        const flash = this.add.rectangle(
            GAME_WIDTH / 2, GAME_HEIGHT / 2,
            GAME_WIDTH, GAME_HEIGHT,
            0xff0000, 0.5
        );
        flash.setDepth(1000);
        flash.setScrollFactor(0);
        flash.setBlendMode('ADD');

        this.tweens.add({
            targets: flash,
            alpha: 0,
            duration: 400,
            onComplete: () => flash.destroy()
        });

        // Dramatic zoom to winner
        this.cameras.main.pan(winner.x, winner.y - 30, 600, 'Power2');
        this.cameras.main.zoomTo(1.6, 600, 'Power2');

        // Massive explosion at loser
        this.time.delayedCall(100, () => {
            this.createPixelParticles(loser.x, loser.y, 0xff0000, 80, 4, 12);
            this.createPixelParticles(loser.x, loser.y, 0x000000, 60, 3.5, 10);
            this.createPixelParticles(loser.x, loser.y, 0xffffff, 40, 3, 8);
        });

        // Dark energy particles around winner
        this.time.delayedCall(200, () => {
            for (let i = 0; i < 6; i++) {
                this.time.delayedCall(i * 80, () => {
                    this.createPixelParticles(winner.x, winner.y - 40, 0xff0000, 25, 2.5, 7);
                    this.createPixelParticles(winner.x, winner.y - 40, 0x00ffff, 20, 2, 6);
                    this.createPixelParticles(winner.x, winner.y - 40, 0x000000, 15, 1.5, 5);
                });
            }
        });

        // Shockwave rings around winner
        for (let i = 0; i < 4; i++) {
            this.time.delayedCall(300 + i * 100, () => {
                const ring = this.add.circle(winner.x, winner.y, 20, 0xff0000, 0);
                ring.setStrokeStyle(3, 0xff0000, 0.8);
                ring.setDepth(999);
                ring.setBlendMode('ADD');

                this.tweens.add({
                    targets: ring,
                    radius: 150 + i * 30,
                    alpha: 0,
                    duration: 700,
                    ease: 'Power2',
                    onComplete: () => ring.destroy()
                });
            });
        }

        // Freeze physics
        this.time.delayedCall(500, () => {
            this.physics.pause();
        });

        // Screen distortion effect (no text)
        this.time.delayedCall(600, () => {
            // Dark vignette
            const vignette = this.add.graphics();
            vignette.fillStyle(0x000000, 0);
            vignette.fillCircle(GAME_WIDTH / 2, GAME_HEIGHT / 2, 500);
            vignette.setDepth(1001);
            vignette.setScrollFactor(0);

            this.tweens.add({
                targets: vignette,
                alpha: 0.7,
                duration: 800,
                ease: 'Power2'
            });

            // Glitch lines
            for (let i = 0; i < 8; i++) {
                this.time.delayedCall(i * 100, () => {
                    const glitch = this.add.graphics();
                    glitch.fillStyle(0xff0000, 0.3);
                    glitch.fillRect(0, Math.random() * GAME_HEIGHT, GAME_WIDTH, 3);
                    glitch.setDepth(1002);
                    glitch.setScrollFactor(0);
                    glitch.setBlendMode('ADD');

                    this.tweens.add({
                        targets: glitch,
                        alpha: 0,
                        duration: 150,
                        onComplete: () => glitch.destroy()
                    });
                });
            }

            // Screen shake for emphasis
            this.cameras.main.shake(1200, 0.01);
        });

        // Transition to victory scene
        this.time.delayedCall(2200, () => {
            this.cameras.main.fadeOut(600, 0, 0, 0);

            this.cameras.main.once('camerafadeoutcomplete', () => {
                this.scene.start('VictoryScene', {
                    winner: winner,
                    mode: this.gameMode,
                    player1: this.player1Data,
                    player2: this.player2Data,
                    arena: this.currentArena,
                    aiDifficulty: this.aiDifficulty
                });
            });
        });
    }
}
