<script setup lang="ts">
import ModuleComingSoon from '@/views/shared/ModuleComingSoon.vue'

definePageMeta({
  action: 'read',
  subject: 'Observability',
})
</script>

<template>
  <ModuleComingSoon
    title="Observability"
    description="Execution traces, logs, and quality evaluations for agent runs."
  />
</template>
