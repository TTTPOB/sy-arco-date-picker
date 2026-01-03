# Fork Information

This is a fork of [svchord/siyuan-arco-calendar](https://github.com/svchord/siyuan-arco-calendar).

## Changes from Upstream

This fork includes the following changes compared to the upstream repository:

- **Keyboard Navigation**: Added keyboard navigation support for the date picker with arrow keys to move between dates
- **Focus Indicators**: Added visual focus indicators for keyboard navigation accessibility
- **Slash Date Picker**: Added slash command integration (`/date`) to quickly insert date links
- **Enhanced Close Behavior**: Improved the date picker close behavior when using keyboard navigation

The upstream repository was last synced at commit `634099b` (version 1.5.0).

---

# Original Content

# arco-calendar

[简体中文](README.md) \| English

Siyuan note calendar plug-in developed by relying on arco design component library

<img width="1280" alt="preview" src="https://github.com/svchord/siyuan-arco-calendar/assets/61345763/6bdf09a9-b5a1-48f7-b499-340d44397787">

## Reference and Thanks

- First implementation of BryceAndJuly in the community
- HowcanoeWang/calendar decompilation and function expansion of the previous project
- The WebSocket package template provided by Jiuyan

## Modify Color

Insert the following code into theme.css and modify the color by yourself

```css
// The color of the dark mode is to add "[data-theme-mode='dark']" at the beginning of the next two lines
.arco-tabs,
.arco-trigger-popup {
  // primary color (r,g,b)
  --arco-primary: 53, 117, 240;
  --primary-6: var(--arco-primary);
  // light primary color
  --color-primary-light-2: var(--b3-theme-primary-lightest);

  // page background color
  --color-bg-1: var(--b3-menu-background);
  // The background color of the drop-down selection box
  --color-bg-2: var(--b3-menu-background);
  // Background color of drop-down selection box && floating background color of drop-down menu options
  --color-fill-2: var(--b3-list-hover);
  --color-fill-3: var(--b3-list-hover);

  // calendar background color
  --color-bg-popup: var(--b3-menu-background);

  // border color
  --color-neutral-3: var(--b3-border-color);

  // text color
  --color-text-1: var(--b3-theme-on-background);
}
```

## Changelog

[Changelog](./CHANGELOG.md)

## License

[License](./LICENSE)
