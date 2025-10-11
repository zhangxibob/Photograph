#!/usr/bin/env node

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 随手拍系统启动器\n');

// 检查Node.js版本
const nodeVersion = process.version;
const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);

if (majorVersion < 14) {
    console.error('❌ 错误: 需要Node.js 14.0.0或更高版本');
    console.error(`   当前版本: ${nodeVersion}`);
    console.error('   请升级Node.js后重试');
    process.exit(1);
}

console.log(`✅ Node.js版本检查通过: ${nodeVersion}`);

// 检查必要文件
const requiredFiles = [
    'server.js',
    'package.json',
    'index.html',
    'script.js',
    'styles.css'
];

console.log('\n📋 检查必要文件:');
let missingFiles = [];

requiredFiles.forEach(file => {
    if (fs.existsSync(file)) {
        console.log(`✅ ${file}`);
    } else {
        console.log(`❌ ${file} - 文件缺失`);
        missingFiles.push(file);
    }
});

if (missingFiles.length > 0) {
    console.error('\n❌ 错误: 缺少必要文件，请确保所有文件都已创建');
    process.exit(1);
}

// 检查依赖是否已安装
if (!fs.existsSync('node_modules')) {
    console.log('\n📦 检测到未安装依赖，正在安装...');
    
    const npmInstall = spawn('npm', ['install'], {
        stdio: 'inherit',
        shell: true
    });
    
    npmInstall.on('close', (code) => {
        if (code === 0) {
            console.log('✅ 依赖安装完成');
            startServer();
        } else {
            console.error('❌ 依赖安装失败');
            process.exit(1);
        }
    });
} else {
    console.log('✅ 依赖已安装');
    startServer();
}

function startServer() {
    console.log('\n🔧 创建必要目录...');
    
    // 创建上传目录
    const dirs = ['uploads', 'uploads/images', 'uploads/videos', 'admin'];
    dirs.forEach(dir => {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
            console.log(`✅ 创建目录: ${dir}`);
        }
    });
    
    // 创建初始数据文件
    if (!fs.existsSync('submissions.json')) {
        const initialData = {
            submissions: [],
            nextId: 1
        };
        fs.writeFileSync('submissions.json', JSON.stringify(initialData, null, 2));
        console.log('✅ 创建数据文件: submissions.json');
    }
    
    console.log('\n🚀 启动服务器...');
    
    const server = spawn('node', ['server.js'], {
        stdio: 'inherit',
        shell: true
    });
    
    server.on('close', (code) => {
        console.log(`\n服务器已关闭，退出代码: ${code}`);
    });
    
    // 处理Ctrl+C
    process.on('SIGINT', () => {
        console.log('\n正在关闭服务器...');
        server.kill('SIGINT');
    });
    
    // 延迟显示访问信息
    setTimeout(() => {
        console.log('\n🎉 系统启动完成！');
        console.log('\n📱 访问地址:');
        console.log('   前端应用: http://localhost:3000');
        console.log('   管理后台: http://localhost:3000/admin');
        console.log('\n💡 使用提示:');
        console.log('   1. 在手机浏览器中访问前端应用进行测试');
        console.log('   2. 在电脑浏览器中访问管理后台查看数据');
        console.log('   3. 按 Ctrl+C 停止服务器');
        console.log('\n🔍 调试信息:');
        console.log('   - 查看控制台日志了解请求处理过程');
        console.log('   - 上传的文件保存在 uploads/ 目录');
        console.log('   - 数据保存在 submissions.json 文件');
    }, 2000);
}