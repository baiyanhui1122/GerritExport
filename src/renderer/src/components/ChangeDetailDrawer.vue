<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'
import type { ChangedFileItem, ExportCommitItem } from '@shared/types'
import CommitPreview from './CommitPreview.vue'

const visible = defineModel<boolean>({ required: true })
defineProps<{ item?: ExportCommitItem }>()

const fileViewerVisible = ref(false)
const selectedFile = ref<ChangedFileItem>()
const fileViewMode = ref<'diff' | 'content'>('diff')
const diffViewerRef = ref<HTMLElement>()

const selectedFileTitle = computed(() => selectedFile.value?.filePath || '')
const selectedDiffRows = computed(() => selectedFile.value?.diffRows || [])

function openReviewUrl(url?: string) {
  if (!url) return
  window.urovo.openExternal(url)
}

function openFileViewer(row: ChangedFileItem, mode: 'diff' | 'content') {
  selectedFile.value = row
  fileViewMode.value = mode
  fileViewerVisible.value = true
  if (mode === 'diff') scrollToFirstChangedLine()
}

function clearFileViewer() {
  selectedFile.value = undefined
}

async function scrollToFirstChangedLine() {
  if (fileViewMode.value !== 'diff') return
  await nextTick()
  window.setTimeout(() => {
    const target = diffViewerRef.value?.querySelector('.diff-added, .diff-removed')
    target?.scrollIntoView({ block: 'center' })
  }, 0)
}
</script>

<template>
  <el-drawer v-model="visible" size="58%" :with-header="false">
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
          <el-button link type="primary" @click="openReviewUrl(item.reviewUrl)">{{ item.reviewUrl }}</el-button>
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
          <el-table :data="item.inlineComments || []" height="320">
            <el-table-column prop="filePath" label="File" min-width="220" />
            <el-table-column prop="line" label="Line" width="80" />
            <el-table-column prop="author" label="Author" width="140" />
            <el-table-column prop="message" label="Message" min-width="220" />
          </el-table>
        </el-tab-pane>

        <el-tab-pane label="Changed Files">
          <el-table :data="item.changedFiles || []" height="420">
            <el-table-column prop="filePath" label="File" min-width="320" show-overflow-tooltip />
            <el-table-column prop="status" label="Status" width="86" />
            <el-table-column prop="linesInserted" label="+ Lines" width="90" />
            <el-table-column prop="linesDeleted" label="- Lines" width="90" />
            <el-table-column label="Diff" width="96">
              <template #default="{ row }">
                <el-button v-if="row.diffRows?.length || row.diff" link type="primary" @click="openFileViewer(row, 'diff')">查看</el-button>
                <el-tag v-else-if="row.diffError" type="warning">失败</el-tag>
                <span v-else class="text-slate-400">-</span>
              </template>
            </el-table-column>
            <el-table-column label="Content" width="108">
              <template #default="{ row }">
                <el-button v-if="row.content" link type="primary" @click="openFileViewer(row, 'content')">查看</el-button>
                <el-tag v-else-if="row.contentError" type="warning">失败</el-tag>
                <span v-else class="text-slate-400">-</span>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
      </el-tabs>
    </div>
  </el-drawer>

  <el-dialog v-model="fileViewerVisible" :title="selectedFileTitle" width="86vw" top="5vh" class="file-viewer-dialog" @opened="scrollToFirstChangedLine" @closed="clearFileViewer">
    <el-tabs v-model="fileViewMode">
      <el-tab-pane label="Diff" name="diff" lazy>
        <el-alert v-if="selectedFile?.diffError" :title="selectedFile.diffError" type="warning" show-icon :closable="false" />
        <div v-else-if="selectedDiffRows.length" ref="diffViewerRef" class="diff-viewer">
          <div
            v-for="(line, index) in selectedDiffRows"
            :key="index"
            class="diff-row"
            :class="{
              'diff-added': line.type === 'added',
              'diff-removed': line.type === 'removed',
              'diff-skip': line.type === 'skip'
            }"
          >
            <span class="diff-line-no">{{ line.oldLine ?? '' }}</span>
            <span class="diff-line-no">{{ line.newLine ?? '' }}</span>
            <span class="diff-mark">{{ line.type === 'added' ? '+' : line.type === 'removed' ? '-' : ' ' }}</span>
            <code>{{ line.text }}</code>
          </div>
        </div>
        <pre v-else-if="selectedFile?.diff" class="file-content-viewer">{{ selectedFile.diff }}</pre>
        <el-empty v-else description="未拉取 Diff" />
      </el-tab-pane>

      <el-tab-pane label="完整文件内容" name="content" lazy>
        <el-alert v-if="selectedFile?.contentError" :title="selectedFile.contentError" type="warning" show-icon :closable="false" />
        <pre v-else-if="selectedFile?.content" class="file-content-viewer">{{ selectedFile.content }}</pre>
        <el-empty v-else description="未拉取完整文件内容" />
      </el-tab-pane>
    </el-tabs>
  </el-dialog>
</template>

<style scoped>
.diff-viewer,
.file-content-viewer {
  max-height: 68vh;
  overflow: auto;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 10px;
  background: #ffffff;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 12px;
  line-height: 1.6;
}

.file-content-viewer {
  margin: 0;
  padding: 14px;
  white-space: pre;
}

.diff-row {
  display: grid;
  grid-template-columns: 56px 56px 24px minmax(0, 1fr);
  min-width: max-content;
  border-left: 3px solid transparent;
  white-space: pre;
}

.diff-row code {
  padding: 1px 12px 1px 0;
  color: inherit;
}

.diff-line-no {
  padding-right: 10px;
  color: #94a3b8;
  text-align: right;
  user-select: none;
  background: rgba(148, 163, 184, 0.1);
}

.diff-mark {
  color: #64748b;
  text-align: center;
  user-select: none;
}

.diff-added {
  border-left-color: #22c55e;
  background: #dcfce7;
  color: #14532d;
}

.diff-removed {
  border-left-color: #ef4444;
  background: #fee2e2;
  color: #7f1d1d;
}

.diff-skip {
  margin: 8px 0;
  border-left-color: transparent;
  background: #f1f5f9;
  color: #64748b;
}
</style>
