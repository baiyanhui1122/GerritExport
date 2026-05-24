<script setup lang="ts">
import type { QueryOptions } from '@shared/types'

defineProps<{ disabled?: boolean }>()
const model = defineModel<QueryOptions>({ required: true })
const emit = defineEmits<{ search: []; reset: []; cancel: [] }>()
</script>

<template>
  <el-form label-position="top" class="glass-panel rounded-[24px] p-5">
    <div class="grid grid-cols-5 gap-4">
      <el-form-item label="Project">
        <el-input v-model="model.project" placeholder="优先使用当前实例默认 Project" clearable />
      </el-form-item>
      <el-form-item label="Branch">
        <el-input v-model="model.branch" placeholder="优先使用当前实例默认 Branch" clearable />
      </el-form-item>
      <el-form-item label="Status">
        <el-select v-model="model.status" class="w-full">
          <el-option label="open" value="open" />
          <el-option label="merged" value="merged" />
          <el-option label="abandoned" value="abandoned" />
          <el-option label="all" value="all" />
        </el-select>
      </el-form-item>
      <el-form-item label="Date Type">
        <el-select v-model="model.dateType" class="w-full">
          <el-option label="更新时间 updated" value="updated" />
          <el-option label="合入时间 merged" value="merged" />
          <el-option label="创建时间 created" value="created" />
        </el-select>
      </el-form-item>
      <el-form-item label="关键词">
        <el-input v-model="model.keyword" placeholder="subject / message" clearable />
      </el-form-item>
      <el-form-item label="Start Date">
        <el-date-picker v-model="model.startDate" type="date" value-format="YYYY-MM-DD" class="w-full" />
      </el-form-item>
      <el-form-item label="End Date">
        <el-date-picker v-model="model.endDate" type="date" value-format="YYYY-MM-DD" class="w-full" />
      </el-form-item>
      <el-form-item label="Owner">
        <el-input v-model="model.owner" clearable />
      </el-form-item>
      <el-form-item label="Reviewer">
        <el-input v-model="model.reviewer" clearable />
      </el-form-item>
      <el-form-item label="Change Number / Change-Id">
        <div class="flex gap-2">
          <el-input v-model="model.changeNumber" placeholder="#70135" clearable />
          <el-input v-model="model.changeId" placeholder="I..." clearable />
        </div>
      </el-form-item>
    </div>

    <el-collapse class="border-0">
      <el-collapse-item title="高级选项" name="advanced">
        <div class="grid grid-cols-6 gap-4">
          <el-form-item label="包含 Review Messages">
            <el-switch v-model="model.includeReviewMessages" />
          </el-form-item>
          <el-form-item label="包含 Inline Comments">
            <el-switch v-model="model.includeInlineComments" />
          </el-form-item>
          <el-form-item label="包含 Changed Files">
            <el-switch v-model="model.includeFiles" />
          </el-form-item>
          <el-form-item label="每页数量">
            <el-input-number v-model="model.pageSize" :min="20" :max="100" />
          </el-form-item>
          <el-form-item label="最大查询数量">
            <el-input-number v-model="model.maxResults" :min="1" :max="5000" />
          </el-form-item>
          <el-form-item label="并发数量">
            <el-input-number v-model="model.concurrency" :min="1" :max="10" />
          </el-form-item>
        </div>
      </el-collapse-item>
    </el-collapse>

    <div class="mt-2 flex justify-end gap-2">
      <el-button :disabled="disabled" @click="emit('reset')">重置</el-button>
      <el-button v-if="disabled" type="danger" @click="emit('cancel')">取消查询</el-button>
      <el-button v-else type="primary" @click="emit('search')">查询</el-button>
    </div>
  </el-form>
</template>
