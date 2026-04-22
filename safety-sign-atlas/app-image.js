// 安全标志图集管理系统 - 带图片上传功能
const API_BASE = '/api';
let selectedImageFile = null;
let allSigns = [];
let allScenes = [];

// 页面切换
function showPage(pageId) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav button').forEach(b => b.classList.remove('active'));
    document.getElementById(pageId).classList.add('active');
    event.target.classList.add('active');
    
    switch(pageId) {
        case 'dashboard': loadStats(); break;
        case 'sign-library': loadSigns(); break;
        case 'scene-list': loadScenes(); break;
    }
}

// 加载统计
async function loadStats() {
    const container = document.getElementById('stats');
    try {
        const [signsRes, scenesRes] = await Promise.all([
            fetch(`${API_BASE}/health`),
            fetch(`${API_BASE}/signs`)
        ]);
        
        const health = await signsRes.json();
        const signs = await scenesRes.json();
        
        let scenes = [];
        try {
            const scenesRes = await fetch(`${API_BASE}/scenes`);
            scenes = await scenesRes.json();
        } catch (e) {}
        
        const typeStats = {
            warning: signs.filter(s => s.sign_type === 'warning').length,
            prohibition: signs.filter(s => s.sign_type === 'prohibition').length,
            instruction: signs.filter(s => s.sign_type === 'instruction').length,
            information: signs.filter(s => s.sign_type === 'information').length
        };
        
        container.innerHTML = `
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-number">${signs.length}</div>
                    <div class="stat-label">标志总数</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">${scenes.length}</div>
                    <div class="stat-label">场景总数</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">${typeStats.warning}</div>
                    <div class="stat-label">警告标志</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">${typeStats.prohibition}</div>
                    <div class="stat-label">禁止标志</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">${typeStats.instruction}</div>
                    <div class="stat-label">指令标志</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">${typeStats.information}</div>
                    <div class="stat-label">提示标志</div>
                </div>
            </div>
            <div style="margin-top: 20px; padding: 15px; background: #f0fff4; border-radius: 8px;">
                <strong>📊 预定义标志示例：</strong><br>
                🟡 W001 - 注意安全 (警告/黄色)<br>
                🟡 W002 - 当心触电 (警告/黄色)<br>
                🔴 P001 - 禁止吸烟 (禁止/红色)<br>
                🔴 P002 - 禁止通行 (禁止/红色)<br>
                🔵 I001 - 必须戴安全帽 (指令/蓝色)<br>
                🔵 I002 - 必须穿防护服 (指令/蓝色)<br>
                🟢 N001 - 紧急出口 (提示/绿色)<br>
                🟢 N002 - 灭火器 (提示/绿色)
            </div>
        `;
    } catch (err) {
        container.innerHTML = `<div class="message error">加载失败: ${err.message}</div>`;
    }
}

// 加载标志
async function loadSigns() {
    const container = document.getElementById('signs-container');
    container.innerHTML = '<div class="loading">加载标志图集...</div>';
    
    try {
        const res = await fetch(`${API_BASE}/signs`);
        allSigns = await res.json();
        
        if (allSigns.length === 0) {
            container.innerHTML = '<div class="message">暂无标志数据</div>';
            return;
        }
        
        // 按类型分组
        const byType = {
            warning: allSigns.filter(s => s.sign_type === 'warning'),
            prohibition: allSigns.filter(s => s.sign_type === 'prohibition'),
            instruction: allSigns.filter(s => s.sign_type === 'instruction'),
            information: allSigns.filter(s => s.sign_type === 'information')
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
        <div class="sign-card">
            ${imageHtml}
            <div style="color: #666; font-size: 0.9rem;">${sign.sign_code}</div>
            <div style="font-weight: bold; margin: 5px 0;">${sign.sign_name}</div>
            <div class="sign-type ${typeClass}">${typeName}</div>
            <div style="font-size: 0.9rem; color: #666; margin-top: 10px;">
                <div>尺寸: ${sign.standard_size}</div>
                <div>材质: ${sign.material}</div>
                ${sign.description ? `<div>描述: ${sign.description}</div>` : ''}
            </div>
        </div>
    `;
}

// 显示添加标志表单
function showAddSignForm() {
    document.getElementById('add-sign-form').style.display = 'block';
    document.getElementById('signs-container').style.display = 'none';
    resetAddSignForm();
}

// 隐藏添加标志表单
function hideAddSignForm() {
    document.getElementById('add-sign-form').style.display = 'none';
    document.getElementById('signs-container').style.display = 'block';
    resetAddSignForm();
}

// 重置添加标志表单
function resetAddSignForm() {
    document.getElementById('sign-code').value = '';
    document.getElementById('sign-name').value = '';
    document.getElementById('sign-type').value = 'warning';
    document.getElementById('standard-size').value = '300x300mm';
    document.getElementById('material').value = '铝板反光';
    document.getElementById('description').value = '';
    removeImage();
    document.getElementById('add-sign-message').innerHTML = '';
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
    const signData = {
        sign_code: document.getElementById('sign-code').value.trim(),
        sign_name: document.getElementById('sign-name').value.trim(),
        sign_type: document.getElementById('sign-type').value,
        color_scheme: getColorScheme(document.getElementById('sign-type').value),
        standard_size: document.getElementById('standard-size').value.trim(),
        material: document.getElementById('material').value.trim(),
        description: document.getElementById('description').value.trim()
    };
    
    // 验证输入
    if (!signData.sign_code || !signData.sign_name) {
        showMessage('请填写标志代码和名称', 'error');
        return;
    }
    
    try {
        // 如果有图片，使用FormData上传
        let response;
        if (selectedImageFile) {
            const formData = new FormData();
            formData.append('sign_code', signData.sign_code);
            formData.append('sign_name', signData.sign_name);
            formData.append('sign_type', signData.sign_type);
            formData.append('color_scheme', signData.color_scheme);
            formData.append('standard_size', signData.standard_size);
            formData.append('material', signData.material);
            formData.append('description', signData.description);
            formData.append('image', selectedImageFile);
            
            response = await fetch(`${API_BASE}/signs/upload`, {
                method: 'POST',
                body: formData
            });
        } else {
            // 没有图片，使用JSON上传
            response = await fetch(`${API_BASE}/signs`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(signData)
            });
        }
        
        if (response.ok) {
            showMessage('标志添加成功！', 'success');
            setTimeout(() => {
                hideAddSignForm();
                loadSigns();
            }, 1500);
        } else {
            const error = await response.json();
            showMessage('添加失败: ' + (error.error || '未知错误'), 'error');
        }
    } catch (error) {
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
        allScenes = await res.json();
        
        if (allScenes.length === 0) {
            container.innerHTML = '<div class="message">暂无场景数据，请先创建场景</div>';
            return;
        }
        
        let html = '<div style="margin-top: 20px;">';
        allScenes.forEach(scene => {
            html += `
                <div class="sign-card" style="margin-bottom: 15px;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <div style="font-weight: bold; font-size: 1.1rem;">${scene.scene_code}</div>
                            <div style="color: #666; margin: 5px 0;">${scene.scene_name}</div>
                        </div>
                        <div>
                            <span style="background: #e9ecef; padding: 3px 8px; border-radius: 12px; font-size: 0.9rem;">
                                ${scene.department}
                            </span>
                        </div>
                    </div>
                    <div style="margin-top: 10px; font-size: 0.9rem; color: #888;">
                        <span>风险等级: ${getRiskLevelText(scene.risk_level)}</span>
                        <span style="margin-left: 15px;">创建时间: ${formatDate(scene.created_at)}</span>
                    </div>
                    ${scene.location_description ? `<div style="margin-top: 10px; color: #666;">位置: ${scene.location_description}</div>` : ''}
                </div>
            `;
        });
        html += '</div>';
        
        container.innerHTML = html;
        
    } catch (error) {
        console.error('加载场景失败:', error);
        container.innerHTML = `<div class="message error">加载失败: ${error.message}</div>`;
    }
}

// 创建场景
async function createScene() {
    const sceneData = {
        scene_code: document.getElementById('scene-code').value.trim(),
        scene_name: document.getElementById('scene-name').value.trim(),
        department: document.getElementById('scene-dept').value.trim(),
        risk_level: document.getElementById('scene-risk').value,
        location_description: document.getElementById('scene-location').value.trim(),
        installation_notes: document.getElementById('scene-notes').value.trim()
    };
    
    // 验证输入
    if (!sceneData.scene_code || !sceneData.scene_name || !sceneData.department) {
        document.getElementById('scene-message').innerHTML = '<div class="message error">请填写场景编码、名称和所属部门</div>';
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
            document.getElementById('scene-code').value = '';
            document.getElementById('scene-name').value = '';
            document.getElementById('scene-dept').value = '';
            document.getElementById('scene-location').value = '';
            document.getElementById('scene-notes').value = '';
            
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

// 辅助函数
function getRiskLevelText(riskLevel) {
    const levels = {
        'low': '低风险',
        'medium': '中风险',
        'high': '高风险',
        'critical': '极高风险'
    };
    return levels[riskLevel] || riskLevel;
}

function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN') + ' ' + date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
}

// 初始化加载
document.addEventListener('DOMContentLoaded', function() {
    loadStats();
    loadSigns();
});