// 全局变量
let currentPage = 1;
let currentStatus = 'all';
let currentSearch = '';
let currentSubmissionId = null;

// 页面初始化
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

// 初始化应用
function initializeApp() {
    setupEventListeners();
    updateCurrentTime();
    loadDashboard();
    
    // 每分钟更新时间
    setInterval(updateCurrentTime, 60000);
}

// 设置事件监听器
function setupEventListeners() {
    // 侧边栏导航
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            const page = this.dataset.page;
            switchPage(page);
        });
    });

    // 侧边栏切换
    document.querySelector('.sidebar-toggle').addEventListener('click', function() {
        document.querySelector('.sidebar').classList.toggle('show');
    });

    // 搜索和筛选
    document.getElementById('search-input').addEventListener('input', debounce(function() {
        currentSearch = this.value;
        currentPage = 1;
        loadSubmissions();
    }, 500));

    document.getElementById('status-filter').addEventListener('change', function() {
        currentStatus = this.value;
        currentPage = 1;
        loadSubmissions();
    });

    document.getElementById('refresh-btn').addEventListener('click', function() {
        loadSubmissions();
    });

    // 弹窗关闭
    document.querySelector('.modal-close').addEventListener('click', closeModal);
    document.getElementById('detail-modal').addEventListener('click', function(e) {
        if (e.target === this) {
            closeModal();
        }
    });
}

// 更新当前时间
function updateCurrentTime() {
    const now = new Date();
    const timeString = now.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
    document.getElementById('current-time').textContent = timeString;
}

// 页面切换
function switchPage(pageName) {
    // 更新导航状态
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    document.querySelector(`[data-page="${pageName}"]`).classList.add('active');

    // 更新页面内容
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    document.getElementById(`${pageName}-page`).classList.add('active');

    // 更新页面标题
    const titles = {
        dashboard: '数据概览',
        submissions: '提交管理',
        media: '媒体文件',
        settings: '系统设置'
    };
    document.getElementById('page-title').textContent = titles[pageName];

    // 加载对应页面数据
    switch(pageName) {
        case 'dashboard':
            loadDashboard();
            break;
        case 'submissions':
            loadSubmissions();
            break;
        case 'media':
            loadMediaGallery();
            break;
        case 'settings':
            // 设置页面是静态的，不需要加载数据
            break;
    }
}

// 加载仪表板数据
async function loadDashboard() {
    try {
        showLoading();
        
        // 加载统计数据
        const statsResponse = await fetch('/api/admin/stats');
        const statsData = await statsResponse.json();
        
        if (statsData.success) {
            updateStatsCards(statsData.data);
        }

        // 加载最近提交
        const submissionsResponse = await fetch('/api/admin/submissions?limit=5');
        const submissionsData = await submissionsResponse.json();
        
        if (submissionsData.success) {
            updateRecentSubmissions(submissionsData.data.submissions);
        }

    } catch (error) {
        console.error('加载仪表板数据失败:', error);
        showNotification('加载数据失败', 'error');
    } finally {
        hideLoading();
    }
}

// 更新统计卡片
function updateStatsCards(stats) {
    document.getElementById('total-submissions').textContent = stats.total;
    document.getElementById('pending-submissions').textContent = stats.pending;
    document.getElementById('approved-submissions').textContent = stats.approved;
    document.getElementById('rejected-submissions').textContent = stats.rejected;
    document.getElementById('total-images').textContent = stats.totalImages;
    document.getElementById('total-videos').textContent = stats.totalVideos;
}

// 更新最近提交
function updateRecentSubmissions(submissions) {
    const container = document.getElementById('recent-submissions-list');
    
    if (submissions.length === 0) {
        container.innerHTML = '<p class="text-muted">暂无提交记录</p>';
        return;
    }

    container.innerHTML = submissions.map(submission => `
        <div class="submission-item" onclick="showSubmissionDetail(${submission.id})">
            <div class="submission-avatar">
                ${submission.name.charAt(0)}
            </div>
            <div class="submission-info">
                <div class="submission-name">${submission.name}</div>
                <div class="submission-meta">
                    ${submission.phone} • ${formatDate(submission.submitTime)}
                </div>
            </div>
            <span class="submission-status status-${submission.status}">
                ${getStatusText(submission.status)}
            </span>
        </div>
    `).join('');
}

// 加载提交列表
async function loadSubmissions() {
    try {
        showLoading();
        
        const params = new URLSearchParams({
            page: currentPage,
            limit: 10,
            status: currentStatus,
            search: currentSearch
        });

        const response = await fetch(`/api/admin/submissions?${params}`);
        const data = await response.json();
        
        if (data.success) {
            updateSubmissionsTable(data.data.submissions);
            updatePagination(data.data.pagination);
        } else {
            showNotification('加载提交数据失败', 'error');
        }

    } catch (error) {
        console.error('加载提交数据失败:', error);
        showNotification('加载数据失败', 'error');
    } finally {
        hideLoading();
    }
}

// 更新提交表格
function updateSubmissionsTable(submissions) {
    const tbody = document.getElementById('submissions-table-body');
    
    if (submissions.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; padding: 40px; color: #999;">
                    暂无数据
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = submissions.map(submission => `
        <tr>
            <td>#${submission.id}</td>
            <td>${submission.name}</td>
            <td>${submission.phone}</td>
            <td>${formatDate(submission.submitTime)}</td>
            <td>
                <span class="submission-status status-${submission.status}">
                    ${getStatusText(submission.status)}
                </span>
            </td>
            <td>
                <div class="media-items-container">
                    ${submission.images.map((img, index) => `
                        <div class="media-item" title="${img.originalName}">
                            <img src="/${img.path}" 
                                 alt="图片${index + 1}" 
                                 onclick="showMediaPreview('/${img.path}', 'image')"
                                 onerror="this.style.display='none'; this.nextElementSibling.style.display='inline-block';">
                            <div class="media-error-mini" style="display: none;">
                                <i class="fas fa-image"></i>
                            </div>
                        </div>
                    `).join('')}
                    ${submission.videos.map((video, index) => `
                        <div class="media-item" title="${video.originalName}">
                            <video src="/${video.path}" 
                                   muted 
                                   preload="metadata"
                                   onclick="showMediaPreview('/${video.path}', 'video')"
                                   onerror="this.style.display='none'; this.nextElementSibling.style.display='inline-block';">
                            </video>
                            <div class="media-error-mini" style="display: none;">
                                <i class="fas fa-video"></i>
                            </div>
                            <div class="video-overlay">
                                <i class="fas fa-play"></i>
                            </div>
                        </div>
                    `).join('')}
                    ${submission.images.length + submission.videos.length > 0 ? `
                        <div class="media-count">
                            <i class="fas fa-images"></i> ${submission.images.length}
                            <i class="fas fa-video" style="margin-left: 8px;"></i> ${submission.videos.length}
                        </div>
                    ` : `
                        <div class="no-media">
                            <i class="fas fa-ban"></i> 无文件
                        </div>
                    `}
                </div>
            </td>
            <td>
                <button class="btn btn-primary btn-sm" onclick="showSubmissionDetail(${submission.id})">
                    <i class="fas fa-eye"></i> 查看
                </button>
                <button class="btn btn-danger btn-sm" onclick="deleteSubmission(${submission.id})">
                    <i class="fas fa-trash"></i> 删除
                </button>
            </td>
        </tr>
    `).join('');
}

// 更新分页
function updatePagination(pagination) {
    const container = document.getElementById('pagination');
    const { current, pages, total } = pagination;
    
    let html = `
        <button ${current <= 1 ? 'disabled' : ''} onclick="changePage(${current - 1})">
            <i class="fas fa-chevron-left"></i>
        </button>
    `;
    
    // 页码按钮
    for (let i = Math.max(1, current - 2); i <= Math.min(pages, current + 2); i++) {
        html += `
            <button class="${i === current ? 'active' : ''}" onclick="changePage(${i})">
                ${i}
            </button>
        `;
    }
    
    html += `
        <button ${current >= pages ? 'disabled' : ''} onclick="changePage(${current + 1})">
            <i class="fas fa-chevron-right"></i>
        </button>
        <span style="margin-left: 15px; color: #666;">
            共 ${total} 条记录，第 ${current}/${pages} 页
        </span>
    `;
    
    container.innerHTML = html;
}

// 切换页码
function changePage(page) {
    currentPage = page;
    loadSubmissions();
}

// 显示提交详情
async function showSubmissionDetail(id) {
    try {
        showLoading();
        
        const response = await fetch(`/api/admin/submissions/${id}`);
        const data = await response.json();
        
        if (data.success) {
            currentSubmissionId = id;
            renderSubmissionDetail(data.data);
            document.getElementById('detail-modal').classList.add('show');
        } else {
            showNotification('获取详情失败', 'error');
        }

    } catch (error) {
        console.error('获取提交详情失败:', error);
        showNotification('获取详情失败', 'error');
    } finally {
        hideLoading();
    }
}

// 渲染提交详情
function renderSubmissionDetail(submission) {
    const modalBody = document.getElementById('detail-modal-body');
    
    modalBody.innerHTML = `
        <div class="detail-section">
            <h4>基本信息</h4>
            <div class="detail-info">
                <div class="info-item">
                    <span class="info-label">提交ID</span>
                    <span class="info-value">#${submission.id}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">姓名</span>
                    <span class="info-value">${submission.name}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">手机号</span>
                    <span class="info-value">${submission.phone}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">提交时间</span>
                    <span class="info-value">${formatDate(submission.submitTime)}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">当前状态</span>
                    <span class="info-value">
                        <span class="submission-status status-${submission.status}">
                            ${getStatusText(submission.status)}
                        </span>
                    </span>
                </div>
            </div>
        </div>

        <div class="detail-section">
            <h4>文字说明</h4>
            <p style="background: #f8f9fa; padding: 15px; border-radius: 6px; line-height: 1.6;">
                ${submission.description}
            </p>
        </div>

        ${submission.images.length > 0 ? `
            <div class="detail-section">
                <h4>图片 (${submission.images.length})</h4>
                <div class="media-gallery">
                    ${submission.images.map(img => `
                        <div class="media-gallery-item">
                            <img src="/${img.path}" alt="${img.originalName}" onclick="showMediaPreview('/${img.path}', 'image')">
                            <div class="media-overlay">
                                <div style="text-align: center;">
                                    <div>${img.originalName}</div>
                                    <div style="font-size: 12px; opacity: 0.8;">${formatFileSize(img.size)}</div>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        ` : ''}

        ${submission.videos.length > 0 ? `
            <div class="detail-section">
                <h4>视频 (${submission.videos.length})</h4>
                <div class="media-gallery">
                    ${submission.videos.map(video => `
                        <div class="media-gallery-item">
                            <video src="/${video.path}" controls muted onclick="showMediaPreview('/${video.path}', 'video')"></video>
                            <div class="media-overlay">
                                <div style="text-align: center;">
                                    <div>${video.originalName}</div>
                                    <div style="font-size: 12px; opacity: 0.8;">${formatFileSize(video.size)}</div>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        ` : ''}
    `;
}

// 更新提交状态
async function updateStatus(status) {
    if (!currentSubmissionId) return;
    
    try {
        showLoading();
        
        const response = await fetch(`/api/admin/submissions/${currentSubmissionId}/status`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showNotification('状态更新成功', 'success');
            closeModal();
            loadSubmissions();
            loadDashboard(); // 更新统计数据
        } else {
            showNotification('状态更新失败', 'error');
        }

    } catch (error) {
        console.error('更新状态失败:', error);
        showNotification('更新状态失败', 'error');
    } finally {
        hideLoading();
    }
}

// 删除提交
async function deleteSubmission(id) {
    if (!confirm('确定要删除这条提交记录吗？此操作不可恢复。')) {
        return;
    }
    
    try {
        showLoading();
        
        const response = await fetch(`/api/admin/submissions/${id}`, {
            method: 'DELETE'
        });
        
        const data = await response.json();
        
        if (data.success) {
            showNotification('删除成功', 'success');
            loadSubmissions();
            loadDashboard(); // 更新统计数据
        } else {
            showNotification('删除失败', 'error');
        }

    } catch (error) {
        console.error('删除失败:', error);
        showNotification('删除失败', 'error');
    } finally {
        hideLoading();
    }
}

// 加载媒体画廊
async function loadMediaGallery() {
    try {
        showLoading();
        
        const response = await fetch('/api/admin/submissions?limit=100');
        const data = await response.json();
        
        if (data.success) {
            renderMediaGallery(data.data.submissions);
        }

    } catch (error) {
        console.error('加载媒体画廊失败:', error);
        showNotification('加载媒体文件失败', 'error');
    } finally {
        hideLoading();
    }
}

// 渲染媒体画廊
function renderMediaGallery(submissions) {
    const container = document.getElementById('media-gallery');
    const allMedia = [];
    
    submissions.forEach(submission => {
        submission.images.forEach(img => {
            allMedia.push({
                type: 'image',
                path: img.path,
                name: img.originalName,
                size: img.size,
                submissionId: submission.id,
                submissionName: submission.name
            });
        });
        
        submission.videos.forEach(video => {
            allMedia.push({
                type: 'video',
                path: video.path,
                name: video.originalName,
                size: video.size,
                submissionId: submission.id,
                submissionName: submission.name
            });
        });
    });
    
    if (allMedia.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #999; padding: 40px;">暂无媒体文件</p>';
        return;
    }
    
    container.innerHTML = allMedia.map(media => `
        <div class="media-gallery-item">
            ${media.type === 'image' ? 
                `<img src="/${media.path}" alt="${media.name}" onclick="showMediaPreview('/${media.path}', 'image')">` :
                `<video src="/${media.path}" muted onclick="showMediaPreview('/${media.path}', 'video')"></video>`
            }
            <div class="media-overlay">
                <div style="text-align: center;">
                    <div style="font-weight: 600;">${media.submissionName}</div>
                    <div style="font-size: 12px; opacity: 0.8;">${media.name}</div>
                    <div style="font-size: 11px; opacity: 0.6;">${formatFileSize(media.size)}</div>
                </div>
            </div>
        </div>
    `).join('');
}

// 显示媒体预览
function showMediaPreview(src, type) {
    console.log('预览媒体:', { src, type });
    
    // 移除已存在的预览弹窗
    const existingPreview = document.querySelector('.media-preview-modal');
    if (existingPreview) {
        existingPreview.remove();
    }
    
    const modal = document.createElement('div');
    modal.className = 'modal show media-preview-modal';
    modal.style.zIndex = '3000';
    modal.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    
    // 创建媒体元素
    let mediaElement = '';
    if (type === 'image') {
        mediaElement = `
            <img id="preview-media" 
                 src="${src}" 
                 alt="预览图片"
                 style="max-width: 90vw; max-height: 80vh; object-fit: contain; border-radius: 8px; box-shadow: 0 4px 20px rgba(0,0,0,0.3);"
                 onload="console.log('图片加载成功')"
                 onerror="console.error('图片加载失败:', this.src); this.style.display='none'; this.nextElementSibling.style.display='block';">
            <div style="display: none; color: white; padding: 20px; text-align: center;">
                <i class="fas fa-exclamation-triangle" style="font-size: 48px; margin-bottom: 10px;"></i>
                <p>图片加载失败</p>
                <p style="font-size: 12px; opacity: 0.7;">${src}</p>
            </div>
        `;
    } else if (type === 'video') {
        mediaElement = `
            <video id="preview-media" 
                   src="${src}" 
                   controls 
                   autoplay 
                   muted
                   style="max-width: 90vw; max-height: 80vh; border-radius: 8px; box-shadow: 0 4px 20px rgba(0,0,0,0.3);"
                   onloadeddata="console.log('视频加载成功')"
                   onerror="console.error('视频加载失败:', this.src); this.style.display='none'; this.nextElementSibling.style.display='block';">
            <div style="display: none; color: white; padding: 20px; text-align: center;">
                <i class="fas fa-exclamation-triangle" style="font-size: 48px; margin-bottom: 10px;"></i>
                <p>视频加载失败</p>
                <p style="font-size: 12px; opacity: 0.7;">${src}</p>
            </div>
        `;
    }
    
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 95vw; max-height: 95vh; background: transparent; box-shadow: none; border-radius: 0;">
            <div class="modal-header" style="background: rgba(0,0,0,0.7); color: white; border-radius: 8px 8px 0 0; padding: 15px 20px;">
                <h3 style="margin: 0; font-size: 18px;">
                    <i class="fas fa-${type === 'image' ? 'image' : 'video'}" style="margin-right: 10px;"></i>
                    ${type === 'image' ? '图片预览' : '视频预览'}
                </h3>
                <div style="display: flex; gap: 10px; align-items: center;">
                    <button class="btn btn-sm btn-secondary" onclick="downloadMedia('${src}')" style="padding: 5px 10px;">
                        <i class="fas fa-download"></i> 下载
                    </button>
                    <button class="modal-close" onclick="closeMediaPreview()" style="background: none; border: none; color: white; font-size: 24px; cursor: pointer; padding: 0; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center;">&times;</button>
                </div>
            </div>
            <div class="modal-body" style="text-align: center; padding: 20px; background: transparent;">
                ${mediaElement}
            </div>
            <div style="position: absolute; bottom: 20px; left: 50%; transform: translateX(-50%); color: white; font-size: 12px; opacity: 0.7;">
                点击空白区域关闭 | ESC键关闭
            </div>
        </div>
    `;
    
    // 点击空白区域关闭
    modal.addEventListener('click', function(e) {
        if (e.target === this) {
            closeMediaPreview();
        }
    });
    
    // ESC键关闭
    const handleEscape = function(e) {
        if (e.key === 'Escape') {
            closeMediaPreview();
            document.removeEventListener('keydown', handleEscape);
        }
    };
    document.addEventListener('keydown', handleEscape);
    
    document.body.appendChild(modal);
    
    // 防止页面滚动
    document.body.style.overflow = 'hidden';
}

// 关闭媒体预览
function closeMediaPreview() {
    const modal = document.querySelector('.media-preview-modal');
    if (modal) {
        modal.remove();
        document.body.style.overflow = 'auto';
    }
}

// 下载媒体文件
function downloadMedia(src) {
    try {
        const link = document.createElement('a');
        link.href = src;
        link.download = src.split('/').pop(); // 使用文件名作为下载名
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showNotification('开始下载文件', 'success');
    } catch (error) {
        console.error('下载失败:', error);
        showNotification('下载失败', 'error');
    }
}

// 关闭弹窗
function closeModal() {
    document.getElementById('detail-modal').classList.remove('show');
    currentSubmissionId = null;
}

// 显示加载动画
function showLoading() {
    document.getElementById('loading').classList.add('show');
}

// 隐藏加载动画
function hideLoading() {
    document.getElementById('loading').classList.remove('show');
}

// 显示通知
function showNotification(message, type = 'info') {
    // 创建通知元素
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 6px;
        color: white;
        font-weight: 500;
        z-index: 4000;
        animation: slideIn 0.3s ease;
    `;
    
    // 设置背景色
    const colors = {
        success: '#28a745',
        error: '#dc3545',
        warning: '#ffc107',
        info: '#007bff'
    };
    notification.style.backgroundColor = colors[type] || colors.info;
    
    notification.textContent = message;
    document.body.appendChild(notification);
    
    // 3秒后自动移除
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// 切换导出下拉菜单
function toggleExportDropdown() {
    const dropdown = document.getElementById('export-dropdown');
    dropdown.classList.toggle('show');
    
    // 点击外部关闭下拉菜单
    document.addEventListener('click', function closeDropdown(e) {
        if (!e.target.closest('.export-dropdown')) {
            dropdown.classList.remove('show');
            document.removeEventListener('click', closeDropdown);
        }
    });
}

// 显示导出进度
function showExportProgress(title, message) {
    const progressId = 'export-progress-' + Date.now();
    const progress = document.createElement('div');
    progress.id = progressId;
    progress.className = 'export-progress';
    
    progress.innerHTML = `
        <div class="export-progress-header">
            <i class="fas fa-download"></i>
            <div class="export-progress-title">${title}</div>
        </div>
        <div class="export-progress-message">${message}</div>
        <div class="export-progress-bar">
            <div class="export-progress-fill"></div>
        </div>
    `;
    
    document.body.appendChild(progress);
    
    return {
        update: (message, type = 'info') => {
            const messageEl = progress.querySelector('.export-progress-message');
            messageEl.textContent = message;
            
            if (type === 'success') {
                progress.classList.add('success');
                progress.querySelector('.export-progress-fill').style.width = '100%';
                progress.querySelector('.export-progress-fill').style.animation = 'none';
            } else if (type === 'error') {
                progress.classList.add('error');
                progress.querySelector('.export-progress-fill').style.background = '#dc3545';
            }
        },
        close: () => {
            setTimeout(() => {
                if (progress.parentNode) {
                    progress.parentNode.removeChild(progress);
                }
            }, 3000);
        }
    };
}

// 导出基础数据
function exportBasicData() {
    if (confirm('确定要导出基础数据到Excel吗？')) {
        const progress = showExportProgress('导出基础数据', '正在准备导出文件...');
        
        // 创建一个隐藏的链接来下载文件
        const link = document.createElement('a');
        link.href = '/api/admin/export';
        link.download = `随手拍数据_${new Date().toISOString().slice(0, 10)}.xlsx`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // 模拟进度更新
        setTimeout(() => {
            progress.update('正在生成Excel文件...');
        }, 1000);
        
        setTimeout(() => {
            progress.update('文件下载完成！', 'success');
            progress.close();
        }, 3000);
    }
}

// 导出详细数据
function exportDetailedData() {
    if (confirm('确定要导出详细数据到Excel吗？\n详细数据包含多个工作表，文件较大。')) {
        const progress = showExportProgress('导出详细数据', '正在准备详细数据...');
        
        const link = document.createElement('a');
        link.href = '/api/admin/export-detailed';
        link.download = `随手拍详细数据_${new Date().toISOString().slice(0, 10)}.xlsx`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // 模拟进度更新
        setTimeout(() => {
            progress.update('正在生成多个工作表...');
        }, 1500);
        
        setTimeout(() => {
            progress.update('正在处理文件信息...');
        }, 3000);
        
        setTimeout(() => {
            progress.update('详细Excel文件下载完成！', 'success');
            progress.close();
        }, 5000);
    }
}

// 导出当前视图数据
async function exportCurrentView() {
    try {
        if (confirm('确定要导出当前筛选的数据吗？')) {
            const progress = showExportProgress('导出当前视图', '正在获取数据...');
            
            // 获取当前筛选的数据
            const params = new URLSearchParams({
                page: 1,
                limit: 1000, // 获取所有数据
                status: currentStatus,
                search: currentSearch
            });

            const response = await fetch(`/api/admin/submissions?${params}`);
            const data = await response.json();
            
            if (data.success && data.data.submissions.length > 0) {
                progress.update('正在生成文件...');
                // 使用前端生成Excel
                exportToExcel(data.data.submissions, '当前视图数据');
                progress.update(`成功导出 ${data.data.submissions.length} 条记录！`, 'success');
                progress.close();
            } else {
                progress.update('当前视图没有数据可导出', 'error');
                progress.close();
            }
        }
    } catch (error) {
        console.error('导出当前视图失败:', error);
        showNotification('导出失败，请稍后重试', 'error');
    }
}

// 前端生成Excel文件
function exportToExcel(submissions, sheetName = '随手拍数据') {
    // 准备数据
    const exportData = submissions.map((submission, index) => ({
        '序号': index + 1,
        '提交ID': submission.id,
        '姓名': submission.name,
        '手机号': submission.phone,
        '文字说明': submission.description,
        '图片数量': submission.images.length,
        '视频数量': submission.videos.length,
        '提交时间': formatDate(submission.submitTime),
        '审核状态': getStatusText(submission.status),
        '更新时间': submission.updateTime ? formatDate(submission.updateTime) : ''
    }));
    
    // 创建CSV内容
    const headers = Object.keys(exportData[0]);
    const csvContent = [
        headers.join(','),
        ...exportData.map(row => 
            headers.map(header => {
                const value = row[header] || '';
                // 处理包含逗号或换行的字段
                return typeof value === 'string' && (value.includes(',') || value.includes('\n')) 
                    ? `"${value.replace(/"/g, '""')}"` 
                    : value;
            }).join(',')
        )
    ].join('\n');
    
    // 添加BOM以支持中文
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    
    // 创建下载链接
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${sheetName}_${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

// 批量导出功能
function showBatchExportModal() {
    const modal = document.createElement('div');
    modal.className = 'modal show';
    modal.style.zIndex = '3000';
    
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 600px;">
            <div class="modal-header">
                <h3>批量导出设置</h3>
                <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
            </div>
            <div class="modal-body">
                <div class="export-options">
                    <h4>选择导出内容：</h4>
                    <div style="margin: 15px 0;">
                        <label style="display: block; margin-bottom: 10px;">
                            <input type="checkbox" id="export-basic" checked> 基本信息
                        </label>
                        <label style="display: block; margin-bottom: 10px;">
                            <input type="checkbox" id="export-images"> 图片文件信息
                        </label>
                        <label style="display: block; margin-bottom: 10px;">
                            <input type="checkbox" id="export-videos"> 视频文件信息
                        </label>
                        <label style="display: block; margin-bottom: 10px;">
                            <input type="checkbox" id="export-stats"> 统计信息
                        </label>
                    </div>
                    
                    <h4>选择状态筛选：</h4>
                    <div style="margin: 15px 0;">
                        <select id="export-status" style="width: 100%; padding: 8px;">
                            <option value="all">全部状态</option>
                            <option value="pending">待审核</option>
                            <option value="approved">已通过</option>
                            <option value="rejected">已拒绝</option>
                        </select>
                    </div>
                    
                    <h4>时间范围：</h4>
                    <div style="margin: 15px 0; display: flex; gap: 10px;">
                        <input type="date" id="export-start-date" style="flex: 1; padding: 8px;">
                        <span style="align-self: center;">至</span>
                        <input type="date" id="export-end-date" style="flex: 1; padding: 8px;">
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-primary" onclick="executeBatchExport()">
                    <i class="fas fa-download"></i> 开始导出
                </button>
                <button class="btn btn-secondary" onclick="this.closest('.modal').remove()">取消</button>
            </div>
        </div>
    `;
    
    modal.addEventListener('click', function(e) {
        if (e.target === this) {
            this.remove();
        }
    });
    
    document.body.appendChild(modal);
}

// 执行批量导出
async function executeBatchExport() {
    try {
        const modal = document.querySelector('.modal');
        const options = {
            basic: document.getElementById('export-basic').checked,
            images: document.getElementById('export-images').checked,
            videos: document.getElementById('export-videos').checked,
            stats: document.getElementById('export-stats').checked,
            status: document.getElementById('export-status').value,
            startDate: document.getElementById('export-start-date').value,
            endDate: document.getElementById('export-end-date').value
        };
        
        modal.remove();
        
        const progress = showExportProgress('批量导出', '正在获取数据...');
        
        // 构建查询参数
        const params = new URLSearchParams({
            page: 1,
            limit: 10000,
            status: options.status
        });
        
        if (options.startDate) params.append('startDate', options.startDate);
        if (options.endDate) params.append('endDate', options.endDate);
        
        // 获取数据
        const response = await fetch(`/api/admin/submissions?${params}`);
        const data = await response.json();
        
        if (data.success) {
            progress.update('正在处理导出数据...');
            
            // 根据选项导出
            if (options.basic) {
                exportToExcel(data.data.submissions, '批量导出数据');
            }
            
            progress.update('导出完成！', 'success');
            progress.close();
        } else {
            progress.update('获取数据失败', 'error');
            progress.close();
        }
        
    } catch (error) {
        console.error('批量导出失败:', error);
        showNotification('批量导出失败', 'error');
    }
}

// 清空数据功能
function clearData() {
    if (confirm('⚠️ 警告：此操作将删除所有提交数据和文件，且不可恢复！\n\n确定要继续吗？')) {
        if (confirm('请再次确认：您真的要删除所有数据吗？')) {
            // 这里可以添加清空数据的API调用
            showNotification('此功能需要服务器端支持', 'warning');
        }
    }
}

// 工具函数

// 防抖函数
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// 格式化日期
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// 获取状态文本
function getStatusText(status) {
    const statusMap = {
        pending: '待审核',
        approved: '已通过',
        rejected: '已拒绝'
    };
    return statusMap[status] || status;
}

// 格式化文件大小
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// 添加CSS动画
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style);