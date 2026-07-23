<script setup lang="ts">
import { ref } from 'vue'
import AppShell from '@/components/AppShell.vue'
import SettingsPanel from '@/components/SettingsPanel.vue'

const showSettings = ref(false)
</script>

<template>
  <AppShell @open-settings="showSettings = true">
    <router-view />
  </AppShell>

  <SettingsPanel v-model="showSettings" />
</template>
