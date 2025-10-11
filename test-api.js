#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const http = require('http');

console.log('🧪 API接口测试工具\n');

// 测试服务器是否运行
function testServerConnection() {
    return new Promise((resolve, reject) => {
        const req = http.get('http://localhost:3000', (res) => {
            console.log('✅ 服务器连接正常');
            resolve(true);
        });
        
        req.on('error', (error) => {
            console.log('❌ 服务器未运行，请先启动服务器');
            console.log('   运行命令: npm start');
            reject(error);
        });
        
        req.setTimeout(5000, () => {
            console.log('❌ 服务器连接超时');
            req.destroy();
            reject(new Error('连接超时'));
        });
    });
}

// 创建测试文件
function createTestFiles() {
    console.log('📁 创建测试文件...');
    
    // 创建测试图片（1x1像素的PNG）
    const testImageData = Buffer.from([
        0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D,
        0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
        0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, 0xDE, 0x00, 0x00, 0x00,
        0x0C, 0x49, 0x44, 0x41, 0x54, 0x08, 0xD7, 0x63, 0xF8, 0x00, 0x00, 0x00,
        0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00
    ]);
    
    fs.writeFileSync('test-image.png', testImageData);
    console.log('✅ 创建测试图片: test-image.png');
    
    // 创建测试视频文件头（MP4）
    const testVideoData = Buffer.from([
        0x00, 0x00, 0x00, 0x20, 0x66, 0x74, 0x79, 0x70, 0x69, 0x73, 0x6F, 0x6D,
        0x00, 0x00, 0x02, 0x00, 0x69, 0x73, 0x6F, 0x6D, 0x69, 0x73, 0x6F, 0x32,
        0x6D, 0x70, 0x34, 0x31, 0x00, 0x00, 0x00, 0x08, 0x66, 0x72, 0x65, 0x65
    ]);
    
    fs.writeFileSync('test-video.mp4', testVideoData);
    console.log('✅ 创建测试视频: test-video.mp4');
}

// 测试API提交
function testAPISubmit() {
    return new Promise((resolve, reject) => {
        console.log('\n📤 测试API提交...');
        
        const form = new FormData();
        
        // 添加表单数据
        form.append('phone', '13800138000');
        form.append('name', '测试用户');
        form.append('description', '这是一个API测试提交，用于验证前后端接口是否正常工作。');
        
        // 添加测试文件
        form.append('image_0', fs.createReadStream('test-image.png'), {
            filename: 'test-image.png',
            contentType: 'image/png'
        });
        
        form.append('video_0', fs.createReadStream('test-video.mp4'), {
            filename: 'test-video.mp4',
            contentType: 'video/mp4'
        });
        
        console.log('📋 提交数据:');
        console.log('   手机号: 13800138000');
        console.log('   姓名: 测试用户');
        console.log('   图片: test-image.png');
        console.log('   视频: test-video.mp4');
        
        const options = {
            hostname: 'localhost',
            port: 3000,
            path: '/api/submit',
            method: 'POST',
            headers: form.getHeaders()
        };
        
        const req = http.request(options, (res) => {
            let data = '';
            
            console.log(`📊 响应状态: ${res.statusCode}`);
            console.log(`📋 响应头:`, res.headers);
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                try {
                    const result = JSON.parse(data);
                    console.log('📥 服务器响应:', result);
                    
                    if (result.success) {
                        console.log('✅ API测试成功！');
                        console.log(`   提交ID: ${result.data.id}`);
                        console.log(`   提交时间: ${result.data.submitTime}`);
                        resolve(result);
                    } else {
                        console.log('❌ API测试失败:', result.message);
                        reject(new Error(result.message));
                    }
                } catch (error) {
                    console.log('❌ 响应解析失败:', data);
                    reject(error);
                }
            });
        });
        
        req.on('error', (error) => {
            console.log('❌ 请求失败:', error.message);
            reject(error);
        });
        
        form.pipe(req);
    });
}

// 清理测试文件
function cleanupTestFiles() {
    console.log('\n🧹 清理测试文件...');
    
    const testFiles = ['test-image.png', 'test-video.mp4'];
    testFiles.forEach(file => {
        if (fs.existsSync(file)) {
            fs.unlinkSync(file);
            console.log(`✅ 删除: ${file}`);
        }
    });
}

// 测试管理API
async function testAdminAPI() {
    return new Promise((resolve, reject) => {
        console.log('\n📊 测试管理API...');
        
        const req = http.get('http://localhost:3000/api/admin/stats', (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                try {
                    const result = JSON.parse(data);
                    console.log('📈 统计数据:', result);
                    
                    if (result.success) {
                        console.log('✅ 管理API测试成功！');
                        console.log(`   总提交数: ${result.data.total}`);
                        console.log(`   待审核: ${result.data.pending}`);
                        resolve(result);
                    } else {
                        console.log('❌ 管理API测试失败');
                        reject(new Error('管理API返回失败'));
                    }
                } catch (error) {
                    console.log('❌ 管理API响应解析失败:', data);
                    reject(error);
                }
            });
        });
        
        req.on('error', (error) => {
            console.log('❌ 管理API请求失败:', error.message);
            reject(error);
        });
    });
}

// 主测试函数
async function runTests() {
    try {
        // 测试服务器连接
        await testServerConnection();
        
        // 创建测试文件
        createTestFiles();
        
        // 测试API提交
        await testAPISubmit();
        
        // 测试管理API
        await testAdminAPI();
        
        console.log('\n🎉 所有测试通过！');
        console.log('\n💡 接下来可以:');
        console.log('   1. 在手机浏览器中访问 http://localhost:3000 测试前端');
        console.log('   2. 在电脑浏览器中访问 http://localhost:3000/admin 查看管理后台');
        console.log('   3. 检查 uploads/ 目录中的上传文件');
        console.log('   4. 查看 submissions.json 中的数据');
        
    } catch (error) {
        console.log('\n❌ 测试失败:', error.message);
        console.log('\n🔧 故障排除:');
        console.log('   1. 确保服务器正在运行: npm start');
        console.log('   2. 检查端口3000是否被占用');
        console.log('   3. 查看服务器控制台的错误信息');
        console.log('   4. 确保所有依赖已安装: npm install');
    } finally {
        // 清理测试文件
        cleanupTestFiles();
    }
}

// 检查是否安装了form-data依赖
if (!fs.existsSync('node_modules/form-data')) {
    console.log('❌ 缺少form-data依赖，正在安装...');
    const { spawn } = require('child_process');
    
    const install = spawn('npm', ['install', 'form-data'], {
        stdio: 'inherit',
        shell: true
    });
    
    install.on('close', (code) => {
        if (code === 0) {
            console.log('✅ form-data安装完成');
            runTests();
        } else {
            console.log('❌ form-data安装失败');
        }
    });
} else {
    runTests();
}