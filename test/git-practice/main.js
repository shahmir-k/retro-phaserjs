const { app, BrowserWindow, Menu } = require('electron');
const path = require('path');

function createWindow() {
    const win = new BrowserWindow({
        width: 1280,
        height: 720,
        minWidth: 900,
        minHeight: 600,
        title: 'RIVALS',
        icon: path.join(__dirname, 'icon.ico'),
        backgroundColor: '#0a0a1a',
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
        }
    });

    // Remove the default menu bar (cleaner game feel)
    Menu.setApplicationMenu(null);

    // Load the game
    win.loadFile('index.html');

    // Resize the canvas whenever the window is resized
    win.webContents.on('did-finish-load', () => {
        const [w, h] = win.getContentSize();
        win.webContents.executeJavaScript(`
            if (typeof canvas !== 'undefined' && canvas) {
                canvas.width = ${w};
                canvas.height = ${h};
            }
        `).catch(() => {});
    });
}

app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});
