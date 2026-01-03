# 安全架构说明

本文档说明 OneNote Clipper 扩展的安全架构和实现方式。

## 安全设计原则

OneNote Clipper 遵循以下安全设计原则：

1. **用户隐私优先** - 不收集任何用户数据
2. **开箱即用** - 用户不需要配置任何凭据
3. **最小权限** - 只请求必要的API权限
4. **数据隔离** - 每个用户使用自己的账户
5. **端到端加密** - 所有通信使用HTTPS/TLS

## 安全架构

### 认证流程

扩展使用 **OAuth 2.0 PKCE（Proof Key for Code Exchange）** 认证流程：

```
用户设备              Microsoft服务
    │                      │
    │  1. 生成code_verifier │
    │  和code_challenge     │
    │                      │
    │  2. 请求授权          │
    │  (包含code_challenge) │
    │─────────────────────>│
    │                      │
    │  3. 用户登录并授权    │
    │<─────────────────────│
    │                      │
    │  4. 返回授权码        │
    │<─────────────────────│
    │                      │
    │  5. 交换令牌          │
    │  (使用code_verifier)  │
    │─────────────────────>│
    │                      │
    │  6. 返回访问令牌      │
    │<─────────────────────│
    │                      │
    │  7. 访问OneNote API   │
    │─────────────────────>│
```

### PKCE 安全性

PKCE（Proof Key for Code Exchange）是OAuth 2.0的安全扩展，专门为公共客户端设计：

**为什么使用PKCE？**

1. **防止授权码拦截攻击**
   - 即使攻击者截获了授权码，也无法获取访问令牌
   - 因为他们没有code_verifier

2. **不需要Client Secret**
   - 传统OAuth 2.0需要Client Secret
   - 但Client Secret无法安全地存储在客户端应用中
   - PKCE使用code_verifier替代Client Secret

3. **适合公开客户端**
   - VSCode扩展是公开客户端
   - 无法安全地存储密钥
   - PKCE是最佳选择

### 数据流

```
用户代码
    ↓
VSCode Extension
    ↓
PKCE认证 (code_verifier + code_challenge)
    ↓
Microsoft Azure AD (OAuth 2.0)
    ↓
Access Token
    ↓
Microsoft Graph API (HTTPS/TLS)
    ↓
Microsoft OneNote
```

## 安全特性

### 1. 无凭据配置 ✅

**实现**：
- 使用公共Azure应用
- Client ID硬编码在代码中（公开信息）
- 不需要Client Secret

**安全性**：
- Client ID是公开信息，不敏感
- 不需要用户配置任何凭据
- 避免凭据泄露风险

### 2. PKCE认证 ✅

**实现**：
- 使用code_verifier和code_challenge
- 每次认证生成新的随机值
- code_verifier只在本地使用，不传输

**安全性**：
- 防止授权码拦截攻击
- 不需要Client Secret
- 符合OAuth 2.1最佳实践

### 3. 用户账户隔离 ✅

**实现**：
- 每个用户使用自己的Microsoft账户登录
- 访问令牌绑定到用户账户
- 扩展开发者无法访问用户数据

**安全性**：
- 完全的数据隔离
- 用户完全控制自己的数据
- 扩展开发者无法访问OneNote数据

### 4. 最小权限 ✅

**实现**：
- 只请求`Notes.ReadWrite`权限
- 只请求`offline_access`权限
- 不请求其他任何权限

**安全性**：
- 遵循最小权限原则
- 降低安全风险
- 用户可以清楚了解权限范围

### 5. 端到端加密 ✅

**实现**：
- 所有通信使用HTTPS/TLS
- 不经过第三方服务器
- 直接连接到Microsoft服务

**安全性**：
- 防止中间人攻击
- 防止数据窃听
- 确保数据完整性

### 6. 本地存储 ✅

**实现**：
- 令牌存储在VSCode的安全存储中
- 不发送到任何第三方服务器
- 不收集任何用户数据

**安全性**：
- 令牌不会被泄露
- 用户数据不会被收集
- 符合隐私保护要求

## 安全检查清单

### 发布前检查

- [x] 使用PKCE认证
- [x] 不使用Client Secret
- [x] 应用设置为公共客户端
- [x] 只请求必要的权限
- [x] 所有通信使用HTTPS
- [x] 令牌安全存储
- [x] 不收集用户数据

### 运行时检查

- [x] 每次认证生成新的code_verifier
- [x] code_verifier只在本地使用
- [x] 访问令牌自动刷新
- [x] 令牌过期自动处理
- [x] 错误信息不包含敏感数据

## 安全最佳实践

### ✅ 推荐做法

1. 使用PKCE认证流程
2. 设置应用为公共客户端
3. 只请求必要的API权限
4. 使用HTTPS/TLS加密
5. 安全存储访问令牌
6. 定期更新依赖项
7. 监控安全漏洞

### ❌ 避免做法

1. 不要使用Client Secret
2. 不要硬编码敏感信息
3. 不要收集用户数据
4. 不要绕过安全检查
5. 不要使用过时的协议
6. 不要忽略安全警告
7. 不要暴露令牌

## 合规性

本扩展符合：

- ✅ GDPR（通用数据保护条例）
- ✅ Microsoft Azure 安全要求
- ✅ VSCode 扩展安全指南
- ✅ OAuth 2.0 安全最佳实践
- ✅ OAuth 2.1 安全要求
- ✅ OWASP 安全标准

## 安全审计

### 代码审计

- [x] 无硬编码凭据
- [x] 无敏感信息泄露
- [x] 错误处理完善
- [x] 输入验证完整
- [x] 依赖项安全

### 配置审计

- [x] 应用设置为公共客户端
- [x] 重定向URI配置正确
- [x] API权限最小化
- [x] 管理员同意已授予

### 运行时审计

- [x] 令牌安全存储
- [x] 通信加密
- [x] 错误信息安全
- [x] 日志不包含敏感信息

## 安全更新

### 持续监控

- 监控安全漏洞
- 跟踪安全公告
- 更新依赖项
- 改进安全措施

### 响应流程

1. 发现安全问题
2. 评估影响范围
3. 修复安全问题
4. 测试修复
5. 发布更新
6. 通知用户

## 联系方式

如果发现安全问题：

- **Email**: your-email@example.com
- **GitHub Security**: https://github.com/your-repo/vscode-onenote-clipper/security/advisories

---

**文档版本**: 2.0
**最后更新**: 2026-01-01
**状态**: ✅ 已实现PKCE认证，无需用户配置