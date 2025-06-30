const { app, BrowserWindow, ipcMain, Menu, shell, session } = require('electron');
const path = require('path');
const Store = require('electron-store');

// Initialize persistent storage
const store = new Store();

let mainWindow;
let onboardingWindow;
let authWindow; // Keep a reference to the auth window

// --- Main Window Creation ---
function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    show: false, // Don't show until ready
    webPreferences: {
      preload: path.join(__dirname, '../preload/preload.js'),
      webviewTag: true, // Enable <webview> tag
      nodeIntegration: false,
      contextIsolation: true,
    },
    titleBarStyle: 'hidden',
    titleBarOverlay: {
        color: '#202124',
        symbolColor: '#747474',
        height: 30
    }
  });

  mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));

  // --- FINAL: Google Auth Flow Handler ---
  mainWindow.webContents.on('did-attach-webview', (event, webContents) => {
    webContents.on('will-navigate', (event, url) => {
        const googleAuthUrlPattern = /accounts\.google\.com/;
        if (googleAuthUrlPattern.test(url)) {
            event.preventDefault();

            if (authWindow) {
                authWindow.focus();
                return;
            }

            authWindow = new BrowserWindow({
                width: 500,
                height: 650,
                parent: mainWindow,
                modal: false,
                show: true,
                webPreferences: {
                    nodeIntegration: false,
                    contextIsolation: true
                }
            });
            
            authWindow.loadURL(url);

            const originalServiceUrl = new URL(webContents.getURL());

            // Use 'will-redirect' to catch the redirect immediately after successful login
            authWindow.webContents.on('will-redirect', async (event, redirectUrl) => {
                const newUrlObj = new URL(redirectUrl);

                // **THE FIX**: If the redirect is going to any domain that is NOT google.com,
                // it means the auth flow is complete and we can proceed.
                if (!newUrlObj.hostname.endsWith('google.com')) {
                    const partition = webContents.session.getPartition();
                    const targetSession = session.fromPartition(partition);

                    const cookies = await authWindow.webContents.session.cookies.get({});
                    
                    for (const cookie of cookies) {
                        const newCookie = {
                            url: originalServiceUrl.origin,
                            name: cookie.name,
                            value: cookie.value,
                            domain: cookie.domain,
                            path: cookie.path,
                            secure: cookie.secure,
                            httpOnly: cookie.httpOnly,
                            expirationDate: cookie.expirationDate
                        };
                        await targetSession.cookies.set(newCookie);
                    }

                    if (authWindow) {
                        authWindow.close();
                    }
                    
                    webContents.reload();
                }
            });

            authWindow.on('closed', () => {
                authWindow = null; // Clean up reference
            });
        }
    });
  });


  // Open external links in the default browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// --- Onboarding Window Creation ---
function createOnboardingWindow() {
    onboardingWindow = new BrowserWindow({
        width: 800,
        height: 650,
        resizable: false,
        frame: false,
        modal: true,
        parent: mainWindow,
        webPreferences: {
            preload: path.join(__dirname, '../preload/preload.js'),
            nodeIntegration: false,
            contextIsolation: true,
        }
    });

    onboardingWindow.loadFile(path.join(__dirname, '../renderer/onboarding.html'));

    onboardingWindow.on('closed', () => {
        onboardingWindow = null;
    });
}

// --- App Lifecycle ---
app.whenReady().then(() => {
  createMainWindow();

  // Check if onboarding is complete
  if (!store.get('onboardingComplete')) {
      createOnboardingWindow();
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});


// --- IPC Handlers ---
ipcMain.on('onboarding-complete', (event, selectedServices) => {
    store.set('onboardingComplete', true);
    store.set('selectedServices', selectedServices);
    if (onboardingWindow) {
        onboardingWindow.close();
    }
    if (mainWindow) {
        mainWindow.webContents.send('reload-services');
    }
});

ipcMain.handle('get-store-data', (event, key) => {
    return store.get(key);
});

ipcMain.on('update-store-data', (event, { key, value }) => {
    store.set(key, value);
});

ipcMain.on('set-theme', (event, theme) => {
    store.set('theme', theme);
});
