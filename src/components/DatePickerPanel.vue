<template>
  <div ref="containerRef" tabindex="0" @mousedown="focusContainer">
    <a-date-picker
      v-model="selected"
      :picker-value="panelValue"
      @picker-value-change="changeMonth"
      hide-trigger
      :style="{ width: '268px', margin: 'auto', boxShadow: 'none' }"
    >
      <template #cell="{ date }">
        <div class="arco-picker-date">
          <div
            class="arco-picker-date-value"
            @click="selectDate(date)"
            :class="{ exist: isDateExisting(date), 'keyboard-focused': isCellFocused(date) }"
          >
            {{ date.getDate() }}
          </div>
        </div>
      </template>
      <template #extra>
        <a-space v-if="quickActions.length > 1" size="mini">
          <a-button v-for="action in quickActions" :key="action.offset" size="mini" @click="selectOffset(action.offset)">
            {{ action.label }}
          </a-button>
        </a-space>
        <a-row v-else-if="quickActions.length === 1" style="text-align: center">
          <a-button size="mini" @click="selectOffset(quickActions[0].offset)">
            {{ quickActions[0].label }}
          </a-button>
        </a-row>
      </template>
    </a-date-picker>
  </div>
</template>

<script lang="ts" setup>
import dayjs from 'dayjs';
import { onMounted, onUnmounted } from 'vue';

type QuickAction = {
  offset: number;
  label: string;
};

const props = withDefaults(
  defineProps<{
    quickActions?: QuickAction[];
    isDateExisting?: (date: Date) => boolean;
    stopImmediatePropagation?: boolean;
    autoFocus?: boolean;
  }>(),
  {
    quickActions: () => [],
    isDateExisting: () => false,
    stopImmediatePropagation: false,
    autoFocus: false,
  },
);

const emit = defineEmits<{
  (e: 'select', date: Date): void;
  (e: 'panel-change', date: Date): void;
  (e: 'close'): void;
}>();

const containerRef = ref<HTMLElement | null>(null);
const selected = ref<string | undefined>(undefined);
const panelValue = ref(dayjs(new Date()).format('YYYY-MM-DD'));
const panelDate = ref(new Date());
const focusedDate = ref<Date | undefined>(undefined);
const isKeyboardFocused = ref(false);

const quickActions = computed(() => props.quickActions);

function focusContainer() {
  containerRef.value?.focus();
}

function syncFocusedDate(date: Date) {
  focusedDate.value = date;
  isKeyboardFocused.value = true;
  panelValue.value = dayjs(date).format('YYYY-MM-DD');
  panelDate.value = new Date(panelValue.value);
}

function selectDate(date: Date) {
  syncFocusedDate(date);
  emit('select', date);
}

function selectOffset(offset: number) {
  selectDate(dayjs().add(offset, 'day').toDate());
}

function changeMonth(dateStr: string) {
  panelValue.value = dateStr;
  panelDate.value = new Date(dateStr);
  emit('panel-change', panelDate.value);
}

function stopEvent(event: KeyboardEvent) {
  if (props.stopImmediatePropagation) {
    event.stopImmediatePropagation();
  }
  event.preventDefault();
}

function handleKeyDown(event: KeyboardEvent) {
  const key = event.key;

  switch (key) {
    case 'ArrowUp':
      stopEvent(event);
      navigateDate(-1, 'week');
      break;
    case 'ArrowDown':
      stopEvent(event);
      navigateDate(1, 'week');
      break;
    case 'ArrowLeft':
      stopEvent(event);
      navigateDate(-1, 'day');
      break;
    case 'ArrowRight':
      stopEvent(event);
      navigateDate(1, 'day');
      break;
    case 'Home':
      stopEvent(event);
      moveToFirstOfMonth();
      break;
    case 'End':
      stopEvent(event);
      moveToLastOfMonth();
      break;
    case 'PageUp':
      stopEvent(event);
      navigateDate(-1, 'month');
      break;
    case 'PageDown':
      stopEvent(event);
      navigateDate(1, 'month');
      break;
    case 'Enter':
    case ' ':
      stopEvent(event);
      if (focusedDate.value) {
        selectDate(focusedDate.value);
      }
      break;
    case 'Escape':
      if (props.stopImmediatePropagation) {
        stopEvent(event);
        emit('close');
      }
      break;
  }
}

function updatePanelForDate(date: Date) {
  if (dayjs(date).month() !== dayjs(panelDate.value).month() || dayjs(date).year() !== dayjs(panelDate.value).year()) {
    changeMonth(dayjs(date).format('YYYY-MM-DD'));
  }
}

function navigateDate(offset: number, unit: 'day' | 'week' | 'month') {
  const current = focusedDate.value || panelDate.value;
  const newDate = dayjs(current).add(offset, unit).toDate();
  focusedDate.value = newDate;
  isKeyboardFocused.value = true;
  if (unit === 'month') {
    changeMonth(dayjs(newDate).format('YYYY-MM-DD'));
    return;
  }
  updatePanelForDate(newDate);
}

function moveToFirstOfMonth() {
  const current = focusedDate.value || panelDate.value;
  const newDate = dayjs(current).date(1).toDate();
  focusedDate.value = newDate;
  isKeyboardFocused.value = true;
  updatePanelForDate(newDate);
}

function moveToLastOfMonth() {
  const current = focusedDate.value || panelDate.value;
  const newDate = dayjs(current).endOf('month').toDate();
  focusedDate.value = newDate;
  isKeyboardFocused.value = true;
  updatePanelForDate(newDate);
}

function isCellFocused(date: Date): boolean {
  if (!isKeyboardFocused.value || !focusedDate.value) {
    return false;
  }
  return dayjs(date).isSame(focusedDate.value, 'day');
}

onMounted(() => {
  focusedDate.value = new Date();
  isKeyboardFocused.value = true;
  panelValue.value = dayjs(focusedDate.value).format('YYYY-MM-DD');
  panelDate.value = new Date(panelValue.value);
  containerRef.value?.addEventListener('keydown', handleKeyDown, { capture: props.stopImmediatePropagation });
  if (props.autoFocus) {
    containerRef.value?.focus();
  }
});

onUnmounted(() => {
  containerRef.value?.removeEventListener('keydown', handleKeyDown, { capture: props.stopImmediatePropagation });
});
</script>
