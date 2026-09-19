<template>
  <a-config-provider :locale="locale">
    <div class="date-picker-shell calendar-date-picker">
      <div class="date-picker-shell__header">
        <div class="date-picker-shell__title">{{ i18n.tabName }}</div>
        <select
          v-model="selectNotebookId"
          class="b3-select date-picker-shell__notebook"
          :aria-label="i18n.placeholder"
          :title="i18n.placeholder"
        >
          <option :value="undefined" disabled>{{ i18n.placeholder }}</option>
          <option v-for="notebook in cusNotebooks" :key="notebook.id" :value="notebook.id">
            {{ notebook.name }}
          </option>
        </select>
      </div>
      <CalendarView :notebook="selectNotebook" />
    </div>
  </a-config-provider>
</template>

<script lang="ts" setup>
import CalendarView from '@/components/CalendarView.vue';
import { useLocale } from '@/hooks/useLocale';
import { i18n } from '@/hooks/useSiYuan';
import { useDailyNoteNotebook } from '@/hooks/useDailyNoteNotebook';

const { locale } = useLocale();
const { cusNotebooks, selectNotebookId, selectNotebook } = useDailyNoteNotebook();
</script>
