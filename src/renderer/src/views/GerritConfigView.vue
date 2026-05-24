<script setup lang="ts">
import { reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import type { GerritInstance } from '@shared/types'
import { useConfigStore } from '../stores/configStore'

const config = useConfigStore()
const testingId = ref('')
const saving = ref(false)

const form = reactive<GerritInstance>({
  id: '',
  name: '',
  baseUrl: '',
  username: '',
  token: '',
  defaultProject: '',
  defaultBranch: '',
  urlTemplate: '{base}/c/{project}/+/{number}'
})

function createId(): string {
  return `gerrit-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function clearForm() {
  Object.assign(form, {
    id: '',
    name: '',
    baseUrl: '',
    username: '',
    token: '',
    defaultProject: '',
    defaultBranch: '',
    urlTemplate: '{base}/c/{project}/+/{number}'
  })
}

function edit(item: GerritInstance) {
  Object.assign(form, {
    ...item,
    urlTemplate: item.urlTemplate || '{base}/c/{project}/+/{number}'
  })
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function normalizeInstance(): GerritInstance {
  return {
    ...form,
    id: form.id || createId(),
    name: form.name.trim(),
    baseUrl: form.baseUrl.trim().replace(/\/+$/, ''),
    username: form.username.trim(),
    token: form.token,
    defaultProject: form.defaultProject?.trim(),
    defaultBranch: form.defaultBranch?.trim(),
    urlTemplate: form.urlTemplate?.trim() || '{base}/c/{project}/+/{number}'
  }
}

async function save() {
  const instance = normalizeInstance()
  if (!instance.name || !instance.baseUrl) {
    ElMessage.warning('名称和 Gerrit 地址必填')
    return
  }

  saving.value = true
  try {
    await config.saveInstance(instance)
    await config.setCurrent(instance.id)
    clearForm()
    ElMessage.success('Gerrit 实例已保存并设为当前')
  } catch (error) {
    ElMessage.error(`保存失败：${error instanceof Error ? error.message : String(error)}`)
  } finally {
    saving.value = false
  }
}

async function remove(item: GerritInstance) {
  try {
    await ElMessageBox.confirm(`确认删除 ${item.name}？`, '删除配置', { type: 'warning' })
    await config.deleteInstance(item.id)
    if (form.id === item.id) clearForm()
    ElMessage.success('已删除')
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(`删除失败：${error instanceof Error ? error.message : String(error)}`)
    }
  }
}

async function setCurrent(item: GerritInstance) {
  await config.setCurrent(item.id)
  ElMessage.success(`已切换到 ${item.name}`)
}

async function test(item?: GerritInstance) {
  const target = item || normalizeInstance()
  if (!target.baseUrl) {
    ElMessage.warning('请先填写 Gerrit 地址')
    return
  }
  testingId.value = target.id || 'form'
  try {
    const result = await window.urovo.testConnection(target)
    if (result.ok) ElMessage.success(result.message)
    else ElMessage.error(result.message)
  } catch (error) {
    ElMessage.error(`测试失败：${error instanceof Error ? error.message : String(error)}`)
  } finally {
    testingId.value = ''
  }
}
</script>

<template>
  <div class="space-y-4 pb-8">
    <section class="glass-panel rounded-[24px] p-5">
      <div class="mb-5 flex items-start justify-between gap-4">
        <div>
          <h2 class="text-lg font-semibold">{{ form.id ? '编辑 Gerrit 实例' : '添加 Gerrit 实例' }}</h2>
          <p class="mt-1 text-sm text-slate-500">填写 Gerrit 地址和 HTTP Password/Token，保存后即可在查询页使用。</p>
        </div>
        <el-button :icon="Plus" @click="clearForm">新建空白配置</el-button>
      </div>

      <el-form label-position="top">
        <div class="grid grid-cols-4 gap-4">
          <el-form-item label="显示名称">
            <el-input v-model="form.name" placeholder="内网 Gerrit" />
          </el-form-item>
          <el-form-item label="Gerrit 地址">
            <el-input v-model="form.baseUrl" placeholder="http://192.168.8.238" />
          </el-form-item>
          <el-form-item label="用户名">
            <el-input v-model="form.username" placeholder="yangqichao" />
          </el-form-item>
          <el-form-item label="HTTP Password / Token">
            <el-input v-model="form.token" type="password" show-password />
          </el-form-item>
          <el-form-item label="默认 Project">
            <el-input v-model="form.defaultProject" placeholder="可选" />
          </el-form-item>
          <el-form-item label="默认 Branch">
            <el-input v-model="form.defaultBranch" placeholder="可选" />
          </el-form-item>
          <el-form-item label="URL 打开模板" class="col-span-2">
            <el-input v-model="form.urlTemplate" />
          </el-form-item>
        </div>
        <div class="flex justify-end gap-2">
          <el-button :loading="testingId === 'form'" @click="test()">测试当前填写</el-button>
          <el-button type="primary" :loading="saving" @click="save">保存并设为当前</el-button>
        </div>
      </el-form>
    </section>

    <section class="glass-panel rounded-[24px] p-5">
      <div class="mb-5 flex items-center justify-between">
        <div>
          <h2 class="text-lg font-semibold">已保存实例</h2>
          <p class="text-sm text-slate-500">可测试连接、编辑、删除或切换当前实例。</p>
        </div>
        <el-tag round>{{ config.instances.length }} 个实例</el-tag>
      </div>

      <el-table :data="config.instances" row-key="id" empty-text="暂无 Gerrit 实例，请先在上方添加">
        <el-table-column prop="name" label="名称" min-width="150" />
        <el-table-column prop="baseUrl" label="地址" min-width="220" show-overflow-tooltip />
        <el-table-column prop="username" label="用户名" width="140" />
        <el-table-column label="默认分支" min-width="180" show-overflow-tooltip>
          <template #default="{ row }">{{ row.defaultBranch || '-' }}</template>
        </el-table-column>
        <el-table-column label="状态" width="90">
          <template #default="{ row }">
            <el-tag v-if="config.currentInstanceId === row.id" type="success">当前</el-tag>
            <el-tag v-else type="info">备用</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="330" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="setCurrent(row)">设为当前</el-button>
            <el-button size="small" :loading="testingId === row.id" @click="test(row)">测试</el-button>
            <el-button size="small" @click="edit(row)">编辑</el-button>
            <el-button size="small" type="danger" @click="remove(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </section>
  </div>
</template>
