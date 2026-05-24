<script setup lang="ts">
import { reactive, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { useConfigStore } from '../stores/configStore'

const config = useConfigStore()
const form = reactive({ darkMode: false, defaultExportDir: '' })

watch(
  () => config.settings,
  (settings) => {
    form.darkMode = settings.darkMode
    form.defaultExportDir = settings.defaultExportDir || ''
  },
  { immediate: true, deep: true }
)

async function save() {
  try {
    await config.saveSettings({ ...form })
    document.documentElement.classList.toggle('dark', form.darkMode)
    ElMessage.success('设置已保存')
  } catch (error) {
    ElMessage.error(`保存失败：${error instanceof Error ? error.message : String(error)}`)
  }
}
</script>

<template>
  <section class="glass-panel max-w-3xl rounded-[24px] p-5">
    <h2 class="text-lg font-semibold">设置</h2>
    <p class="mb-5 text-sm text-slate-500">暗色模式会立即应用到整体界面；默认导出目录保留为后续扩展。</p>
    <el-form label-position="top">
      <el-form-item label="暗色模式">
        <el-switch v-model="form.darkMode" active-text="开启" inactive-text="关闭" />
      </el-form-item>
      <el-form-item label="默认导出目录">
        <el-input v-model="form.defaultExportDir" placeholder="可选，当前导出仍会弹出保存对话框" />
      </el-form-item>
      <el-button type="primary" @click="save">保存设置</el-button>
    </el-form>
  </section>
</template>
