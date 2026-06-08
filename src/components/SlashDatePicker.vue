<template>
  <a-config-provider :locale="locale">
    <DatePickerPanel
      :quick-actions="quickActions"
      :is-date-existing="isDateExisting"
      stop-immediate-propagation
      auto-focus
      @select="selectDate"
      @panel-change="changePanelDate"
      @close="emit('close')"
    />
  </a-config-provider>
</template>

<script lang="ts" setup>
import { useLocale } from '@/hooks/useLocale';
import { i18n as siyuanI18n } from '@/hooks/useSiYuan';
import DatePickerPanel from '@/components/DatePickerPanel.vue';
import { useDailyNoteMarkers } from '@/hooks/useDailyNoteMarkers';
import type { CusNotebook } from '@/utils/notebook';

const emit = defineEmits<{
  (e: 'select', date: Date): void;
  (e: 'close'): void;
}>();

const props = defineProps<{ notebook?: CusNotebook }>();
const { notebook } = toRefs(props);
const { locale } = useLocale();
const { changePanelDate, isDateExisting } = useDailyNoteMarkers(notebook);
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
  emit('select', date);
}
</script>
