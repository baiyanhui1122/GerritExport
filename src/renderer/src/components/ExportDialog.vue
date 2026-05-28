<script setup lang="ts">
import { reactive, watch } from 'vue'
import type { ExportFormat, ExportRange } from '@shared/types'

const visible = defineModel<boolean>({ required: true })
const props = defineProps<{ count: number; selectedCount: number; hasSingle: boolean; initialFormat: ExportFormat }>()
const emit = defineEmits<{
  submit: [options: { format: ExportFormat; range: ExportRange; includeQuery: boolean; includeReviewMessages: boolean; includeInlineComments: boolean; includeFiles: boolean }]
}>()

const form = reactive({
  format: 'txt' as ExportFormat,
  range: 'selected' as ExportRange,
  includeQuery: true,
  includeReviewMessages: true,
  includeInlineComments: true,
  includeFiles: true
})

watch(
  () => visible.value,
  (value) => {
    if (value && props.selectedCount === 0) form.range = props.hasSingle ? 'single' : 'all'
    if (value) form.format = props.initialFormat
  }
)
</script>

<template>
  <el-dialog v-model="visible" title="导出提交信息" width="520px">
    <el-form label-position="top">
      <el-form-item label="导出格式">
        <el-radio-group v-model="form.format">
          <el-radio-button label="txt">TXT</el-radio-button>
          <el-radio-button label="md">Markdown</el-radio-button>
          <el-radio-button label="xlsx">Excel</el-radio-button>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="导出范围">
        <el-radio-group v-model="form.range">
          <el-radio label="all">全部 {{ count }} 条</el-radio>
          <el-radio label="selected" :disabled="selectedCount === 0">已选 {{ selectedCount }} 条</el-radio>
          <el-radio label="single" :disabled="!hasSingle">当前单条</el-radio>
        </el-radio-group>
      </el-form-item>
      <div class="grid grid-cols-2 gap-2">
        <el-checkbox v-model="form.includeQuery">包含查询条件</el-checkbox>
        <el-checkbox v-model="form.includeReviewMessages">包含 Review Messages</el-checkbox>
        <el-checkbox v-model="form.includeInlineComments">包含 Inline Comments</el-checkbox>
      </div>
    </el-form>
    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" @click="emit('submit', form)">选择保存位置</el-button>
    </template>
  </el-dialog>
</template>
