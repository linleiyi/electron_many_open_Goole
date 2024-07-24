const { app, BrowserWindow, Menu, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const https = require('https');

let mainWindow;

app.on('ready', () => {
    mainWindow = new BrowserWindow({
        webPreferences: {
            contextIsolation: false,
            enableRemoteModule: true,
            nodeIntegration: true,
            preload: path.join(__dirname, 'preload.js') // 预加载脚本
        }
    });

    mainWindow.loadURL('https://www.baidu.com/'); // 替换成你的远程网页地址


});



app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
