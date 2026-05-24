<script setup lang="ts">
import type { ExportCommitItem } from '@shared/types'
import CommitPreview from './CommitPreview.vue'

const visible = defineModel<boolean>({ required: true })
defineProps<{ item?: ExportCommitItem }>()
</script>

<template>
  <el-drawer v-model="visible" size="48%" :with-header="false">
    <div v-if="item" class="space-y-5">
      <div>
        <div class="text-xs text-slate-500">#{{ item.changeNumber }} / {{ item.changeId }}</div>
        <h2 class="mt-2 text-xl font-semibold text-slate-950">{{ item.subject }}</h2>
        <div class="mt-3 flex gap-2">
          <el-tag>{{ item.status }}</el-tag>
          <el-tag type="info">{{ item.branch }}</el-tag>
        </div>
      </div>

      <el-descriptions :column="2" border>
        <el-descriptions-item label="Project">{{ item.project }}</el-descriptions-item>
        <el-descriptions-item label="Commit SHA">{{ item.commitSha }}</el-descriptions-item>
        <el-descriptions-item label="Author">{{ item.authorName }} &lt;{{ item.authorEmail }}&gt;</el-descriptions-item>
        <el-descriptions-item label="Author Date">{{ item.authorDate }}</el-descriptions-item>
        <el-descriptions-item label="Committer">{{ item.committerName }} &lt;{{ item.committerEmail }}&gt;</el-descriptions-item>
        <el-descriptions-item label="Committer Date">{{ item.committerDate }}</el-descriptions-item>
        <el-descriptions-item label="Owner">{{ item.ownerName }} {{ item.ownerEmail }}</el-descriptions-item>
        <el-descriptions-item label="Created">{{ item.created }}</el-descriptions-item>
        <el-descriptions-item label="Updated">{{ item.updated }}</el-descriptions-item>
        <el-descriptions-item label="Submitted">{{ item.submitted }}</el-descriptions-item>
        <el-descriptions-item label="Insertions">{{ item.insertions }}</el-descriptions-item>
        <el-descriptions-item label="Deletions">{{ item.deletions }}</el-descriptions-item>
        <el-descriptions-item label="Review URL" :span="2">
          <a class="text-brand" :href="item.reviewUrl">{{ item.reviewUrl }}</a>
        </el-descriptions-item>
      </el-descriptions>

      <section>
        <h3 class="mb-3 font-semibold">Git Log 格式预览</h3>
        <CommitPreview :text="item.gitLogText" />
      </section>

      <el-tabs>
        <el-tab-pane label="Commit Message">
          <pre class="mono whitespace-pre-wrap rounded-2xl bg-slate-100 p-4 text-xs">{{ item.commitMessage }}</pre>
        </el-tab-pane>
        <el-tab-pane label="Review Messages">
          <el-empty v-if="!item.reviewMessages?.length" description="未加载或暂无 Review Messages" />
          <el-timeline v-else>
            <el-timeline-item v-for="msg in item.reviewMessages" :key="`${msg.date}-${msg.patchSet}`" :timestamp="msg.date">
              <b>{{ msg.author }}</b>
              <pre class="mt-2 whitespace-pre-wrap text-xs">{{ msg.message }}</pre>
            </el-timeline-item>
          </el-timeline>
        </el-tab-pane>
        <el-tab-pane label="Inline Comments">
          <el-table :data="item.inlineComments || []" height="260">
            <el-table-column prop="filePath" label="File" min-width="220" />
            <el-table-column prop="line" label="Line" width="80" />
            <el-table-column prop="author" label="Author" width="140" />
            <el-table-column prop="message" label="Message" min-width="220" />
          </el-table>
        </el-tab-pane>
        <el-tab-pane label="Changed Files">
          <el-table :data="item.changedFiles || []" height="260">
            <el-table-column prop="filePath" label="File" min-width="260" />
            <el-table-column prop="status" label="Status" width="90" />
            <el-table-column prop="linesInserted" label="+ Lines" width="90" />
            <el-table-column prop="linesDeleted" label="- Lines" width="90" />
          </el-table>
        </el-tab-pane>
      </el-tabs>
    </div>
  </el-drawer>
</template>
