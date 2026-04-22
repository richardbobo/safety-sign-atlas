// 安全标志图集管理系统 - 改进版（优化添加标志流程）
const API_BASE = '/api';
let selectedImageFile = null;
let currentStep = 1; // 1:上传图片, 2:选择类型, 3:输入信息, 4:确认

// 新布局测试按钮样式和卡片式展示增强
const enhancedStyles = document.createElement('style');
enhancedStyles.textContent = `
    /* 新布局按钮样式 */
    .action-btn.btn-new-layout {
        background: linear-gradient(135deg, #9c27b0 0%, #673ab7 100%);
        color: white;
        border: none;
        padding: 8px 12px;
        border-radius: 6px;
        cursor: pointer;
        font-size: 0.9rem;
        display: flex;
        align-items: center;
        gap: 5px;
        transition: all 0.3s;
    }
    
    .action-btn.btn-new-layout:hover {
        transform: translateY(-2px);
        box-shadow: 0 5px 15px rgba(156, 39, 176, 0.4);
    }
    
    .scene-actions {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
    }
    
    /* 卡片式展示增强 */
    .scene-card {
        background: white;
        border-radius: 12px;
        padding: 20px;
        margin-bottom: 20px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
        border: 1px solid #e9ecef;
        transition: all 0.3s ease;
    }
    
    .scene-card:hover {
        transform: translateY(-4px);
        box-shadow: 0 8px 25px rgba(0, 0, 0, 0.12);
        border-color: #2c80ff;
    }
    
    .scene-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 15px;
    }
    
    .scene-code {
        font-size: 1.1rem;
        font-weight: bold;
        color: #2c80ff;
        margin-bottom: 5px;
    }
    
    .scene-name {
        font-size: 1.3rem;
        font-weight: bold;
        color: #333;
        margin-bottom: 10px;
    }
    
    /* 安全标志预览网格 */
    .signs-preview-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(60px, 1fr));
        gap: 10px;
        margin: 15px 0;
        padding: 15px;
        background: #f8f9fa;
        border-radius: 8px;
        border: 1px solid #e8e8e8;
    }
    
    .sign-preview-item {
        text-align: center;
        padding: 10px;
        border-radius: 6px;
        background: white;
        border: 1px solid #e8e8e8;
        transition: all 0.2s;
    }
    
    .sign-preview-item:hover {
        transform: scale(1.05);
        box-shadow: 0 3px 8px rgba(0, 0, 0, 0.1);
    }
    
    .sign-preview-item img {
        width: 40px;
        height: 40px;
        object-fit: contain;
    }
    
    /* 危险源标签样式增强 */
    .hazard-badge {
        display: inline-block;
        padding: 4px 10px;
        border-radius: 12px;
        font-size: 0.85rem;
        font-weight: bold;
        margin-right: 8px;
        margin-bottom: 8px;
    }
    
    /* 统计信息 */
    .scene-stats {
        display: flex;
        gap: 20px;
        margin-top: 15px;
        padding-top: 15px;
        border-top: 1px solid #e9ecef;
    }
    
    .stat-item {
        display: flex;
        flex-direction: column;
        align-items: center;
    }
    
    .stat-value {
        font-size: 1.2rem;
        font-weight: bold;
        color: #2c80ff;
    }
    
    .stat-label {
        font-size: 0.85rem;
        color: #666;
        margin-top: 3px;
    }
`;
document.head.appendChild(enhancedStyles);

// 页面切换
function showPage(pageId) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav button').forEach(b => b.classList.remove('active'));
    document.getElementById(pageId).classList.add('active');
    event.target.classList.add('active');
    
    switch(pageId) {
        case 'sign-library': loadSigns(); break;
        case 'scene-list': loadScenes(); break;
    }
}

// 加载标志
async function loadSigns() {
    const container = document.getElementById('signs-container');
    container.innerHTML = '<div class="loading">加载标志图集...</div>';
    
    try {
        const res = await fetch(`${API_BASE}/signs`);
        const signs = await res.json();
        
        if (signs.length === 0) {
            container.innerHTML = '<div class="message">暂无标志数据</div>';
            return;
        }
        
        // 按类型分组
        const byType = {
            warning: signs.filter(s => s.sign_type === 'warning'),
            prohibition: signs.filter(s => s.sign_type === 'prohibition'),
            instruction: signs.filter(s => s.sign_type === 'instruction'),
            information: signs.filter(s => s.sign_type === 'information')
        };
        
        let html = '';
        
        // 警告标志
        if (byType.warning.length > 0) {
            html += `<h3 style="color: #92400e; margin: 20px 0 10px 0;">⚠️ 警告标志（黄色）</h3>`;
            html += '<div class="sign-grid">';
            byType.warning.forEach(sign => {
                html += createSignCard(sign);
            });
            html += '</div>';
        }
        
        // 禁止标志
        if (byType.prohibition.length > 0) {
            html += `<h3 style="color: #991b1b; margin: 20px 0 10px 0;">🚫 禁止标志（红色）</h3>`;
            html += '<div class="sign-grid">';
            byType.prohibition.forEach(sign => {
                html += createSignCard(sign);
            });
            html += '</div>';
        }
        
        // 指令标志
        if (byType.instruction.length > 0) {
            html += `<h3 style="color: #1e40af; margin: 20px 0 10px 0;">📋 指令标志（蓝色）</h3>`;
            html += '<div class="sign-grid">';
            byType.instruction.forEach(sign => {
                html += createSignCard(sign);
            });
            html += '</div>';
        }
        
        // 提示标志
        if (byType.information.length > 0) {
            html += `<h3 style="color: #065f46; margin: 20px 0 10px 0;">💡 提示标志（绿色）</h3>`;
            html += '<div class="sign-grid">';
            byType.information.forEach(sign => {
                html += createSignCard(sign);
            });
            html += '</div>';
        }
        
        container.innerHTML = html;
        
    } catch (error) {
        console.error('加载标志失败:', error);
        container.innerHTML = `<div class="message error">加载失败: ${error.message}</div>`;
    }
}

// 创建标志卡片
function createSignCard(sign) {
    const typeClass = sign.sign_type;
    const typeName = {
        'warning': '警告标志',
        'prohibition': '禁止标志',
        'instruction': '指令标志',
        'information': '提示标志'
    }[sign.sign_type] || '未知';
    
    // 如果有图片，显示图片；否则显示占位符
    const imageHtml = sign.image_url 
        ? `<img src="${sign.image_url}" class="sign-image" alt="${sign.sign_name}">`
        : `<div class="sign-image" style="display: flex; align-items: center; justify-content: center; color: #999; font-size: 0.9rem;">暂无图片</div>`;
    
    return `
        <div class="sign-card" id="sign-card-${sign.id}">
            ${imageHtml}
            <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                <div style="flex: 1;">
                    <div style="color: #666; font-size: 0.9rem;">${sign.sign_code}</div>
                    <div style="font-weight: bold; margin: 5px 0;">${sign.sign_name}</div>
                    <div class="sign-type ${typeClass}">${typeName}</div>
                </div>
                <button class="btn-delete" onclick="confirmDeleteSign(${sign.id}, '${sign.sign_code}', '${sign.sign_name.replace(/'/g, "\\'")}')" title="删除标志">
                    🗑️
                </button>
            </div>
            <div style="font-size: 0.9rem; color: #666; margin-top: 10px;">
                <div>尺寸: ${sign.standard_size}</div>
                <div>材质: ${sign.material}</div>
                ${sign.description ? `<div>描述: ${sign.description}</div>` : ''}
                <div style="font-size: 0.8rem; color: #999; margin-top: 5px;">ID: ${sign.id} • 创建: ${formatDateShort(sign.created_at)}</div>
            </div>
        </div>
    `;
}

// 显示添加标志表单（新流程）
function showAddSignForm() {
    document.getElementById('add-sign-form').style.display = 'block';
    document.getElementById('signs-container').style.display = 'none';
    resetAddSignForm();
    showStep(1); // 从第一步开始
}

// 隐藏添加标志表单
function hideAddSignForm() {
    document.getElementById('add-sign-form').style.display = 'none';
    document.getElementById('signs-container').style.display = 'block';
    resetAddSignForm();
}

// 重置添加标志表单
function resetAddSignForm() {
    currentStep = 1;
    selectedImageFile = null;
    document.getElementById('image-upload').value = '';
    document.getElementById('image-preview-container').style.display = 'none';
    document.getElementById('image-preview').src = '';
    document.getElementById('sign-type').value = 'warning';
    document.getElementById('sign-name').value = '';
    document.getElementById('standard-size').value = '300x300mm';
    document.getElementById('material').value = '铝板反光';
    document.getElementById('description').value = '';
    document.getElementById('add-sign-message').innerHTML = '';
    document.getElementById('generated-code').innerHTML = '';
    
    // 重置类型选择
    document.querySelectorAll('.type-option').forEach(option => {
        option.classList.remove('selected');
    });
    
    // 重置步骤显示
    document.querySelectorAll('.step').forEach(step => {
        step.classList.remove('active', 'completed');
    });
    document.getElementById('step-1').classList.add('active');
}

// 选择类型
function selectType(type) {
    // 更新UI选择
    document.querySelectorAll('.type-option').forEach(option => {
        option.classList.remove('selected');
    });
    event.target.closest('.type-option').classList.add('selected');
    
    // 更新表单值
    document.getElementById('sign-type').value = type;
    
    // 生成代码
    generateSignCode();
    
    // 自动进入下一步
    setTimeout(() => {
        nextStep();
    }, 300);
}

// 显示步骤
function showStep(stepNumber) {
    currentStep = stepNumber;
    
    // 更新步骤指示器
    document.querySelectorAll('.step').forEach(step => {
        step.classList.remove('active');
        const stepId = parseInt(step.id.split('-')[1]);
        if (stepId < stepNumber) {
            step.classList.add('completed');
        } else if (stepId === stepNumber) {
            step.classList.add('active');
        } else {
            step.classList.remove('completed');
        }
    });
    
    // 显示对应步骤的内容
    document.querySelectorAll('.step-content').forEach(content => {
        content.style.display = 'none';
    });
    document.getElementById(`step-${stepNumber}-content`).style.display = 'block';
    
    // 在后续步骤中显示图片缩略图
    if (stepNumber >= 2 && selectedImageFile) {
        showImageThumbnailInStep(stepNumber);
    }
    
    // 如果是第四步，更新确认信息
    if (stepNumber === 4) {
        updateConfirmationInfo();
    }
    
    // 更新按钮状态
    updateStepButtons();
}

// 在步骤中显示图片缩略图
function showImageThumbnailInStep(stepNumber) {
    const imagePreview = document.getElementById('image-preview');
    if (!imagePreview.src) return;
    
    // 步骤2：在选择类型页面显示缩略图
    if (stepNumber === 2) {
        let thumbnailContainer = document.getElementById('step-2-thumbnail');
        if (!thumbnailContainer) {
            thumbnailContainer = document.createElement('div');
            thumbnailContainer.id = 'step-2-thumbnail';
            thumbnailContainer.style.cssText = `
                margin: 15px 0 25px 0;
                padding: 15px;
                background: #f8f9fa;
                border-radius: 8px;
                border: 2px dashed #ddd;
                text-align: center;
            `;
            const step2Content = document.getElementById('step-2-content');
            // 插入到第一个元素之前
            if (step2Content.firstChild) {
                step2Content.insertBefore(thumbnailContainer, step2Content.firstChild);
            } else {
                step2Content.appendChild(thumbnailContainer);
            }
        }
        
        thumbnailContainer.innerHTML = `
            <div style="font-weight: bold; color: #555; margin-bottom: 10px;">📷 已上传的标志图片：</div>
            <div style="display: flex; align-items: center; justify-content: center; gap: 20px;">
                <img src="${imagePreview.src}" style="max-width: 120px; max-height: 120px; border-radius: 5px; border: 2px solid #667eea;">
                <div style="text-align: left;">
                    <div style="font-size: 0.9rem; color: #666;">文件: ${selectedImageFile.name}</div>
                    <div style="font-size: 0.9rem; color: #666;">大小: ${formatFileSize(selectedImageFile.size)}</div>
                    <button type="button" class="btn btn-secondary" onclick="removeImageAndGoBack()" style="padding: 5px 10px; font-size: 0.9rem; margin-top: 5px;">更换图片</button>
                </div>
            </div>
            <div style="margin-top: 10px; font-size: 0.9rem; color: #666;">
                请根据图片内容选择标志类型
            </div>
        `;
    }
    
    // 步骤3：在输入信息页面显示缩略图
    if (stepNumber === 3) {
        let thumbnailContainer = document.getElementById('step-3-thumbnail');
        if (!thumbnailContainer) {
            thumbnailContainer = document.createElement('div');
            thumbnailContainer.id = 'step-3-thumbnail';
            thumbnailContainer.style.cssText = `
                margin: 15px 0;
                padding: 15px;
                background: #f8f9fa;
                border-radius: 8px;
                border: 2px dashed #ddd;
                text-align: center;
            `;
            const step3Content = document.getElementById('step-3-content');
            // 插入到第一个form-group之后
            const firstFormGroup = step3Content.querySelector('.form-group');
            if (firstFormGroup && firstFormGroup.nextSibling) {
                step3Content.insertBefore(thumbnailContainer, firstFormGroup.nextSibling);
            } else {
                step3Content.appendChild(thumbnailContainer);
            }
        }
        
        thumbnailContainer.innerHTML = `
            <div style="font-weight: bold; color: #555; margin-bottom: 10px;">📷 已上传的标志图片：</div>
            <div style="display: flex; align-items: center; justify-content: center; gap: 20px;">
                <img src="${imagePreview.src}" style="max-width: 100px; max-height: 100px; border-radius: 5px; border: 2px solid #667eea;">
                <div style="text-align: left;">
                    <div style="font-size: 0.9rem; color: #666;">文件: ${selectedImageFile.name}</div>
                    <div style="font-size: 0.9rem; color: #666;">大小: ${formatFileSize(selectedImageFile.size)}</div>
                    <div style="font-size: 0.9rem; color: #666; margin-top: 5px;">类型: ${getTypeText(document.getElementById('sign-type').value)}</div>
                </div>
            </div>
            <div style="margin-top: 10px; font-size: 0.9rem; color: #666;">
                请根据图片内容填写标志名称和其他信息
            </div>
        `;
    }
}

// 格式化文件大小
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// 获取类型文本
function getTypeText(type) {
    const types = {
        'warning': '警告标志 (黄色)',
        'prohibition': '禁止标志 (红色)',
        'instruction': '指令标志 (蓝色)',
        'information': '提示标志 (绿色)'
    };
    return types[type] || '未知类型';
}

// 移除图片并返回第一步
function removeImageAndGoBack() {
    removeImage();
    showStep(1);
}

// 更新确认信息
function updateConfirmationInfo() {
    const imagePreview = document.getElementById('image-preview');
    document.getElementById('confirm-image').src = imagePreview.src;
    document.getElementById('confirm-code').textContent = document.getElementById('sign-code').value;
    document.getElementById('confirm-name').textContent = document.getElementById('sign-name').value;
    
    const typeText = {
        'warning': '警告标志 (黄色)',
        'prohibition': '禁止标志 (红色)',
        'instruction': '指令标志 (蓝色)',
        'information': '提示标志 (绿色)'
    }[document.getElementById('sign-type').value] || '未知';
    document.getElementById('confirm-type').textContent = typeText;
    
    document.getElementById('confirm-size').textContent = document.getElementById('standard-size').value;
    document.getElementById('confirm-material').textContent = document.getElementById('material').value;
    
    // 更新PPE信息
    const isPpeElement = document.querySelector('input[name="is_ppe"]:checked');
    const is_ppe = isPpeElement ? parseInt(isPpeElement.value) : 0;
    document.getElementById('confirm-ppe').textContent = is_ppe ? '是 (个人防护装备)' : '否 (普通安全标志)';
    
    document.getElementById('confirm-description').textContent = document.getElementById('description').value || '无';
    
    // 在确认页面也显示文件信息
    if (selectedImageFile) {
        const fileInfoDiv = document.getElementById('confirm-file-info');
        if (!fileInfoDiv) {
            const confirmContainer = document.querySelector('#step-4-content .form-group > div');
            const fileInfo = document.createElement('div');
            fileInfo.id = 'confirm-file-info';
            fileInfo.style.cssText = 'font-size: 0.9rem; color: #666; margin-top: 10px;';
            fileInfo.innerHTML = `<strong>文件信息:</strong> ${selectedImageFile.name} (${formatFileSize(selectedImageFile.size)})`;
            confirmContainer.appendChild(fileInfo);
        }
    }
}

// 更新步骤按钮
function updateStepButtons() {
    const prevBtn = document.getElementById('prev-step');
    const nextBtn = document.getElementById('next-step');
    const submitBtn = document.getElementById('submit-sign');
    
    prevBtn.style.display = currentStep > 1 ? 'inline-block' : 'none';
    
    if (currentStep < 4) {
        nextBtn.style.display = 'inline-block';
        submitBtn.style.display = 'none';
    } else {
        nextBtn.style.display = 'none';
        submitBtn.style.display = 'inline-block';
    }
}

// 下一步
function nextStep() {
    // 验证当前步骤
    if (!validateCurrentStep()) {
        return;
    }
    
    showStep(currentStep + 1);
}

// 上一步
function prevStep() {
    showStep(currentStep - 1);
}

// 验证当前步骤
function validateCurrentStep() {
    switch(currentStep) {
        case 1: // 上传图片
            if (!selectedImageFile) {
                showMessage('请先上传标志图片', 'error');
                return false;
            }
            break;
        case 2: // 选择类型
            const signType = document.getElementById('sign-type').value;
            if (!signType) {
                showMessage('请选择标志类型', 'error');
                return false;
            }
            break;
        case 3: // 输入信息
            const signName = document.getElementById('sign-name').value.trim();
            if (!signName) {
                showMessage('请输入标志名称', 'error');
                return false;
            }
            break;
    }
    return true;
}

// 生成标志代码
function generateSignCode() {
    const signType = document.getElementById('sign-type').value;
    const typePrefix = {
        'warning': 'W',
        'prohibition': 'P',
        'instruction': 'I',
        'information': 'N'
    }[signType] || 'X';
    
    // 生成一个随机编号（实际应用中应该从数据库获取下一个可用编号）
    const randomNum = Math.floor(Math.random() * 900) + 100; // 100-999
    const generatedCode = `${typePrefix}${randomNum.toString().padStart(3, '0')}`;
    
    document.getElementById('generated-code').innerHTML = `
        <div style="background: #f0f9ff; padding: 10px; border-radius: 5px; margin: 10px 0;">
            <strong>系统生成的标志代码：</strong>
            <span style="font-size: 1.2rem; font-weight: bold; color: #667eea;">${generatedCode}</span>
            <div style="font-size: 0.9rem; color: #666; margin-top: 5px;">系统自动生成，避免重复</div>
        </div>
    `;
    
    // 保存到隐藏字段
    document.getElementById('sign-code').value = generatedCode;
}

// 预览图片
function previewImage(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    // 验证文件类型
    if (!file.type.match('image.*')) {
        showMessage('请选择图片文件（JPG、PNG等）', 'error');
        return;
    }
    
    // 验证文件大小（限制为5MB）
    if (file.size > 5 * 1024 * 1024) {
        showMessage('图片大小不能超过5MB', 'error');
        return;
    }
    
    selectedImageFile = file;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const preview = document.getElementById('image-preview');
        preview.src = e.target.result;
        document.getElementById('image-preview-container').style.display = 'block';
        
        // 自动进入下一步
        setTimeout(() => {
            nextStep();
        }, 500);
    };
    reader.readAsDataURL(file);
}

// 移除图片
function removeImage() {
    selectedImageFile = null;
    document.getElementById('image-upload').value = '';
    document.getElementById('image-preview-container').style.display = 'none';
    document.getElementById('image-preview').src = '';
}

// 显示消息
function showMessage(message, type = 'info') {
    const container = document.getElementById('add-sign-message');
    container.innerHTML = `<div class="message ${type}">${message}</div>`;
    
    // 3秒后自动清除消息
    if (type === 'success') {
        setTimeout(() => {
            container.innerHTML = '';
        }, 3000);
    }
}

// 添加新标志
async function addNewSign() {
    if (!validateCurrentStep()) {
        return;
    }
    
    // 获取PPE选项
    const isPpeElement = document.querySelector('input[name="is_ppe"]:checked');
    const is_ppe = isPpeElement ? parseInt(isPpeElement.value) : 0;
    
    const signData = {
        sign_code: document.getElementById('sign-code').value,
        sign_name: document.getElementById('sign-name').value.trim(),
        sign_type: document.getElementById('sign-type').value,
        color_scheme: getColorScheme(document.getElementById('sign-type').value),
        standard_size: document.getElementById('standard-size').value.trim(),
        material: document.getElementById('material').value.trim(),
        description: document.getElementById('description').value.trim(),
        is_ppe: is_ppe
    };
    
    try {
        // 使用FormData上传
        const formData = new FormData();
        formData.append('sign_code', signData.sign_code);
        formData.append('sign_name', signData.sign_name);
        formData.append('sign_type', signData.sign_type);
        formData.append('color_scheme', signData.color_scheme);
        formData.append('standard_size', signData.standard_size);
        formData.append('material', signData.material);
        formData.append('description', signData.description);
        formData.append('is_ppe', signData.is_ppe.toString());
        formData.append('image', selectedImageFile);
        
        const response = await fetch(`${API_BASE}/signs/upload`, {
            method: 'POST',
            body: formData
        });
        
        if (response.ok) {
            const result = await response.json();
            showMessage('标志添加成功！', 'success');
            setTimeout(() => {
                hideAddSignForm();
                loadSigns();
            }, 1500);
        } else {
            const error = await response.text();
            console.error('上传失败:', error);
            showMessage('添加失败: ' + (error || '未知错误'), 'error');
        }
    } catch (error) {
        console.error('上传异常:', error);
        showMessage('添加失败: ' + error.message, 'error');
    }
}

// 根据类型获取颜色方案
function getColorScheme(signType) {
    const schemes = {
        'warning': 'yellow-black',
        'prohibition': 'red-white',
        'instruction': 'blue-white',
        'information': 'green-white'
    };
    return schemes[signType] || 'standard';
}

// 加载场景
async function loadScenes() {
    const container = document.getElementById('scenes-container');
    container.innerHTML = '<div class="loading">加载场景列表...</div>';
    
    try {
        const res = await fetch(`${API_BASE}/scenes`);
        const scenes = await res.json();
        
        if (scenes.length === 0) {
            container.innerHTML = '<div class="message">暂无场景数据，请先创建场景</div>';
            return;
        }
        
        // 为每个场景获取标志信息
        const scenesWithSigns = await Promise.all(scenes.map(async (scene) => {
            try {
                const signsRes = await fetch(`${API_BASE}/scenes/${scene.id}`);
                const sceneDetail = await signsRes.json();
                return {
                    ...scene,
                    signs: sceneDetail.signs || []
                };
            } catch (error) {
                console.error(`获取场景${scene.id}的标志信息失败:`, error);
                return {
                    ...scene,
                    signs: []
                };
            }
        }));
        
        let html = '';
        scenesWithSigns.forEach(scene => {
            // 解析危险源标签
            const hazardTags = scene.hazard_tags ? scene.hazard_tags.split(',').filter(tag => tag.trim()) : [];
            const hazardBadges = hazardTags.map(tag => {
                const tagName = getHazardTagName(tag);
                const tagColor = getHazardTagColor(tag);
                return `<span class="hazard-badge" style="background: ${tagColor}20; color: ${tagColor}; border: 1px solid ${tagColor};">${tagName}</span>`;
            }).join('');
            
            html += `
                <div class="scene-card" id="scene-card-${scene.id}">
                    <div class="scene-header">
                        <div style="flex: 1;">
                            <div class="scene-code">${scene.scene_code}</div>
                            <div class="scene-name">${scene.scene_name}</div>
                            <div style="display: flex; align-items: center; gap: 10px; margin-top: 5px;">
                                <span style="background: #e9ecef; padding: 4px 10px; border-radius: 12px; font-size: 0.9rem;">
                                    ${scene.department}
                                </span>
                                <span style="font-size: 0.9rem; color: #666;">
                                    创建: ${formatDateShort(scene.created_at)}
                                </span>
                            </div>
                        </div>
                        <div class="scene-actions">
                            <button class="action-btn btn-view" onclick="viewNewLayout(${scene.id})" title="查看详情（新布局）">👁️ 查看</button>
                            <button class="action-btn btn-new-layout" onclick="viewNewLayout(${scene.id})" title="新布局详情">🎨 新布局</button>
                            <button class="action-btn btn-edit" onclick="editScene(${scene.id})" title="编辑场景">✏️ 编辑</button>
                            <button class="action-btn btn-add-sign" onclick="addSignsToScene(${scene.id})" title="添加标志">➕ 标志</button>
                            <button class="action-btn btn-delete-scene" onclick="confirmDeleteScene(${scene.id}, '${scene.scene_code}', '${scene.scene_name.replace(/'/g, "\\'")}')" title="删除场景">🗑️ 删除</button>
                        </div>
                    </div>
                    
                    <!-- 场景图片预览 -->
                    ${scene.scene_image_url ? `
                        <div style="margin: 15px 0; text-align: center;">
                            <div style="font-size: 0.9rem; color: #666; margin-bottom: 8px; text-align: left;">
                                <strong>场景图片:</strong>
                            </div>
                            <img src="${getFullImageUrl(scene.scene_image_url)}" 
                                 style="max-width: 100%; max-height: 200px; object-fit: contain; border-radius: 8px; border: 1px solid #e9ecef; background: white;"
                                 alt="场景图片"
                                 onerror="this.onerror=null;this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjIwMCIgaGVpZ2h0PSIyMDAiIGZpbGw9IiNGRkZGRkYiLz48dGV4dCB4PSIxMDAiIHk9IjEwMCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE0IiBmaWxsPSIjNjY2IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIj7lm77niYfliLDlpLQ8L3RleHQ+PC9zdmc+';">
                        </div>
                    ` : ''}
                    
                    ${hazardBadges ? `<div style="margin: 10px 0;">${hazardBadges}</div>` : ''}
                    
                    ${scene.installation_notes ? `
                        <div style="margin: 10px 0; font-size: 0.9rem; color: #666;">
                            <strong>安装备注:</strong> ${scene.installation_notes}
                        </div>
                    ` : ''}
                    
                    <!-- 标志缩略图 -->
                    ${scene.signs && scene.signs.length > 0 ? `
                        <div style="margin: 15px 0;">
                            <div style="font-size: 0.9rem; color: #666; margin-bottom: 8px;">
                                <strong>已添加标志 (${scene.signs.length}个):</strong>
                            </div>
                            <div style="display: flex; flex-wrap: wrap; gap: 8px;">
                                ${sortSignsByType(scene.signs).map(sign => {
                                    const imageUrl = sign.image_url || '';
                                    return imageUrl 
                                        ? `<img src="${getFullImageUrl(imageUrl)}" style="width: 40px; height: 40px; object-fit: contain; border-radius: 6px; border: 1px solid #e9ecef; background: white;" title="${sign.sign_code}: ${sign.sign_name} (${getSignTypeChinese(sign.sign_type)})">`
                                        : `<div style="width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; background: #f8f9fa; border-radius: 6px; border: 1px solid #e9ecef; color: #999; font-size: 0.7rem;" title="${sign.sign_code}: ${sign.sign_name} (${getSignTypeChinese(sign.sign_type)})">无图</div>`;
                                }).join('')}
                            </div>
                        </div>
                    ` : `
                        <div style="margin: 15px 0; font-size: 0.9rem; color: #95a5a6;">
                            <em>暂无标志，点击"➕ 标志"按钮添加</em>
                        </div>
                    `}
                    
                    <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #eee; font-size: 0.85rem; color: #888;">
                        最后更新: ${formatDate(scene.updated_at || scene.created_at)}
                    </div>
                </div>
            `;
        });
        
        container.innerHTML = html;
        
    } catch (error) {
        console.error('加载场景失败:', error);
        container.innerHTML = `<div class="message error">加载失败: ${error.message}</div>`;
    }
}

// 获取危险源标签名称
function getHazardTagName(tagId) {
    // 预设标签映射
    const tagMap = {
        'electric': '触电危险',
        'fire': '火灾危险',
        'chemical': '化学品危险',
        'mechanical': '机械伤害',
        'fall': '坠落危险',
        'noise': '噪音危害',
        'dust': '粉尘危害',
        'radiation': '辐射危险',
        'high_temp': '高温烫伤',
        'low_temp': '低温冻伤',
        'slippery': '滑倒危险',
        'confined': '受限空间'
    };
    
    // 如果是预设标签，返回中文名称
    if (tagMap[tagId]) {
        return tagMap[tagId];
    }
    
    // 如果是自定义标签（以custom_开头），尝试从自定义标签列表中查找
    if (tagId.startsWith('custom_')) {
        // 从当前会话的自定义标签中查找
        const customTag = customHazardTags.find(tag => tag.tag_id === tagId);
        if (customTag) {
            return customTag.tag_name;
        }
    }
    
    // 如果都不是，返回原始ID
    return tagId;
}

// 获取危险源标签颜色
function getHazardTagColor(tagId) {
    // 预设标签颜色映射
    const colorMap = {
        'electric': '#92400e',
        'fire': '#991b1b',
        'chemical': '#9d174d',
        'mechanical': '#3730a3',
        'fall': '#0369a1',
        'noise': '#047857',
        'dust': '#57534e',
        'radiation': '#7c3aed',
        'high_temp': '#ea580c',
        'low_temp': '#1e40af',
        'slippery': '#0ea5e9',
        'confined': '#57534e'
    };
    
    // 如果是预设标签，返回对应颜色
    if (colorMap[tagId]) {
        return colorMap[tagId];
    }
    
    // 如果是自定义标签，返回紫色
    if (tagId.startsWith('custom_')) {
        return '#9333ea';
    }
    
    // 默认颜色
    return '#666';
}

// 获取风险等级文本
function getRiskLevelText(level) {
    const levels = {
        'low': '低风险',
        'medium': '中风险',
        'high': '高风险',
        'critical': '极高风险'
    };
    return levels[level] || level;
}

// 格式化日期
function formatDate(dateString) {
    if (!dateString) return '未知';
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// 简化日期格式
function formatDateShort(dateString) {
    if (!dateString) return '未知';
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', {
        month: '2-digit',
        day: '2-digit'
    });
}

// 创建场景
// 生成场景编码（自动）
async function generateSceneCode() {
    // 生成一个基于当前时间的唯一编码
    const now = new Date();
    const timestamp = now.getTime();
    const randomNum = Math.floor(Math.random() * 900) + 100; // 100-999
    const generatedCode = `SCENE-${randomNum.toString().padStart(3, '0')}`;
    document.getElementById('scene-code').value = generatedCode;
}

// 初始化危险源标签
// 危险源标签数据
const hazardTagsData = [
    { id: 'electric', name: '触电危险', color: '#fef3c7' },
    { id: 'fire', name: '火灾危险', color: '#fee2e2' },
    { id: 'chemical', name: '化学品危险', color: '#fce7f3' },
    { id: 'mechanical', name: '机械伤害', color: '#e0e7ff' },
    { id: 'fall', name: '坠落危险', color: '#f0f9ff' },
    { id: 'noise', name: '噪音危害', color: '#ecfdf5' },
    { id: 'dust', name: '粉尘危害', color: '#f5f5f4' },
    { id: 'radiation', name: '辐射危险', color: '#fae8ff' },
    { id: 'high_temp', name: '高温烫伤', color: '#ffedd5' },
    { id: 'low_temp', name: '低温冻伤', color: '#dbeafe' },
    { id: 'slippery', name: '滑倒危险', color: '#f0f9ff' },
    { id: 'confined', name: '受限空间', color: '#f5f5f4' }
];

// 自定义危险源标签存储
let customHazardTags = [];

// 全局错误处理
window.addEventListener('error', function(event) {
    console.error('全局错误捕获:', event.error);
    console.error('错误发生在:', event.filename, '第', event.lineno, '行');
    
    // 显示用户友好的错误消息
    if (event.error && event.error.message && event.error.message.includes('classList')) {
        console.error('classList错误详情: 元素可能不存在或DOM未加载完成');
    }
});

// DOM加载完成检查
let isDOMLoaded = false;
document.addEventListener('DOMContentLoaded', function() {
    isDOMLoaded = true;
    console.log('DOM加载完成，可以安全操作DOM元素');
});

// 安全获取元素函数
function safeGetElementById(id) {
    if (!isDOMLoaded) {
        console.warn(`警告: 尝试在DOM加载前获取元素 ${id}`);
    }
    const element = document.getElementById(id);
    if (!element) {
        console.error(`错误: 找不到元素 ${id}`);
    }
    return element;
}

// 从数据库加载自定义标签
async function loadCustomHazardTags() {
    try {
        const response = await fetch(`${API_BASE}/custom-hazard-tags`);
        if (response.ok) {
            customHazardTags = await response.json();
            console.log('从数据库加载自定义标签:', customHazardTags.length, '个');
        } else {
            console.error('加载自定义标签失败:', response.status);
            customHazardTags = [];
        }
    } catch (error) {
        console.error('加载自定义标签失败:', error);
        customHazardTags = [];
    }
}

// 保存自定义标签到数据库
async function saveCustomHazardTag(tag) {
    try {
        const response = await fetch(`${API_BASE}/custom-hazard-tags`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(tag)
        });
        
        if (response.ok) {
            const result = await response.json();
            console.log('保存自定义标签成功:', result);
            return result;
        } else {
            const error = await response.json();
            console.error('保存自定义标签失败:', error);
            throw new Error(error.error || '保存失败');
        }
    } catch (error) {
        console.error('保存自定义标签失败:', error);
        throw error;
    }
}

// 从数据库删除自定义标签
async function deleteCustomHazardTag(tagId) {
    try {
        const response = await fetch(`${API_BASE}/custom-hazard-tags/${tagId}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            const result = await response.json();
            console.log('删除自定义标签成功:', result);
            return result;
        } else {
            const error = await response.json();
            console.error('删除自定义标签失败:', error);
            throw new Error(error.error || '删除失败');
        }
    } catch (error) {
        console.error('删除自定义标签失败:', error);
        throw error;
    }
}

// 初始化危险源标签
async function initHazardTags() {
    // 加载自定义标签
    await loadCustomHazardTags();
    
    const container = document.getElementById('hazard-tags-container');
    if (!container) return;
    
    container.innerHTML = '';
    
    // 显示预设标签
    hazardTagsData.forEach(tag => {
        createHazardTagElement(container, tag.id, tag.name, tag.color);
    });
    
    // 显示自定义标签
    displayCustomHazards();
}

// 创建危险源标签元素
function createHazardTagElement(container, id, name, color) {
    const tagElement = document.createElement('div');
    tagElement.className = 'hazard-tag';
    tagElement.style.cssText = `
        padding: 8px 12px;
        border: 2px solid ${color};
        background: ${color}20;
        border-radius: 20px;
        cursor: pointer;
        text-align: center;
        font-size: 0.9rem;
        transition: all 0.2s;
        user-select: none;
    `;
    tagElement.textContent = name;
    tagElement.dataset.id = id;
    tagElement.dataset.name = name;
    
    tagElement.onclick = function() {
        this.classList.toggle('selected');
        updateSelectedHazards();
    };
    
    container.appendChild(tagElement);
}

// 显示自定义危险源标签
function displayCustomHazards() {
    const container = document.getElementById('custom-hazards-container');
    if (!container) return;
    
    container.innerHTML = '';
    
    customHazardTags.forEach(tag => {
        const tagElement = document.createElement('div');
        tagElement.className = 'hazard-tag custom-tag';
        tagElement.style.cssText = `
            padding: 8px 12px;
            border: 2px solid #a78bfa;
            background: #f3f0ff;
            border-radius: 20px;
            cursor: pointer;
            text-align: center;
            font-size: 0.9rem;
            transition: all 0.2s;
            user-select: none;
            display: flex;
            align-items: center;
            gap: 5px;
        `;
        
        tagElement.innerHTML = `
            <span>${tag.tag_name}</span>
            <button data-tag-id="${tag.tag_id}" style="background: none; border: none; color: #9333ea; font-size: 1.2rem; cursor: pointer; padding: 0 5px;">×</button>
        `;
        
        tagElement.dataset.id = tag.tag_id;
        tagElement.dataset.name = tag.tag_name;
        
        // 为删除按钮添加事件监听器
        const deleteButton = tagElement.querySelector('button');
        if (deleteButton) {
            deleteButton.onclick = function(e) {
                e.stopPropagation(); // 阻止事件冒泡
                removeCustomHazard(tag.tag_id);
            };
        }
        
        tagElement.onclick = function(e) {
            if (e.target.tagName === 'BUTTON') return; // 点击删除按钮时不触发选择
            this.classList.toggle('selected');
            updateSelectedHazards();
        };
        
        container.appendChild(tagElement);
    });
}

// 添加自定义危险源标签
async function addCustomHazard() {
    const input = document.getElementById('custom-hazard-input');
    const name = input.value.trim();
    
    if (!name) {
        showMessage('请输入危险源标签名称', 'error');
        return;
    }
    
    // 检查是否已存在（包括预设标签和自定义标签）
    const allTags = [...hazardTagsData, ...customHazardTags];
    const exists = allTags.some(tag => tag.tag_name === name);
    
    if (exists) {
        showMessage('该标签已存在', 'error');
        return;
    }
    
    // 生成唯一ID
    const tag_id = 'custom_' + Date.now();
    const newTag = { tag_id, tag_name: name, color: '#a78bfa' };
    
    try {
        // 保存到数据库
        const savedTag = await saveCustomHazardTag(newTag);
        
        // 添加到本地列表
        customHazardTags.push(savedTag);
        
        // 清空输入框
        input.value = '';
        
        // 更新显示
        displayCustomHazards();
        
        // 自动选中新添加的标签
        setTimeout(() => {
            const newTagElement = document.querySelector(`[data-id="${tag_id}"]`);
            if (newTagElement) {
                newTagElement.classList.add('selected');
                updateSelectedHazards();
            }
        }, 100);
        
        showMessage(`已添加自定义标签: ${name}`, 'success');
        
    } catch (error) {
        showMessage(`添加失败: ${error.message}`, 'error');
    }
}

// 移除自定义危险源标签
async function removeCustomHazard(tagId) {
    try {
        // 从数据库删除
        await deleteCustomHazardTag(tagId);
        
        // 从本地列表移除
        customHazardTags = customHazardTags.filter(tag => tag.tag_id !== tagId);
        
        displayCustomHazards();
        updateSelectedHazards();
        
        showMessage('已移除自定义标签', 'success');
    } catch (error) {
        showMessage(`移除失败: ${error.message}`, 'error');
    }
}

// 显示编辑页面的自定义危险源标签
function displayEditCustomHazards(selectedTagIds = []) {
    const container = document.getElementById('edit-custom-hazards-container');
    if (!container) return;
    
    container.innerHTML = '';
    
    customHazardTags.forEach(tag => {
        const tagElement = document.createElement('div');
        tagElement.className = 'hazard-tag custom-tag';
        tagElement.style.cssText = `
            padding: 8px 12px;
            border: 2px solid #a78bfa;
            background: #f3f0ff;
            border-radius: 20px;
            cursor: pointer;
            text-align: center;
            font-size: 0.9rem;
            transition: all 0.2s;
            user-select: none;
            display: flex;
            align-items: center;
            gap: 5px;
        `;
        
        tagElement.innerHTML = `
            <span>${tag.tag_name}</span>
            <button data-tag-id="${tag.tag_id}" style="background: none; border: none; color: #9333ea; font-size: 1.2rem; cursor: pointer; padding: 0 5px;">×</button>
        `;
        
        // 为删除按钮添加事件监听器
        const deleteButton = tagElement.querySelector('button');
        if (deleteButton) {
            deleteButton.onclick = function(e) {
                e.stopPropagation(); // 阻止事件冒泡
                removeEditCustomHazard(tag.tag_id);
            };
        }
        
        tagElement.dataset.id = tag.tag_id;
        tagElement.dataset.name = tag.tag_name;
        
        if (selectedTagIds.includes(tag.tag_id)) {
            tagElement.classList.add('selected');
        }
        
        tagElement.onclick = function(e) {
            if (e.target.tagName === 'BUTTON') return; // 点击删除按钮时不触发选择
            this.classList.toggle('selected');
            updateEditSelectedHazards();
        };
        
        container.appendChild(tagElement);
    });
}

// 添加编辑页面的自定义危险源标签
async function addEditCustomHazard() {
    const input = document.getElementById('edit-custom-hazard-input');
    const name = input.value.trim();
    
    if (!name) {
        showEditMessage('请输入危险源标签名称', 'error');
        return;
    }
    
    // 检查是否已存在（包括预设标签和自定义标签）
    const allTags = [...hazardTagsData, ...customHazardTags];
    const exists = allTags.some(tag => tag.tag_name === name || tag.name === name);
    
    if (exists) {
        showEditMessage('该标签已存在', 'error');
        return;
    }
    
    // 生成唯一ID
    const tag_id = 'custom_' + Date.now();
    const newTag = { tag_id, tag_name: name, color: '#a78bfa' };
    
    try {
        // 保存到数据库
        const savedTag = await saveCustomHazardTag(newTag);
        
        // 添加到本地列表
        customHazardTags.push(savedTag);
        
        // 清空输入框
        input.value = '';
        
        // 更新显示
        displayEditCustomHazards();
        
        // 自动选中新添加的标签
        setTimeout(() => {
            const newTagElement = document.querySelector(`[data-id="${tag_id}"]`);
            if (newTagElement) {
                newTagElement.classList.add('selected');
                updateEditSelectedHazards();
            }
        }, 100);
        
        showEditMessage(`已添加自定义标签: ${name}`, 'success');
        
    } catch (error) {
        showEditMessage(`添加失败: ${error.message}`, 'error');
    }
}

// 移除编辑页面的自定义危险源标签
async function removeEditCustomHazard(tagId) {
    try {
        // 从数据库删除
        await deleteCustomHazardTag(tagId);
        
        // 从本地列表移除
        customHazardTags = customHazardTags.filter(tag => tag.tag_id !== tagId);
        
        displayEditCustomHazards();
        updateEditSelectedHazards();
        
        showEditMessage('已移除自定义标签', 'success');
    } catch (error) {
        showEditMessage(`移除失败: ${error.message}`, 'error');
    }
}

// 更新编辑页面选中的危险源
function updateEditSelectedHazards() {
    const selectedTags = document.querySelectorAll('#edit-hazard-tags-container .hazard-tag.selected, #edit-custom-hazards-container .hazard-tag.selected');
    const selectedHazards = Array.from(selectedTags).map(tag => tag.dataset.id);
    document.getElementById('edit-scene-hazards').value = selectedHazards.join(',');
    
    // 调试信息（可选）
    console.log('编辑页面选中的危险源:', selectedHazards);
}

// 显示编辑页面消息
function showEditMessage(message, type = 'info') {
    const messageDiv = document.getElementById('edit-scene-message');
    if (!messageDiv) return;
    
    const className = type === 'error' ? 'message error' : 'message success';
    messageDiv.innerHTML = `<div class="${className}">${message}</div>`;
    
    // 3秒后自动清除消息
    setTimeout(() => {
        messageDiv.innerHTML = '';
    }, 3000);
}

// 更新选中的危险源
function updateSelectedHazards() {
    const selectedTags = document.querySelectorAll('.hazard-tag.selected');
    const selectedHazards = Array.from(selectedTags).map(tag => tag.dataset.id);
    document.getElementById('scene-hazards').value = selectedHazards.join(',');
    
    // 调试信息（可选）
    console.log('选中的危险源:', selectedHazards);
}

// 重置场景表单
function resetSceneForm() {
    document.getElementById('scene-code').value = '';
    document.getElementById('scene-name').value = '';
    document.getElementById('scene-dept').value = '';
    document.getElementById('scene-location').value = '';
    document.getElementById('scene-notes').value = '';
    document.getElementById('scene-hazards').value = '';
    
    // 重置危险源标签选择
    document.querySelectorAll('.hazard-tag.selected').forEach(tag => {
        tag.classList.remove('selected');
    });
    
    // 清空自定义标签输入框
    document.getElementById('custom-hazard-input').value = '';
    
    // 重置场景图片
    const previewDiv = document.getElementById('scene-image-preview');
    if (previewDiv) previewDiv.innerHTML = '';
    const imageUrlInput = document.getElementById('scene-image-url');
    if (imageUrlInput) imageUrlInput.value = '';
    const imageUploadInput = document.getElementById('scene-image-upload');
    if (imageUploadInput) imageUploadInput.value = '';
    
    document.getElementById('scene-message').innerHTML = '';
}

// 创建场景
async function createScene() {
    // 自动生成场景编码
    await generateSceneCode();
    
    const sceneData = {
        scene_code: document.getElementById('scene-code').value.trim(),
        scene_name: document.getElementById('scene-name').value.trim(),
        department: document.getElementById('scene-dept').value,
        hazard_tags: document.getElementById('scene-hazards').value,
        location_description: document.getElementById('scene-location').value.trim(),
        installation_notes: document.getElementById('scene-notes').value.trim(),
        scene_image_url: document.getElementById('scene-image-url').value || null
    };
    
    // 验证输入
    if (!sceneData.scene_name || !sceneData.department) {
        document.getElementById('scene-message').innerHTML = '<div class="message error">请填写场景名称和选择所属部门</div>';
        return;
    }
    
    try {
        const res = await fetch(`${API_BASE}/scenes`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(sceneData)
        });
        
        if (res.ok) {
            document.getElementById('scene-message').innerHTML = '<div class="message success">场景创建成功！</div>';
            
            // 清空表单
            resetSceneForm();
            
            // 重新加载场景列表
            setTimeout(() => {
                loadScenes();
                showPage('scene-list');
            }, 1500);
            
        } else {
            const error = await res.json();
            document.getElementById('scene-message').innerHTML = `<div class="message error">创建失败: ${error.error || '未知错误'}</div>`;
        }
    } catch (error) {
        document.getElementById('scene-message').innerHTML = `<div class="message error">创建失败: ${error.message}</div>`;
    }
}

// 删除相关变量
let signToDelete = null;

// 确认删除标志
function confirmDeleteSign(signId, signCode, signName) {
    signToDelete = signId;
    document.getElementById('delete-sign-code').textContent = signCode;
    document.getElementById('delete-sign-name').textContent = signName;
    document.getElementById('delete-modal').classList.add('active');
}

// 取消删除
function cancelDelete() {
    signToDelete = null;
    document.getElementById('delete-modal').classList.remove('active');
}

// 删除标志
async function deleteSign() {
    if (!signToDelete) {
        cancelDelete();
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/signs/${signToDelete}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            // 显示成功消息
            showDeleteMessage('标志删除成功！', 'success');
            
            // 从页面移除标志卡片
            const signCard = document.getElementById(`sign-card-${signToDelete}`);
            if (signCard) {
                signCard.style.opacity = '0.5';
                signCard.style.transform = 'scale(0.95)';
                setTimeout(() => {
                    signCard.remove();
                    // 重新加载标志列表以更新分组
                    loadSigns();
                }, 300);
            }
            
            // 关闭对话框
            cancelDelete();
            
        } else {
            const error = await response.text();
            showDeleteMessage('删除失败: ' + (error || '未知错误'), 'error');
            cancelDelete();
        }
    } catch (error) {
        showDeleteMessage('删除失败: ' + error.message, 'error');
        cancelDelete();
    }
}

// 显示删除消息
function showDeleteMessage(message, type = 'info') {
    // 先移除现有的消息
    const existingMessage = document.getElementById('delete-message');
    if (existingMessage) {
        existingMessage.remove();
    }
    
    // 创建新消息
    const messageDiv = document.createElement('div');
    messageDiv.id = 'delete-message';
    messageDiv.className = `message ${type}`;
    messageDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 1001;
        max-width: 300px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    `;
    messageDiv.textContent = message;
    
    document.body.appendChild(messageDiv);
    
    // 3秒后自动移除
    setTimeout(() => {
        if (messageDiv.parentNode) {
            messageDiv.remove();
        }
    }, 3000);
}

// 场景CRUD相关变量
let sceneToDelete = null;
let sceneToEdit = null;

// 查看场景详情 - 增强版（包含标志缩略图和PDF导出）
async function viewScene(sceneId) {
    try {
        const res = await fetch(`${API_BASE}/scenes/${sceneId}`);
        const scene = await res.json();
        
        // 创建详情模态框
        showSceneDetailModal(scene);
        
    } catch (error) {
        showDeleteMessage('加载场景详情失败: ' + error.message, 'error');
    }
}

// 显示场景详情模态框
function showSceneDetailModal(scene) {
    // 创建模态框HTML
    const modalHtml = `
        <div id="sceneDetailModal" class="modal" style="display: block; position: fixed; z-index: 1000; left: 0; top: 0; width: 100%; height: 100%; background-color: rgba(0,0,0,0.5);">
            <div class="modal-content" style="background-color: white; margin: 5% auto; padding: 20px; border-radius: 10px; width: 90%; max-width: 1000px; max-height: 85vh; overflow-y: auto;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                    <h2 style="color: #667eea; margin: 0;">场景详情 - ${scene.scene_name}</h2>
                    <button onclick="closeSceneDetailModal()" style="background: none; border: none; font-size: 24px; cursor: pointer; color: #666;">&times;</button>
                </div>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 30px;">
                    <!-- 左侧：场景基本信息 -->
                    <div>
                        <h3 style="color: #333; border-bottom: 2px solid #667eea; padding-bottom: 10px; margin-bottom: 15px;">基本信息</h3>
                        <div style="background: #f8f9fa; padding: 15px; border-radius: 8px;">
                            <div style="margin-bottom: 10px;">
                                <strong>场景编码：</strong>${scene.scene_code}
                            </div>
                            <div style="margin-bottom: 10px;">
                                <strong>场景名称：</strong>${scene.scene_name}
                            </div>
                            <div style="margin-bottom: 10px;">
                                <strong>所属部门：</strong>${scene.department}
                            </div>
                            <div style="margin-bottom: 10px;">
                                <strong>危险源标签：</strong>${scene.hazard_tags || '无'}
                            </div>
                            <div style="margin-bottom: 10px;">
                                <strong>位置描述：</strong>${scene.location_description || '未填写'}
                            </div>
                            <div style="margin-bottom: 10px;">
                                <strong>安装备注：</strong>${scene.installation_notes || '无'}
                            </div>
                            <div style="margin-bottom: 10px;">
                                <strong>创建时间：</strong>${scene.created_at}
                            </div>
                            ${scene.scene_image_url ? `
                                <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #e0e0e0;">
                                    <strong>场景图片：</strong>
                                    <div style="margin-top: 10px; text-align: center;">
                                        <img src="${getFullImageUrl(scene.scene_image_url)}" 
                                             style="max-width: 100%; max-height: 300px; object-fit: contain; border-radius: 8px; border: 1px solid #e0e0e0; background: white;"
                                             alt="场景图片"
                                             onerror="this.onerror=null;this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjIwMCIgaGVpZ2h0PSIyMDAiIGZpbGw9IiNGRkZGRkYiLz48dGV4dCB4PSIxMDAiIHk9IjEwMCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE0IiBmaWxsPSIjNjY2IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIj7lm77niYfliLDlpLQ8L3RleHQ+PC9zdmc+';">
                                    </div>
                                </div>
                            ` : ''}
                            <div style="margin-bottom: 10px;">
                                <strong>更新时间：</strong>${scene.updated_at}
                            </div>
                        </div>
                    </div>
                    
                    <!-- 右侧：统计信息 -->
                    <div>
                        <h3 style="color: #333; border-bottom: 2px solid #667eea; padding-bottom: 10px; margin-bottom: 15px;">统计信息</h3>
                        <div style="background: #f8f9fa; padding: 15px; border-radius: 8px;">
                            <div style="margin-bottom: 10px;">
                                <strong>安全标志数量：</strong>${scene.signs ? scene.signs.length : 0} 个
                            </div>
                            <div style="margin-bottom: 10px;">
                                <strong>标志类型分布：</strong>
                                <div id="signTypeDistribution" style="margin-top: 10px;">
                                    <!-- 动态生成类型分布 -->
                                </div>
                            </div>
                            <div style="margin-bottom: 10px;">
                                <strong>安装高度范围：</strong>
                                <div id="heightRange" style="margin-top: 10px;">
                                    <!-- 动态生成高度范围 -->
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- 安全标志列表 -->
                <div>
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                        <h3 style="color: #333; border-bottom: 2px solid #667eea; padding-bottom: 10px; margin: 0;">安全标志列表</h3>
                        <button onclick="exportSceneToPDF(${scene.id})" style="background: #48bb78; color: white; border: none; padding: 8px 16px; border-radius: 5px; cursor: pointer; font-weight: bold;">
                            📄 导出PDF指导文件
                        </button>
                    </div>
                    
                    ${scene.signs && scene.signs.length > 0 ? 
                        `<div id="sceneSignsGrid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 15px; margin-top: 15px;">
                            ${sortSignsByType(scene.signs).map((sign, index) => `
                                <div class="sign-card" style="border: 2px solid #e0e0e0; border-radius: 8px; padding: 15px; background: white; position: relative;">
                                    <div style="position: absolute; top: 10px; right: 10px; background: #667eea; color: white; padding: 2px 8px; border-radius: 12px; font-size: 12px; font-weight: bold;">
                                        序号: ${index + 1}
                                    </div>
                                    <div style="text-align: center; margin-bottom: 10px;">
                                        <img src="${getFullImageUrl(sign.image_url)}" alt="${sign.sign_name}" 
                                             style="width: 100%; max-height: 120px; object-fit: contain; background: #f8f9fa; border-radius: 5px; padding: 5px;" onerror="this.onerror=null;this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjIwMCIgaGVpZ2h0PSIyMDAiIGZpbGw9IiNGRkZGRkYiLz48dGV4dCB4PSIxMDAiIHk9IjEwMCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE0IiBmaWxsPSIjNjY2IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIj7lm77niYfliLDlpLQ8L3RleHQ+PC9zdmc+'">
                                    </div>
                                    <div style="margin-bottom: 5px;">
                                        <strong>标志编码：</strong>${sign.sign_code}
                                    </div>
                                    <div style="margin-bottom: 5px;">
                                        <strong>标志名称：</strong>${sign.sign_name}
                                    </div>
                                    <div style="margin-bottom: 5px;">
                                        <strong>标志类型：</strong>
                                        <span class="sign-type ${sign.sign_type}" style="display: inline-block; padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: bold; margin-left: 5px;">
                                            ${getSignTypeChinese(sign.sign_type)}
                                        </span>
                                    </div>
                                    <div style="margin-bottom: 5px;">
                                        <strong>安装高度：</strong>${sign.installation_height || '未设置'} 米
                                    </div>
                                    <div style="margin-bottom: 5px;">
                                        <strong>观察距离：</strong>${sign.observation_distance || '未设置'} 米
                                    </div>
                                    ${sign.special_requirements ? 
                                        `<div style="margin-bottom: 5px;">
                                            <strong>特殊要求：</strong>${sign.special_requirements}
                                        </div>` : ''
                                    }
                                </div>
                            `).join('')}
                        </div>` 
                        : 
                        `<div style="text-align: center; padding: 40px; background: #f8f9fa; border-radius: 8px; color: #666;">
                            <p style="margin: 0;">该场景尚未添加任何安全标志</p>
                            <button onclick="closeSceneDetailModal(); showPage('addSignsPage');" 
                                    style="margin-top: 15px; background: #667eea; color: white; border: none; padding: 8px 16px; border-radius: 5px; cursor: pointer;">
                                前往添加标志
                            </button>
                        </div>`
                    }
                </div>
                
                <!-- 现场张贴指导 -->
                ${scene.signs && scene.signs.length > 0 ? 
                    `<div style="margin-top: 30px; padding-top: 20px; border-top: 2px solid #e0e0e0;">
                        <h3 style="color: #333; border-bottom: 2px solid #667eea; padding-bottom: 10px; margin-bottom: 15px;">现场张贴指导</h3>
                        <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; border-left: 4px solid #667eea;">
                            <h4 style="color: #1e40af; margin-top: 0;">张贴顺序建议：</h4>
                            <ol style="margin: 10px 0; padding-left: 20px;">
                                ${sortSignsByType(scene.signs).map((sign, index) => `
                                    <li style="margin-bottom: 8px;">
                                        <strong>${index + 1}. ${sign.sign_name} (${sign.sign_code})</strong>
                                        - 安装高度: ${sign.installation_height || '1.5'}米
                                        - 观察距离: ${sign.observation_distance || '3'}米
                                        ${sign.special_requirements ? `- 特殊要求: ${sign.special_requirements}` : ''}
                                    </li>
                                `).join('')}
                            </ol>
                            <div style="margin-top: 15px; color: #666; font-size: 14px;">
                                <strong>注意事项：</strong>
                                <ul style="margin: 10px 0; padding-left: 20px;">
                                    <li>按照建议顺序进行张贴，确保标志的可见性和逻辑性</li>
                                    <li>安装高度应符合人体工程学，便于观察</li>
                                    <li>确保标志表面清洁，无遮挡物</li>
                                    <li>定期检查标志的完整性和清晰度</li>
                                </ul>
                            </div>
                        </div>
                    </div>` 
                    : ''
                }
            </div>
        </div>
    `;
    
    // 添加到页面
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    // 动态计算统计信息
    updateSceneStatistics(scene);
    
    // 添加CSS样式
    addSceneDetailStyles();
}

// 关闭场景详情模态框
function closeSceneDetailModal() {
    const modal = document.getElementById('sceneDetailModal');
    if (modal) {
        modal.remove();
    }
}

// 更新场景统计信息
function updateSceneStatistics(scene) {
    if (!scene.signs || scene.signs.length === 0) return;
    
    // 计算类型分布
    const typeCount = {};
    scene.signs.forEach(sign => {
        typeCount[sign.sign_type] = (typeCount[sign.sign_type] || 0) + 1;
    });
    
    const typeDistributionDiv = document.getElementById('signTypeDistribution');
    if (typeDistributionDiv) {
        typeDistributionDiv.innerHTML = Object.entries(typeCount).map(([type, count]) => `
            <div style="display: inline-block; margin-right: 10px; margin-bottom: 5px;">
                <span class="sign-type ${type}" style="display: inline-block; padding: 3px 8px; border-radius: 12px; font-size: 12px; font-weight: bold;">
                    ${getSignTypeChinese(type)}: ${count}个
                </span>
            </div>
        `).join('');
    }
    
    // 计算高度范围
    const heights = scene.signs.map(sign => parseFloat(sign.installation_height) || 1.5);
    const minHeight = Math.min(...heights);
    const maxHeight = Math.max(...heights);
    
    const heightRangeDiv = document.getElementById('heightRange');
    if (heightRangeDiv) {
        heightRangeDiv.innerHTML = `
            <div style="background: #e9ecef; padding: 5px 10px; border-radius: 5px; display: inline-block;">
                最低: ${minHeight.toFixed(1)}米 | 最高: ${maxHeight.toFixed(1)}米 | 平均: ${(heights.reduce((a, b) => a + b, 0) / heights.length).toFixed(1)}米
            </div>
        `;
    }
}

// 获取标志类型的中文名称
function getSignTypeChinese(type) {
    const typeMap = {
        'warning': '警告',
        'prohibition': '禁止',
        'instruction': '指令',
        'information': '信息'
    };
    return typeMap[type] || type;
}

// 按照警告→禁止→指令→信息的顺序排序标志
function sortSignsByType(signs) {
    if (!signs || !Array.isArray(signs)) return [];
    
    // 定义类型顺序
    const typeOrder = {
        'warning': 1,
        'prohibition': 2,
        'instruction': 3,
        'information': 4
    };
    
    // 创建副本并排序
    return [...signs].sort((a, b) => {
        const orderA = typeOrder[a.sign_type] || 99;
        const orderB = typeOrder[b.sign_type] || 99;
        
        // 首先按类型顺序排序
        if (orderA !== orderB) {
            return orderA - orderB;
        }
        
        // 如果类型相同，按display_order排序
        const displayOrderA = a.display_order || 99;
        const displayOrderB = b.display_order || 99;
        return displayOrderA - displayOrderB;
    });
}

// 获取完整的图片URL
function getFullImageUrl(imagePath) {
    if (!imagePath) return '';
    
    // 如果已经是完整URL，直接返回
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
        return imagePath;
    }
    
    // 获取当前页面的基础URL
    let baseUrl = window.location.origin;
    
    // 如果是本地开发环境，使用相对路径
    // 如果是ngrok环境，确保使用正确的协议和域名
    if (baseUrl.includes('localhost') || baseUrl.includes('127.0.0.1')) {
        // 本地开发，使用相对路径
        return imagePath;
    } else {
        // 生产/ngrok环境，使用绝对路径
        // 确保路径以斜杠开头
        const path = imagePath.startsWith('/') ? imagePath : '/' + imagePath;
        return baseUrl + path;
    }
}

// 添加场景详情样式
function addSceneDetailStyles() {
    const styleId = 'sceneDetailStyles';
    if (document.getElementById(styleId)) return;
    
    const styles = `
        <style id="${styleId}">
            .sign-type.warning { background: #fef3c7; color: #92400e; }
            .sign-type.prohibition { background: #fee2e2; color: #991b1b; }
            .sign-type.instruction { background: #dbeafe; color: #1e40af; }
            .sign-type.information { background: #d1fae5; color: #065f46; }
            
            .modal-content {
                animation: modalFadeIn 0.3s;
            }
            
            @keyframes modalFadeIn {
                from { opacity: 0; transform: translateY(-20px); }
                to { opacity: 1; transform: translateY(0); }
            }
            
            .sign-card:hover {
                border-color: #667eea;
                transform: translateY(-2px);
                box-shadow: 0 5px 15px rgba(0,0,0,0.1);
                transition: all 0.3s ease;
            }
        </style>
    `;
    
    document.head.insertAdjacentHTML('beforeend', styles);
}

// 导出场景为PDF - 使用html2canvas解决中文乱码问题
async function exportSceneToPDF(sceneId) {
    try {
        showDeleteMessage('正在生成PDF文件，请稍候...这可能需要几秒钟时间', 'success');
        
        // 获取场景数据
        const res = await fetch(`${API_BASE}/scenes/${sceneId}`);
        const scene = await res.json();
        
        if (!scene.signs || scene.signs.length === 0) {
            showDeleteMessage('该场景没有安全标志，无法生成PDF指导文件', 'error');
            return;
        }
        
        // 创建临时HTML内容用于生成PDF
        const tempHtml = createPDFContent(scene);
        
        // 创建临时div来渲染内容
        const tempDiv = document.createElement('div');
        tempDiv.style.position = 'absolute';
        tempDiv.style.left = '-9999px';
        tempDiv.style.top = '0';
        tempDiv.style.width = '794px'; // A4宽度：794px (210mm * 3.78)
        tempDiv.style.padding = '40px';
        tempDiv.style.backgroundColor = 'white';
        tempDiv.style.boxSizing = 'border-box';
        tempDiv.innerHTML = tempHtml;
        
        document.body.appendChild(tempDiv);
        
        try {
            // 使用html2canvas将HTML转换为图片
            const canvas = await html2canvas(tempDiv, {
                scale: 2, // 提高分辨率
                useCORS: true, // 允许跨域图片
                allowTaint: true,
                backgroundColor: '#ffffff',
                logging: false
            });
            
            // 从canvas获取图片数据
            const imgData = canvas.toDataURL('image/jpeg', 0.9);
            
            // 创建PDF
            const { jsPDF } = window.jspdf;
            const pdf = new jsPDF('p', 'mm', 'a4');
            
            // 计算图片在PDF中的尺寸
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            
            // 添加图片到PDF
            pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
            
            // 保存PDF
            const fileName = `安全标志张贴指导_${scene.scene_code}_${new Date().toISOString().slice(0, 10)}.pdf`;
            pdf.save(fileName);
            
            showDeleteMessage(`PDF文件已生成并下载: ${fileName}`, 'success');
            
        } finally {
            // 清理临时div
            document.body.removeChild(tempDiv);
        }
        
    } catch (error) {
        console.error('PDF导出错误:', error);
        showDeleteMessage('导出PDF失败: ' + error.message, 'error');
    }
}

// 创建PDF内容HTML
function createPDFContent(scene) {
    const now = new Date();
    const formattedTime = `${now.getFullYear()}/${now.getMonth() + 1}/${now.getDate()} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
    
    return `
        <div style="font-family: 'Microsoft YaHei', 'SimHei', Arial, sans-serif; color: #333; line-height: 1.5;">
            <!-- 标题 -->
            <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #2c3e50; margin-bottom: 10px; font-size: 24px;">安全标志张贴指导文件</h1>
                <div style="color: #7f8c8d; font-size: 14px;">生成时间: ${formattedTime}</div>
            </div>
            
            <!-- 场景信息 -->
            <div style="margin-bottom: 30px; border: 1px solid #e0e0e0; border-radius: 8px; padding: 20px; background: #f8f9fa;">
                <h2 style="color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px; margin-bottom: 15px; font-size: 18px;">场景信息</h2>
                
                ${scene.scene_image_url ? `
                    <div style="text-align: center; margin-bottom: 20px;">
                        <div style="font-weight: bold; margin-bottom: 10px; color: #666;">场景图片:</div>
                        <img src="${getFullImageUrl(scene.scene_image_url)}" 
                             style="max-width: 100%; max-height: 300px; object-fit: contain; border-radius: 8px; border: 1px solid #e0e0e0; background: white;"
                             alt="场景图片">
                    </div>
                ` : ''}
                
                <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                        <td style="padding: 8px 0; width: 120px; font-weight: bold;">场景名称:</td>
                        <td style="padding: 8px 0;">${scene.scene_name}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; font-weight: bold;">场景编码:</td>
                        <td style="padding: 8px 0;">${scene.scene_code}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; font-weight: bold;">所属部门:</td>
                        <td style="padding: 8px 0;">${scene.department}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; font-weight: bold;">位置描述:</td>
                        <td style="padding: 8px 0;">${scene.location_description || '未填写'}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; font-weight: bold;">危险源标签:</td>
                        <td style="padding: 8px 0;">${scene.hazard_tags || '无'}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; font-weight: bold;">安装备注:</td>
                        <td style="padding: 8px 0;">${scene.installation_notes || '无'}</td>
                    </tr>
                </table>
            </div>
            
            <!-- 安全标志列表 -->
            <div style="margin-bottom: 30px;">
                <h2 style="color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px; margin-bottom: 15px; font-size: 18px;">安全标志列表 (共${scene.signs.length}个)</h2>
                
                <table style="width: 100%; border-collapse: collapse; border: 1px solid #e0e0e0;">
                    <thead>
                        <tr style="background: #ecf0f1;">
                            <th style="padding: 12px; text-align: left; border-bottom: 2px solid #bdc3c7;">序号</th>
                            <th style="padding: 12px; text-align: left; border-bottom: 2px solid #bdc3c7;">标志编码</th>
                            <th style="padding: 12px; text-align: left; border-bottom: 2px solid #bdc3c7;">标志名称</th>
                            <th style="padding: 12px; text-align: left; border-bottom: 2px solid #bdc3c7;">类型</th>
                            <th style="padding: 12px; text-align: left; border-bottom: 2px solid #bdc3c7;">安装高度</th>
                            <th style="padding: 12px; text-align: left; border-bottom: 2px solid #bdc3c7;">观察距离</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${sortSignsByType(scene.signs).map((sign, index) => `
                            <tr style="${index % 2 === 0 ? 'background: #f8f9fa;' : ''}">
                                <td style="padding: 10px; border-bottom: 1px solid #e0e0e0;">${index + 1}</td>
                                <td style="padding: 10px; border-bottom: 1px solid #e0e0e0;">${sign.sign_code}</td>
                                <td style="padding: 10px; border-bottom: 1px solid #e0e0e0;">${sign.sign_name}</td>
                                <td style="padding: 10px; border-bottom: 1px solid #e0e0e0;">
                                    <span style="display: inline-block; padding: 3px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; 
                                        ${sign.sign_type === 'warning' ? 'background: #fef3c7; color: #92400e;' : ''}
                                        ${sign.sign_type === 'prohibition' ? 'background: #fee2e2; color: #991b1b;' : ''}
                                        ${sign.sign_type === 'instruction' ? 'background: #dbeafe; color: #1e40af;' : ''}
                                        ${sign.sign_type === 'information' ? 'background: #d1fae5; color: #065f46;' : ''}">
                                        ${getSignTypeChinese(sign.sign_type)}
                                    </span>
                                </td>
                                <td style="padding: 10px; border-bottom: 1px solid #e0e0e0;">${sign.installation_height || '1.5'}米</td>
                                <td style="padding: 10px; border-bottom: 1px solid #e0e0e0;">${sign.observation_distance || '3'}米</td>
                            </tr>
                            ${sign.special_requirements ? `
                                <tr style="${index % 2 === 0 ? 'background: #f8f9fa;' : ''}">
                                    <td colspan="6" style="padding: 8px 10px; border-bottom: 1px solid #e0e0e0; font-size: 13px; color: #666;">
                                        <strong>特殊要求:</strong> ${sign.special_requirements}
                                    </td>
                                </tr>
                            ` : ''}
                        `).join('')}
                    </tbody>
                </table>
            </div>
            
            <!-- 张贴指导 -->
            <div style="margin-bottom: 30px; border: 1px solid #e0e0e0; border-radius: 8px; padding: 20px; background: #f0f9ff; border-left: 4px solid #3498db;">
                <h2 style="color: #2c3e50; margin-bottom: 15px; font-size: 18px;">现场张贴指导</h2>
                
                <h3 style="color: #1e40af; margin-bottom: 10px; font-size: 16px;">张贴顺序建议:</h3>
                <ol style="margin: 0 0 20px 20px; padding: 0;">
                    ${sortSignsByType(scene.signs).map((sign, index) => `
                        <li style="margin-bottom: 8px;">
                            <strong>${sign.sign_name} (${sign.sign_code})</strong>
                            - 安装高度: ${sign.installation_height || '1.5'}米
                            - 观察距离: ${sign.observation_distance || '3'}米
                            ${sign.special_requirements ? `- 特殊要求: ${sign.special_requirements}` : ''}
                        </li>
                    `).join('')}
                </ol>
                
                <h3 style="color: #1e40af; margin-bottom: 10px; font-size: 16px;">注意事项:</h3>
                <ul style="margin: 0 0 0 20px; padding: 0; color: #666;">
                    <li style="margin-bottom: 5px;">按照建议顺序进行张贴，确保标志的可见性和逻辑性</li>
                    <li style="margin-bottom: 5px;">安装高度应符合人体工程学，便于观察</li>
                    <li style="margin-bottom: 5px;">确保标志表面清洁，无遮挡物</li>
                    <li style="margin-bottom: 5px;">定期检查标志的完整性和清晰度</li>
                    <li style="margin-bottom: 5px;">标志应安装在光线充足的位置</li>
                    <li style="margin-bottom: 5px;">危险区域标志应使用反光材料</li>
                    <li style="margin-bottom: 5px;">标志内容应清晰易懂，符合国家标准</li>
                </ul>
            </div>
            
            <!-- 页脚 -->
            <div style="text-align: center; color: #95a5a6; font-size: 12px; margin-top: 40px; padding-top: 20px; border-top: 1px solid #ecf0f1;">
                <div>安全标志图集管理系统 - 生成于 ${formattedTime}</div>
                <div style="margin-top: 5px;">本文件用于指导现场安全标志张贴工作，请妥善保管</div>
            </div>
        </div>
    `;
}

// 编辑场景
async function editScene(sceneId) {
    try {
        const res = await fetch(`${API_BASE}/scenes/${sceneId}`);
        const scene = await res.json();
        
        sceneToEdit = sceneId;
        
        // 加载自定义标签
        await loadCustomHazardTags();
        
        // 填充表单
        safeGetElementById('edit-scene-code').value = scene.scene_code;
        safeGetElementById('edit-scene-name').value = scene.scene_name;
        safeGetElementById('edit-scene-dept').value = scene.department;
        safeGetElementById('edit-scene-location').value = scene.location_description || '';
        safeGetElementById('edit-scene-notes').value = scene.installation_notes || '';
        
        // 初始化危险源标签
        initEditHazardTags(scene.hazard_tags);
        
        // 加载场景图片
        loadSceneImageForEdit(scene.scene_image_url);
        
        // 显示编辑模态框
        const editModal = safeGetElementById('edit-scene-modal');
        if (!editModal) {
            console.error('错误: 找不到编辑模态框元素 edit-scene-modal');
            showDeleteMessage('加载场景失败: 找不到编辑表单元素', 'error');
            return;
        }
        editModal.classList.add('active');
        
    } catch (error) {
        showDeleteMessage('加载场景失败: ' + error.message, 'error');
    }
}

// 加载场景图片到编辑表单
function loadSceneImageForEdit(sceneImageUrl) {
    const previewDiv = document.getElementById('edit-scene-image-preview');
    const imageUrlInput = document.getElementById('edit-scene-image-url');
    
    if (!previewDiv) {
        console.warn('警告: 找不到编辑场景图片预览元素 edit-scene-image-preview');
        return;
    }
    if (!imageUrlInput) {
        console.warn('警告: 找不到编辑场景图片URL输入元素 edit-scene-image-url');
        return;
    }
    
    // 清空预览
    previewDiv.innerHTML = '';
    imageUrlInput.value = '';
    
    if (sceneImageUrl) {
        // 显示现有图片
        previewDiv.innerHTML = `
            <div style="text-align: center;">
                <img src="${getFullImageUrl(sceneImageUrl)}" 
                     style="max-width: 200px; max-height: 150px; object-fit: contain; border-radius: 8px; border: 1px solid #e0e0e0;">
                <div style="margin-top: 10px; color: #48bb78;">
                    ✅ 已上传图片
                    <button onclick="removeEditSceneImage()" style="margin-left: 10px; background: #fee2e2; color: #991b1b; border: none; padding: 2px 8px; border-radius: 4px; font-size: 0.8rem; cursor: pointer;">移除</button>
                </div>
            </div>
        `;
        
        imageUrlInput.value = sceneImageUrl;
    }
}

// 初始化编辑危险源标签
function initEditHazardTags(selectedTags) {
    const selectedTagIds = selectedTags ? selectedTags.split(',').filter(tag => tag.trim()) : [];
    
    const container = document.getElementById('edit-hazard-tags-container');
    if (!container) {
        console.warn('警告: 找不到编辑危险源标签容器 edit-hazard-tags-container');
        return;
    }
    
    container.innerHTML = '';
    
    // 显示预设标签
    hazardTagsData.forEach(tag => {
        const tagElement = createHazardTagElement(container, tag.id, tag.name, tag.color);
        if (selectedTagIds.includes(tag.id)) {
            tagElement.classList.add('selected');
        }
    });
    
    // 显示自定义标签
    displayEditCustomHazards(selectedTagIds);
}

// 更新场景
async function updateScene() {
    if (!sceneToEdit) return;
    
    const sceneData = {
        scene_name: document.getElementById('edit-scene-name').value.trim(),
        department: document.getElementById('edit-scene-dept').value,
        hazard_tags: document.getElementById('edit-scene-hazards').value,
        location_description: document.getElementById('edit-scene-location').value.trim(),
        installation_notes: document.getElementById('edit-scene-notes').value.trim(),
        scene_image_url: document.getElementById('edit-scene-image-url').value || null
    };
    
    // 验证输入
    if (!sceneData.scene_name || !sceneData.department) {
        document.getElementById('edit-scene-message').innerHTML = '<div class="message error">请填写场景名称和选择所属部门</div>';
        return;
    }
    
    try {
        const res = await fetch(`${API_BASE}/scenes/${sceneToEdit}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(sceneData)
        });
        
        if (res.ok) {
            document.getElementById('edit-scene-message').innerHTML = '<div class="message success">场景更新成功！</div>';
            
            setTimeout(() => {
                cancelEditScene();
                loadScenes();
            }, 1500);
            
        } else {
            const error = await res.json();
            document.getElementById('edit-scene-message').innerHTML = `<div class="message error">更新失败: ${error.error || '未知错误'}</div>`;
        }
    } catch (error) {
        document.getElementById('edit-scene-message').innerHTML = `<div class="message error">更新失败: ${error.message}</div>`;
    }
}

// 取消编辑场景
function cancelEditScene() {
    sceneToEdit = null;
    document.getElementById('edit-scene-modal').classList.remove('active');
    document.getElementById('edit-scene-message').innerHTML = '';
    
    // 重置图片字段
    const previewDiv = document.getElementById('edit-scene-image-preview');
    if (previewDiv) previewDiv.innerHTML = '';
    const imageUrlInput = document.getElementById('edit-scene-image-url');
    if (imageUrlInput) imageUrlInput.value = '';
    const imageUploadInput = document.getElementById('edit-scene-image-upload');
    if (imageUploadInput) imageUploadInput.value = '';
}

// 确认删除场景
function confirmDeleteScene(sceneId, sceneCode, sceneName) {
    sceneToDelete = sceneId;
    document.getElementById('delete-scene-code').textContent = sceneCode;
    document.getElementById('delete-scene-name').textContent = sceneName;
    document.getElementById('delete-scene-modal').classList.add('active');
}

// 取消删除场景
function cancelDeleteScene() {
    sceneToDelete = null;
    document.getElementById('delete-scene-modal').classList.remove('active');
}

// 删除场景
async function deleteScene() {
    if (!sceneToDelete) {
        cancelDeleteScene();
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/scenes/${sceneToDelete}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            showDeleteMessage('场景删除成功！', 'success');
            
            // 从页面移除场景卡片
            const sceneCard = document.getElementById(`scene-card-${sceneToDelete}`);
            if (sceneCard) {
                sceneCard.style.opacity = '0.5';
                sceneCard.style.transform = 'scale(0.95)';
                setTimeout(() => {
                    sceneCard.remove();
                    // 检查是否还有场景，如果没有显示提示
                    const remainingScenes = document.querySelectorAll('.scene-card').length;
                    if (remainingScenes === 0) {
                        document.getElementById('scenes-container').innerHTML = '<div class="message">暂无场景数据，请先创建场景</div>';
                    }
                }, 300);
            }
            
            cancelDeleteScene();
            
        } else {
            const error = await response.text();
            showDeleteMessage('删除失败: ' + (error || '未知错误'), 'error');
            cancelDeleteScene();
        }
    } catch (error) {
        showDeleteMessage('删除失败: ' + error.message, 'error');
        cancelDeleteScene();
    }
}

// 为场景添加标志（跳转到全窗口页面）
function addSignsToScene(sceneId) {
    // 跳转到三栏布局添加标志页面
    window.location.href = `add-signs-three-column.html?sceneId=${sceneId}`;
}

// 加载标志选择器（改进版，显示图片）
async function loadSignsForSelection() {
    const container = document.getElementById('sign-selector-container');
    container.innerHTML = '<div class="loading">加载标志列表...</div>';
    
    try {
        const res = await fetch(`${API_BASE}/signs`);
        const signs = await res.json();
        
        if (signs.length === 0) {
            container.innerHTML = '<div class="message">暂无标志数据，请先添加标志</div>';
            return;
        }
        
        // 按类型分组
        const signsByType = {
            warning: signs.filter(s => s.sign_type === 'warning'),
            prohibition: signs.filter(s => s.sign_type === 'prohibition'),
            instruction: signs.filter(s => s.sign_type === 'instruction'),
            information: signs.filter(s => s.sign_type === 'information')
        };
        
        let html = '';
        
        // 按类型顺序显示：警告→禁止→指令→信息
        const typeOrder = ['warning', 'prohibition', 'instruction', 'information'];
        const typeNames = {
            warning: '🟡 警告标志',
            prohibition: '🔴 禁止标志',
            instruction: '🔵 指令标志',
            information: '🟢 信息标志'
        };
        
        typeOrder.forEach(type => {
            const typeSigns = signsByType[type];
            if (typeSigns.length > 0) {
                html += `<div style="margin-bottom: 15px;">`;
                html += `<div style="font-weight: bold; margin-bottom: 8px; color: #333; font-size: 0.9rem;">${typeNames[type]}</div>`;
                html += '<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: 10px;">';
                
                typeSigns.forEach(sign => {
                    // 如果有图片，显示图片；否则显示占位符
                    const imageUrl = sign.image_url || '';
                    const imageHtml = imageUrl 
                        ? `<img src="${imageUrl}" style="width: 100%; height: 80px; object-fit: contain; border-radius: 6px; background: white; border: 1px solid #e9ecef;">`
                        : `<div style="width: 100%; height: 80px; display: flex; align-items: center; justify-content: center; background: #f8f9fa; border-radius: 6px; border: 1px solid #e9ecef; color: #999; font-size: 0.8rem;">暂无图片</div>`;
                    
                    html += `
                        <div class="sign-card-selectable" data-sign-id="${sign.id}" onclick="toggleSignSelection(${sign.id}, '${sign.sign_code}', '${sign.sign_name.replace(/'/g, "\\'")}', '${imageUrl.replace(/'/g, "\\'")}')">
                            <div style="position: relative;">
                                ${imageHtml}
                                <div style="position: absolute; top: 5px; right: 5px; background: rgba(255,255,255,0.9); border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; font-size: 1rem; color: #28a745; display: none;" id="selected-indicator-${sign.id}">
                                    ✓
                                </div>
                                <button class="add-sign-btn" style="position: absolute; bottom: 5px; right: 5px; background: #007bff; color: white; border: none; border-radius: 4px; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; font-size: 1rem; cursor: pointer;">
                                    +
                                </button>
                            </div>
                            <div style="padding: 5px 0; text-align: center;">
                                <div style="font-size: 0.8rem; font-weight: bold; color: #333;">${sign.sign_code}</div>
                                <div style="font-size: 0.75rem; color: #666; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${sign.sign_name}</div>
                            </div>
                        </div>
                    `;
                });
                
                html += '</div></div>';
            }
        });
        
        container.innerHTML = html;
        
    } catch (error) {
        console.error('加载标志列表失败:', error);
        container.innerHTML = `<div class="message error">加载失败: ${error.message}</div>`;
    }
}

// 获取标志颜色类
function getSignColorClass(type) {
    const colorMap = {
        warning: '#ffc10720',
        prohibition: '#dc354520',
        instruction: '#007bff20',
        notification: '#28a74520'
    };
    return colorMap[type] || '#f8f9fa';
}

// 获取标志类型emoji
function getSignTypeEmoji(type) {
    const emojiMap = {
        warning: '🟡',
        prohibition: '🔴',
        instruction: '🔵',
        notification: '🟢'
    };
    return emojiMap[type] || '🏷️';
}

// 切换标志选择（改进版，支持图片预览）
function toggleSignSelection(signId, signCode, signName, imageUrl) {
    const signCard = document.querySelector(`.sign-card-selectable[data-sign-id="${signId}"]`);
    const selectedIndicator = document.getElementById(`selected-indicator-${signId}`);
    const previewContainer = document.getElementById('sign-preview-container');
    
    if (signCard.classList.contains('selected')) {
        // 取消选择
        signCard.classList.remove('selected');
        selectedIndicator.style.display = 'none';
        
        // 从预览中移除
        const previewItem = document.getElementById(`preview-sign-${signId}`);
        if (previewItem) {
            previewItem.remove();
        }
    } else {
        // 选择标志
        signCard.classList.add('selected');
        selectedIndicator.style.display = 'flex';
        
        // 添加到预览
        const emptyMessage = previewContainer.querySelector('div[style*="text-align: center"]');
        if (emptyMessage) {
            previewContainer.innerHTML = '';
        }
        
        // 创建预览项
        const previewItem = document.createElement('div');
        previewItem.className = 'preview-sign-item';
        previewItem.id = `preview-sign-${signId}`;
        previewItem.style.cssText = `
            position: relative;
            display: inline-block;
            margin: 5px;
            text-align: center;
            max-width: 100px;
        `;
        
        // 图片或占位符
        const imageHtml = imageUrl 
            ? `<img src="${imageUrl}" style="width: 80px; height: 80px; object-fit: contain; border-radius: 6px; background: white; border: 1px solid #e9ecef;">`
            : `<div style="width: 80px; height: 80px; display: flex; align-items: center; justify-content: center; background: #f8f9fa; border-radius: 6px; border: 1px solid #e9ecef; color: #999; font-size: 0.8rem;">无图</div>`;
        
        previewItem.innerHTML = `
            ${imageHtml}
            <div style="font-size: 0.7rem; margin-top: 3px; color: #333; font-weight: bold;">${signCode}</div>
            <div style="font-size: 0.65rem; color: #666; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${signName}</div>
            <button class="remove-preview-btn" onclick="removeSelectedSign(${signId})" style="position: absolute; top: -5px; right: -5px; background: #dc3545; color: white; border: none; border-radius: 50%; width: 20px; height: 20px; font-size: 0.7rem; cursor: pointer; display: flex; align-items: center; justify-content: center;">
                ×
            </button>
        `;
        
        previewContainer.appendChild(previewItem);
    }
    
    // 更新安装信息表单显示
    updateInstallationInfoVisibility();
}

// 移除已选标志（改进版）
function removeSelectedSign(signId) {
    const signCard = document.querySelector(`.sign-card-selectable[data-sign-id="${signId}"]`);
    const selectedIndicator = document.getElementById(`selected-indicator-${signId}`);
    
    if (signCard) {
        signCard.classList.remove('selected');
        selectedIndicator.style.display = 'none';
    }
    
    // 从预览中移除
    const previewItem = document.getElementById(`preview-sign-${signId}`);
    if (previewItem) {
        previewItem.remove();
    }
    
    // 如果没有已选标志，显示空状态
    const previewContainer = document.getElementById('sign-preview-container');
    if (previewContainer.children.length === 0) {
        previewContainer.innerHTML = `
            <div style="text-align: center; color: #6c757d; padding: 60px 0;">
                <div style="font-size: 1.2rem; margin-bottom: 10px;">🖼️</div>
                <div>暂无标志</div>
                <div style="font-size: 0.9rem; margin-top: 5px;">从左侧标志库添加标志</div>
            </div>
        `;
    }
    
    updateInstallationInfoVisibility();
}

// 更新安装信息表单显示
function updateInstallationInfoVisibility() {
    const previewContainer = document.getElementById('sign-preview-container');
    const installationInfoSection = document.getElementById('installation-info-section');
    
    const hasSelectedSigns = previewContainer.children.length > 0 && 
                            !previewContainer.querySelector('div[style*="text-align: center"]');
    
    installationInfoSection.style.display = hasSelectedSigns ? 'block' : 'none';
}

// 按类型筛选标志
function filterSignsByType(type) {
    // 更新按钮状态
    document.querySelectorAll('.sign-type-filter').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`.sign-type-filter[data-type="${type}"]`).classList.add('active');
    
    // 筛选标志
    const signCards = document.querySelectorAll('.sign-card-selectable');
    signCards.forEach(card => {
        if (type === 'all') {
            card.style.display = 'block';
        } else {
            // 这里需要根据标志类型来筛选，暂时先显示所有
            // 实际应该根据标志类型来筛选
            card.style.display = 'block';
        }
    });
}

// 添加已选标志到场景（改进版）
async function addSelectedSignsToScene() {
    const sceneId = document.getElementById('add-signs-modal').dataset.sceneId;
    if (!sceneId) {
        document.getElementById('add-signs-message').innerHTML = '<div class="message error">场景信息错误</div>';
        return;
    }
    
    // 获取已选标志（从预览中获取）
    const previewItems = document.querySelectorAll('.preview-sign-item');
    if (previewItems.length === 0) {
        document.getElementById('add-signs-message').innerHTML = '<div class="message error">请先选择要添加的标志</div>';
        return;
    }
    
    // 获取安装信息
    const installationHeight = document.getElementById('installation-height').value;
    const observationDistance = document.getElementById('observation-distance').value;
    const specialRequirements = document.getElementById('special-requirements').value;
    
    // 验证安装信息
    if (!installationHeight || !observationDistance) {
        document.getElementById('add-signs-message').innerHTML = '<div class="message error">请填写安装高度和观察距离</div>';
        return;
    }
    
    try {
        // 为每个已选标志添加到场景
        const promises = Array.from(previewItems).map(async (item) => {
            const signId = item.id.replace('preview-sign-', '');
            
            const signData = {
                sign_id: parseInt(signId),
                installation_height: parseFloat(installationHeight),
                observation_distance: parseFloat(observationDistance),
                special_requirements: specialRequirements
            };
            
            const res = await fetch(`${API_BASE}/scenes/${sceneId}/signs`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(signData)
            });
            
            return res.ok;
        });
        
        const results = await Promise.all(promises);
        const allSuccess = results.every(result => result === true);
        
        if (allSuccess) {
            document.getElementById('add-signs-message').innerHTML = '<div class="message success">标志添加成功！</div>';
            
            setTimeout(() => {
                cancelAddSigns();
                // 可以在这里刷新场景详情或显示成功消息
                showDeleteMessage('标志已成功添加到场景', 'success');
            }, 1500);
            
        } else {
            document.getElementById('add-signs-message').innerHTML = '<div class="message error">部分标志添加失败</div>';
        }
        
    } catch (error) {
        document.getElementById('add-signs-message').innerHTML = `<div class="message error">添加失败: ${error.message}</div>`;
    }
}

// 取消添加标志
function cancelAddSigns() {
    document.getElementById('add-signs-modal').classList.remove('active');
    document.getElementById('add-signs-message').innerHTML = '';
    
    // 重置表单
    document.getElementById('installation-height').value = '';
    document.getElementById('observation-distance').value = '';
    document.getElementById('special-requirements').value = '';
}

// 页面加载时初始化
document.addEventListener('DOMContentLoaded', async function() {
    loadSigns();
    await initHazardTags();
    
    // 当切换到创建场景页面时，自动生成场景编码
    document.addEventListener('click', function(event) {
        if (event.target && event.target.textContent === '➕ 创建场景') {
            setTimeout(() => {
                generateSceneCode();
            }, 100);
        }
    });
});

// ==================== 场景图片上传功能 ====================

// 处理场景图片选择
function handleSceneImageSelect(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    // 检查文件类型和大小
    if (!file.type.match('image.*')) {
        alert('请选择图片文件（JPG、PNG格式）');
        return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
        alert('图片文件大小不能超过5MB');
        return;
    }
    
    uploadSceneImage(file);
}

// 处理场景图片拖放
function handleSceneImageDrop(event) {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (!file) return;
    
    // 检查文件类型和大小
    if (!file.type.match('image.*')) {
        alert('请选择图片文件（JPG、PNG格式）');
        return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
        alert('图片文件大小不能超过5MB');
        return;
    }
    
    uploadSceneImage(file);
}

// 上传场景图片
async function uploadSceneImage(file) {
    const previewDiv = document.getElementById('scene-image-preview');
    if (!previewDiv) return;
    
    previewDiv.innerHTML = '<div style="color: #666;">上传中...</div>';
    
    const formData = new FormData();
    formData.append('scene_image', file);
    
    try {
        const res = await fetch(`${API_BASE}/uploads`, {
            method: 'POST',
            body: formData
        });
        
        const result = await res.json();
        
        if (result.success) {
            // 显示预览
            previewDiv.innerHTML = `
                <div style="text-align: center;">
                    <img src="${getFullImageUrl(result.image_url)}" 
                         style="max-width: 200px; max-height: 150px; object-fit: contain; border-radius: 8px; border: 1px solid #e0e0e0;">
                    <div style="margin-top: 10px; color: #48bb78;">
                        ✅ 图片上传成功
                        <button onclick="removeSceneImage()" style="margin-left: 10px; background: #fee2e2; color: #991b1b; border: none; padding: 2px 8px; border-radius: 4px; font-size: 0.8rem; cursor: pointer;">移除</button>
                    </div>
                </div>
            `;
            
            // 保存图片URL到隐藏字段
            const imageUrlInput = document.getElementById('scene-image-url');
            if (imageUrlInput) {
                imageUrlInput.value = result.image_url;
            }
        } else {
            previewDiv.innerHTML = `<div style="color: #f56565;">❌ 上传失败: ${result.error || '未知错误'}</div>`;
        }
    } catch (error) {
        previewDiv.innerHTML = `<div style="color: #f56565;">❌ 上传失败: ${error.message}</div>`;
    }
}

// 移除场景图片
function removeSceneImage() {
    const previewDiv = document.getElementById('scene-image-preview');
    if (previewDiv) previewDiv.innerHTML = '';
    
    const imageUrlInput = document.getElementById('scene-image-url');
    if (imageUrlInput) imageUrlInput.value = '';
    
    const imageUploadInput = document.getElementById('scene-image-upload');
    if (imageUploadInput) imageUploadInput.value = '';
}

// ==================== 编辑场景图片上传功能 ====================

// 处理编辑场景图片选择
function handleEditSceneImageSelect(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    // 检查文件类型和大小
    if (!file.type.match('image.*')) {
        alert('请选择图片文件（JPG、PNG格式）');
        return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
        alert('图片文件大小不能超过5MB');
        return;
    }
    
    uploadEditSceneImage(file);
}

// 处理编辑场景图片拖放
function handleEditSceneImageDrop(event) {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (!file) return;
    
    // 检查文件类型和大小
    if (!file.type.match('image.*')) {
        alert('请选择图片文件（JPG、PNG格式）');
        return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
        alert('图片文件大小不能超过5MB');
        return;
    }
    
    uploadEditSceneImage(file);
}

// 上传编辑场景图片
async function uploadEditSceneImage(file) {
    const previewDiv = document.getElementById('edit-scene-image-preview');
    if (!previewDiv) return;
    
    previewDiv.innerHTML = '<div style="color: #666;">上传中...</div>';
    
    const formData = new FormData();
    formData.append('scene_image', file);
    
    try {
        const res = await fetch(`${API_BASE}/uploads`, {
            method: 'POST',
            body: formData
        });
        
        const result = await res.json();
        
        if (result.success) {
            // 显示预览
            previewDiv.innerHTML = `
                <div style="text-align: center;">
                    <img src="${getFullImageUrl(result.image_url)}" 
                         style="max-width: 200px; max-height: 150px; object-fit: contain; border-radius: 8px; border: 1px solid #e0e0e0;">
                    <div style="margin-top: 10px; color: #48bb78;">
                        ✅ 图片上传成功
                        <button onclick="removeEditSceneImage()" style="margin-left: 10px; background: #fee2e2; color: #991b1b; border: none; padding: 2px 8px; border-radius: 4px; font-size: 0.8rem; cursor: pointer;">移除</button>
                    </div>
                </div>
            `;
            
            // 保存图片URL到隐藏字段
            const imageUrlInput = document.getElementById('edit-scene-image-url');
            if (imageUrlInput) {
                imageUrlInput.value = result.image_url;
            }
        } else {
            previewDiv.innerHTML = `<div style="color: #f56565;">❌ 上传失败: ${result.error || '未知错误'}</div>`;
        }
    } catch (error) {
        previewDiv.innerHTML = `<div style="color: #f56565;">❌ 上传失败: ${error.message}</div>`;
    }
}

// 移除编辑场景图片
function removeEditSceneImage() {
    const previewDiv = document.getElementById('edit-scene-image-preview');
    if (previewDiv) previewDiv.innerHTML = '';
    
    const imageUrlInput = document.getElementById('edit-scene-image-url');
    if (imageUrlInput) imageUrlInput.value = '';
    
    const imageUploadInput = document.getElementById('edit-scene-image-upload');
    if (imageUploadInput) imageUploadInput.value = '';
}

// 查看新布局（简洁版）
function viewNewLayout(sceneId) {
    // 在新标签页中打开新布局页面
    const timestamp = new Date().getTime();
    const ngrokUrl = 'https://nonlethally-unnourished-maxine.ngrok-free.dev';
    window.open(`${ngrokUrl}/new-scene-detail-simple.html?id=${sceneId}&_t=${timestamp}`, '_blank');
}

// 按类型排序标志
function sortSignsByType(signs) {
    const typeOrder = {
        'warning': 1,
        'prohibition': 2,
        'instruction': 3,
        'information': 4
    };
    return [...signs].sort((a, b) => {
        return (typeOrder[a.sign_type] || 99) - (typeOrder[b.sign_type] || 99);
    });
}