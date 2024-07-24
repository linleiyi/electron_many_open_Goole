const { app, BrowserWindow, BrowserView, ipcMain, session, clipboard, globalShortcut, dialog, Menu, MenuItem, screen } = require('electron');
const path = require('path');
const { MongoClient } = require('mongodb');

let mainWindow;
let cookiesMap = {}; // 存储全局的 cookies
let deleteCookies = {}
let views = {}; // 存储所有的 contentView
let globalUsername;
let nowView;
let nowViewName;
let queue = [];
let heightwucha = 46
let widthwucha = 230

const url = 'mongodb://192.168.2.222:27017';
const defaultUrl = 'https://e.waimai.meituan.com/';
const stopurl = 'http://example.com'


function createWindow() {

    function set_cookie(viewName) {
        try {
            // console.log("viewName", viewName);
            // console.log("cookiesMap[viewName]", cookiesMap[viewName]);
            // console.log("cookiesMap", cookiesMap);
            const cookie = cookiesMap[viewName];
            const cookies = cookie.split('; ').map(cookie => cookie.split('='));
            // console.log("url", viewurl);
            // 设置每个 Cookie
            cookies.forEach(([name, value]) => {
                views[viewName].webContents.session.cookies.set({
                    url: defaultUrl, // 替换为你的网站地址
                    name: name,
                    value: value,
                }, (error) => {
                    if (error) {
                        console.error('Failed to set cookie:', error);
                    }
                });
            });
        } catch (e) {
            console.log(viewName);
            console.log(e);
        }
    }

    function push_queue(viewName) {
        console.log('push_queue', viewName);
        if (queue.length > 4) {
            let firstElement = queue.shift();
            set_cookie(viewName);
            // views[firstElement].webContents.loadURL(stopurl);
            // views[viewName].webContents.loadURL(defaultUrl);
            views[firstElement].webContents.stop()
            views[viewName].webContents.reload();

            // views[viewName].webContents.loadURL(defaultUrl);

        } else {
            queue.push(viewName);
            set_cookie(viewName);
            views[viewName].webContents.loadURL(defaultUrl);

        }

    }
    // 获取主屏幕的工作区尺寸
    const display = screen.getPrimaryDisplay();
    const { width, height } = display.workAreaSize;

    // 创建设置主窗口
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            enableRemoteModule: false,
            nodeIntegration: false,
            sandbox: true
        }
    });

    // 监听最大化事件
    mainWindow.on('maximize', () => {
        // 在这里处理全屏的逻辑
        console.log('Window is maximized');
    });

    // 监听取消最大化事件
    mainWindow.on('unmaximize', () => {
        console.log('Window is unmaximized/restored');
        // 在这里处理退出全屏的逻辑
    });

    //结束主窗口

    // 菜单栏设置
    const template = [
        {
            label: "操作",
            submenu: [
                { label: "查看差评", click: badview },
                { type: "separator" },
                { label: "退出", click: () => { app.quit(); } }
            ]

        }
    ]
    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
    // 结束菜单栏设置

    // 创建导航栏的 BrowserView
    let navView = new BrowserView({
        webPreferences: {
            // preload: path.join(__dirname, 'navPreload.js'),
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            enableRemoteModule: false,
            nodeIntegration: false,
            sandbox: true
        }
    });

    // navView.webContents.openDevTools()
    mainWindow.setBrowserView(navView);
    navView.setBounds({ x: 0, y: 0, width: 200, height: mainWindow.getBounds().height - heightwucha });
    navView.setAutoResize({ "vertical": true });
    navView.webContents.loadFile('nav.html');
    // 结束导航栏
    // 监听主窗口的 resize 事件
    mainWindow.on('resize', () => {
        const { width, height } = mainWindow.getBounds();
        navView.setBounds({ x: 0, y: 0, width: 200, height: height });
        if (nowView !== undefined && nowView !== null) {
            nowView.setBounds({ x: 200, y: 0, width: width - 200, height: height });
        }

        // Object.values(views).forEach(view => {

        // });
    });

    // 创建登录窗口
    let loginWindow = new BrowserView({
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            enableRemoteModule: false,
            nodeIntegration: false,
            sandbox: true
        }
    })

    mainWindow.addBrowserView(loginWindow);
    loginWindow.setBounds({ x: 200, y: 0, width: mainWindow.getBounds().width - widthwucha, height: mainWindow.getBounds().height - heightwucha });
    loginWindow.setAutoResize({ "horizontal": true, "vertical": true });
    loginWindow.webContents.loadFile('login.html');
    // loginWindow.webContents.openDevTools();
    // 结束登录窗口


    function addView(cookieName, cookie) {
        // console.log(cookieName);
        let newSession = session.fromPartition(`persist:${cookieName}`);
        let contentView = new BrowserView({
            webPreferences: {
                preload: path.join(__dirname, 'preload.js'),
                contextIsolation: true,
                enableRemoteModule: false,
                nodeIntegration: false,
                sandbox: true,
                session: newSession
            }
        });
        views[cookieName] = contentView;
        mainWindow.addBrowserView(contentView);
        contentView.setBounds({ x: 200, y: 0, width: mainWindow.getBounds().width - widthwucha, height: mainWindow.getBounds().height - heightwucha - 30 });
        // contentView.setAutoResize({ "vertical": true });
        contentView.webContents.loadURL(defaultUrl);
        contentView.webContents.setAudioMuted(true);


        contentView.webContents.on('context-menu', (event, params) => {
            const hasImage = params.mediaType === 'image';
            const menu = Menu.buildFromTemplate([
                {
                    label: '后退',
                    enabled: contentView.webContents.canGoBack(),
                    click: () => { contentView.webContents.goBack(); }
                },
                {
                    label: '前进',
                    enabled: contentView.webContents.canGoForward(),
                    click: () => { contentView.webContents.goForward(); }
                },
                {
                    label: '重新加载',
                    click: () => { contentView.webContents.reload(); }
                },
                {
                    type: 'separator'
                },
                {
                    label: '打开图片',
                    visible: hasImage,
                    click: () => {
                        const imageURL = params.srcURL;
                        const imageWindow = new BrowserWindow({
                            webPreferences: {
                                contextIsolation: true,
                                enableRemoteModule: false,
                                nodeIntegration: true,
                                preload: path.join(__dirname, 'preload.js')
                            }
                        });
                        imageWindow.loadURL(`data:text/html,
                <html>
                <body>
                  <img id="image" src="${imageURL}" style="width:100%">
                  <button onclick="saveImage('${imageURL}')">save img</button>
                </body>
                <script>
                  function saveImage(url) {
                    window.electronAPI.saveImage(url);
                  }
                </script>
                </html>`);
                    }
                },
                {
                    type: 'separator'
                },
                {
                    label: '复制',
                    role: 'copy'
                },
                {
                    label: '粘贴',
                    role: 'paste'
                },
                {
                    label: '检查元素',
                    click: () => { contentView.webContents.inspectElement(params.x, params.y); }
                }
            ]);

            menu.popup(contentView);
        });

        // ipcRenderer.send('view-added', cookieName);
        return 1

        // contentView.webContents.loadURL(defaultUrl);
    }
    // 处理导航事件
    ipcMain.on('navigate-to', (event, cookieName, cookie) => {
        console.log('navigate-to', queue, cookieName);
        if (globalUsername === undefined || globalUsername === null) {
            // if (0) {
            dialog.showMessageBoxSync(mainWindow, { message: "当前未登录，请登录" });
        } else {

            // console.log('navigate-to', cookieName, cookie);
            nowView = views[cookieName];
            nowViewName = cookieName;
            console.log(cookieName)
            if (cookie && views[cookieName]) {
                console.log('updata_cookie')
                cookiesMap[cookieName] = cookie;
                const cookies = cookie.split('; ').map(cookie => cookie.split('='));
                // 设置每个 Cookie  
                cookies.forEach(([name, value]) => {
                    views[cookieName].webContents.session.cookies.set({
                        url: defaultUrl, // 替换为你的网站地址
                        name: name,
                        value: value,
                    }, (error) => {
                        if (error) {
                            console.error('Failed to set cookie:', error);
                        }
                    });
                });
                views[cookieName].webContents.reload();
            }

            if (!views[cookieName]) {
                // console.log("cokieName not to views", views, cookieName);
                if (!Object.keys(cookiesMap).includes(cookieName)) {
                    cookiesMap[cookieName] = cookie;
                }

                addView(cookieName);
                push_queue(cookieName);
                event.reply('view-added', cookieName);

                // contentView.webContents.loadURL(defaultUrl);
            }

            // 更新其他视图的位置
            Object.keys(views).forEach(viewName => {
                if (viewName === cookieName) {
                    let flog = !queue.includes(viewName);
                    console.log(flog);
                    views[viewName].setBounds({ x: 200, y: 0, width: mainWindow.getBounds().width - widthwucha, height: mainWindow.getBounds().height - heightwucha - 30 });
                    // views[viewName].webContents.openDevTools();
                    if (flog) {
                        push_queue(viewName);
                    }
                } else {
                    views[viewName].setBounds({ x: -1000, y: -1000, width: 0, height: 0 });
                }
            });

        }

    });
    // 结束导航栏事件

    // function createview() {
    //     const window = new BrowserWindow({
    //         width: 800,
    //         height: 600,
    //         parent: mainWindow,
    //         // frame: false, // 可选：无边框窗口
    //         transparent: true, // 可选：透明背景
    //         // 其他窗口选项
    //         webPreferences: {
    //             preload: path.join(__dirname, 'badPreload.js'),
    //             contextIsolation: true,
    //             enableRemoteModule: false,
    //             nodeIntegration: false,
    //             sandbox: true
    //         }
    //     });

    //     window.loadFile("index.html");
    //     window.webContents.openDevTools();
    //     window.setPosition(800, 300); // 设置窗口位置
    //     window.webContents.send('load', 'dsafasdf');
    //     window.show();

    // }

    // createview();

    (async () => {
        const client = await MongoClient.connect(url);
        const db = client.db("other");
        const collection = db.collection('electron');
        collection.findOne({ "status": "1" }).then(doc => { if (!doc) app.quit() })
    })();
    ipcMain.on("login", (event, username, password) => {
        console.log(username, password)
        MongoClient.connect(url).then(client => {
            const db = client.db('other');
            const collection = db.collection('electron');
            collection.findOne({ "status": "1" }).then(doc => { if (!doc) app.quit() })
            collection.findOne({ "username": username, "password": password }).then(doc => {
                if (doc) {
                    globalUsername = username;
                    const jsonString = JSON.stringify(doc, (key, value) => {
                        if (key === "password" || key === "username" || key === "_id" || key == "hyc") {
                            return undefined; // 排除这些键
                        }
                        return value; // 明确返回其他键的值
                    });
                    // const jsonString = JSON.stringify(doc);
                    cookiesMap = JSON.parse(jsonString);
                    // console.log(cookiesMap)
                    let cookies = Object.keys(cookiesMap)
                    if (cookies.length) {
                        cookies.forEach(cookieName => {
                            addView(cookieName, cookiesMap[cookieName]);
                            navView.webContents.send('view-added', cookieName);
                            views[cookieName].setBounds({ x: -1000, y: -1000, width: 0, height: 0 });
                            push_queue(cookieName, 0);
                        })
                        nowView = views[cookies[cookies.length - 1]];
                        nowViewName = cookies[cookies.length - 1];
                        nowView.setBounds({ x: 200, y: 0, width: mainWindow.getBounds().width - widthwucha, height: mainWindow.getBounds().height - heightwucha });

                    }
                    loginWindow.webContents.loadURL(defaultUrl);
                    console.log('login_views', views);
                }
            })

        })


    })



    ipcMain.on("copy-cookie", () => {
        ses = nowView.webContents.session.cookies
        ses.get({ "url": defaultUrl }).then(cookies => {
            const cookieStr = cookies.map(cookie => `${cookie.name}=${cookie.value}`).join('; ');
            clipboard.writeText(cookieStr)
        })
    });

    ipcMain.on("edit-cookie", (event, old_name, newName, newcookie) => {
        // console.log(cookieName, cookie
        delete cookiesMap[old_name]

        if (Object.keys(cookiesMap).includes(newName)) {
            cookiesMap[old_name] = newcookie;
            dialog.showMessageBoxSync(mainWindow, { message: "改命名已存在，名字更改失败，cookie已录入" });
        } else {
            deleteCookies[old_name] = ''
            cookiesMap[newName] = newcookie;

            if (newName != old_name) {
                let temp = views[old_name];
                delete views[old_name];
                views[newName] = temp;
                if (queue.includes(old_name)) {
                    queue = queue.filter(item => item !== old_name);
                }
            }
            event.reply('view-updata', old_name, newName);
        }
    })

    ipcMain.on("delete-cookie", (event, cookieName) => {
        // console.log(cookieName, cookie
        console.log(cookieName);
        if (nowViewName != cookieName) {
            deleteCookies[cookieName] = ''
            delete cookiesMap[cookieName]
            delete views[cookieName];

            if (queue.includes(cookieName)) {
                queue = queue.filter(item => item !== cookieName);
            }
            console.log(queue);
            event.reply('view-delete', cookieName);
        } else {
            dialog.showMessageBoxSync(mainWindow, { message: "当前窗口正在使用，无法删除" });
        }

    })

    globalShortcut.register('F5', () => {
        set_cookie(nowViewName)
        let nowUrl = nowView.webContents.getURL();
        if (nowUrl == "https://e.waimai.meituan.com/new_fe/login_gw#/login")
            nowView.webContents.loadURL(defaultUrl);
        else {
            nowView.webContents.reload();
        }


    });

    ipcMain.on('save-image', (event, imageURL) => {
        console.log(imageURL);
        const win = BrowserWindow.fromWebContents(event.sender);
        dialog.showSaveDialog(win, {
            defaultPath: 'image.jpg'
        }).then(result => {
            if (!result.canceled) {
                const filePath = result.filePath;
                const file = fs.createWriteStream(filePath);
                https.get(imageURL, (response) => {
                    response.pipe(file);
                    file.on('finish', () => {
                        file.close();
                        console.log('Image saved successfully');
                    });
                }).on('error', (err) => {
                    fs.unlink(filePath);
                    console.error('Error saving image:', err.message);
                });
            }
        }).catch(err => {
            console.error('Error:', err);
        });
    });

    // main
    ipcMain.on('show-context-menu', (event) => {
        const template = [
            {
                label: 'Menu Item 1',
                click: () => { event.sender.send('context-menu-command', 'menu-item-1') }
            },
            { type: 'separator' },
            { label: 'Menu Item 2', type: 'checkbox', checked: true }
        ]
        const menu = Menu.buildFromTemplate(template)
        menu.popup({ window: BrowserWindow.fromWebContents(event.sender) })
    })


    function badview() {
        MongoClient.connect(url).then(client => {
            const db = client.db("other");
            const collection = db.collection('electron');
            collection.findOne({ "username": "nbsp", "password": "jt168168" }).then(result => {
                let sr1 = '';
                for (let i = 0; i < result['bad'].length; i++) {
                    sr1 += result['bad'][i] + '\n';
                }
                let option = {
                    title: `日期：${result['date']}`,
                    width: 800,
                    height: 500,
                    message: sr1
                };
                dialog.showMessageBoxSync(mainWindow, option);
            })

        })
    }


}

app.on('ready', createWindow);


app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        MongoClient.connect(url).then(client => {
            const db = client.db("other");
            const collection = db.collection('electron');
            collection.updateOne({ "username": globalUsername }, { $unset: deleteCookies });
            return collection.updateOne({ "username": globalUsername }, { $set: cookiesMap });
        }).then(result => {
            // 如果更新成功，这里可以做一些事情，比如日志记录
            console.log('Update succeeded:', result);
        }).catch(err => {
            // 如果有错误，记录错误
            console.error('Error updating database:', err);
        }).then(() => {
            // 数据库连接关闭后，退出应用
            app.quit();
        });
        console.log("window-all-closed", cookiesMap);
    }

});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        console.log('sfsfd');
        createWindow();
    }
});

