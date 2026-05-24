import { ipcMain } from 'electron'
import type { AppSettings, GerritInstance } from '../../shared/types'
import { ConfigService } from '../services/ConfigService'

export function registerConfigIpc(config: ConfigService): void {
  ipcMain.handle('config:listInstances', () => ({
    instances: config.getInstances(),
    currentInstanceId: config.getCurrentInstanceId()
  }))
  ipcMain.handle('config:saveInstance', (_, instance: GerritInstance) => config.saveInstance(instance))
  ipcMain.handle('config:deleteInstance', (_, id: string) => config.deleteInstance(id))
  ipcMain.handle('config:setCurrentInstance', (_, id: string) => {
    config.setCurrentInstance(id)
    return id
  })
  ipcMain.handle('config:getHistory', () => config.getHistory())
  ipcMain.handle('config:deleteHistory', (_, ids: string[]) => config.deleteHistory(ids))
  ipcMain.handle('config:getSettings', () => config.getSettings())
  ipcMain.handle('config:saveSettings', (_, settings: AppSettings) => config.saveSettings(settings))
}
