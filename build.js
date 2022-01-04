const path = require('path');
const builder = require('electron-builder');

builder.build({

    projectDir: path.resolve(__dirname),  // 專案路徑 

    win: [],  // nsis . portable
    config: {
        "appId": "tech.keybo.ipproject",
        "productName": "Kix's Image Processing Project", // 應用程式名稱 ( 顯示在應用程式與功能 )
        "directories": {
            "output": "build/win"
        },
        "win": {
            "icon": path.resolve(__dirname, 'icon.png'),
        }
    },
})
    .then(
        data => console.log(data),
        err => console.error(err)
    );