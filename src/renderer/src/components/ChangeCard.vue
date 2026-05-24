<script setup lang="ts">
import type { ExportCommitItem } from '@shared/types'
import { shortSha, statusType } from '../utils/format'

defineProps<{ item: ExportCommitItem; selected: boolean }>()
const emit = defineEmits<{ toggle: [number]; preview: [ExportCommitItem]; open: [ExportCommitItem]; exportOne: [ExportCommitItem]; copy: [ExportCommitItem] }>()
</script>

<template>
  <article
    class="group rounded-[22px] border border-slate-200/70 bg-white/90 p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-soft"
    :class="item.error ? 'border-red-200 bg-red-50/80' : ''"
    @click="emit('preview', item)"
  >
    <div class="flex gap-4">
      <el-checkbox :model-value="selected" size="large" @click.stop @change="emit('toggle', item.changeNumber)" />
      <div class="min-w-0 flex-1">
        <div class="mb-2 flex items-center gap-2">
          <span class="truncate text-sm font-semibold text-slate-700">{{ item.project }}</span>
          <el-tag :type="statusType(item.status)" size="small" round>{{ item.status }}</el-tag>
          <el-tag v-if="item.error" type="danger" size="small" round>部分失败</el-tag>
          <el-tag v-else type="info" size="small" round>preview</el-tag>
        </div>
        <h3 class="truncate text-base font-semibold text-slate-950">{{ item.subject }}</h3>
        <div class="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-slate-500">
          <span>源 {{ item.branch }}</span>
          <span class="mono">{{ shortSha(item.commitSha) }}</span>
          <span>#{{ item.changeNumber }}</span>
          <span>{{ item.authorName || item.ownerName }}</span>
        </div>
        <div v-if="item.error" class="mt-2 text-xs text-red-600">{{ item.error }}</div>
      </div>
      <div class="flex shrink-0 items-center gap-2" @click.stop>
        <el-button size="small" @click="emit('preview', item)">预览</el-button>
        <el-button size="small" @click="emit('copy', item)">复制</el-button>
        <el-button size="small" @click="emit('exportOne', item)">导出单条</el-button>
        <el-button size="small" type="primary" @click="emit('open', item)">打开</el-button>
      </div>
    </div>
  </article>
</template>
