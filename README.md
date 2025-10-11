# 随手拍完整系统

一个完整的H5随手拍应用，包含前端用户界面和后台管理系统，支持文件上传、数据管理和审核功能。

## 🎯 系统概述

### 前端应用
- **H5移动端界面**：完全响应式设计，适配各种手机屏幕
- **拍照录像功能**：支持调用手机相机拍照和录制视频
- **文件上传**：支持从相册选择图片和视频文件
- **表单验证**：手机号、姓名、文字说明等字段验证
- **荣耀手机优化**：专门针对荣耀手机的兼容性优化

### 后台管理系统
- **数据管理**：查看、审核、删除用户提交的数据
- **媒体文件管理**：预览和管理上传的图片和视频
- **统计分析**：实时统计提交数量、审核状态等
- **状态管理**：支持待审核、已通过、已拒绝状态管理

## 🚀 快速开始

### 1. 环境要求
- Node.js 14.0.0+
- npm 6.0.0+
- 现代浏览器

### 2. 安装依赖
```bash
# 安装项目依赖
npm install

# 或者使用一键安装
npm run setup
```

### 3. 启动服务器
```bash
# 生产模式
npm start

# 开发模式（自动重启）
npm run dev
```

### 4. 访问应用
- **前端应用**: http://localhost:3000
- **管理后台**: http://localhost:3000/admin

## 📁 项目结构

```
随手拍系统/
├── index.html              # 前端主页面
├── script.js               # 前端JavaScript
├── styles.css              # 前端样式
├── server.js               # 后端服务器
├── package.json            # 项目配置
├── setup.js                # 初始化脚本
├── submissions.json        # 数据存储文件
├── admin/                  # 管理后台
│   ├── index.html         # 管理界面
│   ├── admin.css          # 管理界面样式
│   └── admin.js           # 管理界面脚本
└── uploads/               # 文件上传目录
    ├── images/            # 图片存储
    └── videos/            # 视频存储
```

## 🎨 功能特性

### 前端功能
- ✅ **移动端优化**：响应式设计，触摸优化
- ✅ **拍照功能**：调用手机相机拍照
- ✅ **录像功能**：调用手机相机录制视频
- ✅ **文件选择**：从相册选择图片和视频
- ✅ **实时预览**：上传后立即显示预览
- ✅ **文件管理**：支持删除和重新选择
- ✅ **表单验证**：完整的前端验证
- ✅ **荣耀手机兼容**：专门的兼容性处理

### 后台功能
- ✅ **数据概览**：统计图表和最近提交
- ✅ **提交管理**：查看、搜索、筛选提交记录
- ✅ **状态管理**：审核通过/拒绝提交
- ✅ **媒体预览**：在线预览图片和视频
- ✅ **文件管理**：媒体文件画廊
- ✅ **数据导出**：支持数据导出功能
- ✅ **响应式界面**：适配桌面和移动端

## 🔧 API接口

### 用户接口
- `POST /api/submit` - 提交表单数据和文件

### 管理接口
- `GET /api/admin/stats` - 获取统计数据
- `GET /api/admin/submissions` - 获取提交列表
- `GET /api/admin/submissions/:id` - 获取提交详情
- `PUT /api/admin/submissions/:id/status` - 更新提交状态
- `DELETE /api/admin/submissions/:id` - 删除提交记录

## 📱 移动端支持

### iOS设备
- Safari 12+
- Chrome 60+
- 支持相机调用和文件上传

### Android设备
- Chrome 60+
- Firefox 55+
- 荣耀手机专项优化

### 权限要求
- 相机权限（拍照/录像）
- 存储权限（文件访问）
- 网络权限（数据提交）

## ⚙️ 配置说明

### 文件大小限制
在 `server.js` 中修改：
```javascript
limits: {
    fileSize: 50 * 1024 * 1024, // 50MB
    files: 10 // 最多10个文件
}
```

### 端口配置
在 `server.js` 中修改：
```javascript
const PORT = 3000; // 修改端口号
```

### 数据存储
- 默认使用JSON文件存储：`submissions.json`
- 可以替换为数据库存储（MySQL、MongoDB等）

## 🛠️ 开发指南

### 添加新功能
1. 前端：修改 `script.js` 和 `styles.css`
2. 后端：在 `server.js` 中添加新的API路由
3. 管理界面：修改 `admin/` 目录下的文件

### 数据库集成
替换 `server.js` 中的文件存储为数据库操作：
```javascript
// 示例：使用MySQL
const mysql = require('mysql2');
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'password',
    database: 'suishoupai'
});
```

### 部署到生产环境
1. 使用PM2管理进程：
```bash
npm install -g pm2
pm2 start server.js --name suishoupai
```

2. 配置Nginx反向代理
3. 设置HTTPS证书
4. 配置文件上传目录权限

## 🔒 安全考虑

- 文件类型验证
- 文件大小限制
- 路径遍历防护
- XSS防护
- CSRF防护

## 📊 性能优化

- 图片压缩
- 文件缓存
- CDN加速
- 数据库索引
- 分页加载

## 🐛 故障排除

### 常见问题
1. **相机无法调用**：检查HTTPS协议和浏览器权限
2. **文件上传失败**：检查文件大小和网络连接
3. **管理后台无法访问**：确认服务器正常运行

### 调试方法
1. 查看浏览器控制台日志
2. 检查服务器日志
3. 使用开发者工具调试

## 📞 技术支持

如有问题，请提供以下信息：
- 设备型号和系统版本
- 浏览器类型和版本
- 错误信息截图
- 控制台日志

## 📄 许可证

MIT License - 详见 LICENSE 文件

---

**🎉 开始使用**：运行 `npm run setup` 初始化项目，然后 `npm start` 启动服务器！