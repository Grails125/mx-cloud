# MX Cloud - 多云资产管理平台

一个安全、高效、用户友好的多云资产管理Web前端应用，支持聚合、监控和管理来自不同云服务商的账户信息、资源使用情况及财务状况。

## ✨ 核心特性

### 🔐 安全加密存储

- 使用 **Web Crypto API** 实现 **AES-256-GCM** 加密
- **PBKDF2** 密钥派生，100,000 次迭代
- 所有敏感凭证（AccessKey ID/Secret）均加密存储
- 主密码哈希验证，保护数据安全

### ☁️ 云服务支持

- **UCloud** - 余额查询和资源使用情况
- **可扩展架构** - 适配器模式，易于添加新的云服务商

### 📊 数据可视化

- 实时余额展示
- 资源使用情况监控
- 余额分布饼图
- 账户概览仪表盘

### 🚨 智能预警系统

- 自定义预警规则（余额阈值、使用量阈值）
- 自动检查预警条件
- 浏览器原生通知支持
- 预警历史记录

### 🎨 现代化UI/UX

- 响应式设计，适配各种屏幕尺寸
- 直观的用户界面
- 流畅的交互动画
- 清晰的信息层级

## 🛠️ 技术栈

- **前端框架**: Vue 3 (Composition API)
- **构建工具**: Vite 5
- **状态管理**: Pinia
- **路由**: Vue Router 4
- **数据可视化**: ECharts 5
- **HTTP客户端**: Axios
- **加密库**: Web Crypto API + crypto-js
- **类型系统**: TypeScript 5
- **样式**: 原生CSS（CSS变量）

## 📦 安装与运行

### 前置要求

- Node.js >= 16.0.0
- npm >= 7.0.0 或 yarn >= 1.22.0

### 安装依赖

```bash
npm install
# 或
yarn install
```

### 开发模式

```bash
npm run dev
# 或
yarn dev
```

应用将在 `http://localhost:3000` 启动

### 构建生产版本

```bash
npm run build
# 或
yarn build
```

构建产物将输出到 `dist` 目录

### 预览生产构建

```bash
npm run preview
# 或
yarn preview
```

## 🚀 快速开始

### 1. 首次使用

1. 启动应用后，访问登录页面
2. 设置主密码（用于加密存储所有账户凭证）
3. 妥善保管主密码，忘记密码将无法恢复数据

### 2. 添加云账户

1. 进入"账户管理"页面
2. 点击"添加账户"
3. 填写账户信息：
   - 账户名称（自定义）
   - 云服务商（UCloud）
   - AccessKey ID
   - AccessKey Secret
   - 区域（可选）

### 3. 查看数据

1. 进入"仪表盘"页面
2. 查看总余额、账户数量等概览信息
3. 查看各账户的详细余额和资源使用情况
4. 点击"刷新数据"获取最新信息

### 4. 配置预警

1. 进入"预警中心"页面
2. 点击"添加预警规则"
3. 设置预警条件：
   - 选择账户
   - 选择预警类型（余额/使用量）
   - 设置阈值和操作符
   - 启用规则

## 📁 项目结构

```
mx-cloud/
├── src/
│   ├── adapters/          # 云服务适配器
│   │   ├── base.ts        # 适配器基类
│   │   ├── ucloud.ts      # UCloud适配器
│   │   └── index.ts       # 适配器工厂
│   ├── components/        # Vue组件
│   │   └── Layout.vue     # 布局组件
│   ├── stores/            # Pinia状态管理
│   │   ├── account.ts     # 账户管理
│   │   ├── data.ts        # 数据聚合
│   │   └── alert.ts       # 预警系统
│   ├── types/             # TypeScript类型定义
│   │   └── index.ts
│   ├── utils/             # 工具函数
│   │   ├── crypto.ts      # 加密工具
│   │   └── storage.ts     # 存储管理
│   ├── views/             # 页面视图
│   │   ├── Login.vue      # 登录页
│   │   ├── Dashboard.vue  # 仪表盘
│   │   ├── Accounts.vue   # 账户管理
│   │   ├── Alerts.vue    # 预警中心
│   │   └── Settings.vue  # 设置
│   ├── App.vue            # 根组件
│   ├── main.ts            # 入口文件
│   ├── router/            # 路由配置
│   │   └── index.ts
│   └── style.css         # 全局样式
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

## 🔒 安全说明

### 数据存储

- 所有数据仅存储在**本地浏览器**的 `localStorage` 中
- 敏感凭证使用 **AES-256-GCM** 加密存储
- 主密码使用 **SHA-256** 哈希存储（仅用于验证）
- **不会上传任何数据到服务器**

### 安全建议

1. **主密码安全**

   - 使用强密码（至少12位，包含大小写字母、数字、特殊字符）
   - 不要将主密码告诉他人
   - 定期备份账户数据
2. **浏览器安全**

   - 使用私密浏览模式时，关闭浏览器会清除所有数据
   - 定期清理浏览器缓存时注意备份数据
   - 避免在公共计算机上使用
3. **数据备份**

   - 定期使用"设置"页面的"导出数据"功能备份
   - 将备份文件存储在安全的位置

## 🔌 扩展新的云服务商

### 1. 创建适配器

在 `src/adapters/` 目录下创建新的适配器文件，例如 `tencent.ts`:

```typescript
import { BaseAdapter } from './base'
import type { CloudAccount, AccountBalance, ResourceUsage } from '@/types'

export class TencentAdapter extends BaseAdapter {
  async getBalance(account: CloudAccount): Promise<AccountBalance> {
    // 实现余额查询逻辑
  }

  async getResourceUsage(account: CloudAccount): Promise<ResourceUsage[]> {
    // 实现资源查询逻辑
  }

  async validateCredentials(account: CloudAccount): Promise<boolean> {
    // 实现凭证验证逻辑
  }
}
```

### 2. 注册适配器

在 `src/adapters/index.ts` 中添加：

```typescript
import { TencentAdapter } from './tencent'

// 在 AdapterFactory.getAdapter 方法中添加
case CloudProvider.TENCENT:
  this.adapters.set(provider, new TencentAdapter())
  break
```

### 3. 更新类型定义

在 `src/types/index.ts` 中添加：

```typescript
export enum CloudProvider {
  // ...
  TENCENT = 'tencent'
}
```

## 📝 开发说明

### 代码规范

- 使用 TypeScript 严格模式
- 遵循 Vue 3 Composition API 最佳实践
- 组件使用 `<script setup>` 语法
- 使用 ESLint 进行代码检查

### 环境变量

目前项目为纯前端实现，无需环境变量配置。

### API 调用说明

- 所有 API 调用直接与云服务商 API 通信
- 需要处理跨域问题（CORS）
- 建议在生产环境中使用代理或后端服务

## ⚠️ 注意事项

1. **跨域问题**: 由于浏览器的同源策略，直接调用云服务商 API 可能遇到跨域问题。建议：

   - 使用浏览器扩展（如 CORS Unblock）
   - 配置代理服务器
   - 使用后端服务作为中间层
2. **API 限制**: 各云服务商对 API 调用频率有限制，请注意：

   - 避免频繁刷新数据
   - 合理设置自动刷新间隔
   - 处理 API 限流错误
3. **数据持久化**: 数据存储在浏览器本地，清除浏览器数据会丢失所有信息，请定期备份。

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 🙏 致谢

感谢所有开源项目的贡献者，特别是：

- Vue.js 团队
- Vite 团队
- ECharts 团队
- 所有云服务商提供的 API 文档

---

**⚠️ 重要提示**: 本项目为纯前端应用，所有数据存储在本地浏览器。请妥善保管主密码，定期备份数据，避免数据丢失。
