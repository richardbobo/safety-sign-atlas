// 场景创建表单组件

// 当前场景的标志列表
let currentSceneSigns = [];

// 添加标志到场景
function addSignToScene() {
    const container = document.getElementById('signs-container');
    
    // 如果当前是空状态，先清空
    if (container.querySelector('.empty-state')) {
        container.innerHTML = '';
    }
    
    // 创建新的标志项
    const signId = 'sign-' + Date.now();
    const signItem = document.createElement('div');
    signItem.className = 'sign-item';
    signItem.id = signId;
    signItem.innerHTML = `
        <div class="sign-item-header">
            <div class="sign-item-title">
                <span class="sign-item-number">${currentSceneSigns.length + 1}</span>
                <span>安全标志</span>
            </div>
            <button type="button" class="sign-item-remove" onclick="removeSignFromScene('${signId}')">
                <i class="fas fa-times"></i>
            </button>
        </div>
        
        <div class="sign-item-content">
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">标志类型 *</label>
                    <select class="form-control select sign-type" onchange="updateSignColor(this)">
                        <option value="">选择标志类型</option>
                        <option value="warning">警告标志 (黄色)</option>
                        <option value="prohibition">禁止标志 (红色)</option>
                        <option value="mandatory">指令标志 (蓝色)</option>
                        <option value="information">提示标志 (绿色)</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label class="form-label">具体标志 *</label>
                    <select class="form-control select sign-name" onchange="updateSignPreview(this)">
                        <option value="">选择具体标志</option>
                        <option value="当心机械伤人">当心机械伤人</option>
                        <option value="禁止入内">禁止入内</option>
                        <option value="必须戴安全帽">必须戴安全帽</option>
                        <option value="必须穿防护服">必须穿防护服</option>
                        <option value="必须戴护目镜">必须戴护目镜</option>
                        <option value="必须戴护耳器">必须戴护耳器</option>
                        <option value="当心火灾">当心火灾</option>
                        <option value="当心爆炸">当心爆炸</option>
                        <option value="当心中毒">当心中毒</option>
                        <option value="当心触电">当心触电</option>
                    </select>
                </div>
            </div>
            
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">尺寸规格</label>
                    <select class="form-control select sign-size">
                        <option value="">选择尺寸</option>
                        <option value="Φ100mm">Φ100mm (小号)</option>
                        <option value="Φ200mm" selected>Φ200mm (中号)</option>
                        <option value="Φ300mm">Φ300mm (大号)</option>
                        <option value="200×200mm">200×200mm</option>
                        <option value="200×300mm">200×300mm</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label class="form-label">排列顺序</label>
                    <input type="number" class="form-control sign-order" 
                           min="1" value="${currentSceneSigns.length + 1}" readonly>
                </div>
            </div>
            
            <div class="sign-preview" id="preview-${signId}">
                <div class="sign-preview-placeholder">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>选择标志类型和名称后显示预览</p>
                </div>
            </div>
        </div>
    `;
    
    container.appendChild(signItem);
    
    // 添加到当前场景标志列表
    currentSceneSigns.push({
        id: signId,
        type: '',
        name: '',
        size: 'Φ200mm',
        order: currentSceneSigns.length + 1
    });
    
    // 更新所有标志的顺序
    updateSignsOrder();
}

// 从场景中移除标志
function removeSignFromScene(signId) {
    const signItem = document.getElementById(signId);
    if (signItem) {
        signItem.remove();
        
        // 从列表中移除
        currentSceneSigns = currentSceneSigns.filter(sign => sign.id !== signId);
        
        // 更新顺序
        updateSignsOrder();
        
        // 如果没有标志了，显示空状态
        const container = document.getElementById('signs-container');
        if (container.children.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-images"></i>
                    <p>尚未添加任何安全标志</p>
                    <button type="button" class="btn-primary" onclick="addSignToScene()">
                        <i class="fas fa-plus"></i> 添加第一个标志
                    </button>
                </div>
            `;
        }
    }
}

// 更新标志颜色
function updateSignColor(selectElement) {
    const signItem = selectElement.closest('.sign-item');
    const signId = signItem.id;
    const signType = selectElement.value;
    
    // 更新预览
    const preview = document.getElementById(`preview-${signId}`);
    const signNameSelect = signItem.querySelector('.sign-name');
    const signName = signNameSelect.value;
    
    if (signType && signName) {
        updateSignPreviewElement(preview, signType, signName);
    }
    
    // 更新数据
    const signIndex = currentSceneSigns.findIndex(s => s.id === signId);
    if (signIndex !== -1) {
        currentSceneSigns[signIndex].type = signType;
    }
}

// 更新标志预览
function updateSignPreview(selectElement) {
    const signItem = selectElement.closest('.sign-item');
    const signId = signItem.id;
    const signName = selectElement.value;
    const signTypeSelect = signItem.querySelector('.sign-type');
    const signType = signTypeSelect.value;
    
    // 更新预览
    const preview = document.getElementById(`preview-${signId}`);
    
    if (signType && signName) {
        updateSignPreviewElement(preview, signType, signName);
    }
    
    // 更新数据
    const signIndex = currentSceneSigns.findIndex(s => s.id === signId);
    if (signIndex !== -1) {
        currentSceneSigns[signIndex].name = signName;
    }
}

// 更新标志预览元素
function updateSignPreviewElement(preview, type, name) {
    const colors = {
        warning: '#FF9800',
        prohibition: '#FF5252',
        mandatory: '#2196F3',
        information: '#4CAF50'
    };
    
    const icons = {
        warning: 'fa-exclamation-triangle',
        prohibition: 'fa-ban',
        mandatory: 'fa-user-check',
        information: 'fa-info-circle'
    };
    
    const color = colors[type] || '#666';
    const icon = icons[type] || 'fa-question-circle';
    
    preview.innerHTML = `
        <div class="sign-preview-content" style="background: ${color};">
            <i class="fas ${icon}"></i>
            <div class="sign-preview-text">${name}</div>
        </div>
    `;
}

// 更新所有标志的顺序
function updateSignsOrder() {
    const signItems = document.querySelectorAll('.sign-item');
    
    signItems.forEach((item, index) => {
        const orderInput = item.querySelector('.sign-order');
        if (orderInput) {
            orderInput.value = index + 1;
        }
        
        const numberSpan = item.querySelector('.sign-item-number');
        if (numberSpan) {
            numberSpan.textContent = index + 1;
        }
        
        // 更新数据
        const signId = item.id;
        const signIndex = currentSceneSigns.findIndex(s => s.id === signId);
        if (signIndex !== -1) {
            currentSceneSigns[signIndex].order = index + 1;
        }
    });
}

// 预览图集
function previewAtlas() {
    showNotification('图集预览功能正在开发中...', 'info');
}

// 查看场景详情
function viewScene(sceneId) {
    const scene = scenes.find(s => s.id === sceneId);
    if (scene) {
        showNotification(`正在打开场景: ${scene.sceneName}`, 'info');
        // 这里可以跳转到场景详情页面
    }
}

// 工具函数
function getRiskLevelText(level) {
    const levelMap = {
        'high': '高风险',
        'medium': '中风险',
        'low': '低风险'
    };
    return levelMap[level] || '未知';
}

function formatDate(dateString) {
    if (!dateString) return '未知';
    return dateString;
}

// 添加CSS样式
const style = document.createElement('style');
style.textContent = `
    .scene-form-container {
        max-width: 1000px;
        margin: 0 auto;
    }
    
    .form-header {
        text-align: center;
        margin-bottom: 40px;
    }
    
    .form-header h1 {
        color: #1a237e;
        font-size: 28px;
        margin-bottom: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 15px;
    }
    
    .form-hint {
        display: block;
        margin-top: 5px;
        color: #888;
        font-size: 12px;
    }
    
    .form-actions {
        display: flex;
        gap: 15px;
        justify-content: center;
        padding: 30px;
        background: #f8f9fa;
        border-radius: 12px;
        margin-top: 30px;
    }
    
    .btn-secondary {
        background: #6c757d;
        color: white;
        border: none;
        padding: 12px 28px;
        border-radius: 8px;
        font-weight: 600;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        gap: 10px;
        transition: all 0.3s ease;
        font-size: 15px;
    }
    
    .btn-secondary:hover {
        background: #5a6268;
        transform: translateY(-2px);
    }
    
    .btn-outline {
        background: white;
        color: #1a237e;
        border: 2px solid #1a237e;
        padding: 12px 28px;
        border-radius: 8px;
        font-weight: 600;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        gap: 10px;
        transition: all 0.3s ease;
        font-size: 15px;
    }
    
    .btn-outline:hover {
        background: #1a237e;
        color: white;
        transform: translateY(-2px);
    }
    
    /* 标志项样式 */
    .sign-item {
        background: #f8f9fa;
        border-radius: 12px;
        padding: 20px;
        margin-bottom: 20px;
        border: 2px solid #e9ecef;
        transition: border-color 0.3s ease;
    }
    
    .sign-item:hover {
        border-color: #1a237e;
    }
    
    .sign-item-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
        padding-bottom: 15px;
        border-bottom: 1px solid #dee2e6;
    }
    
    .sign-item-title {
        display: flex;
        align-items: center;
        gap: 10px;
        font-weight: 600;
        color: #333;
    }
    
    .sign-item-number {
        background: #1a237e;
        color: white;
        width: 28px;
        height: 28px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 14px;
    }
    
    .sign-item-remove {
        background: #ff6b6b;
        color: white;
        border: none;
        width: 32px;
        height: 32px;
        border-radius: 50%;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: background 0.3s ease;
    }
    
    .sign-item-remove:hover {
        background: #ff5252;
    }
    
    /* 标志预览 */
    .sign-preview {
        margin-top: 20px;
        padding: 20px;
        background: white;
        border-radius: 8px;
        border: 1px solid #e0e0e0;
        min-height: 120px;
        display: flex;
        align-items: center;
        justify-content: center;
    }
    
    .sign-preview-placeholder {
        text-align: center;
        color: #888;
    }
    
    .sign-preview-placeholder i {
        font-size: 36px;
        margin-bottom: 10px;
        color: #ccc;
    }
    
    .sign-preview-content {
        width: 150px;
        height: 150px;
        border-radius: 12px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        color: white;
        text-align: center;
        padding: 20px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }
    
    .sign-preview-content i {
        font-size: 48px;
        margin-bottom: 15px;
    }
    
    .sign-preview-text {
        font-weight: 600;
        font-size: 14px;
        line-height: 1.3;
    }
    
    /* 状态徽章 */
    .status-badge {
        display: inline-block;
        padding: 4px 12px;
        border-radius: 20px;
        font-size: 12px;
        font-weight: 600;
    }
    
    .status-badge.draft {
        background: #ffd54f;
        color: #333;
    }
    
    .status-badge.active {
        background: #4caf50;
        color: white;
    }
    
    .status-badge.archived {
        background: #9e9e9e;
        color: white;
    }
    
    /* 通知样式 */
    .notification {
        background: white;
        border-radius: 8px;
        padding: 15px 20px;
        margin-bottom: 10px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        display: flex;
        justify-content: space-between;
        align-items: center;
        animation: slideIn 0.3s ease;
        border-left: 4px solid #2196F3;
    }
    
    .notification-success {
        border-left-color: #4CAF50;
    }
    
    .notification-error {
        border-left-color: #f44336;
    }
    
    .notification-warning {
        border-left-color: #FF9800;
    }
    
    .notification-content {
        display: flex;
        align-items: center;
        gap: 10px;
    }
    
    .notification-content i {
        font-size: 20px;
    }
    
    .notification-success .notification-content i {
        color: #4CAF50;
    }
    
    .notification-error .notification-content i {
        color: #f44336;
    }
    
    .notification-warning .notification-content i {
        color: #FF9800;
    }
    
    .notification-close {
        background: none;
        border: none;
        color: #888;
        cursor: pointer;
        padding: 5px;
        border-radius: 4px;
        transition: background 0.3s ease;
    }
    
    .notification-close:hover {
        background: #f5f5f5;
    }
    
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
`;
document.head.appendChild(style);