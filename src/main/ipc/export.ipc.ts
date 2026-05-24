import { existsSync } from 'node:fs'
import { ipcMain, shell } from 'electron'
import type { ExportRequest } from '../../shared/types'
import { ConfigService } from '../services/ConfigService'
import { ExportService } from '../services/ExportService'
import { LogService } from '../services/LogService'

export function registerExportIpc(config: ConfigService, log: LogService): void {
  const service = new ExportService(config)

  ipcMain.handle('export:save', async (_, request: ExportRequest) => {
    try {
      return await service.export(request)
    } catch (error) {
      log.error('Export failed', error)
      throw error
    }
  })

  ipcMain.handle('export:openPath', async (_, filePath: string) => {
    if (!existsSync(filePath)) return { ok: false, missing: true, message: '文件不存在，已从历史中移除' }
    const message = await shell.openPath(filePath)
    return { ok: !message, missing: false, message }
  })

  ipcMain.handle('export:showInFolder', (_, filePath: string) => {
    if (!existsSync(filePath)) return { ok: false, missing: true, message: '文件不存在，已从历史中移除' }
    shell.showItemInFolder(filePath)
    return { ok: true, missing: false, message: '' }
  })
}
