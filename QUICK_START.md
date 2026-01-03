# Quick Start Guide

快速开始使用 OneNote Clipper（30秒开始使用）

## 前提条件

- VSCode 1.74+
- Microsoft 账户（个人或组织账户）
- 有效的 OneNote 访问权限

## 快速开始

### 1. 安装扩展

从 [VSCode Marketplace](https://marketplace.visualstudio.com/) 安装 OneNote Clipper

### 2. 发送代码

**发送选中内容：**
1. 选中代码
2. 按 `Ctrl+Alt+O`（或右键 → "发送选中内容到OneNote"）
3. 选择笔记本和分区
4. 完成！

**发送整个文件：**
1. 打开文件
2. 按 `Ctrl+Shift+Alt+O`（或右键 → "发送整个文件到OneNote"）
3. 选择笔记本和分区
4. 完成！

### 3. 首次使用

首次发送时会提示登录Microsoft账户：
1. 在浏览器中登录你的Microsoft账户
2. 授权扩展访问OneNote
3. 完成！

就这么简单！

## 配置默认位置（可选）

在 VSCode 设置中：

```json
{
  "onenote.defaultNotebook": "我的笔记本",
  "onenote.defaultSection": "代码片段"
}
```

## 常见问题

**Q: 需要配置Azure应用吗？**
A: 不需要！扩展使用预配置的公共应用，开箱即用。

**Q: 扩展会收集我的数据吗？**
A: 不会。数据直接发送到你的OneNote，不经过第三方服务器。

**Q: 可以在多台电脑上使用吗？**
A: 可以！任何安装了扩展的VSCode都可以使用。

## 需要帮助？

- 详细文档：[README.md](README.md)
- 报告问题：[GitHub Issues](https://github.com/your-repo/vscode-onenote-clipper/issues)

---

**祝你使用愉快！** 📝