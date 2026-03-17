// Game Constants
const GAME_WIDTH = 1200;
const GAME_HEIGHT = 700;

// Physics
const GRAVITY = 1200;
const PLAYER_SPEED = 300;
const JUMP_VELOCITY = -500;
const DOUBLE_JUMP_VELOCITY = -450;
const AIR_CONTROL = 0.7;
const GROUND_FRICTION = 0.85;

// Combat
const BASE_KNOCKBACK = 200;
const KNOCKBACK_GROWTH = 0.05;
const HITSTUN_BASE = 200;
const HITSTUN_GROWTH = 5;
const ATTACK_COOLDOWN = 300;
const SPECIAL_COOLDOWN = 800;

// Game Rules
const STARTING_STOCKS = 3;
const BLAST_ZONE_PADDING = 200;
const RESPAWN_INVINCIBILITY = 2000;
const RESPAWN_TIME = 1500;

// AI Difficulty Settings
const AI_DIFFICULTY = {
    EASY: {
        reactionTime: 500,
        accuracy: 0.4,
        aggressiveness: 0.3,
        recoverySkill: 0.5,
        comboAbility: 0.2
    },
    MEDIUM: {
        reactionTime: 250,
        accuracy: 0.7,
        aggressiveness: 0.5,
        recoverySkill: 0.75,
        comboAbility: 0.5
    },
    HARD: {
        reactionTime: 100,
        accuracy: 0.9,
        aggressiveness: 0.7,
        recoverySkill: 0.95,
        comboAbility: 0.8
    }
};

// Colors
const COLORS = {
    PRIMARY: 0xe94560,
    SECONDARY: 0x16213e,
    ACCENT: 0x0f3460,
    TEXT: 0xffffff,
    DAMAGE_LOW: 0x00ff00,
    DAMAGE_MED: 0xffff00,
    DAMAGE_HIGH: 0xff0000
};
