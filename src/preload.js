// src/preload.js

const { contextBridge, ipcRenderer } = require('electron');

// Expose a secure API to the renderer process
contextBridge.exposeInMainWorld('electronAPI', {
    // Onboarding / Settings
    onboardingComplete: (services) => ipcRenderer.send('onboarding-complete', services),
    closeSettingsWindow: () => ipcRenderer.send('close-settings-window'),

    // Main App
    getInitialData: () => ipcRenderer.invoke('get-initial-data'),
    openSettings: () => ipcRenderer.send('open-settings'),
    setTheme: (theme) => ipcRenderer.send('set-theme', theme),
    setLayout: (layout) => ipcRenderer.send('set-layout', layout),

    // New in Iteration 7
    saveServiceOrder: (services) => ipcRenderer.send('save-service-order', services),
    showWebviewContextMenu: (webContentsId) => ipcRenderer.send('show-webview-context-menu', webContentsId),
});
