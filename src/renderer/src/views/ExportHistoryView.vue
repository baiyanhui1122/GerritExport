<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import dayjs from 'dayjs'
import type { ExportHistory } from '@shared/types'
import { useConfigStore } from '../stores/configStore'

const config = useConfigStore()
const router = useRouter()
const selectedRows = ref<ExportHistory[]>([])

onMounted(() => config.refreshHistory())

function formatTime(value: string): string {
  const parsed = dayjs(value)
  return parsed.isValid() ? parsed.format('YYYY-MM-DD HH:mm:ss') : value
}

async function removeHistory(ids: string[], silent = false) {
  if (!ids.length) return
  await config.deleteHistory(ids)
  if (!silent) ElMessage.success(`已删除 ${ids.length} 条历史`)
}

async function deleteSelected() {
  const ids = selectedRows.value.map((item) => item.id)
  if (!ids.length) {
    ElMessage.warning('请先选择要删除的历史')
    return
  }
  await ElMessageBox.confirm(`确认删除选中的 ${ids.length} 条导出历史？`, '删除历史', { type: 'warning' })
  await removeHistory(ids)
}

async function deleteOne(row: ExportHistory) {
  await ElMessageBox.confirm('确认删除这条导出历史？', '删除历史', { type: 'warning' })
  await removeHistory([row.id])
}

async function openPath(row: ExportHistory) {
  const result = await window.urovo.openPath(row.filePath)
  if (result?.missing) {
    await removeHistory([row.id], true)
    ElMessage.warning('文件不存在，已自动删除该条历史')
  } else if (result && !result.ok && result.message) {
    ElMessage.error(result.message)
  }
}

async function showInFolder(row: ExportHistory) {
  const result = await window.urovo.showInFolder(row.filePath)
  if (result?.missing) {
    await removeHistory([row.id], true)
    ElMessage.warning('文件不存在，已自动删除该条历史')
  } else if (result && !result.ok && result.message) {
    ElMessage.error(result.message)
  }
}
</script>

<template>
  <section class="glass-panel rounded-[24px] p-5">
    <div class="mb-5 flex items-start justify-between gap-4">
      <div>
        <h2 class="text-lg font-semibold">导出历史</h2>
        <p class="text-sm text-slate-500">记录最近 100 次导出，可打开文件、定位目录或批量删除历史。</p>
      </div>
      <div class="flex gap-2">
        <el-button :disabled="!selectedRows.length" type="danger" @click="deleteSelected">
          删除选中 {{ selectedRows.length || '' }}
        </el-button>
      </div>
    </div>

    <div v-if="!config.currentInstance" class="mb-4 rounded-2xl border border-dashed border-slate-300 bg-white/70 p-4">
      <div class="flex items-center justify-between gap-4">
        <span class="text-sm text-slate-600">还没有 Gerrit 实例，先添加配置后再查询导出。</span>
        <el-button type="primary" @click="router.push('/config')">添加 Gerrit 实例</el-button>
      </div>
    </div>

    <el-table :data="config.history" height="650" row-key="id" @selection-change="selectedRows = $event">
      <el-table-column type="selection" width="44" />
      <el-table-column label="导出时间" width="180">
        <template #default="{ row }">{{ formatTime(row.exportedAt) }}</template>
      </el-table-column>
      <el-table-column prop="gerrit" label="Gerrit" min-width="220" />
      <el-table-column prop="count" label="数量" width="80" />
      <el-table-column prop="format" label="格式" width="90" />
      <el-table-column prop="status" label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="row.status === 'success' ? 'success' : 'danger'">{{ row.status }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="filePath" label="保存路径" min-width="280" show-overflow-tooltip />
      <el-table-column label="操作" width="250" fixed="right">
        <template #default="{ row }">
          <el-button size="small" @click="openPath(row)">打开文件</el-button>
          <el-button size="small" @click="showInFolder(row)">目录</el-button>
          <el-button size="small" type="danger" @click="deleteOne(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
  </section>
</template>
