const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const XLSX = require('xlsx');

const app = express();
const PORT = 3000;

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static('uploads'));
app.use('/admin', express.static('admin'));
app.use(express.static('.'));

// 确保上传目录存在
const uploadDirs = ['uploads/images', 'uploads/videos'];
uploadDirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

// 配置multer存储
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        if (file.mimetype.startsWith('image/')) {
            cb(null, 'uploads/images/');
        } else if (file.mimetype.startsWith('video/')) {
            cb(null, 'uploads/videos/');
        } else {
            cb(new Error('不支持的文件类型'), null);
        }
    },
    filename: function (req, file, cb) {
        // 生成唯一文件名
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, file.fieldname + '-' + uniqueSuffix + ext);
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 50 * 1024 * 1024, // 50MB限制
        files: 10 // 最多10个文件
    },
    fileFilter: function (req, file, cb) {
        // 检查文件类型
        if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
            cb(null, true);
        } else {
            cb(new Error('只允许上传图片和视频文件'), false);
        }
    }
});

// 数据存储（实际项目中应该使用数据库）
let submissions = [];
let submissionId = 1;

// 加载已存在的数据
const dataFile = 'submissions.json';
if (fs.existsSync(dataFile)) {
    try {
        const data = fs.readFileSync(dataFile, 'utf8');
        const parsed = JSON.parse(data);
        submissions = parsed.submissions || [];
        submissionId = parsed.nextId || 1;
        console.log(`加载了 ${submissions.length} 条历史数据`);
    } catch (error) {
        console.error('加载历史数据失败:', error);
    }
}

// 保存数据到文件
function saveData() {
    try {
        const data = {
            submissions: submissions,
            nextId: submissionId
        };
        fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('保存数据失败:', error);
    }
}

// API路由

// 提交表单数据
app.post('/api/submit', upload.any(), (req, res) => {
    console.log('=== 收到提交请求 ===');
    console.log('请求头:', req.headers);
    console.log('请求体:', req.body);
    console.log('文件信息:', req.files?.map(f => ({ 
        fieldname: f.fieldname, 
        originalname: f.originalname,
        filename: f.filename, 
        size: f.size,
        mimetype: f.mimetype 
    })));

    try {
        const { phone, name, description } = req.body;

        // 验证必填字段
        if (!phone || !name || !description) {
            console.log('验证失败: 缺少必填字段', { phone: !!phone, name: !!name, description: !!description });
            return res.status(400).json({
                success: false,
                message: '请填写所有必填字段',
                details: {
                    phone: !phone ? '手机号不能为空' : null,
                    name: !name ? '姓名不能为空' : null,
                    description: !description ? '文字说明不能为空' : null
                }
            });
        }

        // 验证手机号格式
        const phoneRegex = /^1[3-9]\d{9}$/;
        if (!phoneRegex.test(phone)) {
            console.log('验证失败: 手机号格式错误', phone);
            return res.status(400).json({
                success: false,
                message: '手机号格式不正确'
            });
        }

        // 处理上传的文件
        const images = [];
        const videos = [];

        console.log('处理上传文件:', req.files);

        if (req.files && req.files.length > 0) {
            req.files.forEach(file => {
                console.log('处理文件:', {
                    fieldname: file.fieldname,
                    originalname: file.originalname,
                    mimetype: file.mimetype,
                    size: file.size,
                    path: file.path
                });

                const fileInfo = {
                    originalName: file.originalname,
                    filename: file.filename,
                    path: file.path,
                    size: file.size,
                    mimetype: file.mimetype,
                    uploadTime: new Date().toISOString()
                };

                // 根据字段名或MIME类型判断文件类型
                if (file.fieldname.startsWith('image_') || file.mimetype.startsWith('image/')) {
                    images.push(fileInfo);
                    console.log('添加图片文件:', fileInfo.originalName);
                } else if (file.fieldname.startsWith('video_') || file.mimetype.startsWith('video/')) {
                    videos.push(fileInfo);
                    console.log('添加视频文件:', fileInfo.originalName);
                }
            });
        }

        // 验证至少有一张图片
        if (images.length === 0) {
            console.log('验证失败: 没有图片文件');
            return res.status(400).json({
                success: false,
                message: '请至少上传一张图片'
            });
        }

        // 创建提交记录
        const submission = {
            id: submissionId++,
            phone: phone,
            name: name,
            description: description,
            images: images,
            videos: videos,
            submitTime: new Date().toISOString(),
            status: 'pending' // pending, approved, rejected
        };

        submissions.unshift(submission); // 最新的在前面
        saveData();

        console.log(`新提交保存成功，ID: ${submission.id}`);
        console.log('提交详情:', {
            id: submission.id,
            phone: submission.phone,
            name: submission.name,
            imagesCount: submission.images.length,
            videosCount: submission.videos.length
        });

        res.json({
            success: true,
            message: '提交成功！',
            data: {
                id: submission.id,
                submitTime: submission.submitTime,
                imagesCount: images.length,
                videosCount: videos.length
            }
        });

    } catch (error) {
        console.error('提交处理失败:', error);
        
        // 清理可能已上传的文件
        if (req.files) {
            req.files.forEach(file => {
                try {
                    if (fs.existsSync(file.path)) {
                        fs.unlinkSync(file.path);
                        console.log('清理文件:', file.path);
                    }
                } catch (cleanupError) {
                    console.error('清理文件失败:', file.path, cleanupError);
                }
            });
        }
        
        res.status(500).json({
            success: false,
            message: '服务器错误，请稍后重试',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// 获取所有提交数据（管理员接口）
app.get('/api/admin/submissions', (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const status = req.query.status;
        const search = req.query.search;

        let filteredSubmissions = [...submissions];

        // 状态筛选
        if (status && status !== 'all') {
            filteredSubmissions = filteredSubmissions.filter(s => s.status === status);
        }

        // 搜索筛选
        if (search) {
            const searchLower = search.toLowerCase();
            filteredSubmissions = filteredSubmissions.filter(s => 
                s.name.toLowerCase().includes(searchLower) ||
                s.phone.includes(search) ||
                s.description.toLowerCase().includes(searchLower)
            );
        }

        // 分页
        const total = filteredSubmissions.length;
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        const paginatedSubmissions = filteredSubmissions.slice(startIndex, endIndex);

        res.json({
            success: true,
            data: {
                submissions: paginatedSubmissions,
                pagination: {
                    current: page,
                    limit: limit,
                    total: total,
                    pages: Math.ceil(total / limit)
                }
            }
        });

    } catch (error) {
        console.error('获取提交数据失败:', error);
        res.status(500).json({
            success: false,
            message: '服务器错误'
        });
    }
});

// 获取单个提交详情
app.get('/api/admin/submissions/:id', (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const submission = submissions.find(s => s.id === id);

        if (!submission) {
            return res.status(404).json({
                success: false,
                message: '未找到该提交记录'
            });
        }

        res.json({
            success: true,
            data: submission
        });

    } catch (error) {
        console.error('获取提交详情失败:', error);
        res.status(500).json({
            success: false,
            message: '服务器错误'
        });
    }
});

// 更新提交状态
app.put('/api/admin/submissions/:id/status', (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const { status } = req.body;

        if (!['pending', 'approved', 'rejected'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: '无效的状态值'
            });
        }

        const submission = submissions.find(s => s.id === id);
        if (!submission) {
            return res.status(404).json({
                success: false,
                message: '未找到该提交记录'
            });
        }

        submission.status = status;
        submission.updateTime = new Date().toISOString();
        saveData();

        res.json({
            success: true,
            message: '状态更新成功',
            data: submission
        });

    } catch (error) {
        console.error('更新状态失败:', error);
        res.status(500).json({
            success: false,
            message: '服务器错误'
        });
    }
});

// 删除提交记录
app.delete('/api/admin/submissions/:id', (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const submissionIndex = submissions.findIndex(s => s.id === id);

        if (submissionIndex === -1) {
            return res.status(404).json({
                success: false,
                message: '未找到该提交记录'
            });
        }

        const submission = submissions[submissionIndex];

        // 删除相关文件
        [...submission.images, ...submission.videos].forEach(file => {
            try {
                if (fs.existsSync(file.path)) {
                    fs.unlinkSync(file.path);
                }
            } catch (error) {
                console.error('删除文件失败:', file.path, error);
            }
        });

        // 从数组中移除
        submissions.splice(submissionIndex, 1);
        saveData();

        res.json({
            success: true,
            message: '删除成功'
        });

    } catch (error) {
        console.error('删除提交记录失败:', error);
        res.status(500).json({
            success: false,
            message: '服务器错误'
        });
    }
});

// 获取统计数据
app.get('/api/admin/stats', (req, res) => {
    try {
        const stats = {
            total: submissions.length,
            pending: submissions.filter(s => s.status === 'pending').length,
            approved: submissions.filter(s => s.status === 'approved').length,
            rejected: submissions.filter(s => s.status === 'rejected').length,
            totalImages: submissions.reduce((sum, s) => sum + s.images.length, 0),
            totalVideos: submissions.reduce((sum, s) => sum + s.videos.length, 0)
        };

        res.json({
            success: true,
            data: stats
        });

    } catch (error) {
        console.error('获取统计数据失败:', error);
        res.status(500).json({
            success: false,
            message: '服务器错误'
        });
    }
});

// 导出数据到Excel
app.get('/api/admin/export', (req, res) => {
    try {
        console.log('开始导出数据到Excel...');
        
        // 准备导出数据
        const exportData = submissions.map((submission, index) => {
            return {
                '序号': index + 1,
                '提交ID': submission.id,
                '姓名': submission.name,
                '手机号': submission.phone,
                '文字说明': submission.description,
                '图片数量': submission.images.length,
                '视频数量': submission.videos.length,
                '图片文件名': submission.images.map(img => img.originalName).join(', '),
                '视频文件名': submission.videos.map(video => video.originalName).join(', '),
                '提交时间': new Date(submission.submitTime).toLocaleString('zh-CN'),
                '审核状态': getStatusText(submission.status),
                '更新时间': submission.updateTime ? new Date(submission.updateTime).toLocaleString('zh-CN') : ''
            };
        });

        // 创建工作簿
        const wb = XLSX.utils.book_new();
        
        // 创建工作表
        const ws = XLSX.utils.json_to_sheet(exportData);
        
        // 设置列宽
        const colWidths = [
            { wch: 6 },   // 序号
            { wch: 10 },  // 提交ID
            { wch: 12 },  // 姓名
            { wch: 15 },  // 手机号
            { wch: 30 },  // 文字说明
            { wch: 10 },  // 图片数量
            { wch: 10 },  // 视频数量
            { wch: 40 },  // 图片文件名
            { wch: 40 },  // 视频文件名
            { wch: 20 },  // 提交时间
            { wch: 10 },  // 审核状态
            { wch: 20 }   // 更新时间
        ];
        ws['!cols'] = colWidths;
        
        // 添加工作表到工作簿
        XLSX.utils.book_append_sheet(wb, ws, '随手拍数据');
        
        // 生成Excel文件
        const fileName = `随手拍数据_${new Date().toISOString().slice(0, 10)}.xlsx`;
        const filePath = path.join(__dirname, 'exports', fileName);
        
        // 确保导出目录存在
        const exportDir = path.join(__dirname, 'exports');
        if (!fs.existsSync(exportDir)) {
            fs.mkdirSync(exportDir, { recursive: true });
        }
        
        // 写入文件
        XLSX.writeFile(wb, filePath);
        
        console.log(`Excel文件已生成: ${filePath}`);
        
        // 设置响应头
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`);
        
        // 发送文件
        res.sendFile(filePath, (err) => {
            if (err) {
                console.error('发送Excel文件失败:', err);
                res.status(500).json({
                    success: false,
                    message: '文件下载失败'
                });
            } else {
                console.log('Excel文件发送成功');
                // 可选：删除临时文件
                setTimeout(() => {
                    try {
                        if (fs.existsSync(filePath)) {
                            fs.unlinkSync(filePath);
                            console.log('临时Excel文件已删除');
                        }
                    } catch (error) {
                        console.error('删除临时文件失败:', error);
                    }
                }, 5000); // 5秒后删除
            }
        });

    } catch (error) {
        console.error('导出Excel失败:', error);
        res.status(500).json({
            success: false,
            message: '导出失败',
            error: error.message
        });
    }
});

// 导出详细数据（包含文件信息）
app.get('/api/admin/export-detailed', (req, res) => {
    try {
        console.log('开始导出详细数据到Excel...');
        
        // 创建工作簿
        const wb = XLSX.utils.book_new();
        
        // 1. 基本信息工作表
        const basicData = submissions.map((submission, index) => ({
            '序号': index + 1,
            '提交ID': submission.id,
            '姓名': submission.name,
            '手机号': submission.phone,
            '文字说明': submission.description,
            '提交时间': new Date(submission.submitTime).toLocaleString('zh-CN'),
            '审核状态': getStatusText(submission.status),
            '更新时间': submission.updateTime ? new Date(submission.updateTime).toLocaleString('zh-CN') : '',
            '图片数量': submission.images.length,
            '视频数量': submission.videos.length
        }));
        
        const basicWs = XLSX.utils.json_to_sheet(basicData);
        basicWs['!cols'] = [
            { wch: 6 }, { wch: 10 }, { wch: 12 }, { wch: 15 }, { wch: 40 },
            { wch: 20 }, { wch: 10 }, { wch: 20 }, { wch: 10 }, { wch: 10 }
        ];
        XLSX.utils.book_append_sheet(wb, basicWs, '基本信息');
        
        // 2. 图片文件工作表
        const imageData = [];
        submissions.forEach(submission => {
            submission.images.forEach((image, index) => {
                imageData.push({
                    '提交ID': submission.id,
                    '用户姓名': submission.name,
                    '图片序号': index + 1,
                    '原始文件名': image.originalName,
                    '存储文件名': image.filename,
                    '文件大小(MB)': (image.size / 1024 / 1024).toFixed(2),
                    '文件类型': image.mimetype,
                    '上传时间': new Date(image.uploadTime).toLocaleString('zh-CN'),
                    '文件路径': image.path
                });
            });
        });
        
        if (imageData.length > 0) {
            const imageWs = XLSX.utils.json_to_sheet(imageData);
            imageWs['!cols'] = [
                { wch: 10 }, { wch: 12 }, { wch: 8 }, { wch: 25 }, { wch: 25 },
                { wch: 12 }, { wch: 15 }, { wch: 20 }, { wch: 30 }
            ];
            XLSX.utils.book_append_sheet(wb, imageWs, '图片文件');
        }
        
        // 3. 视频文件工作表
        const videoData = [];
        submissions.forEach(submission => {
            submission.videos.forEach((video, index) => {
                videoData.push({
                    '提交ID': submission.id,
                    '用户姓名': submission.name,
                    '视频序号': index + 1,
                    '原始文件名': video.originalName,
                    '存储文件名': video.filename,
                    '文件大小(MB)': (video.size / 1024 / 1024).toFixed(2),
                    '文件类型': video.mimetype,
                    '上传时间': new Date(video.uploadTime).toLocaleString('zh-CN'),
                    '文件路径': video.path
                });
            });
        });
        
        if (videoData.length > 0) {
            const videoWs = XLSX.utils.json_to_sheet(videoData);
            videoWs['!cols'] = [
                { wch: 10 }, { wch: 12 }, { wch: 8 }, { wch: 25 }, { wch: 25 },
                { wch: 12 }, { wch: 15 }, { wch: 20 }, { wch: 30 }
            ];
            XLSX.utils.book_append_sheet(wb, videoWs, '视频文件');
        }
        
        // 4. 统计信息工作表
        const stats = {
            total: submissions.length,
            pending: submissions.filter(s => s.status === 'pending').length,
            approved: submissions.filter(s => s.status === 'approved').length,
            rejected: submissions.filter(s => s.status === 'rejected').length,
            totalImages: submissions.reduce((sum, s) => sum + s.images.length, 0),
            totalVideos: submissions.reduce((sum, s) => sum + s.videos.length, 0)
        };
        
        const statsData = [
            { '统计项目': '总提交数', '数值': stats.total },
            { '统计项目': '待审核', '数值': stats.pending },
            { '统计项目': '已通过', '数值': stats.approved },
            { '统计项目': '已拒绝', '数值': stats.rejected },
            { '统计项目': '图片总数', '数值': stats.totalImages },
            { '统计项目': '视频总数', '数值': stats.totalVideos },
            { '统计项目': '导出时间', '数值': new Date().toLocaleString('zh-CN') }
        ];
        
        const statsWs = XLSX.utils.json_to_sheet(statsData);
        statsWs['!cols'] = [{ wch: 15 }, { wch: 15 }];
        XLSX.utils.book_append_sheet(wb, statsWs, '统计信息');
        
        // 生成文件
        const fileName = `随手拍详细数据_${new Date().toISOString().slice(0, 10)}.xlsx`;
        const filePath = path.join(__dirname, 'exports', fileName);
        
        // 确保导出目录存在
        const exportDir = path.join(__dirname, 'exports');
        if (!fs.existsSync(exportDir)) {
            fs.mkdirSync(exportDir, { recursive: true });
        }
        
        XLSX.writeFile(wb, filePath);
        
        console.log(`详细Excel文件已生成: ${filePath}`);
        
        // 设置响应头并发送文件
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`);
        
        res.sendFile(filePath, (err) => {
            if (err) {
                console.error('发送详细Excel文件失败:', err);
                res.status(500).json({
                    success: false,
                    message: '文件下载失败'
                });
            } else {
                console.log('详细Excel文件发送成功');
                // 5秒后删除临时文件
                setTimeout(() => {
                    try {
                        if (fs.existsSync(filePath)) {
                            fs.unlinkSync(filePath);
                            console.log('临时详细Excel文件已删除');
                        }
                    } catch (error) {
                        console.error('删除临时文件失败:', error);
                    }
                }, 5000);
            }
        });

    } catch (error) {
        console.error('导出详细Excel失败:', error);
        res.status(500).json({
            success: false,
            message: '导出失败',
            error: error.message
        });
    }
});

// 辅助函数：获取状态文本
function getStatusText(status) {
    const statusMap = {
        pending: '待审核',
        approved: '已通过',
        rejected: '已拒绝'
    };
    return statusMap[status] || status;
}

// 管理员登录页面
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin', 'index.html'));
});

// 错误处理中间件
app.use((error, req, res, next) => {
    console.error('服务器错误:', error);
    
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                message: '文件大小超出限制'
            });
        }
        if (error.code === 'LIMIT_FILE_COUNT') {
            return res.status(400).json({
                success: false,
                message: '文件数量超出限制'
            });
        }
    }

    res.status(500).json({
        success: false,
        message: '服务器内部错误'
    });
});

// 启动服务器
app.listen(PORT, () => {
    console.log(`🚀 随手拍后台服务器启动成功！`);
    console.log(`📱 前端应用: http://localhost:${PORT}`);
    console.log(`🔧 管理后台: http://localhost:${PORT}/admin`);
    console.log(`📊 API文档: http://localhost:${PORT}/api`);
    console.log(`📁 上传目录: ${path.resolve('uploads')}`);
    console.log(`💾 数据文件: ${path.resolve(dataFile)}`);
});

// 优雅关闭
process.on('SIGINT', () => {
    console.log('\n正在关闭服务器...');
    saveData();
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n正在关闭服务器...');
    saveData();
    process.exit(0);
});