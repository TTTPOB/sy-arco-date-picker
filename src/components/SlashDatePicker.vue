<template>
  <a-config-provider :locale="locale">
    <div class="date-picker-shell slash-date-picker">
      <div class="slash-date-picker__header">
        <div class="slash-date-picker__title">{{ siyuanI18n.tabName }}</div>
        <select
          v-model="selectNotebookId"
          class="b3-select slash-date-picker__notebook"
          :aria-label="siyuanI18n.placeholder"
          :title="siyuanI18n.placeholder"
        >
          <option :value="undefined" disabled>{{ siyuanI18n.placeholder }}</option>
          <option v-for="notebook in cusNotebooks" :key="notebook.id" :value="notebook.id">
            {{ notebook.name }}
          </option>
        </select>
      </div>
      <DatePickerPanel
        :quick-actions="quickActions"
        :is-date-existing="isDateExisting"
        stop-immediate-propagation
        auto-focus
        @select="selectDate"
        @panel-change="changePanelDate"
        @close="emit('close')"
      />
    </div>
  </a-config-provider>
</template>

<script lang="ts" setup>
import { useLocale } from '@/hooks/useLocale';
import { i18n as siyuanI18n } from '@/hooks/useSiYuan';
import DatePickerPanel from '@/components/DatePickerPanel.vue';
import { useDailyNoteMarkers } from '@/hooks/useDailyNoteMarkers';
import { useDailyNoteNotebook } from '@/hooks/useDailyNoteNotebook';

const emit = defineEmits<{
  (e: 'select', date: Date, notebookId: NotebookId | undefined): void;
  (e: 'close'): void;
}>();

const { locale } = useLocale();
const { cusNotebooks, selectNotebookId, selectNotebook } = useDailyNoteNotebook();
const { changePanelDate, isDateExisting } = useDailyNoteMarkers(selectNotebook);
const slash = computed(() => {
  const value = (siyuanI18n.value as Record<string, any>)?.slash;
  return {
    today: value?.today ?? 'Today',
    tomorrow: value?.tomorrow ?? 'Tomorrow',
    yesterday: value?.yesterday ?? 'Yesterday',
  };
});
const quickActions = computed(() => [
  { offset: -1, label: slash.value.yesterday },
  { offset: 0, label: slash.value.today },
  { offset: 1, label: slash.value.tomorrow },
]);

function selectDate(date: Date) {
  emit('select', date, selectNotebookId.value);
}
</script>
