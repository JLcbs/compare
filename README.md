<<<<<<< HEAD
# compare
=======
# 文本对比工具 MVP

一个功能强大的网页端文本对比工具，支持中文分词、实时对比、差异导航和报告导出。

## 功能特性

### 核心功能
- ✅ **实时对比** - 输入即对比，延迟≤300ms
- ✅ **中文优化** - 智能中文分词，句子级+字符级双层对比
- ✅ **差异高亮** - 清晰标注新增(绿)、删除(红)、修改(蓝)
- ✅ **快速导航** - 上/下差异跳转，支持键盘快捷键
- ✅ **统计摘要** - 实时显示变更数量、相似度等
- ✅ **报告导出** - 支持HTML/文本/JSON格式导出

### 高级功能
- ✅ **忽略选项** - 可忽略大小写、空白、标点差异
- ✅ **文件上传** - 支持拖放或选择文本文件
- ✅ **大文本优化** - Web Worker异步计算，虚拟滚动
- ✅ **主题切换** - 支持浅色/深色/跟随系统
- ✅ **离线模式** - 纯前端计算，保护隐私
- ✅ **历史记录** - 自动保存最近10次对比

## 快速开始

### 本地运行

1. **克隆项目**
```bash
git clone <repository-url>
cd text-diff-mvp
```

2. **安装依赖**
```bash
npm install
# 或
yarn install
# 或
pnpm install
```

3. **启动开发服务器**
```bash
npm run dev
# 或
yarn dev
# 或
pnpm dev
```

4. **访问应用**
打开浏览器访问 http://localhost:3000

### 生产构建

```bash
# 构建生产版本
npm run build

# 预览生产版本
npm run preview
```

### Docker部署

```bash
# 构建镜像
docker build -t text-diff-mvp .

# 运行容器
docker run -p 8080:80 text-diff-mvp

# 或使用docker-compose
docker-compose up -d
```

## 快捷键

| 快捷键 | 功能 |
|-------|------|
| `J` / `↓` | 下一个差异 |
| `K` / `↑` | 上一个差异 |
| `Home` | 第一个差异 |
| `End` | 最后一个差异 |
| `Ctrl+S` | 导出报告 |
| `Ctrl+,` | 打开设置 |
| `Alt+X` | 交换左右文本 |
| `Ctrl+Delete` | 清空所有文本 |
| `Shift+?` | 显示帮助 |

## 技术栈

- **框架**: React 18 + TypeScript 5
- **构建**: Vite 5
- **样式**: Tailwind CSS 3
- **状态管理**: Zustand 4
- **Diff算法**: Google diff-match-patch
- **图标**: Lucide React

## 性能指标

- 10万字符对比 ≤ 2秒
- 实时对比延迟 ≤ 300ms
- 支持百万字符级文本
- 内存占用优化

## 浏览器支持

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- 移动端基础支持

## 项目结构

```
text-diff-mvp/
├── src/
│   ├── components/     # React组件
│   ├── hooks/         # 自定义Hooks
│   ├── utils/         # 工具函数
│   ├── stores/        # 状态管理
│   ├── types/         # TypeScript类型
│   └── workers/       # Web Workers
├── public/            # 静态资源
└── dist/             # 构建输出
```

## 开发指南

### 环境要求
- Node.js 16+
- npm/yarn/pnpm

### 开发命令
```bash
npm run dev        # 启动开发服务器
npm run build      # 构建生产版本
npm run preview    # 预览生产版本
npm run type-check # TypeScript类型检查
npm run lint       # ESLint检查
```

### 配置说明
- `vite.config.ts` - Vite构建配置
- `tailwind.config.js` - Tailwind样式配置
- `tsconfig.json` - TypeScript配置
- `.env.example` - 环境变量示例

## 许可证

MIT License

## 作者

Text Diff MVP Team

## 更新日志

### v1.0.0 (2024-01-01)
- 初始版本发布
- 核心对比功能
- 中文优化支持
- 导出功能
- 键盘快捷键
>>>>>>> ae70434 (feat: 初始化文本对比工具MVP)
