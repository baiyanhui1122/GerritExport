# Urovo Export

Urovo Export 是一个基于 Electron + Vue 3 + TypeScript 的 Gerrit Change Exporter 桌面工具，用于批量查询 Gerrit 修改并导出 git log 风格提交信息。

## 功能

- 多 Gerrit 实例配置：地址、用户名、HTTP Password/Token、默认 Project/Branch、打开 URL 模板。
- Gerrit REST 查询：支持 Project、Branch、Status、Date Type、起止日期、Owner、Reviewer、关键词、Change Number、Change-Id。
- 自动处理 Gerrit XSSI 前缀 `)]}'`。
- 查询结果卡片列表展示，支持预览、详情 Drawer、打开 Gerrit 页面、复制提交信息。
- 导出 TXT、Markdown、Excel。
- Excel 包含提交列表、Commit Message、Review Messages、Inline Comments、Changed Files 五个 Sheet。
- 本地导出历史记录。

## 安装

```bash
npm install
```

## 开发运行

```bash
npm run dev
```

## 构建

```bash
npm run build
```

构建后的 Electron 运行产物在：

```text
out/
```

如果需要生成 Windows 安装包和免安装版：

```bash
npm run dist
```

生成结果在：

```text
release/
```

## 使用流程

1. 打开「Gerrit 配置」，新增 Gerrit 实例。
2. 填写 Gerrit 地址、用户名和 HTTP Password/Token。
3. 点击「测试连接」确认可访问。
4. 回到「查询导出」，输入 Branch、Status、日期等筛选条件。
5. 点击「查询」，在列表中预览或打开 Gerrit 页面。
6. 选择记录后导出 TXT、Markdown 或 Excel。

## 导出格式说明

所有导出和详情预览统一使用 `src/shared/formatGitLog.ts` 中的 `formatGitLogText`，保证 TXT、Markdown、Excel 与界面预览一致：

```text
commit {commitSha}
Author: {authorName} <{authorEmail}>
Date:   {authorDate}

    {commitMessageLine1}
    {commitMessageLine2}
```

## Gerrit URL 模板

默认模板：

```text
{base}/c/{project}/+/{number}
```

如果 Gerrit 版本较旧，可以改为：

```text
{base}/#/c/{number}
```

## 目录结构

```text
src/
  main/       Electron 主进程、IPC、Gerrit 查询、导出服务
  preload/    安全暴露给渲染端的 API
  renderer/   Vue 3 前端界面
  shared/     前后端共享类型、查询构造、git log 格式化
```
