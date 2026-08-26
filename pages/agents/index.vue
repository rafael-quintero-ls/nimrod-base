<script setup lang="ts">
import ModuleComingSoon from '@/views/shared/ModuleComingSoon.vue'

definePageMeta({
  action: 'read',
  subject: 'Agent',
})
</script>

<template>
  <ModuleComingSoon
    title="Agents"
    description="Catalog, configuration, and runtime status for the agents this platform will orchestrate."
  />
</template>
