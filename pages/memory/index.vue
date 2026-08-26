<script setup lang="ts">
import ModuleComingSoon from '@/views/shared/ModuleComingSoon.vue'

definePageMeta({
  action: 'read',
  subject: 'Memory',
})
</script>

<template>
  <ModuleComingSoon
    title="Context & Memory"
    description="What context persists across agent runs, and for how long."
  />
</template>
