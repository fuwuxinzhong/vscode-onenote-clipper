# 发布检查清单

在发布 OneNote Clipper 扩展之前，请确保完成以下所有检查。

## 安全检查 ✅

- [x] 代码中不包含硬编码的凭据
- [x] `.vscode/settings.json` 在 `.gitignore` 中
- [x] `credentials.txt` 在 `.gitignore` 中
- [x] 所有敏感信息通过 VSCode 配置系统管理
- [x] 运行 `check-security.ps1` 通过

## 功能检查 ✅

- [x] 登录功能正常
- [x] 登出功能正常
- [x] 发送选中内容功能正常
- [x] 发送整个文件功能正常
- [x] 选择目标位置功能正常
- [x] 快捷键配置正确
- [x] 右键菜单显示正确
- [x] 欢迎指南正常显示
- [x] 配置验证正常工作

## 文档检查 ✅

- [x] README.md 更新完整
- [x] USER_GUIDE.md 详细说明配置步骤
- [x] CONFIGURE_CREDENTIALS.md 包含安全建议
- [x] AZURE_SETUP.md 提供Azure配置步骤
- [x] CHANGELOG.md 记录版本更新（需要创建）
- [x] LICENSE 文件存在（需要创建）
- [x] CONTRIBUTING.md 说明贡献流程（需要创建）

## 代码质量检查 ✅

- [x] TypeScript 编译无错误
- [x] 代码风格一致
- [x] 错误处理完善
- [x] 用户提示清晰
- [x] 日志输出适当

## 配置检查 ✅

- [x] package.json 配置正确
- [x] tsconfig.json 配置正确
- [x] .vscodeignore 配置正确
- [x] 版本号更新
- [x] 所有依赖项正确

## 测试检查 ⚠️

- [ ] 在 Windows 上测试
- [ ] 在 macOS 上测试
- [ ] 在 Linux 上测试
- [ ] 测试个人账户登录
- [ ] 测试组织账户登录
- [ ] 测试不同文件类型
- [ ] 测试大文件发送
- [ ] 测试网络异常情况
- [ ] 测试令牌刷新

## 发布前检查 ⚠️

- [ ] 更新版本号
- [ ] 更新 CHANGELOG.md
- [ ] 创建发布说明
- [ ] 准备截图
- [ ] 测试打包的扩展
- [ ] 准备 Marketplace 描述
- [ ] 准备标签和分类

## Marketplace 检查 ⚠️

- [ ] 创建 Visual Studio Marketplace 账户
- [ ] 准备扩展图标
- [ ] 准备扩展封面图
- [ ] 准备扩展截图
- [ ] 编写扩展描述
- [ ] 设置扩展标签
- [ ] 选择扩展分类
- [ ] 配置扩展定价（免费）

## 法律检查 ⚠️

- [ ] 检查许可证是否正确
- [ ] 确认第三方依赖的许可证兼容
- [ ] 确认隐私政策（如果需要）
- [ ] 确认服务条款（如果需要）

## 发布后检查 ⚠️

- [ ] 监控扩展下载量
- [ ] 监控用户反馈
- [ ] 及时回复 Issues
- [ ] 准备版本更新计划

## 必需的文件清单

### 根目录文件

- [x] package.json
- [x] tsconfig.json
- [x] .gitignore
- [x] .vscodeignore
- [x] README.md
- [x] USER_GUIDE.md
- [x] CONFIGURE_CREDENTIALS.md
- [x] AZURE_SETUP.md
- [ ] CHANGELOG.md
- [ ] LICENSE
- [ ] CONTRIBUTING.md

### 源代码文件

- [x] src/extension.ts
- [x] src/authService.ts
- [x] src/oneNoteService.ts
- [x] src/config.ts
- [x] src/welcomeGuide.ts

### 配置文件

- [x] .vscode/launch.json
- [x] .vscode/tasks.json

### 工具文件

- [x] check-security.ps1
- [x] create-app-device.ps1
- [ ] settings.example.json

## 发布命令

```bash
# 编译
npm run compile

# 打包扩展
npm install -g vsce
vsce package

# 发布到 Marketplace
vsce publish
```

## 注意事项

1. **不要提交敏感信息**：确保 `.gitignore` 正确配置，不要提交包含凭据的文件

2. **版本管理**：每次发布前更新版本号和 CHANGELOG.md

3. **测试充分**：在多个平台上测试，确保兼容性

4. **用户文档**：确保文档清晰易懂，特别是配置指南

5. **安全第一**：始终优先考虑安全性，不要为了方便而牺牲安全

6. **及时响应**：发布后及时响应用户反馈和问题

## 发布流程

1. 完成上述所有检查
2. 更新版本号和 CHANGELOG.md
3. 编译并打包扩展
4. 测试打包的扩展
5. 准备 Marketplace 材料
6. 发布到 Visual Studio Marketplace
7. 监控反馈和问题
8. 持续维护和更新

---

**重要**：只有在完成所有检查后才能发布扩展！