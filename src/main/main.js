const { app, BrowserWindow, ipcMain, Menu, shell, session, webContents, dialog, clipboard } = require('electron');
const path = require('path');
const Store = require('electron-store');
const express = require('express');
const axios = require('axios');
const url = require('url');
const fs = require('fs');

// --- Securely Load Google OAuth Credentials ---
let GOOGLE_CLIENT_ID;
let GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = 'http://localhost:3000/callback';

try {
    const configPath = path.join(app.getAppPath(), 'config.json');
    if (fs.existsSync(configPath)) {
        const config = require(configPath);
        GOOGLE_CLIENT_ID = config.GOOGLE_CLIENT_ID;
        GOOGLE_CLIENT_SECRET = config.GOOGLE_CLIENT_SECRET;
    } else {
        throw new Error('config.json not found');
    }
    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || GOOGLE_CLIENT_ID.includes('HERE')) {
        throw new Error('Google credentials are not set in config.json');
    }
} catch (error) {
    dialog.showErrorBox(
        'Configuration Error',
        `Could not load Google credentials. Please ensure 'config.json' exists and is correctly formatted. See README.md for setup instructions.\n\nError: ${error.message}`
    );
    app.quit();
}

const store = new Store();
console.log('App config file located at:', store.path);

let mainWindow;
let settingsWindow;
let server;

// --- Main Window Creation ---
function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, '../preload/preload.js'),
      webviewTag: true,
      nodeIntegration: false,
      contextIsolation: true,
    },
    titleBarStyle: 'hidden',
    titleBarOverlay: { color: '#202124', symbolColor: '#747474', height: 30 }
  });

  mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));

  // --- Universal Google Auth & Link Handling ---
  mainWindow.webContents.on('did-attach-webview', (event, attachedWebContents) => {
    // Handle popups (like third-party auth)
    attachedWebContents.setWindowOpenHandler(({ url }) => {
      const googleAuthUrlPattern = /accounts\.google\.com/;
      if (googleAuthUrlPattern.test(url)) {
        handleGoogleLogin(attachedWebContents);
        return { action: 'deny' };
      }
      shell.openExternal(url);
      return { action: 'deny' };
    });

    // Handle in-page link clicks
    attachedWebContents.on('will-navigate', (event, navigationUrl) => {
        const currentUrl = new URL(attachedWebContents.getURL());
        const navigationTargetUrl = new URL(navigationUrl);

        // If navigating away from the service's domain, open externally
        if (navigationTargetUrl.hostname !== currentUrl.hostname) {
            event.preventDefault();
            shell.openExternal(navigationUrl);
        }
    });
  });

  mainWindow.once('ready-to-show', () => mainWindow.show());
  mainWindow.on('closed', () => { mainWindow = null; });
}

// --- Settings Window Creation ---
function createSettingsWindow() {
    if (settingsWindow) {
        settingsWindow.focus();
        return;
    }
    settingsWindow = new BrowserWindow({
        width: 600, height: 500, parent: mainWindow, modal: true, show: true,
        resizable: false, frame: false,
        webPreferences: {
            preload: path.join(__dirname, '../preload/preload.js'),
            nodeIntegration: false, contextIsolation: true,
        }
    });
    settingsWindow.loadFile(path.join(__dirname, '../renderer/settings.html'));
    settingsWindow.on('closed', () => { settingsWindow = null; });
}

// --- Google OAuth 2.0 Loopback Flow ---
function handleGoogleLogin(targetWebContents) {
  if (server && server.listening) return;
  
  const expressApp = express();

  const authUrl = new url.URL('https://accounts.google.com/o/oauth2/v2/auth');
  authUrl.searchParams.set('client_id', GOOGLE_CLIENT_ID);
  authUrl.searchParams.set('redirect_uri', REDIRECT_URI);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('scope', 'https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile');
  authUrl.searchParams.set('access_type', 'offline');
  authUrl.searchParams.set('prompt', 'consent');

  server = expressApp.listen(3000, () => {
    shell.openExternal(authUrl.toString());
  });

  expressApp.get('/callback', async (req, res) => {
    try {
      const authorizationCode = req.query.code;
      if (!authorizationCode) throw new Error('Authorization code not found');

      const tokenResponse = await axios.post('https://oauth2.googleapis.com/token', {
        client_id: GOOGLE_CLIENT_ID, client_secret: GOOGLE_CLIENT_SECRET,
        code: authorizationCode, grant_type: 'authorization_code', redirect_uri: REDIRECT_URI,
      });

      await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { Authorization: `Bearer ${tokenResponse.data.access_token}` }
      });

      res.send('<h1>Authentication successful!</h1><p>You can now close this window.</p>');
      targetWebContents.reload();
    } catch (error) {
      console.error('Error during Google OAuth token exchange:', error.response ? error.response.data : error.message);
      res.status(500).send('Authentication failed. Please try again.');
    } finally {
      if (server) {
        server.close(() => { server = null; });
      }
    }
  });
}

// --- App Lifecycle ---
app.whenReady().then(() => {
  createMainWindow();
  if (!store.get('onboardingComplete')) createOnboardingWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
  });
});
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// --- IPC Handlers ---
ipcMain.on('onboarding-complete', (event, selectedServices) => {
    store.set('onboardingComplete', true);
    store.set('selectedServices', selectedServices);
    BrowserWindow.fromWebContents(event.sender).close();
    if (mainWindow) mainWindow.webContents.send('reload-services');
});
ipcMain.handle('get-store-data', (event, key) => store.get(key));
ipcMain.on('update-store-data', (event, { key, value }) => store.set(key, value));
ipcMain.on('set-theme', (event, theme) => store.set('theme', theme));
ipcMain.on('open-settings-window', createSettingsWindow);
ipcMain.on('close-settings-window', () => { if (settingsWindow) settingsWindow.close(); });
ipcMain.on('settings-updated', (event, selectedServices) => {
    store.set('selectedServices', selectedServices);
    if (mainWindow) mainWindow.webContents.send('reload-services');
});

// UPDATED: Context Menu Handler
ipcMain.on('show-context-menu', (event, webContentsId, params) => {
    const targetWebContents = webContents.fromId(webContentsId);
    if (targetWebContents) {
        const template = [];

        if (params.linkURL) {
            template.push({ label: 'Copy Link Address', click: () => clipboard.writeText(params.linkURL) });
            template.push({ type: 'separator' });
        }

        template.push(
            { label: 'Go Back', enabled: targetWebContents.canGoBack(), click: () => targetWebContents.goBack() },
            { label: 'Go Forward', enabled: targetWebContents.canGoForward(), click: () => targetWebContents.goForward() },
            { label: 'Reload', click: () => targetWebContents.reload() },
            { type: 'separator' },
            { label: 'Inspect Element', click: () => targetWebContents.openDevTools() }
        );

        const contextMenu = Menu.buildFromTemplate(template);
        contextMenu.popup(BrowserWindow.fromWebContents(event.sender));
    }
});