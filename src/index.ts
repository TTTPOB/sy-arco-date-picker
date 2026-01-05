import CalendarApp from './App.vue';
import SlashDatePicker from './components/SlashDatePicker.vue';
import { Plugin, Menu, Setting, getFrontend, Constants } from 'siyuan';
import dayjs from 'dayjs';
import { app, i18n, isMobile, eventBus, position } from './hooks/useSiYuan';
import SySelect from './lib/SySelect.vue';
import { lsNotebooks, request, pushErrMsg } from './api/api';
import { CusNotebook } from './utils/notebook';
import { formatMsg } from './hooks/useLocale';
import './index.less';

const STORAGE_NAME = 'arco-calendar-entry';
type InsertFormat = 'block' | 'url';
type PositionValue = 'top-left' | 'top-right' | 'dock';

type PluginSettings = {
  position: PositionValue;
  insertFormat: InsertFormat;
};

const DEFAULT_SETTINGS: PluginSettings = {
  position: 'top-left',
  insertFormat: 'block',
};

type SlashProtyle = {
  insert: (content: string) => void;
};

type SlashPickerState = {
  container: HTMLDivElement;
  app: ReturnType<typeof createApp>;
  cleanup: () => void;
};

export default class ArcoCalendarPlugin extends Plugin {
  private topEle!: HTMLElement;
  private menuEle!: HTMLElement;
  private settings: PluginSettings = { ...DEFAULT_SETTINGS };
  private slashPicker?: SlashPickerState;

  async onload() {
    i18n.value = this.i18n;
    app.value = this.app;
    eventBus.value = this.eventBus;
    isMobile.value = ['mobile', 'browser-mobile'].includes(getFrontend());
    await this.init();
    this.initSlashCommands();
  }

  onunload() {
    this.topEle?.remove();
    this.menuEle?.remove();
    this.disposeSlashPicker();
  }

  private async init() {
    const data = await this.loadData(STORAGE_NAME);
    if (!data) {
      await this.saveData(STORAGE_NAME, { ...DEFAULT_SETTINGS });
      this.settings = { ...DEFAULT_SETTINGS };
      position.value = DEFAULT_SETTINGS.position;
    } else {
      this.settings = { ...DEFAULT_SETTINGS, ...(data as Partial<typeof DEFAULT_SETTINGS>) };
      position.value = this.settings.position;
    }
    if (position.value === 'top-left') {
      this.addTopItem('left');
    } else if (position.value === 'top-right') {
      this.addTopItem('right');
    } else if (position.value === 'dock') {
      this.addDockItem();
    }
    this.initSetting();
  }

  private initSetting() {
    this.setting = new Setting({
      height: 'auto',
      width: '500px',
      confirmCallback: async () => {
        const positionChanged = position.value !== this.settings.position;
        this.settings.position = position.value as PositionValue;
        await this.saveData(STORAGE_NAME, this.settings);
        if (positionChanged) {
          window.location.reload();
        }
      },
    });
    const selectEle = document.createElement('div');
    createApp(SySelect).mount(selectEle);
    this.setting.addItem({
      title: i18n.value.position.title,
      actionElement: selectEle,
    });

    const notebookSelect = document.createElement('select');
    notebookSelect.className = 'b3-select fn__flex-center fn__size200';
    notebookSelect.addEventListener('change', async () => {
      await this.saveNotebookSelection(notebookSelect.value);
    });
    void this.populateNotebookOptions(notebookSelect);
    this.setting.addItem({
      title: i18n.value.settings?.notebook ?? '日记笔记本',
      actionElement: notebookSelect,
    });

    const formatSelect = document.createElement('select');
    formatSelect.className = 'b3-select fn__flex-center fn__size200';
    this.populateFormatOptions(formatSelect);
    formatSelect.addEventListener('change', () => {
      this.settings.insertFormat = formatSelect.value as InsertFormat;
    });
    this.setting.addItem({
      title: i18n.value.settings?.insertFormat ?? '插入格式',
      actionElement: formatSelect,
    });
  }

  private populateFormatOptions(select: HTMLSelectElement) {
    const options = [
      { value: 'block', label: i18n.value.settings?.insertBlock ?? '块引用 ((id))' },
      { value: 'url', label: i18n.value.settings?.insertUrl ?? '链接 [标题](siyuan://blocks/id)' },
    ];
    select.innerHTML = '';
    for (const option of options) {
      const item = document.createElement('option');
      item.value = option.value;
      item.textContent = option.label;
      if (option.value === this.settings.insertFormat) {
        item.selected = true;
      }
      select.appendChild(item);
    }
  }

  private async populateNotebookOptions(select: HTMLSelectElement) {
    select.innerHTML = '';
    const placeholder = document.createElement('option');
    placeholder.value = '';
    placeholder.textContent = i18n.value.placeholder ?? '选择笔记本...';
    select.appendChild(placeholder);
    try {
      const { notebooks } = await lsNotebooks();
      const storage = await request('/api/storage/getLocalStorage');
      const currentId = storage?.['local-dailynoteid'];
      for (const book of notebooks) {
        if (book.closed) {
          continue;
        }
        const option = document.createElement('option');
        option.value = book.id;
        option.textContent = book.name;
        if (book.id === currentId) {
          option.selected = true;
        }
        select.appendChild(option);
      }
    } catch {
      await pushErrMsg(formatMsg('notNoteBook'));
    }
  }

  private async saveNotebookSelection(notebookId: string) {
    if (!notebookId) {
      await pushErrMsg(formatMsg('notNoteBook'));
      return;
    }
    await request('/api/storage/setLocalStorageVal', {
      app: Constants.SIYUAN_APPID,
      key: 'local-dailynoteid',
      val: notebookId,
    });
  }

  private addTopItem(direction: 'left' | 'right') {
    this.topEle = this.addTopBar({
      icon: 'iconCalendar',
      title: this.i18n.openCalendar,
      position: direction,
      callback: () => {
        let rect = this.topEle.getBoundingClientRect();
        // 如果被隐藏，则使用更多按钮
        if (rect.width === 0) {
          rect = document.querySelector('#barMore')!.getBoundingClientRect();
        }
        const menu = new Menu('Calendar');
        menu.addItem({ element: this.menuEle });
        if (isMobile.value) {
          menu.fullscreen();
        } else {
          menu.open({
            x: rect[direction],
            y: rect.bottom,
            isLeft: direction !== 'left',
          });
        }
      },
    });
    this.menuEle = document.createElement('div');
    createApp(CalendarApp).mount(this.menuEle);
  }

  private addDockItem() {
    const _plugin = this;
    this.addDock({
      config: {
        position: 'RightTop',
        size: { width: 300, height: 0 },
        icon: 'iconCalendar',
        title: _plugin.i18n.tabName,
      },
      data: {},
      type: 'dock_tab',
      init: dock => {
        createApp(CalendarApp).mount(dock.element);
      },
    });
  }

  private initSlashCommands() {
    this.protyleSlash = [
      {
        id: 'arco-date-picker',
        filter: ['date', '日期', 'riqi'],
        html: `<div class=\"b3-list-item__first\"><span class=\"b3-list-item__text\">${i18n.value.slash?.date ?? '日期选择'}</span><span class=\"b3-list-item__meta\">/date</span></div>`,
        callback: ((protyle: SlashProtyle, nodeElement?: HTMLElement) => {
          this.openSlashDatePicker(protyle, nodeElement);
        }) as unknown as (protyle: SlashProtyle) => void,
      },
      {
        id: 'arco-date-picker-today',
        filter: ['today', '今天'],
        html: `<div class=\"b3-list-item__first\"><span class=\"b3-list-item__text\">${i18n.value.slash?.today ?? '今天'}</span><span class=\"b3-list-item__meta\">/today</span></div>`,
        callback: protyle => {
          void this.insertWithOffset(protyle, 0);
        },
      },
      {
        id: 'arco-date-picker-tomorrow',
        filter: ['tomorrow', '明天'],
        html: `<div class=\"b3-list-item__first\"><span class=\"b3-list-item__text\">${i18n.value.slash?.tomorrow ?? '明天'}</span><span class=\"b3-list-item__meta\">/tomorrow</span></div>`,
        callback: protyle => {
          void this.insertWithOffset(protyle, 1);
        },
      },
      {
        id: 'arco-date-picker-yesterday',
        filter: ['yesterday', '昨天'],
        html: `<div class=\"b3-list-item__first\"><span class=\"b3-list-item__text\">${i18n.value.slash?.yesterday ?? '昨天'}</span><span class=\"b3-list-item__meta\">/yesterday</span></div>`,
        callback: protyle => {
          void this.insertWithOffset(protyle, -1);
        },
      },
    ];
  }

  private clearSlashInput(protyle: SlashProtyle) {
    const carte = (window as unknown as { Lute?: { Carte?: string } }).Lute?.Carte;
    if (carte) {
      protyle.insert(carte);
    }
  }

  private async insertWithOffset(protyle: SlashProtyle, offsetDays: number) {
    this.clearSlashInput(protyle);
    const targetDate = dayjs().add(offsetDays, 'day').toDate();
    await this.insertDailyNoteLink(protyle, targetDate);
  }

  private async insertDailyNoteLink(protyle: SlashProtyle, date: Date) {
    const notebook = await this.getSelectedNotebook();
    if (!notebook) {
      return;
    }
    const dailyNote = await notebook.createDailyNote(date);
    const content =
      this.settings.insertFormat === 'url'
        ? `[${dailyNote.dateStr}](siyuan://blocks/${dailyNote.id})`
        : `((${dailyNote.id} "${dailyNote.dateStr}"))`;
    protyle.insert(content);
  }

  private async getSelectedNotebook(): Promise<CusNotebook | null> {
    const storage = await request('/api/storage/getLocalStorage');
    const notebookId = storage?.['local-dailynoteid'];
    if (!notebookId) {
      await pushErrMsg(formatMsg('notNoteBook'));
      return null;
    }
    const { notebooks } = await lsNotebooks();
    const notebook = notebooks.find(book => book.id === notebookId);
    if (!notebook) {
      await pushErrMsg(formatMsg('notNoteBook'));
      return null;
    }
    return CusNotebook.build(notebook);
  }

  private openSlashDatePicker(protyle: SlashProtyle, nodeElement?: HTMLElement) {
    this.clearSlashInput(protyle);
    this.disposeSlashPicker();

    const container = document.createElement('div');
    container.className = 'arco-date-picker-popover';
    document.body.appendChild(container);
    this.positionPopover(container, nodeElement);

    const app = createApp(SlashDatePicker, {
      onSelect: async (date: Date) => {
        await this.insertDailyNoteLink(protyle, date);
        this.disposeSlashPicker();
      },
      onClose: () => {
        this.disposeSlashPicker();
      },
    });
    app.mount(container);

    const onMouseDown = (event: MouseEvent) => {
      if (!container.contains(event.target as Node)) {
        this.disposeSlashPicker();
      }
    };

    window.setTimeout(() => {
      document.addEventListener('mousedown', onMouseDown);
    }, 0);

    this.slashPicker = {
      container,
      app,
      cleanup: () => {
        document.removeEventListener('mousedown', onMouseDown);
      },
    };
  }

  private positionPopover(container: HTMLDivElement, nodeElement?: HTMLElement) {
    const margin = 8;
    const rect = nodeElement?.getBoundingClientRect();
    const initialTop = rect ? rect.bottom + margin : window.innerHeight / 2;
    const initialLeft = rect ? rect.left : window.innerWidth / 2;

    container.style.top = `${initialTop}px`;
    container.style.left = `${initialLeft}px`;

    requestAnimationFrame(() => {
      const bounds = container.getBoundingClientRect();
      let top = initialTop;
      let left = initialLeft;

      if (bounds.right > window.innerWidth - margin) {
        left = Math.max(margin, window.innerWidth - bounds.width - margin);
      }
      if (bounds.bottom > window.innerHeight - margin) {
        top = Math.max(margin, window.innerHeight - bounds.height - margin);
      }
      container.style.top = `${top}px`;
      container.style.left = `${left}px`;
    });
  }

  private disposeSlashPicker() {
    if (!this.slashPicker) {
      return;
    }
    this.slashPicker.cleanup();
    this.slashPicker.app.unmount();
    this.slashPicker.container.remove();
    this.slashPicker = undefined;
  }
}
