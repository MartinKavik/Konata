"use strict";

const electron = require("electron");
const {app} = electron;
const {BrowserWindow} = electron;

// Remote モジュールを有効化
require("@electron/remote/main").initialize();

// __dirname には現在のファイルの場所が入る
let currentURL = "file://" + __dirname + "/index.html";

// appendSwitch は複数回呼ぶと，前回に与えたスイッチを上書きしてしまうので注意
// --max-old-space-size=32768: 使用できるメモリの最大使用量を 32GB に
// --expose-gc: Make it possible to call GC manually
app.commandLine.appendSwitch("js-flags", "--expose-gc --max-old-space-size=65536");


// メインウィンドウはGCされないようにグローバル宣言
let m_window = null;

// 全てのウィンドウが閉じたら終了
app.on("window-all-closed", function(){
    if (process.platform != "darwin") {
        app.quit();
    }
});

// Electronの初期化完了後に実行
app.on("ready", function() {
    // The main window is not shown while loading. 
    m_window = new BrowserWindow({
        width: 800, 
        height: 600,

        // The window is initially hidden and 
        // is activate in an initial handler in <app> in app.tag.html
        show: false,
        
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    });

    require("@electron/remote/main").enable(m_window.webContents);
    m_window.setMenu(null);

    m_window.loadURL(currentURL);
    //m_window.toggleDevTools();

    // ウィンドウが閉じる前に，設定を保存
    // store.config が生きている間 = ウィンドウの生存期間内に処理をしないといけない
    m_window.on("close", function() {
        m_window.webContents.executeJavaScript("store.config.save();");
    });

    // ウィンドウが閉じられたらアプリも終了
    m_window.on("closed", function() {
        m_window = null;
    });
});

const express = require('express')
const path = require('node:path');
const server = express()
const PORT = process.env.PORT || 30000;

const jsonErrorHandler = (err, req, res, next) => {
    res.status(500).send({ error: err });
}

server.use(express.json());
server.use(jsonErrorHandler)

// localhost:30000/status
server.get('/status', function (req, res) {
    res.sendStatus(200)
})

// curl --json '{ \"file_path\": \"D:/repos/FastWave2.0/test_files/sv39_mmu_cache_sim/fst/konata.log\" }' http://localhost:30000/open-konata-file
server.post('/open-konata-file', function (req, res) {
    const file_path = path.normalize(req.body.file_path).replace(/\\/g, "/");
    console.log(`Opening file '${file_path}'`);
    m_window.webContents.executeJavaScript(`dispatcher.trigger(ACTION.FILE_OPEN, "${file_path}");`);
    res.send(`Request to open Konata file '${file_path}' has been processed.`)
})

server.listen(PORT, function (err) {
    if (err) console.log(err);
    console.log("Konata server listening on PORT", PORT);
});

