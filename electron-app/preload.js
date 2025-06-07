const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  minimize: () => ipcRenderer.send("window:minimize"),
  close: () => ipcRenderer.send("window:close"),
  // Listening for maximize/restore events from main process
  toggleMaximize: () => ipcRenderer.send("window-toggle-maximize"),
  onWindowMaximized: (callback) => ipcRenderer.on("window-maximized", callback),
  onWindowRestored: (callback) => ipcRenderer.on("window-restored", callback),
});
