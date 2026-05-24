<script setup lang="ts">
defineProps<{ text: string }>()
</script>

<template>
  <pre class="mono max-h-[420px] overflow-auto rounded-2xl bg-slate-950 p-4 text-xs leading-6 text-slate-100">{{ text }}</pre>
</template>
