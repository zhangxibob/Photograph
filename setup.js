const fs = require('fs');
const path = require('path');

console.log('🚀 正在初始化随手拍后台管理系统...\n');

// 创建必要的目录
const directories = [
    'uploads',
    'uploads/images',
    'uploads/videos',
    'admin'
];

directories.forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`✅ 创建目录: ${dir}`);
    } else {
        console.log(`📁 目录已存在: ${dir}`);
    }
});

// 创建初始数据文件
const dataFile = 'submissions.json';
if (!fs.existsSync(dataFile)) {
    const initialData = {
        submissions: [],
        nextId: 1
    };
    fs.writeFileSync(dataFile, JSON.stringify(initialData, null, 2));
    console.log(`✅ 创建数据文件: ${dataFile}`);
} else {
    console.log(`📄 数据文件已存在: ${dataFile}`);
}

// 检查必要文件
const requiredFiles = [
    'server.js',
    'index.html',
    'script.js',
    'styles.css',
    'admin/index.html',
    'admin/admin.css',
    'admin/admin.js'
];

console.log('\n📋 检查必要文件:');
let allFilesExist = true;

requiredFiles.forEach(file => {
    if (fs.existsSync(file)) {
        console.log(`✅ ${file}`);
    } else {
        console.log(`❌ ${file} - 文件缺失`);
        allFilesExist = false;
    }
});

if (allFilesExist) {
    console.log('\n🎉 初始化完成！所有文件都已就绪。');
    console.log('\n📖 使用说明:');
    console.log('1. 启动服务器: npm start');
    console.log('2. 开发模式: npm run dev');
    console.log('3. 前端应用: http://localhost:3000');
    console.log('4. 管理后台: http://localhost:3000/admin');
    console.log('\n💡 提示: 确保已安装 Node.js 14+ 版本');
} else {
    console.log('\n⚠️  警告: 部分文件缺失，请检查项目完整性。');
}

console.log('\n🔧 系统要求:');
console.log('- Node.js 14.0.0+');
console.log('- npm 6.0.0+');
console.log('- 现代浏览器支持');

console.log('\n📱 功能特性:');
console.log('- H5随手拍前端应用');
console.log('- 文件上传 (图片/视频)');
console.log('- 后台管理系统');
console.log('- 数据统计和审核');
console.log('- 荣耀手机兼容优化');

console.log('\n🎯 下一步:');
console.log('运行 "npm start" 启动服务器');
console.log('然后在浏览器中访问 http://localhost:3000');