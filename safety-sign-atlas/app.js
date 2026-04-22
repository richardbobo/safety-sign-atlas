// 安全标志图集管理系统 - 应用主文件

let scenes = [];
let currentSceneSigns = [];

// 初始化
document.addEventListener('DOMContentLoaded', function() {
    console.log('系统初始化...');
    initData();
    initNavigation();
    initDashboard();
});

// 数据初始化
function initData() {
    const saved = localStorage.getItem('safetySignScenes');
    if (saved) scenes = JSON.parse(saved);
}

function saveScenes() {
    localStorage.setItem('safetySignScenes', JSON.stringify(scenes));
}

// 页面切换
window.showPage = function(pageId) {
    document.querySelectorAll('.page-section').forEach(p => p.classList.remove('active'));
    const target = document.getElementById(pageId);
    if (target) {
        target.classList.add('active');
        if (pageId === 'dashboard') initDashboard();
        else if (pageId === 'scene-form') loadSceneForm();
        else if (pageId === 'atlas') loadAtlasDisplay();
    }
};

// 导航
function initNavigation() {
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
            this.classList.add('active');
            showPage(this.getAttribute('href').substring(1));
        });
    });
}

// 仪表板
function initDashboard() {
    updateDashboardStats();
    loadRecentScenes();
}

function updateDashboardStats() {
    document.getElementById('total-scenes').textContent = scenes.length;
    let totalSigns = 0;
    scenes.forEach(s => { if (s.signs) totalSigns += s.signs.length; });
    document.getElementById('total-signs').textContent = totalSigns;
}

function loadRecentScenes() {
    const container = document.getElementById('recent-scenes-list');
    if (scenes.length === 0) {
        container.innerHTML = `<div class="empty-state"><i class="fas fa-inbox"></i><p>还没有创建任何场景</p><button class="btn-primary" onclick="showPage('scene-form')"><i class="fas fa-plus"></i> 创建第一个场景</button></div>`;
        return;
    }
    
    let html = '';
    scenes.slice(0, 5).forEach(scene => {
        const signCount = scene.signs ? scene.signs.length : 0;
        html += `<div class="scene-card" onclick="viewScene('${scene.id}')">
            <div class="scene-card-header"><div class="scene-code">${scene.sceneCode || '未设置'}</div><div class="scene-status"><span class="status-badge active">激活</span></div></div>
            <div class="scene-name">${scene.sceneName || '未命名'}</div>
            <div class="scene-desc">${scene.description || '暂无描述'}</div>
            <div class="scene-meta"><span><i class="fas fa-building"></i> ${scene.department || '未指定'}</span><span><i class="fas fa-exclamation-triangle"></i> ${signCount}个标志</span><span><i class="fas fa-calendar"></i> ${scene.createdAt || '未知'}</span></div>
        </div>`;
    });
    container.innerHTML = html;
}

function viewScene(sceneId) {
    const scene = scenes.find(s => s.id === sceneId);
    if (scene) {
        let details = `编码: ${scene.sceneCode}\n名称: ${scene.sceneName}\n部门: ${scene.department}\n描述: ${scene.description}`;
        if (scene.signs && scene.signs.length > 0) {
            details += '\n\n安全标志:';
            scene.signs.forEach((sign, i) => details += `\n${i+1}. ${sign.name} (${sign.size})`);
        }
        alert(details);
    }
}

// 场景表单
function loadSceneForm() {
    document.getElementById('scene-form').innerHTML = `
        <div class="scene-form-container">
            <div class="form-header"><h1><i class="fas fa-plus-circle"></i> 创建安全场景</h1><p class="subtitle">填写以下信息创建新的安全标志标准场景</p></div>
            <form id="sceneCreationForm" onsubmit="handleSceneSubmit(event)">
                <div class="form-section"><h3><i class="fas fa-info-circle"></i> 场景基本信息</h3>
                    <div class="form-row">
                        <div class="form-group"><label>场景编码 *</label><input type="text" class="form-control" name="sceneCode" placeholder="例如: S-01" required></div>
                        <div class="form-group"><label>场景名称 *</label><input type="text" class="form-control" name="sceneName" placeholder="例如: 自动化机器人岛入口" required></div>
                    </div>
                    <div class="form-row">
                        <div class="form-group"><label>所属部门 *</label>
                            <select class="form-control select" name="department" required>
                                <option value="">请选择部门</option><option value="维修">维修</option><option value="工艺">工艺</option><option value="生产">生产</option><option value="其它">其它</option>
                            </select>
                        </div>
                        <div class="form-group"><label>风险等级</label>
                            <select class="form-control select" name="riskLevel">
                                <option value="">请选择风险等级</option><option value="high">高风险</option><option value="medium">中风险</option><option value="low">低风险</option>
                            </select>
                        </div>
                    </div>
                    <div class="form-group"><label>适用区域描述 *</label><textarea class="form-control textarea" name="description" placeholder="详细描述适用区域" rows="3" required></textarea></div>
                </div>
                <div class="form-section"><h3><i class="fas fa-exclamation-triangle"></i> 标志组合配置</h3>
                    <div id="signs-container"><div class="empty-state"><i class="fas fa-images"></i><p>尚未添加任何安全标志</p><button type="button" class="btn-primary" onclick="addSignToScene()"><i class="fas fa-plus"></i> 添加第一个标志</button></div></div>
                </div>
                <div class="form-section"><h3><i class="fas fa-ruler-combined"></i> 技术规格</h3>
                    <div class="form-row">
                        <div class="form-group"><label>材质要求</label><input type="text" class="form-control" name="material" placeholder="例如: 硬质PVC板（3mm厚）"></div>
                        <div class="form-group"><label>安装方式</label><input type="text" class="form-control" name="installationMethod" placeholder="例如: 四角打孔扎带固定"></div>
                    </div>
                    <div class="form-row">
                        <div class="form-group"><label>悬挂高度（米）</label><input type="number" class="form-control" name="heightFromGround" min="1" max="3" step="0.1" value="1.5"></div>
                        <div class="form-group"><label>观察距离（米）</label><input type="number" class="form-control" name="viewingDistance" min="1" max="20" value="3"></div>
                    </div>
                </div>
                <div class="form-section"><h3><i class="fas fa-shopping-cart"></i> 采购信息</h3>
                    <div class="form-row">
                        <div class="form-group"><label>采购代码</label><input type="text" class="form-control" name="partCode" placeholder="例如: S-01-KIT"></div>
                        <div class="form-group"><label>单价（元）</label><input type="number" class="form-control" name="unitPrice" min="0" step="0.01" placeholder="0.00"></div>
                    </div>
                    <div class="form-row">
                        <div class="form-group"><label>供应商</label><input type="text" class="form-control" name="supplier" placeholder="供应商名称"></div>
                        <div class="form-group"><label>交货周期（天）</label><input type="number" class="form-control" name="leadTime" min="1" value="3"></div>
                    </div>
                </div>
                <div class="form-actions">
                    <button type="submit" class="btn-primary"><i class="fas fa-save"></i> 保存场景</button>
                    <button type="button" class="btn-secondary" onclick="showPage('dashboard')"><i class="fas fa-times"></i> 取消</button>
                    <button type="button" class="btn-outline" onclick="previewAtlas()"><i class="fas fa-eye"></i> 预览图集</button>
                </div>
            </form>
        </div>
    `;
    currentSceneSigns = [];
}

// 标志管理
function addSignToScene() {
    const container = document.getElementById('signs-container');
    if (container.querySelector('.empty-state')) container.innerHTML = '';
    
    const signId = 'sign-' + Date.now();
    const signItem = document.createElement('div');
    signItem.className = 'sign-item';
    signItem.id = signId;
    signItem.innerHTML = `
        <div class="sign-item-header">
            <div class="sign-item-title"><span class="sign-item-number">${currentSceneSigns.length + 1}</span><span>安全标志</span></div>
            <button type="button" class="sign-item-remove" onclick="removeSignFromScene('${signId}')"><i class="fas fa-times"></i></button>
        </div>
        <div class="sign-item-content">
            <div class="form-row">
                <div class="form-group"><label>标志类型 *</label>
                    <select class="form-control select sign-type" required>
                        <option value="">选择标志类型</option><option value="warning">警告标志</option><option value="prohibition">禁止标志</option><option value="mandatory">指令标志</option>
                    </select>
                </div>
                <div class="form-group"><label>具体标志 *</label>
                    <select class="form-control select sign-name" required>
                        <option value="">选择具体标志</option><option value="当心机械伤人">当心机械伤人</option><option value="禁止入内">禁止入内</option><option value="必须戴安全帽">必须戴安全帽</option>
                    </select>
                </div>
            </div>
            <div class="form-row">
                <div class="form-group"><label>尺寸规格</label>
                    <select class="form-control select sign-size">
                        <option value="Φ200mm" selected>Φ200mm</option><option value="Φ100mm">Φ100mm</option><option value="Φ300mm">Φ300mm</option>
                    </select>
                </div>
                <div class="form-group"><label>排列顺序</label><input type="number" class="form-control sign-order" min="1" value="${currentSceneSigns.length + 1}" readonly></div>
            </div>
        </div>
    `;
    container.appendChild(signItem);
    currentSceneSigns.push({id: signId, type: '', name: '', size: 'Φ200mm', order: currentSceneSigns.length + 1});
}

function removeSignFromScene(signId) {
    const item = document.getElementById(signId);
    if (item) {
        item.remove();
        currentSceneSigns = currentSceneSigns.filter(s => s.id !== signId);
        updateSignsOrder();
        const container = document.getElementById('signs-container');
        if (container.children.length === 0) {
            container.innerHTML = `<div class="empty-state"><i class="fas fa-images"></i><p>尚未添加任何安全标志</p><button type="button" class="btn-primary" onclick="addSignToScene()"><i class="fas fa-plus"></i> 添加第一个标志</button></div>`;
        }
    }
}

function updateSignsOrder() {
    document.querySelectorAll('.sign-item').forEach((item, index) => {
        const orderInput = item.querySelector('.sign-order');
        const numberSpan = item.querySelector('.sign-item-number');
        if (orderInput) orderInput.value = index + 1;
        if (numberSpan) numberSpan.textContent = index + 1;
    });
}

// 表单提交
function handleSceneSubmit(event) {
    event.preventDefault();
    
    const form = event.target;
    const formData = new FormData(form);
    
    // 验证标志
    const signItems = document.querySelectorAll('.sign-item');
    if (signItems.length === 0) {
        alert('请至少添加一个安全标志！');
        return;
    }
    
    // 收集标志数据
    const signs = [];
    signItems.forEach((item, index) => {
        const typeSelect = item.querySelector('.sign-type');
        const nameSelect = item.querySelector('.sign-name');
        const sizeSelect = item.querySelector('.sign-size');
        
        if (typeSelect && nameSelect && sizeSelect) {
            if (!typeSelect.value || !nameSelect.value) {
                alert(`第${index + 1}个标志的类型和名称必须填写！`);
                throw new Error('标志验证失败');
            }
            signs.push({
                type: typeSelect.value,
                name: nameSelect.value,
                size: sizeSelect.value,
                order: index + 1
            });
        }
    });
    
    // 创建场景数据
    const sceneData = {
        id: 'scene-' + Date.now(),
        sceneCode: formData.get('sceneCode'),
        sceneName: formData.get('sceneName'),
        department: formData.get('department'),
        riskLevel: formData.get('riskLevel'),
        description: formData.get('description'),
        material: formData.get('material'),
        installationMethod: formData.get('installationMethod'),
        heightFromGround: parseFloat(formData.get('heightFromGround')) || 1.5,
        viewingDistance: parseInt(formData.get('viewingDistance')) || 3,
        partCode: formData.get('partCode'),
        unitPrice: parseFloat(formData.get('unitPrice')) || 0,
        supplier: formData.get('supplier'),
        leadTime: parseInt(formData.get('leadTime')) || 3,
        signs: signs,
        createdAt: new Date().toISOString().split('T')[0],
        createdBy: '波仔'
    };
    
    // 保存
    scenes.push(sceneData);
    saveScenes();
    currentSceneSigns = [];
    
    alert(`场景 "${sceneData.sceneName}" 创建成功！\n包含 ${signs.length} 个安全标志`);
    showPage('dashboard');
}

// 图集展示
function loadAtlasDisplay() {
    document.getElementById('atlas').innerHTML = `
        <div class="page-header"><h1><i class="fas fa-book"></i> 图集浏览</h1><p>查看所有标准图集</p></div>
        <div class="empty-state"><i class="fas fa-book-open"></i><p>图集展示功能正在开发中...</p><button class="btn-primary" onclick="showPage('scene-form')"><i class="fas fa-plus"></i> 创建第一个场景</button></div>
    `;
}

// 预览图集
function previewAtlas() {
    alert('图集预览功能正在开发中...');
}