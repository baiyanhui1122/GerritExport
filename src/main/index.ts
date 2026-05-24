import { join } from 'node:path'
import { app, BrowserWindow } from 'electron'
import { is } from '@electron-toolkit/utils'
import { ConfigService } from './services/ConfigService'
import { LogService } from './services/LogService'
import { registerConfigIpc } from './ipc/config.ipc'
import { registerGerritIpc } from './ipc/gerrit.ipc'
import { registerExportIpc } from './ipc/export.ipc'

const config = new ConfigService()
const log = new LogService()

function createWindow(): void {
  const mainWindow = new BrowserWindow({
    width: 1360,
    height: 900,
    minWidth: 1120,
    minHeight: 720,
    title: 'Urovo Export',
    backgroundColor: '#f4f7fb',
    webPreferences: {
      preload: join(__dirname, '../preload/index.mjs'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  if (is.dev && process.env.ELECTRON_RENDERER_URL) {
    mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL)
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  registerConfigIpc(config)
  registerGerritIpc(log)
  registerExportIpc(config, log)
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
