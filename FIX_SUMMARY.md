# 问题分析与修复总结

## 问题描述
VS Code 扩展在按 F5 调试运行时正常，但打包安装后无法运行。

## 根本原因
**动态 require 导致模块加载失败**

在 `src/oneNoteService.ts` 文件中，第374行使用了动态 `require`：

```typescript
const taskLists = require('markdown-it-task-lists');
```

这种动态 require 在 TypeScript 编译后，VS Code 扩展打包工具（vsce）无法正确解析和打包依赖，导致安装后运行时找不到模块。

## 修复步骤

### 1. 添加静态 import
在文件顶部添加静态 import：

```typescript
import taskLists = require('markdown-it-task-lists');
```

### 2. 移除动态 require
将原来的动态 require 代码块：

```typescript
try {
  const taskLists = require('markdown-it-task-lists');
  md.use(taskLists);
} catch (e) {
  console.warn('markdown-it-task-lists not available, continuing without it');
}
```

改为：

```typescript
try {
  md.use(taskLists);
} catch (e) {
  console.warn('markdown-it-task-lists not available, continuing without it');
}
```

### 3. 添加类型声明
由于 `markdown-it-task-lists` 没有官方类型定义，创建了 `src/types/markdown-it-task-lists.d.ts`：

```typescript
declare module 'markdown-it-task-lists' {
  import MarkdownIt from 'markdown-it';
  
  const taskLists: MarkdownIt.PluginSimple;
  export = taskLists;
}
```

### 4. 重新编译
运行 `npm run compile` 重新编译 TypeScript 代码。

## 验证结果

编译后的 `out/oneNoteService.js` 现在包含静态 require：

```javascript
const taskLists = require("markdown-it-task-lists");
```

这种静态 require 可以被 VS Code 扩展打包工具正确识别和打包。

## 如何测试修复

1. **清理旧的打包文件**：
   ```bash
   del *.vsix
   ```

2. **重新打包扩展**：
   ```bash
   vsce package
   ```

3. **安装测试**：
   - 在 VS Code 中按 `Ctrl+Shift+P`
   - 输入 "Extensions: Install from VSIX"
   - 选择新生成的 `.vsix` 文件

4. **验证功能**：
   - 尝试登录 Microsoft 账户
   - 发送代码片段到 OneNote
   - 发送 Markdown 文件到 OneNote

## 其他注意事项

### .vscodeignore 配置
当前的 `.vscodeignore` 配置是正确的：
- 排除了源代码 `src/**`
- 排除了 sourcemap `**/*.map`
- 排除了 TypeScript 源文件 `**/*.ts`
- 没有排除 `node_modules`（依赖需要被打包）

### 依赖声明
确保 `package.json` 中正确声明了所有依赖：

```json
"dependencies": {
  "axios": "^1.6.0",
  "markdown-it": "^14.1.0",
  "markdown-it-task-lists": "^2.1.1"
}
```

## 总结

**核心问题**：动态 require 在 VS Code 扩展打包后无法正确加载模块。

**解决方案**：使用静态 import 替代动态 require，确保打包工具能够正确识别和包含依赖。

**修复文件**：
- `src/oneNoteService.ts`（主要修复）
- `src/types/markdown-it-task-lists.d.ts`（新增类型声明）

现在扩展应该可以正常打包并在安装后运行了。
