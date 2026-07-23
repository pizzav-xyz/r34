<script setup lang="ts">
import { useVModel } from '@vueuse/core'
import { ACCENT_PALETTE, useSettingsStore } from '@/stores/settings'
import type { AccentColorId, ThemeMode, WatchedMode } from '@/types'

const props = defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const show = useVModel(props, 'modelValue', emit)
const settings = useSettingsStore()

const THEMES: { value: ThemeMode; label: string; icon: string }[] = [
  { value: 'light', label: 'Light', icon: 'light_mode' },
  { value: 'dark', label: 'Dark', icon: 'dark_mode' },
  { value: 'system', label: 'System', icon: 'contrast' },
]

const WATCHED_MODES: { value: WatchedMode; label: string }[] = [
  { value: 'show', label: 'Show all' },
  { value: 'dim', label: 'Dim watched' },
  { value: 'hide', label: 'Hide watched' },
]
</script>

<template>
  <v-dialog
    v-model="show"
    max-width="480"
  >
    <v-card rounded="xl">
      <v-card-title class="d-flex align-center justify-space-between py-4 px-6">
        <span class="text-h6">Settings</span>
        <v-btn
          icon="close"
          variant="text"
          size="small"
          @click="show = false"
        />
      </v-card-title>

      <v-card-text class="px-6 pb-2">
        <!-- Theme -->
        <div class="text-caption text-medium-emphasis mb-2">Theme</div>
        <v-btn-toggle
          :model-value="settings.theme"
          mandatory
          density="comfortable"
          color="primary"
          class="mb-4"
          @update:model-value="settings.setTheme($event as ThemeMode)"
        >
          <v-btn
            v-for="t in THEMES"
            :key="t.value"
            :value="t.value"
            variant="outlined"
            size="small"
          >
            <v-icon start size="small">{{ t.icon }}</v-icon>
            {{ t.label }}
          </v-btn>
        </v-btn-toggle>

        <div class="text-caption text-medium-emphasis mb-2">Accent color</div>
        <div class="d-flex flex-wrap ga-2 mb-4">
          <v-btn
            v-for="accent in ACCENT_PALETTE"
            :key="accent.id"
            :aria-label="`Use ${accent.label} accent color`"
            :title="accent.label"
            :color="accent.light.primary"
            icon
            size="36"
            variant="flat"
            :elevation="settings.accentId === accent.id ? 3 : 0"
            @click="settings.setAccent(accent.id as AccentColorId)"
          >
            <v-icon
              v-if="settings.accentId === accent.id"
              color="white"
              size="small"
            >
              check
            </v-icon>
          </v-btn>
        </div>

        <!-- Safe Mode -->
        <div class="d-flex align-center justify-space-between mb-4">
          <div>
            <div class="text-body-2">Safe mode</div>
            <div class="text-caption text-medium-emphasis">Filter explicit results</div>
          </div>
          <v-switch
            :model-value="settings.safeMode"
            color="primary"
            density="compact"
            hide-details
            @update:model-value="settings.setSafeMode(!!$event)"
          />
        </div>

        <v-divider class="mb-4" />

        <!-- Watched Mode -->
        <div class="text-caption text-medium-emphasis mb-2">Watched posts</div>
        <v-btn-toggle
          :model-value="settings.watchedMode"
          mandatory
          density="comfortable"
          color="primary"
          @update:model-value="settings.setWatchedMode($event as WatchedMode)"
        >
          <v-btn
            v-for="m in WATCHED_MODES"
            :key="m.value"
            :value="m.value"
            variant="outlined"
            size="small"
          >
            {{ m.label }}
          </v-btn>
        </v-btn-toggle>
      </v-card-text>

      <v-card-actions class="px-6 pb-4">
        <v-spacer />
        <v-btn
          variant="flat"
          color="primary"
          @click="show = false"
        >
          Done
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
