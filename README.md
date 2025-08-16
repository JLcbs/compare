# Text Diff Desktop - 跨平台文本对比工具

一个强大的跨平台桌面文本对比应用，基于Tauri构建，提供高性能的文本差异分析。

## ✨ 功能特性

### 核心功能
- 🚀 **高性能对比引擎** - Rust实现，支持百万字符级文本
- 📄 **多格式支持** - DOCX, PDF, ODT, RTF, HTML, Markdown
- 🌏 **中文优化** - 智能中文分词，三层对比策略
- 📊 **详细统计** - 字符/词/句/段落级别统计
- 🎨 **多种视图** - 双栏/合并/行内高亮
- 💾 **专业导出** - HTML/PDF/DOCX(带修订痕迹)
- 🔌 **插件系统** - 可扩展的插件架构
- 🔒 **隐私优先** - 默认离线，本地处理

### 企业特性
- 🔐 **安全加密** - AES256内容加密选项
- 📝 **审计日志** - 元数据级操作日志
- 🏢 **批量处理** - 命令行批处理支持
- 🔄 **自动更新** - 增量更新，签名验证
- 🌐 **国际化** - 中英文界面

## 📦 安装

### Windows
1. 下载 `TextDiffDesktop-Setup.exe`
2. 运行安装程序
3. 按照向导完成安装

### macOS
1. 下载 `TextDiffDesktop.dmg`
2. 打开DMG文件
3. 拖动应用到Applications文件夹

### Linux
```bash
# DEB包（Ubuntu/Debian）
sudo dpkg -i text-diff-desktop_1.0.0_amd64.deb

# RPM包（Fedora/RHEL）
sudo rpm -i text-diff-desktop-1.0.0.x86_64.rpm

# AppImage（通用）
chmod +x TextDiffDesktop.AppImage
./TextDiffDesktop.AppImage
```

## 🚀 快速开始

### 开发环境设置

1. **安装依赖**
```bash
# 安装Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# 安装Node.js (16+)
# 从 https://nodejs.org 下载

# 安装Tauri CLI
cargo install tauri-cli

# 克隆项目
git clone https://github.com/yourusername/text-diff-desktop.git
cd text-diff-desktop

# 安装前端依赖
npm install

# 安装Rust依赖
cd src-tauri
cargo build
```

2. **开发模式运行**
```bash
npm run tauri:dev
```

3. **构建发布版**
```bash
# 所有平台
npm run tauri:build

# 特定平台
npm run tauri:build:win    # Windows
npm run tauri:build:mac    # macOS
npm run tauri:build:linux  # Linux
```

## 🎯 使用指南

### 基本对比
1. 打开应用
2. 通过以下方式输入文本：
   - 直接粘贴
   - 打开文件（支持拖拽）
   - 从历史记录加载
3. 自动实时对比或手动触发
4. 查看差异高亮和统计

### 高级功能

#### 忽略选项
- 忽略大小写
- 忽略空白
- 忽略标点
- 自定义正则忽略规则

#### 导航
- `J/K` - 上下差异导航
- `Ctrl+F` - 搜索
- `Ctrl+G` - 跳转到行
- 缩略图视图快速定位

#### 批注与协作
- 对差异添加批注
- 标签分类
- 导出含批注的报告

### 命令行使用
```bash
# 基本对比
textdiff compare file1.txt file2.txt

# 批量对比
textdiff batch --input pairs.json --output results/

# 导出指定格式
textdiff compare file1.txt file2.txt --export pdf --output diff.pdf

# 使用配置文件
textdiff compare --config myconfig.json file1.txt file2.txt
```

## ⚙️ 配置

配置文件位置：
- Windows: `%APPDATA%\text-diff-desktop\config.json`
- macOS: `~/Library/Application Support/text-diff-desktop/config.json`
- Linux: `~/.config/text-diff-desktop/config.json`

示例配置：
```json
{
  "theme": "auto",
  "language": "zh-CN",
  "diff": {
    "ignoreCase": false,
    "ignoreWhitespace": false,
    "splitBySentence": true,
    "chunkSize": 10000
  },
  "export": {
    "includeStats": true,
    "includeTimestamp": true,
    "defaultFormat": "html"
  },
  "security": {
    "offlineMode": true,
    "encryptCache": false,
    "clearOnExit": true
  },
  "performance": {
    "useWebWorker": true,
    "maxFileSize": 52428800,
    "virtualScrollThreshold": 1000
  }
}
```

## 🔌 插件开发

### 创建插件
```javascript
// myplugin.js
export default {
  name: 'MyPlugin',
  version: '1.0.0',
  
  // 文件解析器插件
  parser: {
    extensions: ['.custom'],
    parse: async (file) => {
      // 解析逻辑
      return { content: '...' };
    }
  },
  
  // 分析器插件
  analyzer: {
    analyze: (diffItems) => {
      // 分析逻辑
      return { customMetrics: {} };
    }
  },
  
  // 导出器插件
  exporter: {
    formats: ['custom'],
    export: async (diffResult, format) => {
      // 导出逻辑
      return Buffer.from('...');
    }
  }
};
```

### 安装插件
1. 将插件放入 `plugins/` 目录
2. 在设置中启用插件
3. 重启应用

## 🔒 安全与隐私

- **默认离线** - 无网络请求，除非明确启用
- **本地处理** - 所有计算在本地完成
- **无遥测** - 不收集任何用户数据
- **内存安全** - Rust实现，防止缓冲区溢出
- **签名验证** - 插件和更新包签名验证

## 🐛 故障排查

### 常见问题

**Q: 应用无法启动**
- 检查系统要求（Windows 10+, macOS 10.15+, Ubuntu 20.04+）
- 以管理员权限运行
- 检查防病毒软件设置

**Q: 文件解析失败**
- 确认文件格式支持
- 检查文件是否损坏
- 尝试转换为支持的格式

**Q: 性能问题**
- 启用Web Worker
- 减小chunk大小
- 关闭实时对比

## 📊 性能基准

| 操作 | 文本大小 | 耗时 |
|------|---------|------|
| 对比 | 10K字符 | <100ms |
| 对比 | 100K字符 | <500ms |
| 对比 | 1M字符 | <3s |
| 导出HTML | 100K字符 | <1s |
| 导出PDF | 100K字符 | <2s |

测试环境：Intel i5-10400, 16GB RAM, SSD

## 🤝 贡献

欢迎贡献代码、报告问题或提出建议！

1. Fork项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启Pull Request

## 📄 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件

## 🙏 致谢

- [Tauri](https://tauri.app/) - 应用框架
- [diff-match-patch](https://github.com/google/diff-match-patch) - Diff算法
- [Monaco Editor](https://microsoft.github.io/monaco-editor/) - 代码编辑器

## 📞 支持

- 📧 Email: support@textdiff.com
- 💬 Discord: [加入社区](https://discord.gg/textdiff)
- 📖 文档: [docs.textdiff.com](https://docs.textdiff.com)
- 🐛 Issues: [GitHub Issues](https://github.com/yourusername/text-diff-desktop/issues)