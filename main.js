// main.js

const { app, BrowserWindow, ipcMain, shell, protocol, Menu, webContents, session } = require('electron');
const path = require('path');
const Store = require('electron-store');

// Initialize electron-store
const store = new Store();

let mainWindow;
let settingsWindow;
let authWindow;

const GEMINI_PARTITION = 'persist:gemini';
const GEMINI_USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.6367.118 Safari/537.36';
const GEMINI_ACCEPT_LANGUAGE = 'en-US,en;q=0.9';
const GEMINI_SEC_CH_HEADERS = {
    'sec-ch-ua': '"Not A(Brand";v="99", "Chromium";v="124", "Google Chrome";v="124"',
    'sec-ch-ua-full-version-list': '"Not A(Brand";v="99.0.0.0", "Chromium";v="124.0.6367.118", "Google Chrome";v="124.0.6367.118"',
    'sec-ch-ua-full-version': '"124.0.6367.118"',
    'sec-ch-ua-mobile': '?0',
    'sec-ch-ua-platform': '"macOS"',
    'sec-ch-ua-platform-version': '"14.4.1"',
    'sec-ch-ua-arch': '"x86"',
    'sec-ch-ua-bitness': '"64"',
    'sec-ch-ua-form-factors': '"Desktop"',
    'sec-ch-ua-model': '""',
    'sec-ch-ua-reduced': '"Chromium";v="124"'
};

const SERVICE_MANIFEST = Object.freeze({
    gemini: {
        id: 'gemini',
        name: 'Gemini',
        url: 'https://gemini.google.com/',
        logo: 'asset://logos/gemini.svg',
        allowedHosts: ['gemini.google.com', 'accounts.google.com']
    },
    chatgpt: {
        id: 'chatgpt',
        name: 'ChatGPT',
        url: 'https://chat.openai.com/',
        logo: 'asset://logos/openai.svg',
        allowedHosts: ['chat.openai.com', 'auth.openai.com', 'login.openai.com']
    },
    claude: {
        id: 'claude',
        name: 'Claude',
        url: 'https://claude.ai/',
        logo: 'asset://logos/claude.svg',
        allowedHosts: ['claude.ai', 'account.anthropic.com']
    },
    notebooklm: {
        id: 'notebooklm',
        name: 'NotebookLM',
        url: 'https://notebooklm.google.com/',
        logo: 'asset://logos/notebook-lm.svg',
        allowedHosts: ['notebooklm.google.com', 'accounts.google.com']
    },
    perplexity: {
        id: 'perplexity',
        name: 'Perplexity',
        url: 'https://www.perplexity.ai/',
        logo: 'asset://logos/perplexity.svg',
        allowedHosts: ['www.perplexity.ai']
    },
    metaai: {
        id: 'metaai',
        name: 'Meta AI',
        url: 'https://www.meta.ai/',
        logo: 'asset://logos/meta-ai.svg',
        allowedHosts: ['www.meta.ai']
    }
});

const DEFAULT_SIDEBAR_WIDTH = 96;

function sanitizeServices(rawServices = []) {
    const uniqueIds = new Set();
    const sanitized = [];

    rawServices.forEach((service) => {
        if (!service || typeof service.id !== 'string') return;
        const manifestEntry = SERVICE_MANIFEST[service.id];
        if (!manifestEntry || uniqueIds.has(manifestEntry.id)) return;
        sanitized.push(manifestEntry);
        uniqueIds.add(manifestEntry.id);
    });

    return sanitized;
}

function getAllowedHostsForSelectedServices() {
    const selectedServices = sanitizeServices(store.get('selectedServices', []));
    const hosts = new Set([
        'accounts.google.com',
    ]);

    selectedServices.forEach((service) => {
        service.allowedHosts.forEach((host) => hosts.add(host));
    });

    return hosts;
}

/*
function configureGeminiSession() {
    if (configureGeminiSession.hasConfigured) {
        return;
    }
    configureGeminiSession.hasConfigured = true;

    const geminiSession = session.fromPartition(GEMINI_PARTITION);
    geminiSession.setUserAgent(GEMINI_USER_AGENT, GEMINI_ACCEPT_LANGUAGE);

    const preloads = geminiSession.getPreloads();
    const geminiPreloadPath = path.join(__dirname, 'src/preloads/gemini-preload.js');
    if (!preloads.includes(geminiPreloadPath)) {
        geminiSession.setPreloads([...preloads, geminiPreloadPath]);
    }

    const requestFilter = {
        urls: [
            'https://*.google.com/*',
            'https://*.googleusercontent.com/*',
            'https://*.gstatic.com/*',
            'https://*.withgoogle.com/*',
            'https://*.googleapis.com/*',
            'https://accounts.google.com/*'
        ]
    };

    geminiSession.webRequest.onBeforeSendHeaders(requestFilter, (details, callback) => {
        const requestHeaders = { ...details.requestHeaders };

        requestHeaders['User-Agent'] = GEMINI_USER_AGENT;
        requestHeaders['Accept-Language'] = GEMINI_ACCEPT_LANGUAGE;

        for (const [header, value] of Object.entries(GEMINI_SEC_CH_HEADERS)) {
            requestHeaders[header] = value;
        }

        callback({ cancel: false, requestHeaders });
    });
}
*/

app.whenReady().then(() => {
    protocol.registerFileProtocol('asset', (request, callback) => {
        const url = request.url.replace('asset://', '');
        const filePath = path.join(__dirname, 'src', 'assets', url);
        callback({ path: filePath });
    });

    // configureGeminiSession();
    createMainWindow();
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
            contextIsolation: true,
            sandbox: true,
            webviewTag: true,
        },
        show: false,
    });

    mainWindow.loadFile(path.join(__dirname, 'src', entryFile));

    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
    });

    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        try {
            const parsedUrl = new URL(url);
            const allowedHosts = getAllowedHostsForSelectedServices();

            if (allowedHosts.has(parsedUrl.hostname)) {
                return {
                    action: 'allow',
                    overrideBrowserWindowOptions: {
                        parent: mainWindow,
                        modal: true,
                        show: true,
                        width: 520,
                        height: 640,
                        webPreferences: {
                            sandbox: true,
                            contextIsolation: true,
                            nodeIntegration: false
                        }
                    }
                };
            }

            if (parsedUrl.protocol === 'https:') {
                shell.openExternal(url);
            }
        } catch (error) {
            // fall through to deny
        }

        return { action: 'deny' };
    });

    mainWindow.on('closed', () => { mainWindow = null; });
}

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createMainWindow(); });

// --- IPC Handlers ---
ipcMain.on('onboarding-complete', (event, services) => {
    const sanitizedServices = sanitizeServices(services);
    store.set('selectedServices', sanitizedServices);
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
    settingsWindow = new BrowserWindow({ width: 800, height: 650, parent: mainWindow, modal: true, show: false, frame: false, transparent: true, webPreferences: { preload: path.join(__dirname, 'src/preload.js'), contextIsolation: true, sandbox: true } });
    settingsWindow.loadFile(path.join(__dirname, 'src/onboarding.html'));
    settingsWindow.once('ready-to-show', () => settingsWindow.show());
    settingsWindow.on('closed', () => { settingsWindow = null; });
});

ipcMain.on('close-settings-window', () => { if (settingsWindow) settingsWindow.close(); });

ipcMain.handle('get-initial-data', () => {
    const services = sanitizeServices(store.get('selectedServices', []));
    const allowedIds = new Set(services.map((service) => service.id));
    const lastActiveServiceId = store.get('lastActiveServiceId', null);

    return {
        services,
        theme: store.get('theme', 'light') === 'dark' ? 'dark' : 'light',
        layout: store.get('layout', 'top') === 'side' ? 'side' : 'top',
        sidebarWidth: Math.max(72, Number(store.get('sidebarWidth', DEFAULT_SIDEBAR_WIDTH)) || DEFAULT_SIDEBAR_WIDTH),
        lastActiveServiceId: allowedIds.has(lastActiveServiceId) ? lastActiveServiceId : null,
        availableServices: Object.values(SERVICE_MANIFEST)
    };
});

ipcMain.on('set-theme', (event, theme) => {
    if (theme === 'dark' || theme === 'light') {
        store.set('theme', theme);
    }
});
ipcMain.handle('clear-service-storage', async (event, serviceId) => {
    if (typeof serviceId !== 'string' || serviceId.trim().length === 0 || !SERVICE_MANIFEST[serviceId]) {
        return { success: false, error: 'Invalid service id' };
    }

    const partitionName = `persist:${serviceId}`;
    const targetSession = session.fromPartition(partitionName);

    try {
        await Promise.all([
            targetSession.clearStorageData(),
            targetSession.clearCache()
        ]);
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message || String(error) };
    }
});

ipcMain.on('set-layout', (event, layout) => {
    if (layout === 'top' || layout === 'side') {
        store.set('layout', layout);
    }
});

// --- New IPC Handlers for Iteration 7 ---

// Persist the new order of services after drag-and-drop
ipcMain.on('save-service-order', (event, services) => {
    const sanitizedServices = sanitizeServices(services);
    if (sanitizedServices.length > 0) {
        store.set('selectedServices', sanitizedServices);
    }
});

ipcMain.on('set-active-service', (event, serviceId) => {
    const sanitizedId = typeof serviceId === 'string' ? serviceId : '';
    const allowedIds = new Set(sanitizeServices(store.get('selectedServices', [])).map((service) => service.id));
    if (sanitizedId && allowedIds.has(sanitizedId)) {
        store.set('lastActiveServiceId', sanitizedId);
    }
});

ipcMain.on('set-sidebar-width', (event, width) => {
    const numericWidth = Number(width);
    if (!Number.isFinite(numericWidth)) return;
    const clampedWidth = Math.max(72, Math.min(numericWidth, 500));
    store.set('sidebarWidth', clampedWidth);
});

// Create and show a context menu for a webview
ipcMain.on('show-webview-context-menu', (event, webContentsId) => {
    const webviewContents = webContents.fromId(webContentsId);
    if (!webviewContents) return;

    const contextMenu = Menu.buildFromTemplate([
        { label: 'Back', click: () => { if (webviewContents.canGoBack()) webviewContents.goBack(); }, enabled: webviewContents.canGoBack() },
        { label: 'Forward', click: () => { if (webviewContents.canGoForward()) webviewContents.goForward(); }, enabled: webviewContents.canGoForward() },
        { label: 'Reload', click: () => webviewContents.reload() },
        { label: 'Open in Browser', click: () => { const targetUrl = webviewContents.getURL(); if (targetUrl) { shell.openExternal(targetUrl); } } },
        { type: 'separator' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectAll' },
        { type: 'separator' },
        { label: 'Inspect Element', click: () => webviewContents.openDevTools() }
    ]);
    contextMenu.popup(BrowserWindow.fromWebContents(event.sender));
});
