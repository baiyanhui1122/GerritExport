import { contextBridge, ipcRenderer } from 'electron'
import type { AppSettings, ExportRequest, GerritInstance, QueryOptions } from '../shared/types'

function plain<T>(value: T): T {
  if (value === null || value === undefined) return value
  return JSON.parse(JSON.stringify(value)) as T
}

const api = {
  listInstances: () => ipcRenderer.invoke('config:listInstances'),
  saveInstance: (instance: GerritInstance) => ipcRenderer.invoke('config:saveInstance', plain(instance)),
  deleteInstance: (id: string) => ipcRenderer.invoke('config:deleteInstance', id),
  setCurrentInstance: (id: string) => ipcRenderer.invoke('config:setCurrentInstance', id),
  getHistory: () => ipcRenderer.invoke('config:getHistory'),
  deleteHistory: (ids: string[]) => ipcRenderer.invoke('config:deleteHistory', plain(ids)),
  getSettings: () => ipcRenderer.invoke('config:getSettings'),
  saveSettings: (settings: AppSettings) => ipcRenderer.invoke('config:saveSettings', plain(settings)),
  testConnection: (instance: GerritInstance) => ipcRenderer.invoke('gerrit:testConnection', plain(instance)),
  queryChanges: (instance: GerritInstance, options: QueryOptions, queryId?: string) => ipcRenderer.invoke('gerrit:query', plain(instance), plain(options), queryId),
  cancelQuery: (queryId: string) => ipcRenderer.invoke('gerrit:cancelQuery', queryId),
  openExternal: (url: string) => ipcRenderer.invoke('gerrit:openExternal', url),
  exportChanges: (request: ExportRequest) => ipcRenderer.invoke('export:save', plain(request)),
  openPath: (filePath: string) => ipcRenderer.invoke('export:openPath', filePath),
  showInFolder: (filePath: string) => ipcRenderer.invoke('export:showInFolder', filePath)
}

contextBridge.exposeInMainWorld('urovo', api)

export type UrovoApi = typeof api
