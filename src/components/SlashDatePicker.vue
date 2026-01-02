<template>
  <a-config-provider :locale="locale">
    <a-date-picker
      v-model="selected"
      hide-trigger
      :style="{ width: '268px', margin: 'auto', boxShadow: 'none' }"
    >
      <template #cell="{ date }">
        <div class="arco-picker-date">
          <div class="arco-picker-date-value" @click="selectDate(date)">
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

function selectDate(date: Date) {
  emit('select', date);
}

function selectOffset(offset: number) {
  const date = dayjs().add(offset, 'day').toDate();
  emit('select', date);
}
</script>
