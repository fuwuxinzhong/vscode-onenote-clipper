# Contributing to OneNote Clipper

感谢你对 OneNote Clipper 的兴趣！我们欢迎各种形式的贡献。

## 如何贡献

### 报告 Bug

如果你发现了 bug，请：

1. 检查 [Issues](https://github.com/your-repo/vscode-onenote-clipper/issues) 确保该 bug 还未被报告
2. 创建一个新的 Issue，包含：
   - 清晰的标题
   - 详细的问题描述
   - 复现步骤
   - 预期行为和实际行为
   - 截图（如果适用）
   - 环境信息（VSCode 版本、操作系统等）
   - **不要分享你的凭据或敏感信息**

### 提出功能请求

如果你有新的功能想法：

1. 检查 [Issues](https://github.com/your-repo/vscode-onenote-clipper/issues) 确保该功能还未被请求
2. 创建一个新的 Issue，包含：
   - 清晰的标题
   - 详细的功能描述
   - 使用场景
   - 为什么这个功能有用

### 提交代码

如果你想贡献代码：

1. Fork 本仓库
2. 创建你的特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交你的更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建一个 Pull Request

## 开发指南

### 环境设置

```bash
# 克隆仓库
git clone https://github.com/your-repo/vscode-onenote-clipper.git
cd vscode-onenote-clipper

# 安装依赖
npm install

# 编译
npm run compile

# 启动调试
# 在 VSCode 中按 F5
```

### 代码规范

- 使用 TypeScript 编写代码
- 遵循现有的代码风格
- 添加适当的注释
- 编写清晰的错误消息
- 确保代码通过 TypeScript 编译

### 安全要求

**重要**：在提交代码前，请确保：

- [x] 代码中不包含硬编码的凭据
- [x] 不提交 `.vscode/settings.json`（如果包含凭据）
- [x] 不提交 `credentials.txt` 或其他包含敏感信息的文件
- [x] 运行 `check-security.ps1` 确保通过安全检查
- [x] 不要在代码中记录或泄露用户凭据

### 提交规范

使用清晰的提交消息：

```
feat: 添加新功能
fix: 修复 bug
docs: 更新文档
style: 代码格式调整
refactor: 代码重构
test: 添加测试
chore: 构建/工具链相关
```

示例：

```
feat: 添加语法高亮支持

- 检测文件类型并应用相应的语法高亮
- 支持多种编程语言
- 改进代码在 OneNote 中的显示效果

Closes #123
```

### Pull Request 流程

1. 确保你的代码是最新的 (`git pull upstream main`)
2. 创建一个清晰的 PR 标题和描述
3. 引用相关的 Issue（如果适用）
4. 等待代码审查
5. 根据反馈进行修改
6. 等待合并

## 测试

在提交 PR 前，请确保：

- [ ] 代码编译无错误
- [ ] 功能正常工作
- [ ] 在不同平台上测试（如果可能）
- [ ] 通过安全检查
- [ ] 更新相关文档

## 文档

如果你添加了新功能或修改了现有功能，请更新相关文档：

- README.md
- USER_GUIDE.md
- CHANGELOG.md

## 行为准则

- 尊重所有贡献者
- 使用友好和包容的语言
- 接受建设性的批评
- 专注于对社区最有利的事情
- 对不同的观点和经历保持同理心

## 许可证

通过贡献代码，你同意你的贡献将在 [MIT License](LICENSE) 下发布。

## 联系方式

如果你有任何问题：

- 打开一个 Issue
- 发送邮件到 your-email@example.com

---

感谢你的贡献！🎉