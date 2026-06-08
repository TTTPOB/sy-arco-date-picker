import dayjs from 'dayjs';
import { refreshSql } from '@/api/utils';
import { eventBus } from '@/hooks/useSiYuan';
import type { CusNotebook } from '@/utils/notebook';
import type { Ref } from 'vue';

export function useDailyNoteMarkers(notebook: Ref<CusNotebook | undefined>) {
  const existDailyNotesMap = ref(new Map<string, BlockId>());
  const panelDate = ref(new Date());

  async function getExistDate(date: Date) {
    if (!notebook.value) {
      return;
    }
    const existDailyNotes = await notebook.value.getExistDailyNote(date);
    if (!existDailyNotes) {
      return;
    }
    for (const { id, dateStr } of existDailyNotes) {
      existDailyNotesMap.value.set(dateStr, id);
    }
  }

  function changePanelDate(date: Date) {
    panelDate.value = date;
    void getExistDate(panelDate.value);
  }

  function isDateExisting(date: Date) {
    return existDailyNotesMap.value.has(dayjs(date).format('YYYY-MM-DD'));
  }

  function getDailyNoteId(date: Date) {
    return existDailyNotesMap.value.get(dayjs(date).format('YYYY-MM-DD'));
  }

  function markDailyNote(dateStr: string, id: BlockId) {
    existDailyNotesMap.value.set(dateStr, id);
  }

  watch(notebook, notebook => {
    existDailyNotesMap.value.clear();
    if (notebook) {
      void getExistDate(new Date());
    }
  });

  eventBus.value?.on('ws-main', async ({ detail }) => {
    if (!notebook.value) {
      return;
    }
    const { cmd } = detail;
    if (['removeDoc', 'createdailynote'].includes(cmd)) {
      await refreshSql();
      await getExistDate(panelDate.value);
    }
  });

  return {
    existDailyNotesMap,
    panelDate,
    getExistDate,
    changePanelDate,
    isDateExisting,
    getDailyNoteId,
    markDailyNote,
  };
}
