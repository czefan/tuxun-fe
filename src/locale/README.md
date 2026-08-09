# 国际化多语言 (`src/locale`)

本目录包含 `tuxun-fe` 项目的多语言 i18n 配置与语言包。

---

## 📂 字典目录

- `zh-Hans.json`：简体中文字典
- `en.json`：英文字典
- `index.ts`：i18n 实例初始化与语言切换逻辑

---

## 📐 编写规则

1. 业务文本按模块分组书写（如 `common.*`, `auth.*`, `photo.*`）。
2. 在 Vue 模板中使用 `$t('key')` 或在 TS 中使用 `i18n.global.t('key')`。
