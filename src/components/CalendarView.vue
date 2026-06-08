<template>
  <DatePickerPanel :quick-actions="quickActions" :is-date-existing="isDateExisting" @select="openDailyNote" @panel-change="changePanelDate" />
</template>
<script lang="ts" setup>
import dayjs from 'dayjs';
import * as api from '@/api/api';
import { openDoc } from '@/api/daily-note';
import { useLocale, formatMsg } from '@/hooks/useLocale';
import { CusNotebook } from '@/utils/notebook';
import DatePickerPanel from '@/components/DatePickerPanel.vue';
import { useDailyNoteMarkers } from '@/hooks/useDailyNoteMarkers';

const { locale } = useLocale();

const props = defineProps<{ notebook: CusNotebook | undefined }>();
const { notebook } = toRefs(props);
const quickActions = computed(() => [{ offset: 0, label: locale.value.datePicker.today }]);
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
