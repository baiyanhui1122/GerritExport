import { defineStore } from 'pinia'
import type { ExportCommitItem, GerritInstance, QueryOptions, QueryResult } from '@shared/types'
import { toIpcPayload } from '../utils/ipc'

export const defaultQuery = (): QueryOptions => ({
  status: 'merged',
  dateType: 'updated',
  includeReviewMessages: false,
  includeInlineComments: false,
  includeFiles: true,
  pageSize: 100,
  maxResults: 1000,
  concurrency: 5
})

export const useQueryStore = defineStore('query', {
  state: () => ({
    query: defaultQuery(),
    items: [] as ExportCommitItem[],
    selectedKeys: [] as number[],
    loading: false,
    currentQueryId: '' as string,
    errors: [] as QueryResult['errors']
  }),
  getters: {
    selectedItems(state): ExportCommitItem[] {
      const keys = new Set(state.selectedKeys)
      return state.items.filter((item) => keys.has(item.changeNumber))
    }
  },
  actions: {
    reset() {
      this.query = defaultQuery()
      this.items = []
      this.selectedKeys = []
      this.errors = []
    },
    syncInstanceDefaults(instance?: GerritInstance) {
      this.query.project = instance?.defaultProject || ''
      this.query.branch = instance?.defaultBranch || ''
    },
    fillMissingInstanceDefaults(instance?: GerritInstance) {
      if (!instance) return
      if (!this.query.project && instance.defaultProject) this.query.project = instance.defaultProject
      if (!this.query.branch && instance.defaultBranch) this.query.branch = instance.defaultBranch
    },
    async run(instance: GerritInstance) {
      this.loading = true
      this.errors = []
      this.fillMissingInstanceDefaults(instance)
      const queryId = `query-${Date.now()}-${Math.random().toString(16).slice(2)}`
      this.currentQueryId = queryId
      try {
        const result = await window.urovo.queryChanges(toIpcPayload(instance), toIpcPayload(this.query), queryId)
        this.items = result.items
        this.errors = result.errors
        this.selectedKeys = []
      } finally {
        this.loading = false
        this.currentQueryId = ''
      }
    },
    async cancel() {
      if (!this.currentQueryId) return
      await window.urovo.cancelQuery(this.currentQueryId)
    }
  }
})
