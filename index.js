const { app, BrowserWindow,ipcMain } = require('electron')
const path = require('path')

// 建立應用程式視窗的 function
function createWindow() {
  // 應用程式視窗設定
  const mainWindow = new BrowserWindow({
    width: 1920,
    height: 1080,
    frame: false ,
    titleBarStyle: 'hidden' ,
    backgroundColor: "#212529",
    resizable:false,
    show:false,
    webPreferences: {
      // 載入 preload.js
      preload: path.join(__dirname, 'preload.js')
    }
  })

  // 載入 index.html，亦可載入某個網址
  mainWindow.loadFile('index.html')
  // 打開開發者模式
  // mainWindow.webContents.openDevTools()

  ipcMain.on('minimize', () => {
    mainWindow.minimize()
  })
  mainWindow.webContents.once('dom-ready', () => {mainWindow.show()});
}

// 完成初始化後執行此方法
app.on('ready', () => {
  createWindow()

  // 運用程式運行時，點擊工具列圖示時觸發（macOS）
  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })

})

// 關閉所有視窗時觸發，除 macOS 以外
app.on('window-all-closed', function () {
  // darwin 為 macOS 的作業系統
  if (process.platform !== 'darwin') app.quit()
})