# 部署指南

## GitHub Pages 部署（推荐）

### 手动设置GitHub Actions工作流

由于权限限制，您需要手动在GitHub仓库中创建工作流文件：

1. 在GitHub仓库页面，点击 **Actions** 标签
2. 点击 **New workflow**
3. 选择 **set up a workflow yourself**
4. 将以下内容粘贴到编辑器：

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v3
        
      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Build
        run: npm run build
        
      - name: Upload artifact
        uses: actions/upload-pages-artifact@v2
        with:
          path: ./dist

  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    needs: build
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v2
```

5. 保存文件为 `.github/workflows/deploy.yml`
6. 提交更改

### 启用GitHub Pages

1. 进入仓库 **Settings** > **Pages**
2. 在 **Source** 下拉菜单选择 **GitHub Actions**
3. 等待工作流运行完成
4. 访问 `https://[你的用户名].github.io/compare/`

## Vercel 部署

### 一键部署

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/JLcbs/compare)

### 手动部署

1. 注册/登录 [Vercel](https://vercel.com)
2. 点击 **New Project**
3. 导入GitHub仓库
4. 保持默认设置，点击 **Deploy**

## Netlify 部署

1. 注册/登录 [Netlify](https://netlify.com)
2. 点击 **New site from Git**
3. 选择GitHub并授权
4. 选择 `compare` 仓库
5. 构建设置：
   - Build command: `npm run build`
   - Publish directory: `dist`
6. 点击 **Deploy site**

## Docker 部署

### 本地构建和运行

```bash
# 构建镜像
docker build -t text-diff-mvp .

# 运行容器
docker run -p 8080:80 text-diff-mvp

# 访问 http://localhost:8080
```

### 使用Docker Compose

```bash
docker-compose up -d
```

## 云服务器部署

### 使用PM2部署

```bash
# 安装依赖
npm install

# 构建项目
npm run build

# 安装PM2
npm install -g pm2

# 使用PM2启动静态服务器
pm2 serve dist 3000 --spa

# 保存PM2配置
pm2 save
pm2 startup
```

### 使用Nginx部署

1. 构建项目：
```bash
npm run build
```

2. 将 `dist` 目录内容复制到服务器
3. 配置Nginx（参考项目中的 `nginx.conf`）
4. 重启Nginx

## 环境变量配置

复制 `.env.example` 为 `.env` 并根据需要修改：

```bash
cp .env.example .env
```

主要配置项：
- `VITE_MAX_TEXT_LENGTH` - 最大文本长度限制
- `VITE_DEBOUNCE_DELAY` - 输入防抖延迟
- `VITE_USE_WEB_WORKER` - 是否启用Web Worker

## 性能优化建议

1. **CDN加速**：将静态资源部署到CDN
2. **Gzip压缩**：启用服务器端Gzip压缩
3. **缓存策略**：设置合理的浏览器缓存策略
4. **懒加载**：对大组件使用动态导入

## 故障排查

### 构建失败
- 检查Node.js版本（需要16+）
- 清除缓存：`rm -rf node_modules package-lock.json`
- 重新安装：`npm install`

### 部署后404
- 检查base路径配置（`vite.config.ts`）
- 确保服务器支持SPA路由

### 性能问题
- 启用生产模式构建
- 检查是否启用了Web Worker
- 考虑使用CDN

## 支持

如有问题，请在 [GitHub Issues](https://github.com/JLcbs/compare/issues) 提交。