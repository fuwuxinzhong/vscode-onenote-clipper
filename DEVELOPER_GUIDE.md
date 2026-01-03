# 开发者指南：创建公共Azure应用

本指南说明如何为OneNote Clipper扩展创建公共Azure应用，供所有用户使用。

## 为什么需要公共Azure应用？

为了实现"开箱即用"的体验，扩展需要一个公共的Azure应用：

- ✅ 用户不需要自己创建Azure应用
- ✅ 用户不需要配置凭据
- ✅ 使用PKCE认证，不需要Client Secret
- ✅ 每个用户使用自己的Microsoft账户登录
- ✅ 数据完全隔离，扩展开发者无法访问用户数据

## 创建步骤

### 1. 登录Azure Portal

使用你的Microsoft账户登录 [Azure Portal](https://portal.azure.com/)

### 2. 创建应用注册

1. 搜索并点击 **"App registrations"**
2. 点击 **"New registration"**
3. 填写以下信息：
   - **Name**: `OneNote Clipper Public`（或任何你喜欢的名称）
   - **Supported account types**: 选择 **"Accounts in any organizational directory and personal Microsoft accounts"**
   - **Redirect URI**: 选择 **"Web"**，输入 `http://localhost:8080/callback`
4. 点击 **"Register"**

### 3. 配置为公共客户端

1. 在应用页面，点击左侧菜单的 **"Authentication"**
2. 向下滚动到 **"Advanced settings"** 部分
3. 勾选 **"Allow public client flows"**
4. 点击 **"Save"**

这一步很重要！它允许应用使用PKCE认证，不需要Client Secret。

### 4. 配置API权限

1. 在左侧菜单中，点击 **"API permissions"**
2. 点击 **"Add a permission"**
3. 选择 **"Microsoft Graph"**
4. 选择 **"Delegated permissions"**
5. 搜索并勾选以下权限：
   - ✅ `Notes.ReadWrite` - 读写OneNote内容
   - ✅ `offline_access` - 刷新令牌
6. 点击 **"Add permissions"**
7. 点击 **"Grant admin consent for [你的组织名称]"**

### 5. 获取Client ID

1. 在应用概览页面，复制 **"Application (client) ID"**
2. 这就是你的 **Client ID**

### 6. 更新代码

在 `src/config.ts` 中更新 `PUBLIC_CLIENT_ID`：

```typescript
static getClientId(): string {
  // 公共应用的Client ID（由开发者创建）
  // 用户不需要自己创建Azure应用
  const PUBLIC_CLIENT_ID = 'your-client-id-here';  // 替换为你的Client ID

  // 允许用户覆盖（用于测试或自定义）
  const config = vscode.workspace.getConfiguration(this.CONFIG_SECTION);
  return config.get<string>('clientId', PUBLIC_CLIENT_ID);
}
```

## 安全考虑

### ✅ 为什么这样是安全的？

1. **PKCE认证**：使用code_verifier和code_challenge，防止授权码拦截攻击
2. **不需要Client Secret**：避免了Client Secret泄露的风险
3. **用户账户隔离**：每个用户使用自己的Microsoft账户，数据完全隔离
4. **最小权限**：只请求必要的API权限（Notes.ReadWrite和offline_access）
5. **端到端加密**：所有通信使用HTTPS/TLS加密

### ✅ 扩展开发者能做什么？

- 创建和管理公共Azure应用
- 配置API权限
- 监控应用使用情况（如果启用）

### ❌ 扩展开发者不能做什么？

- 访问用户的OneNote数据
- 访问用户的Microsoft账户
- 读取或修改用户的授权令牌
- 查看用户的代码内容

### ⚠️ 重要提醒

1. **不要启用需要Client Secret的功能**
   - 不要创建Client Secret
   - 不要使用需要Client Secret的API
   - 保持应用为公共客户端

2. **定期检查应用状态**
   - 监控应用使用情况
   - 检查API权限配置
   - 及时更新应用配置

3. **保护你的Azure账户**
   - 启用多因素认证
   - 定期更换密码
   - 监控账户活动

## 测试

在更新Client ID后：

1. 编译代码：`npm run compile`
2. 启动扩展：按F5
3. 测试登录功能
4. 测试发送功能
5. 确认一切正常

## 发布

发布扩展前，确保：

- [x] 公共Azure应用已创建并配置
- [x] Client ID已更新到代码中
- [x] 应用设置为公共客户端
- [x] API权限已配置并授予
- [x] 所有功能已测试
- [x] 文档已更新

## 故障排除

### 错误：AADSTS700016

**原因**：应用未设置为公共客户端

**解决**：
1. 在Azure Portal中打开应用
2. 进入"Authentication"
3. 勾选"Allow public client flows"
4. 保存

### 错误：AADSTS65001

**原因**：用户未授权应用

**解决**：
- 用户需要在浏览器中完成授权流程

### 错误：权限不足

**原因**：API权限未配置或未授予

**解决**：
1. 检查API权限配置
2. 确保已授予管理员同意
3. 确认权限范围正确

## 维护

### 定期任务

- 检查应用使用情况
- 监控错误日志
- 更新应用配置（如果需要）
- 更新文档

### 更新应用

如果需要更新应用配置：

1. 在Azure Portal中修改配置
2. 更新代码（如果需要）
3. 测试所有功能
4. 发布新版本

## 参考资料

- [Microsoft Identity Platform](https://docs.microsoft.com/azure/active-directory/develop/v2-overview)
- [OAuth 2.0 PKCE Flow](https://docs.microsoft.com/azure/active-directory/develop/v2-oauth2-auth-code-flow)
- [Public Client Apps](https://docs.microsoft.com/azure/active-directory/develop/scenario-desktop-app-registration)

---

**文档版本**: 1.0
**最后更新**: 2026-01-01