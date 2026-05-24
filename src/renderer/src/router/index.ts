import { createRouter, createWebHashHistory } from 'vue-router'
import QueryExportView from '../views/QueryExportView.vue'
import GerritConfigView from '../views/GerritConfigView.vue'
import ExportHistoryView from '../views/ExportHistoryView.vue'
import SettingsView from '../views/SettingsView.vue'

export const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', redirect: '/query' },
    { path: '/query', name: 'query', component: QueryExportView, meta: { title: '查询导出' } },
    { path: '/history', name: 'history', component: ExportHistoryView, meta: { title: '导出历史' } },
    { path: '/config', name: 'config', component: GerritConfigView, meta: { title: 'Gerrit 配置' } },
    { path: '/settings', name: 'settings', component: SettingsView, meta: { title: '设置' } }
  ]
})
