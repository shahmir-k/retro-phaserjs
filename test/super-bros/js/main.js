// Global error handler to catch any uncaught errors
window.onerror = function(msg, url, lineNo, columnNo, error) {
    console.error('Game Error:', msg, 'at', url, lineNo, columnNo);
    document.getElementById('loading').textContent = 'Error: ' + msg;
    return false;
};

// Check if Phaser loaded
if (typeof Phaser === 'undefined') {
    console.error('Phaser failed to load!');
    document.getElementById('loading').textContent = 'Error: Phaser failed to load';
}

// Main Game Configuration and Initialization
const config = {
    type: Phaser.CANVAS,  // Force Canvas renderer instead of WebGL
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    parent: 'game-container',
    backgroundColor: '#2a2a4e',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    scene: [
        BootScene,
        MenuScene,
        CharacterSelectScene,
        StageSelectScene,
        GameScene,
        PauseScene,
        VictoryScene
    ],
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    render: {
        pixelArt: false,
        antialias: true,
        antialiasGL: true
    },
    audio: {
        disableWebAudio: false
    }
};

// Create game instance
const game = new Phaser.Game(config);

// Handle window focus/blur for pausing
window.addEventListener('blur', () => {
    if (game.scene.isActive('GameScene')) {
        const gameScene = game.scene.getScene('GameScene');
        if (gameScene && !gameScene.isPaused && !gameScene.gameOver) {
            gameScene.togglePause();
        }
    }
});

// Prevent default key behaviors
window.addEventListener('keydown', (e) => {
    // Prevent arrow keys and space from scrolling
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
    }
});

console.log('Super Bros loaded successfully!');
