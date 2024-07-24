
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    login: (username, password) => ipcRenderer.send('login', username, password),
    navigate_to: (name, cookieStr) => ipcRenderer.send('navigate-to', name, cookieStr),
    copy_cookie: () => ipcRenderer.send('copy-cookie'),
    saveImage: (imageURL) => ipcRenderer.send('save-image', imageURL),
    edit_cookie: (old_name, newName, newcookie) => ipcRenderer.send('edit-cookie', old_name, newName, newcookie),
    delete_cookie: (cookieName) => ipcRenderer.send('delete-cookie', cookieName),
    on: (channel, listener) => ipcRenderer.on(channel, (event, ...args) => listener(...args)),
    exit: () => ipcRenderer.send('exit'),
});



