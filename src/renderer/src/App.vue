<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Clock, House, Operation, Plus, Setting } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import type { GerritInstance } from '@shared/types'
import { useConfigStore } from './stores/configStore'
import GerritInstanceDialog from './components/GerritInstanceDialog.vue'

const route = useRoute()
const router = useRouter()
const config = useConfigStore()
const instanceDialog = ref(false)

const nav = [
  { path: '/query', label: '查询导出', icon: House },
  { path: '/history', label: '导出历史', icon: Clock },
  { path: '/config', label: 'Gerrit 配置', icon: Operation },
  { path: '/settings', label: '设置', icon: Setting }
]
const title = computed(() => String(route.meta.title || '查询导出'))

async function saveInstance(instance: GerritInstance) {
  try {
    await config.saveInstance(instance)
    await config.setCurrent(instance.id)
    ElMessage.success('Gerrit 实例已保存')
  } catch (error) {
    ElMessage.error(`保存失败：${error instanceof Error ? error.message : String(error)}`)
  }
}

function applyTheme(enabled: boolean): void {
  document.documentElement.classList.toggle('dark', enabled)
}

watch(
  () => config.settings.darkMode,
  (enabled) => applyTheme(enabled),
  { immediate: true }
)

onMounted(async () => {
  await config.load()
  applyTheme(config.settings.darkMode)
})
</script>

<template>
  <div class="flex h-screen overflow-hidden p-4">
    <aside class="glass-panel flex w-64 shrink-0 flex-col rounded-[24px] p-4">
      <div class="mb-8 px-2">
        <div class="text-lg font-semibold tracking-tight">Urovo Export</div>
        <div class="mt-1 text-xs text-slate-500">Gerrit Change Exporter</div>
      </div>
      <button
        v-for="item in nav"
        :key="item.path"
        class="mb-2 flex h-11 items-center gap-3 rounded-2xl px-3 text-left text-sm transition"
        :class="route.path === item.path ? 'bg-slate-900 text-white shadow-soft' : 'text-slate-600 hover:bg-white'"
        @click="router.push(item.path)"
      >
        <el-icon><component :is="item.icon" /></el-icon>
        {{ item.label }}
      </button>
      <button
        class="mt-3 flex h-11 items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-300 bg-white/70 text-sm text-slate-700 transition hover:border-brand hover:text-brand"
        @click="instanceDialog = true"
      >
        <el-icon><Plus /></el-icon>
        添加 Gerrit
      </button>
      <div class="mt-auto rounded-2xl bg-slate-900 p-4 text-white">
        <div class="text-xs text-slate-300">当前实例</div>
        <div class="mt-2 truncate text-sm font-medium">{{ config.currentInstance?.name || '未配置' }}</div>
        <div class="mt-1 truncate text-xs text-slate-400">{{ config.currentInstance?.baseUrl || '请先添加 Gerrit' }}</div>
      </div>
    </aside>

    <main class="ml-4 flex min-w-0 flex-1 flex-col">
      <header class="glass-panel mb-4 flex h-16 shrink-0 items-center justify-between rounded-[24px] px-6">
        <div>
          <div class="text-xl font-semibold">{{ title }}</div>
          <div class="text-xs text-slate-500">批量查询、预览并导出 Gerrit 提交信息</div>
        </div>
        <div class="flex items-center gap-3">
          <el-button v-if="!config.currentInstance" type="primary" :icon="Plus" @click="instanceDialog = true">
            添加 Gerrit 实例
          </el-button>
          <el-tag :type="config.currentInstance ? 'success' : 'info'" round>
            {{ config.currentInstance ? '配置就绪' : '等待配置' }}
          </el-tag>
          <el-select
            v-model="config.currentInstanceId"
            placeholder="选择实例"
            style="width: 240px"
            :disabled="!config.instances.length"
            @change="config.setCurrent"
          >
            <el-option v-for="item in config.instances" :key="item.id" :label="item.name" :value="item.id" />
          </el-select>
        </div>
      </header>
      <section class="min-h-0 flex-1 overflow-auto">
        <router-view />
      </section>
    </main>

    <GerritInstanceDialog v-model="instanceDialog" @saved="saveInstance" />
  </div>
</template>
