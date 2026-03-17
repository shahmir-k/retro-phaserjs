// Character Definitions - CYBER THEME with 30 unique fighters
// BALANCE NOTES:
// - Fast chars: high speed, low weight/damage
// - Heavy chars: slow, high damage/weight
// - Balanced chars: moderate all stats
const CHARACTERS = {
    // ===== BALANCED FIGHTERS =====
    WARRIOR: {
        id: 'warrior',
        name: 'Cyber Blade',
        color: 0xff00ff,
        accentColor: 0x00ffff,
        speed: 290,
        weight: 1.1,
        jumpPower: 1.0,
        size: { width: 40, height: 60 },
        bodyType: 'mechanical',
        attackEffect: 'slash_purple',
        attacks: {
            normal: { damage: 11, knockback: 1.0, range: 50, startup: 4, duration: 14 },
            special: { damage: 20, knockback: 1.5, range: 75, startup: 10, duration: 22, type: 'slash' }
        },
        description: 'Neon blade fighter with plasma sword attacks'
    },
    BRAWLER: {
        id: 'brawler',
        name: 'Chrome Fist',
        color: 0xff8800,
        accentColor: 0xffff00,
        speed: 280,
        weight: 1.2,
        jumpPower: 0.95,
        size: { width: 45, height: 58 },
        bodyType: 'mechanical',
        attackEffect: 'punch_orange',
        attacks: {
            normal: { damage: 13, knockback: 1.1, range: 42, startup: 3, duration: 11 },
            special: { damage: 24, knockback: 2.0, range: 55, startup: 7, duration: 22, type: 'uppercut' }
        },
        description: 'Power-fist combos with rocket uppercut'
    },
    PIRATE: {
        id: 'pirate',
        name: 'Net Runner',
        color: 0xffff00,
        accentColor: 0x00ff00,
        speed: 300,
        weight: 1.0,
        jumpPower: 1.05,
        size: { width: 40, height: 58 },
        bodyType: 'slim',
        attackEffect: 'shot_yellow',
        attacks: {
            normal: { damage: 9, knockback: 0.8, range: 48, startup: 3, duration: 12 },
            special: { damage: 16, knockback: 1.4, range: 200, startup: 8, duration: 18, type: 'pistol' }
        },
        description: 'Hacker with rapid-fire EMP blaster'
    },
    ROBOT: {
        id: 'robot',
        name: 'V-800',
        color: 0x00ffff,
        accentColor: 0xff00ff,
        speed: 260,
        weight: 1.35,
        jumpPower: 0.9,
        size: { width: 48, height: 62 },
        bodyType: 'mechanical',
        attackEffect: 'beam_cyan',
        attacks: {
            normal: { damage: 12, knockback: 1.0, range: 52, startup: 6, duration: 16 },
            special: { damage: 22, knockback: 1.6, range: 200, startup: 14, duration: 28, type: 'laser' }
        },
        description: 'Combat android with piercing laser beam'
    },

    // ===== SPEED FIGHTERS (buffed damage slightly, glass cannons) =====
    SPEEDSTER: {
        id: 'speedster',
        name: 'Neon Rush',
        color: 0x00ff88,
        accentColor: 0x88ffff,
        speed: 420,
        weight: 0.65,
        jumpPower: 1.35,
        size: { width: 32, height: 52 },
        bodyType: 'slim',
        attackEffect: 'dash_green',
        attacks: {
            normal: { damage: 7, knockback: 0.5, range: 35, startup: 2, duration: 7 },
            special: { damage: 16, knockback: 1.5, range: 130, startup: 3, duration: 14, type: 'dash' }
        },
        description: 'Blazing fast with multi-hit dash attacks'
    },
    NINJA: {
        id: 'ninja',
        name: 'Ghost Protocol',
        color: 0xaa00ff,
        accentColor: 0xff00aa,
        speed: 380,
        weight: 0.7,
        jumpPower: 1.45,
        size: { width: 32, height: 52 },
        bodyType: 'slim',
        attackEffect: 'kunai_purple',
        attacks: {
            normal: { damage: 8, knockback: 0.6, range: 38, startup: 2, duration: 9 },
            special: { damage: 14, knockback: 1.3, range: 220, startup: 4, duration: 11, type: 'shuriken' }
        },
        description: 'Teleporting assassin with holo-shuriken'
    },
    SHADOW: {
        id: 'shadow',
        name: 'Darknet',
        color: 0x8800ff,
        accentColor: 0x220044,
        speed: 340,           // NERFED from 390
        weight: 0.7,          // NERFED from 0.65 (easier to knock back)
        jumpPower: 1.2,       // NERFED from 1.35
        size: { width: 30, height: 54 },
        bodyType: 'slim',
        attackEffect: 'void_dark',
        attacks: {
            normal: { damage: 7, knockback: 0.6, range: 36, startup: 3, duration: 10 },  // NERFED
            special: { damage: 16, knockback: 1.3, range: 140, startup: 7, duration: 20, type: 'shadow' }  // NERFED
        },
        description: 'Phase through attacks with glitch teleport'
    },
    STRIKER: {
        id: 'striker',
        name: 'Blitz',
        color: 0xffff00,
        accentColor: 0xff8800,
        speed: 350,           // NERFED from 400
        weight: 0.8,          // NERFED from 0.75 (easier to knock back)
        jumpPower: 1.15,      // NERFED from 1.3
        size: { width: 35, height: 55 },
        bodyType: 'slim',
        attackEffect: 'spark_yellow',
        attacks: {
            normal: { damage: 6, knockback: 0.5, range: 34, startup: 3, duration: 8 },  // NERFED
            special: { damage: 14, knockback: 1.3, range: 80, startup: 6, duration: 18, type: 'lightning' }  // NERFED
        },
        description: 'Electric speed demon with chain lightning'
    },

    // ===== HEAVY FIGHTERS (nerfed speed, buffed damage) =====
    TANK: {
        id: 'tank',
        name: 'Mech Titan',
        color: 0x4488ff,
        accentColor: 0x00ffff,
        speed: 160,
        weight: 1.9,
        jumpPower: 0.55,
        size: { width: 55, height: 70 },
        bodyType: 'mechanical',
        attackEffect: 'crush_blue',
        attacks: {
            normal: { damage: 20, knockback: 1.6, range: 62, startup: 11, duration: 26 },
            special: { damage: 35, knockback: 2.4, range: 85, startup: 22, duration: 42, type: 'smash' }
        },
        description: 'Massive mech with devastating ground pounds'
    },
    KNIGHT: {
        id: 'knight',
        name: 'Titan Frame',
        color: 0xffaa00,
        accentColor: 0x888888,
        speed: 200,
        weight: 1.6,
        jumpPower: 0.85,
        size: { width: 52, height: 66 },
        bodyType: 'mechanical',
        attackEffect: 'shield_gold',
        attacks: {
            normal: { damage: 15, knockback: 1.3, range: 58, startup: 7, duration: 17 },
            special: { damage: 22, knockback: 1.8, range: 75, startup: 14, duration: 28, type: 'shield' }
        },
        description: 'Heavy exosuit with reflective shield bash'
    },
    GOLEM: {
        id: 'golem',
        name: 'Monolith',
        color: 0x888888,
        accentColor: 0x00ffff,
        speed: 140,
        weight: 2.2,
        jumpPower: 0.45,
        size: { width: 60, height: 75 },
        bodyType: 'mechanical',
        attackEffect: 'quake_gray',
        attacks: {
            normal: { damage: 22, knockback: 1.8, range: 68, startup: 14, duration: 30 },
            special: { damage: 40, knockback: 2.8, range: 100, startup: 28, duration: 55, type: 'earthquake' }
        },
        description: 'Immovable fortress with ground-shaking slams'
    },
    BEAST: {
        id: 'beast',
        name: 'Cyber Wolf',
        color: 0x00ff44,
        accentColor: 0x88ff00,
        speed: 320,
        weight: 1.4,
        jumpPower: 1.25,
        size: { width: 52, height: 58 },
        bodyType: 'mechanical',
        attackEffect: 'claw_green',
        attacks: {
            normal: { damage: 16, knockback: 1.4, range: 48, startup: 3, duration: 11 },
            special: { damage: 24, knockback: 1.8, range: 65, startup: 7, duration: 20, type: 'roar' }
        },
        description: 'Savage mechanical predator with pounce'
    },

    // ===== MAGE/RANGED FIGHTERS (glass cannon, high damage specials) =====
    MAGE: {
        id: 'mage',
        name: 'Data Witch',
        color: 0xff00ff,
        accentColor: 0x8800ff,
        speed: 240,
        weight: 0.8,
        jumpPower: 1.15,
        size: { width: 36, height: 56 },
        bodyType: 'slim',
        attackEffect: 'magic_pink',
        attacks: {
            normal: { damage: 7, knockback: 0.5, range: 65, startup: 5, duration: 15 },
            special: { damage: 28, knockback: 2.2, range: 280, startup: 16, duration: 40, type: 'fireball' }
        },
        description: 'Long-range digital virus projectiles'
    },
    FROSTMAGE: {
        id: 'frostmage',
        name: 'Cryo Unit',
        color: 0x00ddff,
        accentColor: 0xaaffff,
        speed: 220,
        weight: 0.95,
        jumpPower: 1.1,
        size: { width: 42, height: 60 },
        bodyType: 'mechanical',
        attackEffect: 'frost_blue',
        attacks: {
            normal: { damage: 8, knockback: 0.6, range: 58, startup: 5, duration: 14 },
            special: { damage: 20, knockback: 1.5, range: 200, startup: 12, duration: 32, type: 'ice' }
        },
        description: 'Freezing attacks that slow enemies'
    },
    SNIPER: {
        id: 'sniper',
        name: 'Railgun',
        color: 0xff4400,
        accentColor: 0xffaa00,
        speed: 230,
        weight: 0.9,
        jumpPower: 1.0,
        size: { width: 36, height: 58 },
        bodyType: 'slim',
        attackEffect: 'rail_red',
        attacks: {
            normal: { damage: 7, knockback: 0.5, range: 42, startup: 5, duration: 13 },
            special: { damage: 42, knockback: 2.8, range: 450, startup: 28, duration: 55, type: 'railgun' }
        },
        description: 'Slow but devastating long-range shots'
    },
    HACKER: {
        id: 'hacker',
        name: 'Zero Day',
        color: 0x00ff00,
        accentColor: 0x003300,
        speed: 270,
        weight: 0.85,
        jumpPower: 1.1,
        size: { width: 38, height: 56 },
        bodyType: 'slim',
        attackEffect: 'data_green',
        attacks: {
            normal: { damage: 8, knockback: 0.65, range: 52, startup: 4, duration: 11 },
            special: { damage: 22, knockback: 1.7, range: 320, startup: 18, duration: 38, type: 'hack' }
        },
        description: 'Places traps and hacks enemy controls'
    },

    // ===== HYBRID FIGHTERS (unique playstyles) =====
    DEMON: {
        id: 'demon',
        name: 'Virus Prime',
        color: 0xff0044,
        accentColor: 0xff8800,
        speed: 310,
        weight: 1.3,
        jumpPower: 1.4,
        size: { width: 50, height: 68 },
        bodyType: 'mechanical',
        attackEffect: 'fire_red',
        attacks: {
            normal: { damage: 14, knockback: 1.2, range: 52, startup: 4, duration: 13 },
            special: { damage: 28, knockback: 2.2, range: 110, startup: 11, duration: 28, type: 'inferno' }
        },
        description: 'Corrupted AI with explosive malware'
    },
    ANGEL: {
        id: 'angel',
        name: 'Guardian AI',
        color: 0xaaffff,
        accentColor: 0xffffff,
        speed: 290,
        weight: 0.8,
        jumpPower: 1.55,
        size: { width: 40, height: 60 },
        bodyType: 'slim',
        attackEffect: 'holy_white',
        attacks: {
            normal: { damage: 9, knockback: 0.7, range: 48, startup: 4, duration: 11 },
            special: { damage: 18, knockback: 1.5, range: 220, startup: 10, duration: 25, type: 'holy' }
        },
        description: 'Floaty with healing light beams'
    },
    DRUID: {
        id: 'druid',
        name: 'Bio Hacker',
        color: 0x00ff88,
        accentColor: 0x44ffaa,
        speed: 260,
        weight: 1.0,
        jumpPower: 1.15,
        size: { width: 40, height: 58 },
        bodyType: 'slim',
        attackEffect: 'vine_green',
        attacks: {
            normal: { damage: 8, knockback: 0.6, range: 58, startup: 5, duration: 14 },
            special: { damage: 20, knockback: 1.5, range: 180, startup: 12, duration: 32, type: 'nature' }
        },
        description: 'Nano-vine traps and area denial'
    },
    BOMBER: {
        id: 'bomber',
        name: 'Payload',
        color: 0xff6600,
        accentColor: 0xffff00,
        speed: 210,
        weight: 1.35,
        jumpPower: 0.9,
        size: { width: 48, height: 60 },
        bodyType: 'mechanical',
        attackEffect: 'bomb_orange',
        attacks: {
            normal: { damage: 11, knockback: 1.0, range: 48, startup: 5, duration: 15 },
            special: { damage: 32, knockback: 2.4, range: 130, startup: 14, duration: 32, type: 'bomb' }
        },
        description: 'Explosive projectiles with area damage'
    },

    // ===== NEW CHARACTERS (10 more) =====
    SAMURAI: {
        id: 'samurai',
        name: 'Ronin.exe',
        color: 0xff2222,
        accentColor: 0xffffaa,
        speed: 300,
        weight: 1.05,
        jumpPower: 1.1,
        size: { width: 38, height: 60 },
        bodyType: 'slim',
        attackEffect: 'katana_red',
        attacks: {
            normal: { damage: 14, knockback: 1.1, range: 55, startup: 3, duration: 10 },
            special: { damage: 26, knockback: 2.0, range: 80, startup: 8, duration: 20, type: 'iai' }
        },
        description: 'Precise counter-attacks with quick draw'
    },
    MEDIC: {
        id: 'medic',
        name: 'Nano Doc',
        color: 0x44ff44,
        accentColor: 0xffffff,
        speed: 270,
        weight: 0.9,
        jumpPower: 1.1,
        size: { width: 36, height: 56 },
        bodyType: 'slim',
        attackEffect: 'heal_green',
        attacks: {
            normal: { damage: 6, knockback: 0.5, range: 45, startup: 4, duration: 12 },
            special: { damage: 15, knockback: 1.2, range: 150, startup: 10, duration: 25, type: 'heal' }
        },
        description: 'Support fighter with healing nanobots'
    },
    PHANTOM: {
        id: 'phantom',
        name: 'Wraith',
        color: 0x6600aa,
        accentColor: 0xcc00ff,
        speed: 350,
        weight: 0.6,
        jumpPower: 1.4,
        size: { width: 32, height: 56 },
        bodyType: 'slim',
        attackEffect: 'phase_purple',
        attacks: {
            normal: { damage: 9, knockback: 0.7, range: 42, startup: 2, duration: 9 },
            special: { damage: 22, knockback: 1.7, range: 100, startup: 6, duration: 18, type: 'phase' }
        },
        description: 'Intangible ghost with possession attacks'
    },
    GLADIATOR: {
        id: 'gladiator',
        name: 'Arena King',
        color: 0xcc8800,
        accentColor: 0xffdd00,
        speed: 250,
        weight: 1.45,
        jumpPower: 0.95,
        size: { width: 50, height: 64 },
        bodyType: 'mechanical',
        attackEffect: 'trident_gold',
        attacks: {
            normal: { damage: 16, knockback: 1.3, range: 60, startup: 6, duration: 16 },
            special: { damage: 25, knockback: 2.0, range: 70, startup: 12, duration: 26, type: 'arena' }
        },
        description: 'Crowd favorite with devastating combos'
    },
    PSYCHIC: {
        id: 'psychic',
        name: 'Mind.sys',
        color: 0xff44ff,
        accentColor: 0x8888ff,
        speed: 260,
        weight: 0.85,
        jumpPower: 1.2,
        size: { width: 34, height: 56 },
        bodyType: 'slim',
        attackEffect: 'mind_pink',
        attacks: {
            normal: { damage: 7, knockback: 0.6, range: 50, startup: 5, duration: 14 },
            special: { damage: 20, knockback: 1.8, range: 200, startup: 14, duration: 30, type: 'psi' }
        },
        description: 'Telekinetic attacks from a distance'
    },
    BERSERKER: {
        id: 'berserker',
        name: 'Rampage',
        color: 0xdd0000,
        accentColor: 0xff4400,
        speed: 340,
        weight: 1.25,
        jumpPower: 1.15,
        size: { width: 48, height: 62 },
        bodyType: 'mechanical',
        attackEffect: 'rage_red',
        attacks: {
            normal: { damage: 18, knockback: 1.4, range: 50, startup: 3, duration: 10 },
            special: { damage: 30, knockback: 2.2, range: 60, startup: 6, duration: 22, type: 'rage' }
        },
        description: 'Gets stronger as damage increases'
    },
    ENGINEER: {
        id: 'engineer',
        name: 'Turret.io',
        color: 0x888800,
        accentColor: 0xffff00,
        speed: 240,
        weight: 1.1,
        jumpPower: 1.0,
        size: { width: 40, height: 58 },
        bodyType: 'mechanical',
        attackEffect: 'wrench_yellow',
        attacks: {
            normal: { damage: 10, knockback: 0.8, range: 45, startup: 4, duration: 13 },
            special: { damage: 18, knockback: 1.4, range: 250, startup: 15, duration: 35, type: 'turret' }
        },
        description: 'Deploys auto-turrets for zone control'
    },
    VAMPIRE: {
        id: 'vampire',
        name: 'Blood.dll',
        color: 0x880022,
        accentColor: 0xff0044,
        speed: 310,
        weight: 0.95,
        jumpPower: 1.3,
        size: { width: 36, height: 60 },
        bodyType: 'slim',
        attackEffect: 'drain_red',
        attacks: {
            normal: { damage: 10, knockback: 0.8, range: 44, startup: 3, duration: 11 },
            special: { damage: 18, knockback: 1.4, range: 80, startup: 8, duration: 22, type: 'drain' }
        },
        description: 'Steals health with each hit'
    },
    SCORPION: {
        id: 'scorpion',
        name: 'Stinger',
        color: 0xaaaa00,
        accentColor: 0x444400,
        speed: 290,
        weight: 1.15,
        jumpPower: 1.05,
        size: { width: 46, height: 54 },
        bodyType: 'mechanical',
        attackEffect: 'poison_yellow',
        attacks: {
            normal: { damage: 11, knockback: 0.9, range: 50, startup: 4, duration: 12 },
            special: { damage: 16, knockback: 1.3, range: 140, startup: 10, duration: 24, type: 'sting' }
        },
        description: 'Poison attacks deal damage over time'
    },
    TITAN: {
        id: 'titan',
        name: 'Colossus',
        color: 0x446688,
        accentColor: 0x88aacc,
        speed: 180,
        weight: 1.85,
        jumpPower: 0.65,
        size: { width: 58, height: 72 },
        bodyType: 'mechanical',
        attackEffect: 'stomp_blue',
        attacks: {
            normal: { damage: 19, knockback: 1.5, range: 64, startup: 10, duration: 24 },
            special: { damage: 36, knockback: 2.6, range: 95, startup: 22, duration: 48, type: 'titan' }
        },
        description: 'Ancient war machine with meteor strike'
    },

    // ===== ADDITIONAL CHARACTERS (10 more) =====
    ASSASSIN: {
        id: 'assassin',
        name: 'Silent Kill',
        color: 0x222222,
        accentColor: 0xff0000,
        speed: 360,
        weight: 0.75,
        jumpPower: 1.3,
        size: { width: 34, height: 58 },
        bodyType: 'slim',
        attackEffect: 'dagger_black',
        attacks: {
            normal: { damage: 12, knockback: 0.9, range: 40, startup: 2, duration: 8 },
            special: { damage: 24, knockback: 1.8, range: 90, startup: 5, duration: 15, type: 'backstab' }
        },
        description: 'Critical hits from behind deal double damage'
    },
    WIZARD: {
        id: 'wizard',
        name: 'Arcane.sys',
        color: 0x4444ff,
        accentColor: 0xffffaa,
        speed: 230,
        weight: 0.8,
        jumpPower: 1.1,
        size: { width: 36, height: 58 },
        bodyType: 'slim',
        attackEffect: 'arcane_blue',
        attacks: {
            normal: { damage: 8, knockback: 0.6, range: 70, startup: 6, duration: 16 },
            special: { damage: 26, knockback: 2.1, range: 300, startup: 18, duration: 42, type: 'meteor' }
        },
        description: 'Summons digital meteors from above'
    },
    RANGER: {
        id: 'ranger',
        name: 'Huntsman',
        color: 0x228844,
        accentColor: 0x88ff44,
        speed: 280,
        weight: 0.95,
        jumpPower: 1.15,
        size: { width: 38, height: 58 },
        bodyType: 'slim',
        attackEffect: 'arrow_green',
        attacks: {
            normal: { damage: 9, knockback: 0.7, range: 50, startup: 4, duration: 12 },
            special: { damage: 22, knockback: 1.6, range: 350, startup: 12, duration: 28, type: 'multishot' }
        },
        description: 'Rapid-fire arrows with multi-target attacks'
    },
    NECROMANCER: {
        id: 'necromancer',
        name: 'Death.code',
        color: 0x440088,
        accentColor: 0x00ff44,
        speed: 250,
        weight: 0.9,
        jumpPower: 1.05,
        size: { width: 38, height: 60 },
        bodyType: 'slim',
        attackEffect: 'skull_purple',
        attacks: {
            normal: { damage: 8, knockback: 0.65, range: 55, startup: 5, duration: 14 },
            special: { damage: 20, knockback: 1.5, range: 160, startup: 14, duration: 32, type: 'summon' }
        },
        description: 'Summons ghost minions to attack'
    },
    JUGGERNAUT: {
        id: 'juggernaut',
        name: 'Unstoppable',
        color: 0x884444,
        accentColor: 0xff8844,
        speed: 190,
        weight: 1.75,
        jumpPower: 0.7,
        size: { width: 54, height: 68 },
        bodyType: 'mechanical',
        attackEffect: 'charge_red',
        attacks: {
            normal: { damage: 17, knockback: 1.4, range: 58, startup: 8, duration: 20 },
            special: { damage: 32, knockback: 2.5, range: 140, startup: 16, duration: 38, type: 'charge' }
        },
        description: 'Charges through enemies with unstoppable force'
    },
    TRICKSTER: {
        id: 'trickster',
        name: 'Jester.exe',
        color: 0xff88ff,
        accentColor: 0xffff00,
        speed: 330,
        weight: 0.85,
        jumpPower: 1.35,
        size: { width: 36, height: 56 },
        bodyType: 'slim',
        attackEffect: 'trick_rainbow',
        attacks: {
            normal: { damage: 9, knockback: 0.7, range: 46, startup: 3, duration: 10 },
            special: { damage: 18, knockback: 1.5, range: 100, startup: 8, duration: 20, type: 'chaos' }
        },
        description: 'Unpredictable attacks with random effects'
    },
    MONK: {
        id: 'monk',
        name: 'Iron Palm',
        color: 0xff8800,
        accentColor: 0xffffaa,
        speed: 310,
        weight: 1.0,
        jumpPower: 1.2,
        size: { width: 38, height: 60 },
        bodyType: 'slim',
        attackEffect: 'chi_orange',
        attacks: {
            normal: { damage: 11, knockback: 1.0, range: 42, startup: 2, duration: 9 },
            special: { damage: 20, knockback: 1.8, range: 70, startup: 7, duration: 18, type: 'palm' }
        },
        description: 'Lightning-fast combos with chi blasts'
    },
    DRAGON: {
        id: 'dragon',
        name: 'Wyrm.ai',
        color: 0xff2200,
        accentColor: 0xffaa00,
        speed: 270,
        weight: 1.5,
        jumpPower: 1.6,
        size: { width: 52, height: 66 },
        bodyType: 'mechanical',
        attackEffect: 'flame_red',
        attacks: {
            normal: { damage: 15, knockback: 1.2, range: 54, startup: 5, duration: 14 },
            special: { damage: 28, knockback: 2.0, range: 220, startup: 12, duration: 30, type: 'breath' }
        },
        description: 'Flying dragon with devastating fire breath'
    },
    ALCHEMIST: {
        id: 'alchemist',
        name: 'Chem Lab',
        color: 0x44ff88,
        accentColor: 0xff44ff,
        speed: 260,
        weight: 0.95,
        jumpPower: 1.1,
        size: { width: 38, height: 58 },
        bodyType: 'slim',
        attackEffect: 'potion_green',
        attacks: {
            normal: { damage: 8, knockback: 0.7, range: 48, startup: 4, duration: 13 },
            special: { damage: 22, knockback: 1.7, range: 130, startup: 11, duration: 26, type: 'potion' }
        },
        description: 'Throws explosive chemical bombs'
    },
    SENTINEL: {
        id: 'sentinel',
        name: 'Guardian X',
        color: 0x0088ff,
        accentColor: 0x00ffff,
        speed: 220,
        weight: 1.55,
        jumpPower: 0.85,
        size: { width: 50, height: 66 },
        bodyType: 'mechanical',
        attackEffect: 'shield_cyan',
        attacks: {
            normal: { damage: 14, knockback: 1.2, range: 54, startup: 6, duration: 16 },
            special: { damage: 24, knockback: 1.9, range: 100, startup: 13, duration: 30, type: 'barrier' }
        },
        description: 'Creates protective barriers that reflect projectiles'
    },

    // ===== WAVE 3 CHARACTERS (10 more) =====
    REAPER: {
        id: 'reaper',
        name: 'Soul Harvest',
        color: 0x111111,
        accentColor: 0x00ff00,
        speed: 320,
        weight: 0.9,
        jumpPower: 1.25,
        size: { width: 40, height: 62 },
        bodyType: 'slim',
        attackEffect: 'scythe_black',
        attacks: {
            normal: { damage: 13, knockback: 1.1, range: 58, startup: 4, duration: 12 },
            special: { damage: 25, knockback: 2.0, range: 85, startup: 9, duration: 22, type: 'reap' }
        },
        description: 'Scythe swings that steal life force'
    },
    CHRONOMANCER: {
        id: 'chronomancer',
        name: 'Time Loop',
        color: 0x8844ff,
        accentColor: 0x44ffff,
        speed: 270,
        weight: 0.85,
        jumpPower: 1.15,
        size: { width: 36, height: 58 },
        bodyType: 'slim',
        attackEffect: 'time_purple',
        attacks: {
            normal: { damage: 7, knockback: 0.6, range: 50, startup: 5, duration: 14 },
            special: { damage: 19, knockback: 1.6, range: 180, startup: 15, duration: 35, type: 'slow' }
        },
        description: 'Slows opponents and reverses damage'
    },
    CRUSADER: {
        id: 'crusader',
        name: 'Holy Knight',
        color: 0xffdd00,
        accentColor: 0xffffff,
        speed: 250,
        weight: 1.4,
        jumpPower: 0.95,
        size: { width: 48, height: 64 },
        bodyType: 'mechanical',
        attackEffect: 'hammer_gold',
        attacks: {
            normal: { damage: 16, knockback: 1.3, range: 56, startup: 7, duration: 18 },
            special: { damage: 26, knockback: 2.1, range: 90, startup: 14, duration: 32, type: 'smite' }
        },
        description: 'Divine hammer strikes with AoE damage'
    },
    BANDIT: {
        id: 'bandit',
        name: 'Rogue Code',
        color: 0x664422,
        accentColor: 0xff8800,
        speed: 340,
        weight: 0.8,
        jumpPower: 1.3,
        size: { width: 36, height: 56 },
        bodyType: 'slim',
        attackEffect: 'dual_brown',
        attacks: {
            normal: { damage: 10, knockback: 0.8, range: 44, startup: 2, duration: 9 },
            special: { damage: 18, knockback: 1.4, range: 110, startup: 6, duration: 16, type: 'steal' }
        },
        description: 'Steals opponent abilities temporarily'
    },
    ELEMENTALIST: {
        id: 'elementalist',
        name: 'Prism',
        color: 0xff44ff,
        accentColor: 0x44ff44,
        speed: 260,
        weight: 0.9,
        jumpPower: 1.2,
        size: { width: 38, height: 58 },
        bodyType: 'slim',
        attackEffect: 'element_rainbow',
        attacks: {
            normal: { damage: 9, knockback: 0.7, range: 52, startup: 4, duration: 13 },
            special: { damage: 21, knockback: 1.7, range: 200, startup: 13, duration: 30, type: 'elements' }
        },
        description: 'Cycles through fire, ice, and lightning'
    },
    WARLORD: {
        id: 'warlord',
        name: 'Commander',
        color: 0x884422,
        accentColor: 0xff0000,
        speed: 240,
        weight: 1.6,
        jumpPower: 0.9,
        size: { width: 52, height: 66 },
        bodyType: 'mechanical',
        attackEffect: 'axe_red',
        attacks: {
            normal: { damage: 18, knockback: 1.5, range: 60, startup: 8, duration: 20 },
            special: { damage: 30, knockback: 2.3, range: 75, startup: 16, duration: 36, type: 'rally' }
        },
        description: 'Battle axe with empowering war cry'
    },
    CYBORG: {
        id: 'cyborg',
        name: 'Hybrid X',
        color: 0x666666,
        accentColor: 0xff4444,
        speed: 300,
        weight: 1.2,
        jumpPower: 1.1,
        size: { width: 42, height: 60 },
        bodyType: 'mechanical',
        attackEffect: 'cyber_gray',
        attacks: {
            normal: { damage: 12, knockback: 1.0, range: 50, startup: 4, duration: 12 },
            special: { damage: 22, knockback: 1.7, range: 160, startup: 10, duration: 24, type: 'upgrade' }
        },
        description: 'Upgrades weapons mid-battle for combo potential'
    },
    SHAMAN: {
        id: 'shaman',
        name: 'Spirit Walker',
        color: 0x448866,
        accentColor: 0xaaffaa,
        speed: 270,
        weight: 0.95,
        jumpPower: 1.15,
        size: { width: 38, height: 58 },
        bodyType: 'slim',
        attackEffect: 'spirit_green',
        attacks: {
            normal: { damage: 8, knockback: 0.7, range: 48, startup: 4, duration: 13 },
            special: { damage: 19, knockback: 1.5, range: 150, startup: 12, duration: 28, type: 'totem' }
        },
        description: 'Summons spirit totems for buffs and damage'
    },
    VANGUARD: {
        id: 'vanguard',
        name: 'Front Line',
        color: 0x224488,
        accentColor: 0x4488ff,
        speed: 230,
        weight: 1.5,
        jumpPower: 0.85,
        size: { width: 50, height: 64 },
        bodyType: 'mechanical',
        attackEffect: 'spear_blue',
        attacks: {
            normal: { damage: 15, knockback: 1.3, range: 62, startup: 6, duration: 16 },
            special: { damage: 24, knockback: 1.9, range: 120, startup: 12, duration: 28, type: 'thrust' }
        },
        description: 'Long-range spear with charging thrust'
    },
    WARLOCK: {
        id: 'warlock',
        name: 'Hex Master',
        color: 0x440044,
        accentColor: 0xff00ff,
        speed: 250,
        weight: 0.85,
        jumpPower: 1.1,
        size: { width: 36, height: 58 },
        bodyType: 'slim',
        attackEffect: 'curse_purple',
        attacks: {
            normal: { damage: 8, knockback: 0.65, range: 54, startup: 5, duration: 14 },
            special: { damage: 23, knockback: 1.8, range: 190, startup: 16, duration: 36, type: 'curse' }
        },
        description: 'Dark curses that debuff and weaken enemies'
    },

    // ===== WAVE 4 CHARACTERS (10 more) =====
    DUELIST: {
        id: 'duelist',
        name: 'Fencer',
        color: 0x4488aa,
        accentColor: 0xaaddff,
        speed: 330,
        weight: 0.9,
        jumpPower: 1.25,
        size: { width: 36, height: 60 },
        bodyType: 'slim',
        attackEffect: 'rapier_blue',
        attacks: {
            normal: { damage: 10, knockback: 0.8, range: 52, startup: 2, duration: 8 },
            special: { damage: 19, knockback: 1.5, range: 75, startup: 5, duration: 14, type: 'riposte' }
        },
        description: 'Perfect counter-attacks after blocking'
    },
    SUMMONER: {
        id: 'summoner',
        name: 'Conjurer',
        color: 0x8844aa,
        accentColor: 0xcc88ff,
        speed: 240,
        weight: 0.8,
        jumpPower: 1.05,
        size: { width: 36, height: 58 },
        bodyType: 'slim',
        attackEffect: 'summon_purple',
        attacks: {
            normal: { damage: 6, knockback: 0.5, range: 48, startup: 5, duration: 15 },
            special: { damage: 17, knockback: 1.4, range: 170, startup: 16, duration: 38, type: 'demon' }
        },
        description: 'Summons demon allies to fight alongside'
    },
    GUNSLINGER: {
        id: 'gunslinger',
        name: 'Quickdraw',
        color: 0xaa6633,
        accentColor: 0xffaa44,
        speed: 300,
        weight: 0.95,
        jumpPower: 1.15,
        size: { width: 38, height: 58 },
        bodyType: 'slim',
        attackEffect: 'revolver_orange',
        attacks: {
            normal: { damage: 8, knockback: 0.7, range: 45, startup: 3, duration: 10 },
            special: { damage: 20, knockback: 1.6, range: 280, startup: 9, duration: 20, type: 'sixshot' }
        },
        description: 'Rapid six-shooter with fan the hammer'
    },
    PLAGUE: {
        id: 'plague',
        name: 'Contagion',
        color: 0x448844,
        accentColor: 0x88ff44,
        speed: 270,
        weight: 1.0,
        jumpPower: 1.1,
        size: { width: 40, height: 60 },
        bodyType: 'slim',
        attackEffect: 'disease_green',
        attacks: {
            normal: { damage: 7, knockback: 0.6, range: 46, startup: 4, duration: 13 },
            special: { damage: 16, knockback: 1.3, range: 140, startup: 11, duration: 26, type: 'plague' }
        },
        description: 'Spreads infectious damage over time'
    },
    LANCER: {
        id: 'lancer',
        name: 'Pike Master',
        color: 0x6666aa,
        accentColor: 0x9999ff,
        speed: 260,
        weight: 1.25,
        jumpPower: 1.0,
        size: { width: 44, height: 62 },
        bodyType: 'mechanical',
        attackEffect: 'lance_purple',
        attacks: {
            normal: { damage: 14, knockback: 1.2, range: 65, startup: 6, duration: 15 },
            special: { damage: 23, knockback: 1.9, range: 130, startup: 11, duration: 26, type: 'joust' }
        },
        description: 'Charging lance attacks with huge range'
    },
    ARTIFICER: {
        id: 'artificer',
        name: 'Tech Mage',
        color: 0xff8844,
        accentColor: 0x44ffff,
        speed: 250,
        weight: 0.9,
        jumpPower: 1.1,
        size: { width: 38, height: 58 },
        bodyType: 'slim',
        attackEffect: 'construct_orange',
        attacks: {
            normal: { damage: 8, knockback: 0.7, range: 50, startup: 5, duration: 14 },
            special: { damage: 20, knockback: 1.6, range: 160, startup: 14, duration: 32, type: 'construct' }
        },
        description: 'Creates magical constructs and machines'
    },
    DESTROYER: {
        id: 'destroyer',
        name: 'Annihilator',
        color: 0xaa2222,
        accentColor: 0xff6666,
        speed: 200,
        weight: 1.7,
        jumpPower: 0.75,
        size: { width: 54, height: 68 },
        bodyType: 'mechanical',
        attackEffect: 'demolish_red',
        attacks: {
            normal: { damage: 19, knockback: 1.6, range: 60, startup: 9, duration: 22 },
            special: { damage: 34, knockback: 2.7, range: 110, startup: 20, duration: 44, type: 'demolish' }
        },
        description: 'Slow but absolutely devastating damage'
    },
    ILLUSIONIST: {
        id: 'illusionist',
        name: 'Mirage',
        color: 0xaa44ff,
        accentColor: 0xffffaa,
        speed: 340,
        weight: 0.75,
        jumpPower: 1.35,
        size: { width: 34, height: 56 },
        bodyType: 'slim',
        attackEffect: 'illusion_purple',
        attacks: {
            normal: { damage: 9, knockback: 0.7, range: 42, startup: 3, duration: 10 },
            special: { damage: 17, knockback: 1.4, range: 90, startup: 7, duration: 18, type: 'clone' }
        },
        description: 'Creates decoy clones to confuse enemies'
    },
    BARBARIAN: {
        id: 'barbarian',
        name: 'Savage',
        color: 0x996633,
        accentColor: 0xff9944,
        speed: 290,
        weight: 1.35,
        jumpPower: 1.05,
        size: { width: 48, height: 64 },
        bodyType: 'mechanical',
        attackEffect: 'cleave_brown',
        attacks: {
            normal: { damage: 17, knockback: 1.4, range: 54, startup: 5, duration: 14 },
            special: { damage: 27, knockback: 2.1, range: 70, startup: 10, duration: 24, type: 'whirlwind' }
        },
        description: 'Cleaving attacks that hit multiple times'
    },
    ASTRONAUT: {
        id: 'astronaut',
        name: 'Cosmonaut',
        color: 0xeeeeee,
        accentColor: 0x4444ff,
        speed: 210,
        weight: 0.5,
        jumpPower: 2.0,
        size: { width: 40, height: 60 },
        bodyType: 'mechanical',
        attackEffect: 'zero_g_white',
        attacks: {
            normal: { damage: 9, knockback: 1.2, range: 48, startup: 4, duration: 12 },
            special: { damage: 18, knockback: 2.0, range: 120, startup: 10, duration: 24, type: 'gravity' }
        },
        description: 'Extremely floaty with gravity manipulation'
    }
};

// Character list for menus
const CHARACTER_LIST = Object.values(CHARACTERS);
