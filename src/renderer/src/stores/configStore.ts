import { defineStore } from 'pinia'
import type { AppSettings, ExportHistory, GerritInstance } from '@shared/types'
import { toIpcPayload } from '../utils/ipc'

export const useConfigStore = defineStore('config', {
  state: () => ({
    instances: [] as GerritInstance[],
    currentInstanceId: undefined as string | undefined,
    history: [] as ExportHistory[],
    settings: { darkMode: false } as AppSettings
  }),
  getters: {
    currentInstance(state): GerritInstance | undefined {
      return state.instances.find((item) => item.id === state.currentInstanceId) || state.instances[0]
    }
  },
  actions: {
    async load() {
      const result = await window.urovo.listInstances()
      this.instances = result.instances
      this.currentInstanceId = result.currentInstanceId || result.instances[0]?.id
      this.settings = await window.urovo.getSettings()
      this.history = await window.urovo.getHistory()
    },
    async saveInstance(instance: GerritInstance) {
      this.instances = await window.urovo.saveInstance(toIpcPayload(instance))
      if (!this.currentInstanceId) this.currentInstanceId = instance.id
    },
    async deleteInstance(id: string) {
      this.instances = await window.urovo.deleteInstance(id)
      if (this.currentInstanceId === id) this.currentInstanceId = this.instances[0]?.id
    },
    async setCurrent(id: string) {
      this.currentInstanceId = await window.urovo.setCurrentInstance(id)
    },
    async refreshHistory() {
      this.history = await window.urovo.getHistory()
    },
    async deleteHistory(ids: string[]) {
      this.history = await window.urovo.deleteHistory(toIpcPayload(ids))
    },
    async saveSettings(settings: AppSettings) {
      this.settings = await window.urovo.saveSettings(toIpcPayload(settings))
    }
  }
})
