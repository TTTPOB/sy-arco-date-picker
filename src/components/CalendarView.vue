<template>
  <DatePickerPanel :quick-actions="quickActions" :is-date-existing="isDateExisting" @select="openDailyNote" @panel-change="changePanelDate" />
</template>
<script lang="ts" setup>
import dayjs from 'dayjs';
import * as api from '@/api/api';
import { openDoc } from '@/api/daily-note';
import { useLocale, formatMsg } from '@/hooks/useLocale';
import { i18n as siyuanI18n } from '@/hooks/useSiYuan';
import { CusNotebook } from '@/utils/notebook';
import DatePickerPanel from '@/components/DatePickerPanel.vue';
import { useDailyNoteMarkers } from '@/hooks/useDailyNoteMarkers';

const { locale } = useLocale();

const props = defineProps<{ notebook: CusNotebook | undefined }>();
const { notebook } = toRefs(props);
const datePickerActions = computed(() => {
  const value = (siyuanI18n.value as Record<string, any>)?.slash;
  return {
    today: value?.today ?? locale.value.datePicker.today,
    tomorrow: value?.tomorrow ?? 'Tomorrow',
    yesterday: value?.yesterday ?? 'Yesterday',
  };
});
const quickActions = computed(() => {
  return [
    { offset: -1, label: datePickerActions.value.yesterday },
    { offset: 0, label: datePickerActions.value.today },
    { offset: 1, label: datePickerActions.value.tomorrow },
  ];
});
const { changePanelDate, getDailyNoteId, isDateExisting, markDailyNote } = useDailyNoteMarkers(notebook);

async function openDailyNote(date: Date) {
  if (!notebook.value) {
    await api.pushErrMsg(formatMsg('notNoteBook'));
    return;
  }
  const dateStr = dayjs(date).format('YYYY-MM-DD');
  const dailyNoteId = getDailyNoteId(date);
  if (dailyNoteId) {
    openDoc(dailyNoteId);
    return;
  }
  const dailyNote = await notebook.value.createDailyNote(date);
  const { id } = dailyNote;
  openDoc(id); //打开新建的日记
  markDailyNote(dateStr, id);
}
</script>
