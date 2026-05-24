import { ipcMain, shell } from 'electron'
import type { GerritInstance, QueryOptions } from '../../shared/types'
import { GerritClient } from '../services/GerritClient'
import { LogService } from '../services/LogService'

const runningQueries = new Map<string, AbortController>()

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error || '未知错误')
}

export function registerGerritIpc(log: LogService): void {
  ipcMain.handle('gerrit:testConnection', async (_, instance: GerritInstance) => {
    try {
      return await new GerritClient(instance).testConnection()
    } catch (error) {
      log.error('Test connection failed', error)
      return { ok: false, message: errorMessage(error) || '连接失败' }
    }
  })

  ipcMain.handle('gerrit:query', async (_, instance: GerritInstance, options: QueryOptions, queryId?: string) => {
    const id = queryId || `query-${Date.now()}`
    const controller = new AbortController()
    runningQueries.set(id, controller)
    try {
      return await new GerritClient(instance, controller.signal).queryChanges(options)
    } catch (error) {
      log.error('Query failed', error)
      throw new Error(controller.signal.aborted ? '查询已取消' : errorMessage(error))
    } finally {
      runningQueries.delete(id)
    }
  })

  ipcMain.handle('gerrit:cancelQuery', (_, queryId: string) => {
    const controller = runningQueries.get(queryId)
    if (!controller) return { ok: false, message: '查询已结束或不存在' }
    controller.abort()
    runningQueries.delete(queryId)
    return { ok: true, message: '已取消查询' }
  })

  ipcMain.handle('gerrit:openExternal', (_, url: string) => shell.openExternal(url))
}
