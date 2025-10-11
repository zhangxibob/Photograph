// 页面切换功能
function showActivityPage() {
    document.getElementById('activity-page').classList.remove('hidden');
    document.getElementById('register-page').classList.add('hidden');
}

function showRegisterPage() {
    document.getElementById('activity-page').classList.add('hidden');
    document.getElementById('register-page').classList.remove('hidden');
}

// 文件上传相关变量和限制
let selectedImages = [];
let selectedVideos = [];
const MAX_IMAGES = 4;
const MAX_VIDEOS = 2;

// 显示图片选择弹窗
function showImageOptions() {
    // 检查图片数量限制
    if (selectedImages.length >= MAX_IMAGES) {
        alert(`最多只能上传${MAX_IMAGES}张图片`);
        return;
    }
    showModal('image-modal');
}

// 显示视频选择弹窗
function showVideoOptions() {
    // 检查视频数量限制
    if (selectedVideos.length >= MAX_VIDEOS) {
        alert(`最多只能上传${MAX_VIDEOS}个视频`);
        return;
    }
    showModal('video-modal');
}

// 显示弹窗
function showModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.classList.add('show');
    document.body.style.overflow = 'hidden';
}

// 隐藏弹窗
function hideModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.classList.remove('show');
    document.body.style.overflow = 'auto';
}

// 从相册选择
function selectFromGallery(type) {
    if (type === 'image') {
        document.getElementById('image-input-gallery').click();
        hideModal('image-modal');
    } else if (type === 'video') {
        document.getElementById('video-input-gallery').click();
        hideModal('video-modal');
    }
}

// 检测设备相机支持
function isCameraSupported() {
    // 检查多种相机API支持
    return !!(
        navigator.mediaDevices && navigator.mediaDevices.getUserMedia ||
        navigator.getUserMedia ||
        navigator.webkitGetUserMedia ||
        navigator.mozGetUserMedia ||
        navigator.msGetUserMedia ||
        // 检查是否为移动设备
        /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    );
}

// 拍照功能 - 优化荣耀手机兼容性
function capturePhoto() {
    console.log('尝试拍照，设备信息:', {
        userAgent: navigator.userAgent,
        mediaDevices: !!navigator.mediaDevices,
        getUserMedia: !!navigator.mediaDevices?.getUserMedia
    });

    hideModal('image-modal');

    // 使用增强的相机调用功能
    try {
        enhancedCameraCapture('image');
    } catch (error) {
        console.error('拍照功能调用失败:', error);
        alert('无法调用相机，请选择本地图片');
    }
}

// 拍视频功能 - 优化荣耀手机兼容性
function captureVideo() {
    console.log('尝试录像，设备信息:', {
        userAgent: navigator.userAgent,
        mediaDevices: !!navigator.mediaDevices,
        getUserMedia: !!navigator.mediaDevices?.getUserMedia
    });

    hideModal('video-modal');

    // 使用增强的相机调用功能
    try {
        enhancedCameraCapture('video');
    } catch (error) {
        console.error('录像功能调用失败:', error);
        alert('无法调用相机，请选择本地视频');
    }
}

// 处理文件选择的通用函数
function handleFileSelection(files, type) {
    console.log(`处理文件选择: ${type}, 文件数量: ${files.length}`);

    if (type === 'image') {
        // 检查图片数量限制
        const remainingSlots = MAX_IMAGES - selectedImages.length;
        console.log(`图片剩余槽位: ${remainingSlots}`);

        if (remainingSlots <= 0) {
            alert(`最多只能上传${MAX_IMAGES}张图片`);
            return;
        }

        let addedCount = 0;
        files.forEach((file, index) => {
            console.log(`处理图片文件 ${index + 1}:`, {
                name: file.name,
                type: file.type,
                size: file.size,
                isImage: file.type.startsWith('image/')
            });

            if (file.type.startsWith('image/') && addedCount < remainingSlots) {
                // 检查文件大小 (限制为5MB)
                if (file.size > 5 * 1024 * 1024) {
                    alert(`图片 "${file.name}" 文件大小不能超过5MB`);
                    return;
                }
                selectedImages.push(file);
                addedCount++;
                console.log(`成功添加图片: ${file.name}, 当前总数: ${selectedImages.length}`);
            }
        });

        if (files.length > remainingSlots) {
            alert(`只能再添加${remainingSlots}张图片，已为您选择前${remainingSlots}张`);
        }

        console.log('更新图片预览...');
        updateImagePreview();
        updateImageCount();

    } else if (type === 'video') {
        // 检查视频数量限制
        const remainingSlots = MAX_VIDEOS - selectedVideos.length;
        console.log(`视频剩余槽位: ${remainingSlots}`);

        if (remainingSlots <= 0) {
            alert(`最多只能上传${MAX_VIDEOS}个视频`);
            return;
        }

        let addedCount = 0;
        files.forEach((file, index) => {
            console.log(`处理视频文件 ${index + 1}:`, {
                name: file.name,
                type: file.type,
                size: file.size,
                isVideo: file.type.startsWith('video/')
            });

            if (file.type.startsWith('video/') && addedCount < remainingSlots) {
                // 检查文件大小 (限制为50MB)
                if (file.size > 50 * 1024 * 1024) {
                    alert(`视频 "${file.name}" 文件大小不能超过50MB`);
                    return;
                }
                selectedVideos.push(file);
                addedCount++;
                console.log(`成功添加视频: ${file.name}, 当前总数: ${selectedVideos.length}`);
            }
        });

        if (files.length > remainingSlots) {
            alert(`只能再添加${remainingSlots}个视频，已为您选择前${remainingSlots}个`);
        }

        console.log('更新视频预览...');
        updateVideoPreview();
        updateVideoCount();
    }
}

// 更新图片预览
function updateImagePreview() {
    console.log('开始更新图片预览，当前图片数量:', selectedImages.length);

    const placeholder = document.getElementById('image-placeholder');
    const uploadArea = placeholder.parentElement;

    // 清除现有预览
    const existingPreviews = uploadArea.querySelectorAll('.upload-preview');
    existingPreviews.forEach(preview => {
        // 释放现有图片的URL
        const imgs = preview.querySelectorAll('img');
        imgs.forEach(img => {
            if (img.src.startsWith('blob:')) {
                URL.revokeObjectURL(img.src);
            }
        });
        preview.remove();
    });

    // 更新上传区域样式
    uploadArea.classList.remove('has-files', 'limit-reached');

    if (selectedImages.length > 0) {
        console.log('显示图片预览');
        placeholder.style.display = 'none';
        uploadArea.classList.add('has-files');

        const previewContainer = document.createElement('div');
        previewContainer.className = 'upload-preview';

        // 添加已选择的图片
        selectedImages.forEach((file, index) => {
            console.log(`创建图片预览 ${index + 1}:`, file.name);

            const previewItem = document.createElement('div');
            previewItem.className = 'preview-item';

            const img = document.createElement('img');
            const imageUrl = URL.createObjectURL(file);
            img.src = imageUrl;
            img.alt = `预览图片 ${index + 1}`;

            // 添加样式确保图片正确显示
            img.style.width = '100%';
            img.style.height = '100%';
            img.style.objectFit = 'cover';

            // 图片加载事件
            img.onload = () => {
                console.log(`图片 ${index + 1} 加载成功:`, file.name);
            };

            img.onerror = () => {
                console.error(`图片 ${index + 1} 加载失败:`, file.name);
                URL.revokeObjectURL(imageUrl);
                previewItem.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#999;">加载失败</div>';
            };

            const removeBtn = document.createElement('button');
            removeBtn.className = 'remove-btn';
            removeBtn.innerHTML = '×';
            removeBtn.title = `删除图片 ${index + 1}`;
            removeBtn.onclick = (e) => {
                e.stopPropagation();
                console.log(`点击删除图片 ${index + 1}`);
                removeImage(index);
            };

            previewItem.appendChild(img);
            previewItem.appendChild(removeBtn);
            previewContainer.appendChild(previewItem);
        });

        // 如果还没达到最大数量，添加"继续添加"按钮
        if (selectedImages.length < MAX_IMAGES) {
            const addMoreBtn = document.createElement('div');
            addMoreBtn.className = 'add-more-btn';
            addMoreBtn.onclick = (e) => {
                e.stopPropagation();
                console.log('点击继续添加图片');
                showImageOptions();
            };

            const addIcon = document.createElement('div');
            addIcon.className = 'add-icon';
            addIcon.textContent = '+';

            const addText = document.createElement('div');
            addText.className = 'add-text';
            addText.textContent = '继续添加';

            addMoreBtn.appendChild(addIcon);
            addMoreBtn.appendChild(addText);
            previewContainer.appendChild(addMoreBtn);
        } else {
            // 达到最大数量时，标记为已满
            uploadArea.classList.add('limit-reached');
            console.log('图片已达到最大数量');
        }

        uploadArea.appendChild(previewContainer);
        console.log('图片预览容器已添加到页面');
    } else {
        console.log('没有图片，显示占位符');
        placeholder.style.display = 'flex';
    }
}

// 更新视频预览
function updateVideoPreview() {
    console.log('开始更新视频预览，当前视频数量:', selectedVideos.length);

    const placeholder = document.getElementById('video-placeholder');
    const uploadArea = placeholder.parentElement;

    // 清除现有预览
    const existingPreviews = uploadArea.querySelectorAll('.upload-preview');
    existingPreviews.forEach(preview => {
        // 释放现有视频的URL
        const videos = preview.querySelectorAll('video');
        videos.forEach(video => {
            if (video.src.startsWith('blob:')) {
                URL.revokeObjectURL(video.src);
            }
        });
        preview.remove();
    });

    // 更新上传区域样式
    uploadArea.classList.remove('has-files', 'limit-reached');

    if (selectedVideos.length > 0) {
        console.log('显示视频预览');
        placeholder.style.display = 'none';
        uploadArea.classList.add('has-files');

        const previewContainer = document.createElement('div');
        previewContainer.className = 'upload-preview';

        // 添加已选择的视频
        selectedVideos.forEach((file, index) => {
            console.log(`创建视频预览 ${index + 1}:`, file.name);

            const previewItem = document.createElement('div');
            previewItem.className = 'preview-item';

            const video = document.createElement('video');
            const videoUrl = URL.createObjectURL(file);
            video.src = videoUrl;
            video.controls = true;
            video.muted = true;
            video.preload = 'metadata';

            // 添加样式确保视频正确显示
            video.style.width = '100%';
            video.style.height = '100%';
            video.style.objectFit = 'cover';

            // 视频加载事件
            video.onloadedmetadata = () => {
                console.log(`视频 ${index + 1} 加载成功:`, file.name);
            };

            video.onerror = () => {
                console.error(`视频 ${index + 1} 加载失败:`, file.name);
                URL.revokeObjectURL(videoUrl);
                previewItem.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#999;">加载失败</div>';
            };

            const removeBtn = document.createElement('button');
            removeBtn.className = 'remove-btn';
            removeBtn.innerHTML = '×';
            removeBtn.title = `删除视频 ${index + 1}`;
            removeBtn.onclick = (e) => {
                e.stopPropagation();
                console.log(`点击删除视频 ${index + 1}`);
                removeVideo(index);
            };

            previewItem.appendChild(video);
            previewItem.appendChild(removeBtn);
            previewContainer.appendChild(previewItem);
        });

        // 如果还没达到最大数量，添加"继续添加"按钮
        if (selectedVideos.length < MAX_VIDEOS) {
            const addMoreBtn = document.createElement('div');
            addMoreBtn.className = 'add-more-btn';
            addMoreBtn.onclick = (e) => {
                e.stopPropagation();
                console.log('点击继续添加视频');
                showVideoOptions();
            };

            const addIcon = document.createElement('div');
            addIcon.className = 'add-icon';
            addIcon.textContent = '+';

            const addText = document.createElement('div');
            addText.className = 'add-text';
            addText.textContent = '继续添加';

            addMoreBtn.appendChild(addIcon);
            addMoreBtn.appendChild(addText);
            previewContainer.appendChild(addMoreBtn);
        } else {
            // 达到最大数量时，标记为已满
            uploadArea.classList.add('limit-reached');
            console.log('视频已达到最大数量');
        }

        uploadArea.appendChild(previewContainer);
        console.log('视频预览容器已添加到页面');
    } else {
        console.log('没有视频，显示占位符');
        placeholder.style.display = 'flex';
    }
}

// 移除图片
function removeImage(index) {
    console.log(`删除图片 ${index}:`, selectedImages[index]?.name);

    // 释放被删除图片的URL
    const uploadArea = document.getElementById('image-placeholder').parentElement;
    const previewItems = uploadArea.querySelectorAll('.preview-item img');
    if (previewItems[index]) {
        URL.revokeObjectURL(previewItems[index].src);
    }

    selectedImages.splice(index, 1);
    console.log(`删除后图片总数: ${selectedImages.length}`);
    updateImagePreview();
    updateImageCount();
}

// 移除视频
function removeVideo(index) {
    console.log(`删除视频 ${index}:`, selectedVideos[index]?.name);

    // 释放被删除视频的URL
    const uploadArea = document.getElementById('video-placeholder').parentElement;
    const previewItems = uploadArea.querySelectorAll('.preview-item video');
    if (previewItems[index]) {
        URL.revokeObjectURL(previewItems[index].src);
    }

    selectedVideos.splice(index, 1);
    console.log(`删除后视频总数: ${selectedVideos.length}`);
    updateVideoPreview();
    updateVideoCount();
}

// 更新图片计数
function updateImageCount() {
    console.log('更新图片计数:', selectedImages.length);

    // 通过图片上传区域的父元素来查找计数元素
    const imagePlaceholder = document.getElementById('image-placeholder');
    if (!imagePlaceholder) {
        console.error('找不到图片占位符元素');
        return;
    }

    const uploadSection = imagePlaceholder.closest('.upload-section');
    if (!uploadSection) {
        console.error('找不到图片上传区域');
        return;
    }

    const countElement = uploadSection.querySelector('.upload-count');
    if (!countElement) {
        console.error('找不到图片计数元素');
        return;
    }

    countElement.textContent = `${selectedImages.length}/${MAX_IMAGES}`;
    console.log('图片计数更新成功:', countElement.textContent);
}

// 更新视频计数
function updateVideoCount() {
    console.log('更新视频计数:', selectedVideos.length);

    // 通过视频上传区域的父元素来查找计数元素
    const videoPlaceholder = document.getElementById('video-placeholder');
    if (!videoPlaceholder) {
        console.error('找不到视频占位符元素');
        return;
    }

    const uploadSection = videoPlaceholder.closest('.upload-section');
    if (!uploadSection) {
        console.error('找不到视频上传区域');
        return;
    }

    const countElement = uploadSection.querySelector('.upload-count');
    if (!countElement) {
        console.error('找不到视频计数元素');
        return;
    }

    countElement.textContent = `${selectedVideos.length}/${MAX_VIDEOS}`;
    console.log('视频计数更新成功:', countElement.textContent);
}

// 表单验证
function validateForm() {
    const phone = document.getElementById('phone').value.trim();
    const name = document.getElementById('name').value.trim();
    const description = document.getElementById('description').value.trim();

    // 手机号验证
    const phoneRegex = /^1[3-9]\d{9}$/;
    if (!phone) {
        alert('请输入手机号');
        return false;
    }
    if (!phoneRegex.test(phone)) {
        alert('请输入正确的手机号格式');
        return false;
    }

    // 姓名验证
    if (!name) {
        alert('请输入姓名');
        return false;
    }
    if (name.length < 2 || name.length > 10) {
        alert('姓名长度应在2-10个字符之间');
        return false;
    }

    // 图片验证
    if (selectedImages.length === 0) {
        alert('请至少上传一张图片');
        return false;
    }

    // 文字说明验证
    if (!description) {
        alert('请输入文字说明');
        return false;
    }
    if (description.length < 10) {
        alert('文字说明至少需要10个字符');
        return false;
    }

    return true;
}

// 提交表单
async function submitForm() {
    if (!validateForm()) {
        return;
    }

    const submitBtn = document.querySelector('.submit-btn');
    const originalText = submitBtn.textContent;

    // 显示加载状态
    submitBtn.innerHTML = '<span class="loading"></span>';
    submitBtn.disabled = true;

    try {
        // 创建FormData对象
        const formData = new FormData();
        formData.append('phone', document.getElementById('phone').value.trim());
        formData.append('name', document.getElementById('name').value.trim());
        formData.append('description', document.getElementById('description').value.trim());

        // 添加图片文件
        selectedImages.forEach((file, index) => {
            formData.append(`image_${index}`, file);
        });

        // 添加视频文件
        selectedVideos.forEach((file, index) => {
            formData.append(`video_${index}`, file);
        });

        // 提交到服务器
        await submitToServer(formData);

        alert('提交成功！感谢您的参与！');

        // 重置表单
        resetForm();

        // 返回活动页面
        showActivityPage();

    } catch (error) {
        console.error('提交失败:', error);
        alert('提交失败，请稍后重试');
    } finally {
        // 恢复按钮状态
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
}

// 真实的文件上传
async function submitToServer(formData) {
    try {
        console.log('开始提交到服务器...');
        console.log('FormData内容:');
        
        // 调试：显示FormData内容
        for (let [key, value] of formData.entries()) {
            if (value instanceof File) {
                console.log(`${key}:`, {
                    name: value.name,
                    size: value.size,
                    type: value.type
                });
            } else {
                console.log(`${key}:`, value);
            }
        }
        
        const response = await fetch('/api/submit', {
            method: 'POST',
            body: formData
        });
        
        console.log('服务器响应状态:', response.status);
        console.log('响应头:', response.headers);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('服务器错误响应:', errorText);
            throw new Error(`HTTP ${response.status}: ${errorText}`);
        }
        
        const result = await response.json();
        console.log('服务器响应:', result);
        
        if (result.success) {
            console.log('提交成功:', result);
            return result;
        } else {
            throw new Error(result.message || '提交失败');
        }
        
    } catch (error) {
        console.error('提交到服务器失败:', error);
        
        // 提供更友好的错误信息
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            throw new Error('网络连接失败，请检查网络连接');
        } else if (error.message.includes('HTTP 400')) {
            throw new Error('提交的数据格式不正确，请检查填写内容');
        } else if (error.message.includes('HTTP 500')) {
            throw new Error('服务器内部错误，请稍后重试');
        } else {
            throw error;
        }
    }
}

// 重置表单
function resetForm() {
    document.getElementById('registration-form').reset();
    selectedImages = [];
    selectedVideos = [];
    updateImagePreview();
    updateVideoPreview();
    updateImageCount();
    updateVideoCount();
}

// 安全的初始化函数
function safeInitialize() {
    console.log('开始安全初始化...');

    // 检查关键DOM元素是否存在
    const imagePlaceholder = document.getElementById('image-placeholder');
    const videoPlaceholder = document.getElementById('video-placeholder');

    if (!imagePlaceholder || !videoPlaceholder) {
        console.log('关键DOM元素未找到，延迟初始化...');
        setTimeout(safeInitialize, 100);
        return;
    }

    console.log('DOM元素检查通过，开始初始化功能...');

    try {
        // 初始化计数显示
        updateImageCount();
        updateVideoCount();

        // 添加文件选择事件监听器
        setupFileInputListeners();

        // 添加弹窗点击外部关闭功能
        setupModalClickOutside();

        // 检测设备和浏览器信息
        detectDeviceCapabilities();

        console.log('初始化完成');
    } catch (error) {
        console.error('初始化过程中出现错误:', error);
    }
}

// 页面加载完成后的初始化
document.addEventListener('DOMContentLoaded', function () {
    console.log('DOM内容加载完成');

    // 使用安全初始化
    safeInitialize();

    // 防止页面刷新时丢失状态
    window.addEventListener('beforeunload', function (e) {
        if (selectedImages.length > 0 || selectedVideos.length > 0 ||
            document.getElementById('phone')?.value ||
            document.getElementById('name')?.value ||
            document.getElementById('description')?.value) {
            e.preventDefault();
            return '您有未保存的内容，确定要离开吗？';
        }
    });

    // 添加触摸优化
    if ('ontouchstart' in window) {
        document.body.classList.add('touch-device');
    }
});

// 检测设备能力
function detectDeviceCapabilities() {
    const deviceInfo = {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        vendor: navigator.vendor,
        isHonor: /honor/i.test(navigator.userAgent),
        isHuawei: /huawei/i.test(navigator.userAgent),
        isAndroid: /android/i.test(navigator.userAgent),
        isIOS: /iphone|ipad|ipod/i.test(navigator.userAgent),
        isMobile: /android|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(navigator.userAgent),
        hasMediaDevices: !!navigator.mediaDevices,
        hasGetUserMedia: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia),
        hasFileAPI: !!(window.File && window.FileReader && window.FileList && window.Blob),
        supportedFormats: {
            image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
            video: ['video/mp4', 'video/webm', 'video/ogg', 'video/3gpp']
        }
    };

    console.log('设备检测结果:', deviceInfo);

    // 如果是荣耀或华为设备，进行特殊处理
    if (deviceInfo.isHonor || deviceInfo.isHuawei) {
        console.log('检测到荣耀/华为设备，启用兼容模式');
        setupHonorCompatibility();
    }

    return deviceInfo;
}

// 荣耀手机兼容性设置
function setupHonorCompatibility() {
    // 为荣耀手机优化capture属性
    const imageInput = document.getElementById('image-input-camera');
    const videoInput = document.getElementById('video-input-camera');

    // 尝试多种capture属性值
    if (imageInput) {
        // 移除原有属性，重新设置
        imageInput.removeAttribute('capture');
        // 荣耀手机支持的多种capture值
        imageInput.setAttribute('capture', '');  // 空值让浏览器自动选择
        imageInput.setAttribute('accept', 'image/*');
        // 添加额外属性以提高兼容性
        imageInput.setAttribute('multiple', 'false');
    }

    if (videoInput) {
        videoInput.removeAttribute('capture');
        videoInput.setAttribute('capture', '');  // 空值让浏览器自动选择
        videoInput.setAttribute('accept', 'video/*');
        videoInput.setAttribute('multiple', 'false');
    }

    console.log('荣耀手机兼容性设置完成');
}

// 增强的相机调用功能
function enhancedCameraCapture(type) {
    const isHonorOrHuawei = /honor|huawei/i.test(navigator.userAgent);
    const isAndroid = /android/i.test(navigator.userAgent);

    console.log('增强相机调用:', { type, isHonorOrHuawei, isAndroid });

    if (type === 'image') {
        const input = document.getElementById('image-input-camera');

        // 简化相机调用，避免复杂的重试机制影响回显
        if (isHonorOrHuawei) {
            console.log('荣耀手机拍照模式');
            input.setAttribute('capture', 'environment');
            input.setAttribute('accept', 'image/*');
        } else if (isAndroid) {
            console.log('Android拍照模式');
            input.setAttribute('capture', 'camera');
            input.setAttribute('accept', 'image/*');
        } else {
            console.log('通用拍照模式');
            input.setAttribute('capture', 'environment');
            input.setAttribute('accept', 'image/*');
        }

        // 直接触发点击，依赖已设置的事件监听器处理文件选择
        console.log('触发相机拍照...');
        input.click();

    } else if (type === 'video') {
        const input = document.getElementById('video-input-camera');

        // 简化视频录制调用
        if (isHonorOrHuawei) {
            console.log('荣耀手机录像模式');
            input.setAttribute('capture', 'environment');
            input.setAttribute('accept', 'video/*');
        } else if (isAndroid) {
            console.log('Android录像模式');
            input.setAttribute('capture', 'camcorder');
            input.setAttribute('accept', 'video/*');
        } else {
            console.log('通用录像模式');
            input.setAttribute('capture', 'environment');
            input.setAttribute('accept', 'video/*');
        }

        // 直接触发点击，依赖已设置的事件监听器处理文件选择
        console.log('触发相机录像...');
        input.click();
    }
}

// 设置文件输入监听器
function setupFileInputListeners() {
    console.log('设置文件输入监听器...');

    // 图片相册选择
    const imageGalleryInput = document.getElementById('image-input-gallery');
    if (imageGalleryInput) {
        imageGalleryInput.addEventListener('change', function (e) {
            console.log('图片相册选择触发，文件数量:', e.target.files.length);
            const files = Array.from(e.target.files);
            handleFileSelection(files, 'image');
            e.target.value = ''; // 清空input，允许重复选择同一文件
        });
        console.log('图片相册监听器设置完成');
    } else {
        console.error('找不到图片相册输入元素');
    }

    // 图片拍照
    const imageCameraInput = document.getElementById('image-input-camera');
    if (imageCameraInput) {
        imageCameraInput.addEventListener('change', function (e) {
            console.log('图片拍照触发，文件数量:', e.target.files.length);
            const files = Array.from(e.target.files);
            if (files.length > 0) {
                console.log('拍照文件详情:', files.map(f => ({
                    name: f.name,
                    size: f.size,
                    type: f.type,
                    lastModified: f.lastModified
                })));
            }
            handleFileSelection(files, 'image');
            e.target.value = ''; // 清空input，允许重复选择同一文件
        });
        console.log('图片拍照监听器设置完成');
    } else {
        console.error('找不到图片拍照输入元素');
    }

    // 视频相册选择
    const videoGalleryInput = document.getElementById('video-input-gallery');
    if (videoGalleryInput) {
        videoGalleryInput.addEventListener('change', function (e) {
            console.log('视频相册选择触发，文件数量:', e.target.files.length);
            const files = Array.from(e.target.files);
            handleFileSelection(files, 'video');
            e.target.value = ''; // 清空input，允许重复选择同一文件
        });
        console.log('视频相册监听器设置完成');
    } else {
        console.error('找不到视频相册输入元素');
    }

    // 视频拍摄
    const videoCameraInput = document.getElementById('video-input-camera');
    if (videoCameraInput) {
        videoCameraInput.addEventListener('change', function (e) {
            console.log('视频拍摄触发，文件数量:', e.target.files.length);
            const files = Array.from(e.target.files);
            if (files.length > 0) {
                console.log('录像文件详情:', files.map(f => ({
                    name: f.name,
                    size: f.size,
                    type: f.type,
                    lastModified: f.lastModified
                })));
            }
            handleFileSelection(files, 'video');
            e.target.value = ''; // 清空input，允许重复选择同一文件
        });
        console.log('视频拍摄监听器设置完成');
    } else {
        console.error('找不到视频拍摄输入元素');
    }

    console.log('所有文件输入监听器设置完成');
}

// 设置弹窗点击外部关闭
function setupModalClickOutside() {
    const modals = ['image-modal', 'video-modal'];

    modals.forEach(modalId => {
        const modal = document.getElementById(modalId);
        modal.addEventListener('click', function (e) {
            if (e.target === modal) {
                hideModal(modalId);
            }
        });
    });
}

// 图片压缩功能（可选）
function compressImage(file, maxWidth = 1200, quality = 0.8) {
    return new Promise((resolve) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();

        img.onload = function () {
            const ratio = Math.min(maxWidth / img.width, maxWidth / img.height);
            canvas.width = img.width * ratio;
            canvas.height = img.height * ratio;

            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

            canvas.toBlob(resolve, 'image/jpeg', quality);
        };

        img.src = URL.createObjectURL(file);
    });
}

// 错误处理
window.addEventListener('error', function (e) {
    console.error('页面错误:', e.error);
});

// 处理网络状态变化
window.addEventListener('online', function () {
    console.log('网络已连接');
});

window.addEventListener('offline', function () {
    console.log('网络已断开');
    alert('网络连接已断开，请检查网络设置');
});

// 测试回显功能
function testPreviewFunction() {
    console.log('=== 开始测试回显功能 ===');

    // 创建测试文件
    const testImageBlob = new Blob(['test image data'], { type: 'image/jpeg' });
    const testVideoBlob = new Blob(['test video data'], { type: 'video/mp4' });

    // 创建File对象
    const testImageFile = new File([testImageBlob], 'test-image.jpg', { type: 'image/jpeg' });
    const testVideoFile = new File([testVideoBlob], 'test-video.mp4', { type: 'video/mp4' });

    console.log('测试文件创建完成:', {
        image: testImageFile,
        video: testVideoFile
    });

    // 测试图片处理
    console.log('测试图片处理...');
    handleFileSelection([testImageFile], 'image');

    // 延迟测试视频处理
    setTimeout(() => {
        console.log('测试视频处理...');
        handleFileSelection([testVideoFile], 'video');
    }, 1000);

    console.log('=== 测试完成，请查看页面效果 ===');
}

// 在控制台中添加测试函数
window.testPreview = testPreviewFunction;