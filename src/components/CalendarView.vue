<template>
  <a-date-picker
    v-model="thisDay"
    @picker-value-change="changeMonth"
    hide-trigger
    style="width: 268px; margin: auto; box-shadow: none"
  >
    <template #cell="{ date }">
      <div class="arco-picker-date">
        <div class="arco-picker-date-value" @click="openDailyNote(date)" :class="{ exist: getCell(date), 'keyboard-focused': isCellFocused(date) }">
          {{ date.getDate() }}
        </div>
      </div>
    </template>
    <template #extra>
      <a-row style="text-align: center">
        <a-button size="mini" @click="clickToday"> {{ locale.datePicker.today }} </a-button>
      </a-row>
    </template>
  </a-date-picker>
</template>
<script lang="ts" setup>
import dayjs from 'dayjs';
import * as api from '@/api/api';
import { openDoc } from '@/api/daily-note';
import { useLocale, formatMsg } from '@/hooks/useLocale';
import { eventBus } from '@/hooks/useSiYuan';
import { CusNotebook } from '@/utils/notebook';
import { refreshSql } from '@/api/utils';
import { onMounted, onUnmounted } from 'vue';

const { locale } = useLocale();

const props = defineProps<{ notebook: CusNotebook | undefined }>();
const { notebook } = toRefs(props);

//已存在日记的日期
const existDailyNotesMap = ref(new Map());

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

watch(notebook, notebook => {
  existDailyNotesMap.value.clear();
  if (notebook) {
    getExistDate(new Date());
  }
});

const thisDay = ref();

// Keyboard navigation state
const focusedDate = ref<Date | undefined>(undefined);
const isKeyboardFocused = ref(false);

function clickToday() {
  const today = new Date();
  focusedDate.value = today;
  isKeyboardFocused.value = true;
  openDailyNote(today);
  thisDay.value = dayjs(today).format('YYYY-MM-DD');
}

async function openDailyNote(date: Date) {
  // Update keyboard focus state on click
  focusedDate.value = date;
  isKeyboardFocused.value = true;

  if (!notebook.value) {
    await api.pushErrMsg(formatMsg('notNoteBook'));
    return;
  }
  const dateStr = dayjs(date).format('YYYY-MM-DD');
  if (existDailyNotesMap.value.has(dateStr)) {
    openDoc(existDailyNotesMap.value.get(dateStr));
    return;
  }
  const dailyNote = await notebook.value.createDailyNote(date);
  const { id } = dailyNote;
  openDoc(id); //打开新建的日记
  existDailyNotesMap.value.set(dateStr, id);
}

const thisPanelDate = ref(new Date());
function changeMonth(dateStr: string) {
  thisPanelDate.value = new Date(dateStr);
  getExistDate(thisPanelDate.value);
}

// Keyboard event handler
function handleKeyDown(event: KeyboardEvent) {
  const key = event.key;

  switch (key) {
    case 'ArrowUp':
      event.preventDefault();
      navigateDate(-1, 'week');
      break;
    case 'ArrowDown':
      event.preventDefault();
      navigateDate(1, 'week');
      break;
    case 'ArrowLeft':
      event.preventDefault();
      navigateDate(-1, 'day');
      break;
    case 'ArrowRight':
      event.preventDefault();
      navigateDate(1, 'day');
      break;
    case 'Home':
      event.preventDefault();
      moveToFirstOfMonth();
      break;
    case 'End':
      event.preventDefault();
      moveToLastOfMonth();
      break;
    case 'PageUp':
      event.preventDefault();
      navigateDate(-1, 'month');
      break;
    case 'PageDown':
      event.preventDefault();
      navigateDate(1, 'month');
      break;
    case 'Enter':
    case ' ':
      event.preventDefault();
      if (focusedDate.value) {
        openDailyNote(focusedDate.value);
      }
      break;
  }
}

// Keyboard navigation functions
function navigateDate(offset: number, unit: 'day' | 'week' | 'month') {
  const current = focusedDate.value || thisPanelDate.value;
  const newDate = dayjs(current).add(offset, unit).toDate();
  focusedDate.value = newDate;
  isKeyboardFocused.value = true;
  // Update panel date if we navigated to a different month
  if (unit === 'month' || dayjs(newDate).month() !== dayjs(thisPanelDate.value).month()) {
    const dateStr = dayjs(newDate).format('YYYY-MM-DD');
    changeMonth(dateStr);
  }
}

function moveToFirstOfMonth() {
  const current = focusedDate.value || thisPanelDate.value;
  const newDate = dayjs(current).date(1).toDate();
  focusedDate.value = newDate;
  isKeyboardFocused.value = true;
  if (dayjs(newDate).month() !== dayjs(thisPanelDate.value).month()) {
    const dateStr = dayjs(newDate).format('YYYY-MM-DD');
    changeMonth(dateStr);
  }
}

function moveToLastOfMonth() {
  const current = focusedDate.value || thisPanelDate.value;
  const newDate = dayjs(current).endOf('month').toDate();
  focusedDate.value = newDate;
  isKeyboardFocused.value = true;
  if (dayjs(newDate).month() !== dayjs(thisPanelDate.value).month()) {
    const dateStr = dayjs(newDate).format('YYYY-MM-DD');
    changeMonth(dateStr);
  }
}

eventBus.value?.on('ws-main', async ({ detail }) => {
  if (!notebook.value) {
    return;
  }
  const { cmd } = detail;
  if (['removeDoc', 'createdailynote'].includes(cmd)) {
    await refreshSql();
    await getExistDate(thisPanelDate.value);
  }
});

// Check if a cell has keyboard focus
function isCellFocused(date: Date): boolean {
  if (!isKeyboardFocused.value || !focusedDate.value) {
    return false;
  }
  return dayjs(date).isSame(focusedDate.value, 'day');
}

// 设置 cell 类
function getCell(date: Date) {
  return existDailyNotesMap.value.has(dayjs(date).format('YYYY-MM-DD'));
}

// Set up keyboard event listener when component mounts
onMounted(() => {
  document.addEventListener('keydown', handleKeyDown);
});

// Clean up event listener when component unmounts
onUnmounted(() => {
  document.removeEventListener('keydown', handleKeyDown);
});
</script>
