const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

console.log('🔍 启动调试服务器...');

const app = express();
const PORT = 3001; // 使用不同端口避免冲突

// 基本中间件
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 静态文件服务
app.use(express.static('.'));

console.log('✅ 中间件配置完成');

// 简单的multer配置
const upload = multer({
    dest: 'uploads/',
    limits: {
        fileSize: 50 * 1024 * 1024, // 50MB
        files: 10
    }
});

console.log('✅ Multer配置完成');

// 测试路由
app.get('/test', (req, res) => {
    console.log('收到测试请求');
    res.json({ message: '服务器正常运行', timestamp: new Date().toISOString() });
});

// 简化的提交API
app.post('/api/submit', upload.any(), (req, res) => {
    console.log('=== 收到提交请求 ===');
    console.log('Method:', req.method);
    console.log('URL:', req.url);
    console.log('Headers:', req.headers);
    console.log('Body:', req.body);
    console.log('Files:', req.files);
    
    try {
        const { phone, name, description } = req.body;
        
        console.log('解析的数据:', { phone, name, description });
        
        // 基本验证
        if (!phone || !name || !description) {
            console.log('❌ 验证失败: 缺少必填字段');
            return res.status(400).json({
                success: false,
                message: '请填写所有必填字段',
                received: { phone: !!phone, name: !!name, description: !!description }
            });
        }
        
        // 处理文件
        const files = req.files || [];
        console.log(`收到 ${files.length} 个文件`);
        
        files.forEach((file, index) => {
            console.log(`文件 ${index + 1}:`, {
                fieldname: file.fieldname,
                originalname: file.originalname,
                mimetype: file.mimetype,
                size: file.size
            });
        });
        
        // 成功响应
        const response = {
            success: true,
            message: '提交成功！',
            data: {
                phone,
                name,
                description,
                filesCount: files.length,
                timestamp: new Date().toISOString()
            }
        };
        
        console.log('✅ 发送成功响应:', response);
        res.json(response);
        
    } catch (error) {
        console.error('❌ 处理错误:', error);
        res.status(500).json({
            success: false,
            message: '服务器错误',
            error: error.message
        });
    }
});

// 错误处理中间件
app.use((error, req, res, next) => {
    console.error('❌ 全局错误处理:', error);
    res.status(500).json({
        success: false,
        message: '服务器内部错误',
        error: error.message
    });
});

// 404处理
app.use((req, res) => {
    console.log(`❌ 404 - 未找到路由: ${req.method} ${req.url}`);
    res.status(404).json({
        success: false,
        message: '接口不存在',
        method: req.method,
        url: req.url
    });
});

// 启动服务器
app.listen(PORT, () => {
    console.log(`🚀 调试服务器启动成功！`);
    console.log(`📍 端口: ${PORT}`);
    console.log(`🔗 测试地址: http://localhost:${PORT}/test`);
    console.log(`📤 API地址: http://localhost:${PORT}/api/submit`);
    console.log(`📱 前端地址: http://localhost:${PORT}`);
    console.log('\n💡 使用说明:');
    console.log('1. 访问 http://localhost:3001/test 测试服务器');
    console.log('2. 修改前端script.js中的API地址为 http://localhost:3001/api/submit');
    console.log('3. 查看控制台日志了解请求处理过程');
});

// 优雅关闭
process.on('SIGINT', () => {
    console.log('\n正在关闭调试服务器...');
    process.exit(0);
});