const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Renderer to Main (one-way)
  onboardingComplete: (services) => ipcRenderer.send('onboarding-complete', services),
  setTheme: (theme) => ipcRenderer.send('set-theme', theme),
  updateStoreData: (data) => ipcRenderer.send('update-store-data', data),
  openSettingsWindow: () => ipcRenderer.send('open-settings-window'),
  closeSettingsWindow: () => ipcRenderer.send('close-settings-window'),
  settingsUpdated: (services) => ipcRenderer.send('settings-updated', services),
  showContextMenu: (webContentsId, params) => ipcRenderer.send('show-context-menu', webContentsId, params), // UPDATED

  // Renderer to Main (two-way)
  getStoreData: (key) => ipcRenderer.invoke('get-store-data', key),

  // Main to Renderer
  onReloadServices: (callback) => ipcRenderer.on('reload-services', callback)
});
