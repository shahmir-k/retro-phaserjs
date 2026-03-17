// Arena/Stage Definitions
const ARENAS = {
    BATTLEFIELD: {
        id: 'battlefield',
        name: 'Battlefield',
        background: {
            type: 'gradient',
            colors: [0x1a1a2e, 0x16213e, 0x0f3460],
            particles: 'stars'
        },
        platforms: [
            { x: 600, y: 550, width: 700, height: 40, type: 'main' },
            { x: 350, y: 400, width: 180, height: 25, type: 'floating' },
            { x: 850, y: 400, width: 180, height: 25, type: 'floating' },
            { x: 600, y: 280, width: 150, height: 25, type: 'floating' }
        ],
        blastZones: { left: -150, right: 1350, top: -200, bottom: 900 },
        effects: ['floatingParticles', 'ambientGlow'],
        theme: 'epic'
    },
    TEMPLE: {
        id: 'temple',
        name: 'Ancient Temple',
        background: {
            type: 'gradient',
            colors: [0x2d1b0e, 0x4a3728, 0x6b5344],
            particles: 'dust'
        },
        platforms: [
            { x: 600, y: 570, width: 800, height: 50, type: 'main' },
            { x: 200, y: 450, width: 150, height: 30, type: 'floating' },
            { x: 500, y: 350, width: 200, height: 30, type: 'floating' },
            { x: 800, y: 450, width: 150, height: 30, type: 'floating' },
            { x: 1000, y: 350, width: 120, height: 30, type: 'floating' }
        ],
        blastZones: { left: -150, right: 1350, top: -200, bottom: 900 },
        effects: ['torchFlicker', 'dustMotes'],
        theme: 'ancient'
    },
    VOLCANO: {
        id: 'volcano',
        name: 'Volcanic Peak',
        background: {
            type: 'gradient',
            colors: [0x1a0a00, 0x4a1a00, 0x8b2500],
            particles: 'embers'
        },
        platforms: [
            { x: 600, y: 520, width: 500, height: 45, type: 'main' },
            { x: 200, y: 480, width: 200, height: 35, type: 'floating' },
            { x: 1000, y: 480, width: 200, height: 35, type: 'floating' },
            { x: 400, y: 340, width: 140, height: 25, type: 'floating' },
            { x: 800, y: 340, width: 140, height: 25, type: 'floating' }
        ],
        blastZones: { left: -150, right: 1350, top: -200, bottom: 900 },
        effects: ['lavaGlow', 'risingEmbers', 'heatWave'],
        theme: 'fire'
    },
    SKY_TOWER: {
        id: 'sky_tower',
        name: 'Sky Tower',
        background: {
            type: 'gradient',
            colors: [0x87ceeb, 0x4a90d9, 0x1e3a5f],
            particles: 'clouds'
        },
        platforms: [
            { x: 600, y: 500, width: 350, height: 40, type: 'main' },
            { x: 250, y: 400, width: 200, height: 30, type: 'floating' },
            { x: 950, y: 400, width: 200, height: 30, type: 'floating' },
            { x: 600, y: 300, width: 180, height: 25, type: 'floating' },
            { x: 150, y: 550, width: 150, height: 35, type: 'floating' },
            { x: 1050, y: 550, width: 150, height: 35, type: 'floating' }
        ],
        blastZones: { left: -200, right: 1400, top: -250, bottom: 900 },
        effects: ['driftingClouds', 'sunRays', 'windLines'],
        theme: 'sky'
    },
    NEON_CITY: {
        id: 'neon_city',
        name: 'Neon City',
        background: {
            type: 'gradient',
            colors: [0x0a0a1a, 0x1a0a2e, 0x2a1a4e],
            particles: 'neonFlakes'
        },
        platforms: [
            { x: 600, y: 550, width: 600, height: 40, type: 'main' },
            { x: 150, y: 450, width: 180, height: 30, type: 'floating' },
            { x: 450, y: 380, width: 160, height: 25, type: 'floating' },
            { x: 750, y: 380, width: 160, height: 25, type: 'floating' },
            { x: 1050, y: 450, width: 180, height: 30, type: 'floating' }
        ],
        blastZones: { left: -150, right: 1350, top: -200, bottom: 900 },
        effects: ['neonGlow', 'scanlines', 'electricSparks'],
        theme: 'cyber'
    },
    FROZEN_LAKE: {
        id: 'frozen_lake',
        name: 'Frozen Lake',
        background: {
            type: 'gradient',
            colors: [0x1a2a3a, 0x2a4a6a, 0x4a7a9a],
            particles: 'snow'
        },
        platforms: [
            { x: 600, y: 560, width: 750, height: 45, type: 'main', slippery: true },
            { x: 300, y: 420, width: 200, height: 30, type: 'floating' },
            { x: 900, y: 420, width: 200, height: 30, type: 'floating' },
            { x: 600, y: 300, width: 220, height: 25, type: 'floating' }
        ],
        blastZones: { left: -150, right: 1350, top: -200, bottom: 900 },
        effects: ['snowfall', 'iceShimmer', 'breathMist'],
        theme: 'ice'
    },
    FINAL_DESTINATION: {
        id: 'final_destination',
        name: 'Final Destination',
        background: {
            type: 'animated',
            colors: [0x000022, 0x110033, 0x220044],
            particles: 'cosmic'
        },
        platforms: [
            { x: 600, y: 500, width: 600, height: 50, type: 'main' }
        ],
        blastZones: { left: -200, right: 1400, top: -250, bottom: 900 },
        effects: ['cosmicWaves', 'starfield', 'energyPulse'],
        theme: 'cosmic'
    },
    JUNGLE: {
        id: 'jungle',
        name: 'Jungle Ruins',
        background: {
            type: 'gradient',
            colors: [0x0a2a0a, 0x1a4a1a, 0x2a6a2a],
            particles: 'leaves'
        },
        platforms: [
            { x: 600, y: 550, width: 650, height: 45, type: 'main' },
            { x: 200, y: 420, width: 170, height: 30, type: 'floating' },
            { x: 450, y: 320, width: 140, height: 25, type: 'floating' },
            { x: 750, y: 320, width: 140, height: 25, type: 'floating' },
            { x: 1000, y: 420, width: 170, height: 30, type: 'floating' }
        ],
        blastZones: { left: -150, right: 1350, top: -200, bottom: 900 },
        effects: ['fallingLeaves', 'vines', 'fireflies'],
        theme: 'nature'
    }
};

// Arena list for menus
const ARENA_LIST = Object.values(ARENAS);
