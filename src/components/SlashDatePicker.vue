<template>
  <a-config-provider :locale="locale">
    <a-date-picker
      v-model="selected"
      hide-trigger
      :style="{ width: '268px', margin: 'auto', boxShadow: 'none' }"
    >
      <template #cell="{ date }">
        <div class="arco-picker-date">
          <div class="arco-picker-date-value" @click="selectDate(date)" :class="{ 'keyboard-focused': isCellFocused(date) }">
            {{ date.getDate() }}
          </div>
        </div>
      </template>
      <template #extra>
        <a-space size="mini">
          <a-button size="mini" @click="selectOffset(-1)"> {{ slash.yesterday }} </a-button>
          <a-button size="mini" @click="selectOffset(0)"> {{ slash.today }} </a-button>
          <a-button size="mini" @click="selectOffset(1)"> {{ slash.tomorrow }} </a-button>
        </a-space>
      </template>
    </a-date-picker>
  </a-config-provider>
</template>

<script lang="ts" setup>
import dayjs from 'dayjs';
import { useLocale } from '@/hooks/useLocale';
import { i18n as siyuanI18n } from '@/hooks/useSiYuan';
import { onMounted, onUnmounted } from 'vue';

const emit = defineEmits<{
  (e: 'select', date: Date): void;
}>();

const { locale } = useLocale();
const slash = computed(() => {
  const value = (siyuanI18n.value as Record<string, any>)?.slash;
  return {
    today: value?.today ?? 'Today',
    tomorrow: value?.tomorrow ?? 'Tomorrow',
    yesterday: value?.yesterday ?? 'Yesterday',
  };
});
const selected = ref<string | undefined>(undefined);

// Keyboard navigation state
const focusedDate = ref<Date | undefined>(undefined);
const isKeyboardFocused = ref(false);

function selectDate(date: Date) {
  // Update keyboard focus state on click
  focusedDate.value = date;
  isKeyboardFocused.value = true;
  emit('select', date);
}

function selectOffset(offset: number) {
  const date = dayjs().add(offset, 'day').toDate();
  focusedDate.value = date;
  isKeyboardFocused.value = true;
  emit('select', date);
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
        selectDate(focusedDate.value);
      }
      break;
  }
}

// Keyboard navigation functions
function navigateDate(offset: number, unit: 'day' | 'week' | 'month') {
  const current = focusedDate.value || new Date();
  const newDate = dayjs(current).add(offset, unit).toDate();
  focusedDate.value = newDate;
  isKeyboardFocused.value = true;
}

function moveToFirstOfMonth() {
  const current = focusedDate.value || new Date();
  const newDate = dayjs(current).date(1).toDate();
  focusedDate.value = newDate;
  isKeyboardFocused.value = true;
}

function moveToLastOfMonth() {
  const current = focusedDate.value || new Date();
  const newDate = dayjs(current).endOf('month').toDate();
  focusedDate.value = newDate;
  isKeyboardFocused.value = true;
}

// Check if a cell has keyboard focus
function isCellFocused(date: Date): boolean {
  if (!isKeyboardFocused.value || !focusedDate.value) {
    return false;
  }
  return dayjs(date).isSame(focusedDate.value, 'day');
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
