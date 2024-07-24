
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    on: (channel, listener) => ipcRenderer.on(channel, (event, ...args) => listener(...args)),
    exit: () => ipcRenderer.send('exit'),
});



