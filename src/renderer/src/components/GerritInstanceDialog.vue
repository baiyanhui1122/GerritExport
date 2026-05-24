<script setup lang="ts">
import { reactive, watch } from 'vue'
import { ElMessage } from 'element-plus'
import type { GerritInstance } from '@shared/types'

const visible = defineModel<boolean>({ required: true })
const props = defineProps<{ instance?: GerritInstance }>()
const emit = defineEmits<{ saved: [GerritInstance] }>()

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

function reset() {
  Object.assign(form, {
    id: props.instance?.id || createId(),
    name: props.instance?.name || '',
    baseUrl: props.instance?.baseUrl || '',
    username: props.instance?.username || '',
    token: props.instance?.token || '',
    defaultProject: props.instance?.defaultProject || '',
    defaultBranch: props.instance?.defaultBranch || '',
    urlTemplate: props.instance?.urlTemplate || '{base}/c/{project}/+/{number}'
  })
}

function normalize(): GerritInstance {
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
  const instance = normalize()
  if (!instance.name || !instance.baseUrl) {
    ElMessage.warning('名称和 Gerrit 地址必填')
    return
  }
  emit('saved', instance)
  visible.value = false
}

watch(
  () => visible.value,
  (value) => {
    if (value) reset()
  }
)
</script>

<template>
  <el-dialog v-model="visible" :title="props.instance ? '编辑 Gerrit 实例' : '添加 Gerrit 实例'" width="620px">
    <el-form label-position="top">
      <div class="grid grid-cols-2 gap-3">
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
      </div>
      <el-form-item label="URL 打开模板">
        <el-input v-model="form.urlTemplate" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" @click="save">保存并设为当前</el-button>
    </template>
  </el-dialog>
</template>
