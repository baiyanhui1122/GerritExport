import Store from 'electron-store'
import type { AppSettings, ExportHistory, GerritInstance } from '../../shared/types'

interface StoreShape {
  instances: GerritInstance[]
  currentInstanceId?: string
  exportHistory: ExportHistory[]
  settings: AppSettings
}

export class ConfigService {
  private readonly store = new Store<StoreShape>({
    name: 'urovo-export',
    defaults: {
      instances: [],
      exportHistory: [],
      settings: {
        darkMode: false
      }
    }
  })

  getInstances(): GerritInstance[] {
    return this.store.get('instances', [])
  }

  saveInstance(instance: GerritInstance): GerritInstance[] {
    const items = this.getInstances()
    const index = items.findIndex((item) => item.id === instance.id)
    if (index >= 0) items[index] = instance
    else items.push(instance)
    this.store.set('instances', items)
    if (!this.getCurrentInstanceId()) this.store.set('currentInstanceId', instance.id)
    return items
  }

  deleteInstance(id: string): GerritInstance[] {
    const next = this.getInstances().filter((item) => item.id !== id)
    this.store.set('instances', next)
    if (this.getCurrentInstanceId() === id) this.store.set('currentInstanceId', next[0]?.id)
    return next
  }

  setCurrentInstance(id: string): void {
    this.store.set('currentInstanceId', id)
  }

  getCurrentInstanceId(): string | undefined {
    return this.store.get('currentInstanceId')
  }

  getHistory(): ExportHistory[] {
    return this.store.get('exportHistory', [])
  }

  addHistory(history: ExportHistory): ExportHistory[] {
    const next = [history, ...this.getHistory()].slice(0, 100)
    this.store.set('exportHistory', next)
    return next
  }

  deleteHistory(ids: string[]): ExportHistory[] {
    const removeIds = new Set(ids)
    const next = this.getHistory().filter((item) => !removeIds.has(item.id))
    this.store.set('exportHistory', next)
    return next
  }

  getSettings(): AppSettings {
    return this.store.get('settings', { darkMode: false })
  }

  saveSettings(settings: AppSettings): AppSettings {
    this.store.set('settings', settings)
    return settings
  }
}
