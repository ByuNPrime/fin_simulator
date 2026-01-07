# 🚀 Vercel 部署指南

## 📋 前置准备

1. **GitHub仓库**：将代码推送到GitHub仓库
2. **Vercel账号**：访问 [vercel.com](https://vercel.com) 注册账号（建议使用GitHub账号登录）

## 🔧 Vercel 部署步骤

### 方法一：通过 Vercel 网站部署（推荐）

1. **登录 Vercel**
   - 访问 https://vercel.com
   - 点击 "Sign Up" 或 "Log In"
   - 选择 "Continue with GitHub"

2. **创建新项目**
   - 点击 "Add New..." → "Project"
   - 从你的 GitHub 仓库列表中选择 "game" 项目
   - 如果没看到，点击 "Import Git Repository"

3. **配置项目**
   - **Project Name**: `financial-elite-simulator`（可自定义）
   - **Framework Preset**: 选择 "Other" 或 "Static"
   - **Root Directory**: 保持默认 `./`
   - **Build Command**: 留空（不需要构建）
   - **Output Directory**: 留空

4. **部署**
   - 点击 "Deploy" 按钮
   - 等待部署完成（约30秒）
   - 部署成功后会显示类似：`https://financial-elite-simulator.vercel.app`

### 方法二：使用 Vercel CLI 部署

1. **安装 Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **登录 Vercel**
   ```bash
   vercel login
   ```

3. **部署项目**
   在项目根目录执行：
   ```bash
   vercel
   ```

4. **按照提示操作**
   - Set up and deploy? **Y**
   - Which scope? **选择你的账号**
   - Link to existing project? **N**
   - Project name: **financial-elite-simulator**
   - In which directory is your code: **.** (当前目录)
   - Want to override settings? **N**

5. **完成部署**
   - Vercel 会生成一个部署链接
   - 以后更新代码后，再次运行 `vercel` 即可重新部署

## 📁 项目文件说明

```
game/
├── index.html          # 游戏主页面（入口文件）
├── styles.css          # 样式文件
├── game.js             # 游戏逻辑
├── package.json        # 项目配置（新增）
├── vercel.json         # Vercel配置（新增）
├── .gitignore          # Git忽略文件（新增）
├── README.md           # 项目说明
├── 游戏玩法指南.md      # 游戏指南
└── 游戏需求文档.md      # 需求文档
```

## 🔍 配置文件详解

### package.json
定义了项目的基本信息和Vercel CLI依赖。

### vercel.json
告诉 Vercel 这是一个静态网站，所有路由都指向 index.html。

## ⚠️ 常见问题

### Q1: 部署后页面空白？
**原因**: 文件路径问题
**解决**: 确保所有文件都在仓库根目录，且 `vercel.json` 配置正确

### Q2: 提示 "No Next.js version detected"？
**原因**: Vercel 错误识别项目类型
**解决**: 在项目设置中选择 "Framework Preset" 为 "Other" 或 "Static"

### Q3: 如何更新已部署的网站？
**方法一**: 推送代码到 GitHub，Vercel 会自动重新部署
**方法二**: 运行 `vercel --prod` 命令手动部署

### Q4: 如何绑定自定义域名？
1. 在 Vercel 项目设置中点击 "Domains"
2. 添加你的域名
3. 按照提示配置 DNS 记录

## 🎯 部署后测试

部署完成后，访问你的 Vercel 链接：
- 检查游戏是否正常加载
- 测试所有功能是否正常
- 在不同浏览器中测试兼容性

## 📊 性能优化建议

1. **压缩资源**: Vercel 自动压缩 HTML/CSS/JS
2. **CDN 加速**: Vercel 全球 CDN 自动加速
3. **缓存策略**: 静态资源会被自动缓存

## 🔗 相关链接

- Vercel 官网: https://vercel.com
- Vercel 文档: https://vercel.com/docs
- 静态网站部署: https://vercel.com/docs/deployments/overview

---

**祝你部署成功！🎉**
