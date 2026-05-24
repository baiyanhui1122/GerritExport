<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { ExportCommitItem, ExportFormat, ExportRange } from '@shared/types'
import { useConfigStore } from '../stores/configStore'
import { useQueryStore } from '../stores/queryStore'
import { formatGitLogText } from '../utils/format'
import { toIpcPayload } from '../utils/ipc'
import QueryForm from '../components/QueryForm.vue'
import ChangeCard from '../components/ChangeCard.vue'
import ChangeDetailDrawer from '../components/ChangeDetailDrawer.vue'
import ExportDialog from '../components/ExportDialog.vue'

const config = useConfigStore()
const queryStore = useQueryStore()
const router = useRouter()
const drawer = ref(false)
const exportDialog = ref(false)
const exportFormat = ref<ExportFormat>('txt')
const current = ref<ExportCommitItem>()

const selectedSet = computed(() => new Set(queryStore.selectedKeys))

watch(
  () => config.currentInstance,
  (instance) => {
    queryStore.applyInstanceDefaults(instance)
  },
  { immediate: true }
)

async function search() {
  const instance = config.currentInstance
  if (!instance) {
    ElMessage.warning('请先配置 Gerrit 实例')
    return
  }
  try {
    await queryStore.run(instance)
    if (queryStore.items.length === 0) ElMessage.info('查询结果为空')
    else ElMessage.success(`查询完成，共 ${queryStore.items.length} 条`)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    if (message.includes('查询已取消')) ElMessage.info('查询已取消')
    else ElMessage.error(`查询失败：${message}`)
  }
}

async function cancelSearch() {
  await queryStore.cancel()
  ElMessage.info('正在取消查询')
}

function resetQuery() {
  queryStore.reset()
  queryStore.applyInstanceDefaults(config.currentInstance)
}

function toggle(number: number) {
  const keys = new Set(queryStore.selectedKeys)
  if (keys.has(number)) keys.delete(number)
  else keys.add(number)
  queryStore.selectedKeys = [...keys]
}

function preview(item: ExportCommitItem) {
  current.value = item
  drawer.value = true
}

async function open(item: ExportCommitItem) {
  await window.urovo.openExternal(item.reviewUrl)
}

async function copy(item?: ExportCommitItem) {
  const items = item ? [item] : queryStore.selectedItems
  if (!items.length) {
    ElMessage.warning('请先选择要复制的提交')
    return
  }
  await navigator.clipboard.writeText(items.map(formatGitLogText).join('\n\n'))
  ElMessage.success('已复制 git log 格式内容')
}

function openExport(format?: ExportFormat, item?: ExportCommitItem) {
  exportFormat.value = format || 'txt'
  if (item) current.value = item
  exportDialog.value = true
}

async function doExport(options: { format: ExportFormat; range: ExportRange; includeQuery: boolean; includeReviewMessages: boolean; includeInlineComments: boolean; includeFiles: boolean }) {
  const instance = config.currentInstance
  if (!instance) return
  const items =
    options.range === 'single' && current.value
      ? [current.value]
      : options.range === 'selected'
        ? queryStore.selectedItems
        : queryStore.items

  if (!items.length) {
    ElMessage.warning('没有可导出的记录')
    return
  }

  try {
    const result = await window.urovo.exportChanges(toIpcPayload({
      ...options,
      query: queryStore.query,
      instance,
      items
    }))
    exportDialog.value = false
    if (!result.canceled && result.filePath) {
      await config.refreshHistory()
      ElMessageBox.confirm(`导出成功：${result.filePath}`, '导出完成', {
        confirmButtonText: '在资源管理器中显示',
        cancelButtonText: '关闭',
        type: 'success'
      })
        .then(() => window.urovo.showInFolder(result.filePath))
        .catch(() => undefined)
    }
  } catch (error) {
    ElMessage.error(`导出失败：${error instanceof Error ? error.message : String(error)}`)
  }
}
</script>

<template>
  <div class="space-y-4 pb-8">
    <QueryForm
      v-model="queryStore.query"
      :disabled="queryStore.loading"
      @search="search"
      @cancel="cancelSearch"
      @reset="resetQuery"
    />

    <div v-if="!config.currentInstance" class="glass-panel rounded-[24px] p-6">
      <div class="flex items-center justify-between gap-4">
        <div>
          <h2 class="text-lg font-semibold text-slate-950">请先添加 Gerrit 实例</h2>
          <p class="mt-1 text-sm text-slate-500">添加 Gerrit 地址、用户名和 HTTP Password/Token 后，就可以开始查询和导出。</p>
        </div>
        <el-button type="primary" size="large" @click="router.push('/config')">去添加 Gerrit</el-button>
      </div>
    </div>

    <div class="glass-panel flex items-center justify-between rounded-[24px] p-4">
      <div class="flex items-center gap-4 text-sm text-slate-600">
        <span>共查询到 <b class="text-slate-950">{{ queryStore.items.length }}</b> 条</span>
        <span>已选择 <b class="text-slate-950">{{ queryStore.selectedKeys.length }}</b> 条</span>
        <el-tag v-if="queryStore.errors.length" type="danger" round>{{ queryStore.errors.length }} 条详情失败</el-tag>
      </div>
      <div class="flex gap-2">
        <el-button @click="copy()">复制选中</el-button>
        <el-button @click="openExport('txt')">导出 TXT</el-button>
        <el-button @click="openExport('md')">导出 MD</el-button>
        <el-button type="primary" @click="openExport('xlsx')">导出 Excel</el-button>
      </div>
    </div>

    <div v-if="queryStore.loading" class="grid gap-3">
      <el-skeleton v-for="i in 5" :key="i" animated class="rounded-[22px] bg-white p-4" />
    </div>

    <el-empty v-else-if="!queryStore.items.length" description="配置 Gerrit 后开始查询" class="glass-panel rounded-[24px]" />

    <div v-else class="grid gap-3">
      <ChangeCard
        v-for="item in queryStore.items"
        :key="item.changeNumber"
        :item="item"
        :selected="selectedSet.has(item.changeNumber)"
        @toggle="toggle"
        @preview="preview"
        @open="open"
        @copy="copy"
        @export-one="openExport(undefined, $event)"
      />
    </div>

    <ChangeDetailDrawer v-model="drawer" :item="current" />
    <ExportDialog
      v-model="exportDialog"
      :count="queryStore.items.length"
      :selected-count="queryStore.selectedKeys.length"
      :has-single="Boolean(current)"
      :initial-format="exportFormat"
      @submit="doExport"
    />
  </div>
</template>
