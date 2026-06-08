import { Constants } from 'siyuan';
import { lsNotebooks, pushErrMsg, request } from '@/api/api';
import { formatMsg } from '@/hooks/useLocale';
import { eventBus } from '@/hooks/useSiYuan';
import { refreshSql } from '@/api/utils';
import { CusNotebook } from '@/utils/notebook';

const DAILY_NOTE_STORAGE_KEY = 'local-dailynoteid';

export function useDailyNoteNotebook() {
  const cusNotebooks = ref<CusNotebook[]>([]);
  const selectNotebookId = ref<NotebookId | undefined>(undefined);
  const selectNotebook = computed(() => cusNotebooks.value.find(book => book.id === selectNotebookId.value));
  let initialized = false;

  async function loadNotebooks() {
    const { notebooks } = await lsNotebooks();
    const books = notebooks.filter((book: Notebook) => !book.closed);
    const nextNotebooks: CusNotebook[] = [];
    for (const book of books) {
      nextNotebooks.push(await CusNotebook.build(book));
    }

    const storage = await request('/api/storage/getLocalStorage');
    const storedNotebookId = storage[DAILY_NOTE_STORAGE_KEY];
    cusNotebooks.value = nextNotebooks;
    selectNotebookId.value = nextNotebooks.some(book => book.id === storedNotebookId) ? storedNotebookId : undefined;
    initialized = true;
  }

  async function saveNotebookSelection(bookId: NotebookId | undefined) {
    if (!bookId) {
      await pushErrMsg(formatMsg('notNoteBook'));
      return;
    }

    const storage = await request('/api/storage/getLocalStorage');
    if (bookId === storage[DAILY_NOTE_STORAGE_KEY]) {
      return;
    }

    await request('/api/storage/setLocalStorageVal', {
      app: Constants.SIYUAN_APPID,
      key: DAILY_NOTE_STORAGE_KEY,
      val: bookId,
    });
  }

  async function reloadNotebooks() {
    await refreshSql();
    cusNotebooks.value = [];
    await loadNotebooks();
  }

  void loadNotebooks();

  eventBus.value?.on('ws-main', async ({ detail }) => {
    const { cmd } = detail;
    if (['createnotebook', 'mount', 'unmount'].includes(cmd)) {
      await reloadNotebooks();
    }
  });

  watch(selectNotebookId, async bookId => {
    if (!initialized) {
      return;
    }
    await saveNotebookSelection(bookId);
  });

  return {
    cusNotebooks,
    selectNotebookId,
    selectNotebook,
    loadNotebooks,
    reloadNotebooks,
    saveNotebookSelection,
  };
}
