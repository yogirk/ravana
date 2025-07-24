// main.js

const { app, BrowserWindow, ipcMain, shell, protocol, Menu, webContents } = require('electron');
const path = require('path');
const Store = require('electron-store');

// Initialize electron-store
const store = new Store();

let mainWindow;
let settingsWindow;
let authWindow;

app.whenReady().then(() => {
    protocol.registerFileProtocol('asset', (request, callback) => {
        const url = request.url.replace('asset://', '');
        const filePath = path.join(__dirname, 'src', 'assets', url);
        callback({ path: filePath });
    });
});

function createMainWindow() {
    const isOnboardingComplete = store.get('onboardingComplete', false);
    const entryFile = isOnboardingComplete ? 'app.html' : 'onboarding.html';

    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        minWidth: 800,
        minHeight: 600,
        webPreferences: {
            preload: path.join(__dirname, 'src/preload.js'),
            webviewTag: true,
        },
        show: false,
    });

    mainWindow.loadFile(path.join(__dirname, 'src', entryFile));
    
    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
    });

    mainWindow.webContents.on('new-window', (event, url, frameName, disposition, options) => {
        event.preventDefault();
        if (frameName === 'modal' || disposition === 'new-window') {
            authWindow = new BrowserWindow({ width: 500, height: 600, parent: mainWindow, modal: true, show: false });
            authWindow.loadURL(url);
            authWindow.once('ready-to-show', () => authWindow.show());
            authWindow.on('closed', () => { authWindow = null; });
        } else {
            shell.openExternal(url);
        }
    });

    mainWindow.on('closed', () => { mainWindow = null; });
}

app.on('ready', createMainWindow);
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createMainWindow(); });

// --- IPC Handlers ---
ipcMain.on('onboarding-complete', (event, services) => {
    store.set('selectedServices', services);
    store.set('onboardingComplete', true);
    if (settingsWindow) {
        settingsWindow.close();
        mainWindow.loadFile(path.join(__dirname, 'src/app.html'));
    } else {
        mainWindow.loadFile(path.join(__dirname, 'src/app.html'));
    }
});

ipcMain.on('open-settings', () => {
    if (settingsWindow) { settingsWindow.focus(); return; }
    settingsWindow = new BrowserWindow({ width: 800, height: 650, parent: mainWindow, modal: true, show: false, frame: false, transparent: true, webPreferences: { preload: path.join(__dirname, 'src/preload.js') } });
    settingsWindow.loadFile(path.join(__dirname, 'src/onboarding.html'));
    settingsWindow.once('ready-to-show', () => settingsWindow.show());
    settingsWindow.on('closed', () => { settingsWindow = null; });
});

ipcMain.on('close-settings-window', () => { if (settingsWindow) settingsWindow.close(); });

ipcMain.handle('get-initial-data', () => ({
    services: store.get('selectedServices', []),
    theme: store.get('theme', 'light'),
    layout: store.get('layout', 'top'),
}));

ipcMain.on('set-theme', (event, theme) => store.set('theme', theme));
ipcMain.on('set-layout', (event, layout) => store.set('layout', layout));

// --- New IPC Handlers for Iteration 7 ---

// Persist the new order of services after drag-and-drop
ipcMain.on('save-service-order', (event, services) => {
    store.set('selectedServices', services);
});

// Create and show a context menu for a webview
ipcMain.on('show-webview-context-menu', (event, webContentsId) => {
    const webviewContents = webContents.fromId(webContentsId);
    if (!webviewContents) return;

    const contextMenu = Menu.buildFromTemplate([
        { label: 'Back', click: () => { if (webviewContents.canGoBack()) webviewContents.goBack(); }, enabled: webviewContents.canGoBack() },
        { label: 'Forward', click: () => { if (webviewContents.canGoForward()) webviewContents.goForward(); }, enabled: webviewContents.canGoForward() },
        { label: 'Reload', click: () => webviewContents.reload() },
        { type: 'separator' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectAll' },
        { type: 'separator' },
        { label: 'Inspect Element', click: () => webviewContents.openDevTools() }
    ]);
    contextMenu.popup(BrowserWindow.fromWebContents(event.sender));
});
