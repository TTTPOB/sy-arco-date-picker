<template>
  <a-config-provider :locale="locale">
    <a-tabs style="width: 280px">
      <template #extra>
        <a-select
          v-model="selectNotebookId"
          :options="cusNotebooks"
          :field-names="{ value: 'id', label: 'name' }"
          :style="{ width: '160px', margin: 'auto' }"
          :placeholder="i18n.placeholder"
          allow-search
        >
        </a-select>
      </template>
      <a-tab-pane key="1">
        <template #title> {{ i18n.tabName }} </template>
        <CalendarView :notebook="selectNotebook" />
      </a-tab-pane>
      <!-- <a-tab-pane key="2">
        </a-tab-pane> -->
    </a-tabs>
  </a-config-provider>
</template>

<script lang="ts" setup>
import CalendarView from '@/components/CalendarView.vue';
import { useLocale } from '@/hooks/useLocale';
import { i18n } from '@/hooks/useSiYuan';
import { useDailyNoteNotebook } from '@/hooks/useDailyNoteNotebook';

const { locale } = useLocale();
const { cusNotebooks, selectNotebookId, selectNotebook } = useDailyNoteNotebook();
</script>
