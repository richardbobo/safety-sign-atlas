// 安全标志图集管理系统 - 优化版前端逻辑
const API_BASE_URL = 'http://localhost:8000/api';

// 全局状态
let currentSceneId = null;
let selectedSigns = [];
let allSigns = [];

// 页面切换
function showPage(pageId) {
    // 隐藏所有页面
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    
    // 显示目标页面
    document.getElementById(pageId).classList.add('active');
    
    // 更新导航激活状态
    document.querySelectorAll('.nav-item').forEach(nav => {
        nav.classList.remove('active');
    });
    event.target.classList.add('active');
    
    // 加载页面数据
    switch(pageId) {
        case 'dashboard':
            loadDashboardStats();
            break;
        case 'sign-library':
            loadSignLibrary();
            break;
        case 'scene-list':
            loadSceneList();
            break;
        case 'sign-combination':
            loadSignCombination();
            break;
    }
}

// 加载仪表板统计
async function loadDashboardStats() {
    const container = document.getElementById('stats-container');
    container.innerHTML = '<div class="loading">加载系统统计...</div>';
    
    try {
        const response = await fetch(`${API_BASE_URL}/stats`);
        const stats = await response.json();
        
        let html = `
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-number">${stats.scene_count || 0}</div>
                    <div class="stat-label">场景数量</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">${stats.sign_count || 0}</div>
                    <div class="stat-label">标志数量</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">${stats.sign_types?.count || 0}</div>
                    <div class="stat-label">${getSignTypeName(stats.sign_types?.sign_type)}</div>
                </div>
            </div>
            
            <div style="margin-top: 30px; padding: 20px; background: #f8f9fa; border-radius: 12px;">
                <h3 style="margin-bottom: 15px;">系统功能说明</h3>
                <p style="margin-bottom: 10px;">✅ <strong>优化后的操作流程：</strong></p>
                <ol style="margin-left: 20px; line-height: 1.6;">
                    <li>先在"标志图集管理"中预定义所有安全标志</li>
                    <li>按4种类型分类：警告(黄)、禁止(红)、指令(蓝)、提示(绿)</li>
                    <li>在"创建场景"中建立场景基本信息</li>
                    <li>在"标志组合配置"中从图库选择标志完成组合</li>
                    <li>技术规格（材质/尺寸/安装方式）与设备位置相关，不与场景强绑定</li>
                </ol>
            </div>
        `;
        
        container.innerHTML = html;
    } catch (error) {
        container.innerHTML = `<div class="status-message status-error">加载统计失败: ${error.message}</div>`;
    }
}

// 获取标志类型名称
function getSignTypeName(type) {
    const typeMap = {
        'warning': '警告标志',
        'prohibition': '禁止标志',
        'instruction': '指令标志',
        'information': '提示标志'
    };
    return typeMap[type] || '标志类型';
}

// 加载标志图集
async function loadSignLibrary() {
    const container = document.getElementById('sign-library-container');
    container.innerHTML = '<div class="loading">加载标志图集...</div>';
    
    try {
        const response = await fetch(`${API_BASE_URL}/signs`);
        allSigns = await response.json();
        
        if (allSigns.length === 0) {
            container.innerHTML = '<div class="status-message">暂无标志数据，请先添加标志</div>';
            return;
        }
        
        // 按类型分组
        const signsByType = {
            warning: allSigns.filter(s => s.sign_type === 'warning'),
            prohibition: allSigns.filter(s => s.sign_type === 'prohibition'),
            instruction: allSigns.filter(s => s.sign_type === 'instruction'),
            information: allSigns.filter(s => s.sign_type === 'information')
        };
        
        let html = '';
        
        // 警告标志（黄色）
        if (signsByType.warning.length > 0) {
            html += `<h3 style="margin: 25px 0 15px 0; color: #92400e;">⚠️ 警告标志（黄色）</h3>`;
            html += renderSignGrid(signsByType.warning, 'warning');
        }
        
        // 禁止标志（红色）
        if (signsByType.prohibition.length > 0) {
            html += `<h3 style="margin: 25px 0 15px 0; color: #991b1b;">🚫 禁止标志（红色）</h3>`;
            html += renderSignGrid(signsByType.prohibition, 'prohibition');
        }
        
        // 指令标志（蓝色）
        if (signsByType.instruction.length > 0) {
            html += `<h3 style="margin: 25px 0 15px 0; color: #1e40af;">📋 指令标志（蓝色）</h3>`;
            html += renderSignGrid(signsByType.instruction, 'instruction');
        }
        
        // 提示标志（绿色）
        if (signsByType.information.length > 0) {
            html += `<h3 style="margin: 25px 0 15px 0; color: #065f46;">💡 提示标志（绿色）</h3>`;
            html += renderSignGrid(signsByType.information, 'information');
        }
        
        container.innerHTML = html;
    } catch (error) {
        container.innerHTML = `<div class="status-message status-error">加载标志图集失败: ${error.message}</div>`;
    }
}

// 渲染标志网格
function renderSignGrid(signs, type) {
    const typeClass = `type-${type}`;
    const typeName = getSignTypeName(type);
    
    return `
        <div class="sign-grid">
            ${signs.map(sign => `
                <div class="sign-card" onclick="selectSignForCombination(${sign.id})">
                    <div class="sign-code">${sign.sign_code}</div>
                    <div class="sign-name">${sign.sign_name}</div>
                    <div class="sign-type ${typeClass}">${typeName}</div>
                    <div class="sign-details">
                        <div><strong>尺寸:</strong> ${sign.standard_size}</div>
                        <div><strong>材质:</strong> ${sign.material}</div>
                        ${sign.description ? `<div><strong>描述:</strong> ${sign.description}</div>` : ''}
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

// 显示添加标志表单
function showAddSignForm() {
    document.getElementById('add-sign-form').style.display = 'block';
}

// 隐藏添加标志表单
function hideAddSignForm() {
    document.getElementById('add-sign-form').style.display = 'none';
    // 清空表单
    document.getElementById('sign-code').value = '';
    document.getElementById('sign-name').value = '';
    document.getElementById('sign-type').value = 'warning';
    document.getElementById('standard-size').value = '300x300mm';
    document.getElementById('material').value = '铝板反光';
    document.getElementById('description').value = '';
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
    
    // 验证
    if (!signData.sign_code || !signData.sign_name) {
        alert('请填写标志代码和名称');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/signs`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(signData)
        });
        
        if (response.ok) {
            hideAddSignForm();
            loadSignLibrary();
            showMessage('标志添加成功！', 'success');
        } else {
            const error = await response.json();
            throw new Error(error.error || '添加失败');
        }
    } catch (error) {
        showMessage(`添加失败: ${error.message}`, 'error');
    }
}

// 获取颜色方案
function getColorScheme(type) {
    const schemes = {
        'warning': 'yellow-black',
        'prohibition': 'red-white',
        'instruction': 'blue-white',
        'information': 'green-white'
    };
    return schemes[type] || 'standard';
}

// 创建场景
async function createScene() {
    const sceneData = {
        scene_code: document.getElementById('scene-code').value.trim(),
        scene_name: document.getElementById('scene-name').value.trim(),
        department: document.getElementById('department').value.trim(),
        risk_level: document.getElementById('risk-level').value,
        location_description: document.getElementById('location-description').value.trim(),
        installation_notes: document.getElementById('installation-notes').value.trim()
    };
    
    // 验证
    if (!sceneData.scene_code || !sceneData.scene_name || !sceneData.department) {
        showMessage('请填写场景编码、名称和所属部门', 'error');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/scenes`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(sceneData)
        });
        
        if (response.ok) {
            const result = await response.json();
            showMessage(`场景创建成功！场景ID: ${result.id}`, 'success');
            
            // 清空表单
            document.getElementById('scene-code').value = '';
            document.getElementById('scene-name').value = '';
            document.getElementById('department').value = '';
            document.getElementById('risk-level').value = 'medium';
            document.getElementById('location-description').value = '';
            document.getElementById('installation-notes').value = '';
            
            // 加载场景列表
            loadSceneList();
        } else {
            const error = await response.json();
            throw new Error(error.error || '创建失败');
        }
    } catch (error) {
        showMessage(`创建失败: ${error.message}`, 'error');
    }
}

// 加载场景列表
async function loadSceneList() {
    const container = document.getElementById('scene-list');
    if (!container) return;
    
    // 如果容器不存在，可能是页面还没切换过来
    setTimeout(async () => {
        const sceneListContainer = document.getElementById('scene-list-container');
        if (!sceneListContainer) return;
        
        sceneListContainer.innerHTML = '<div class="loading">加载场景列表...</div>';
        
        try {
            const response = await fetch(`${API_BASE_URL}/scenes`);
            const scenes = await response.json();
            
            if (scenes.length === 0) {
                sceneListContainer.innerHTML = '<div class="status-message">暂无场景数据，请先创建场景</div>';
                return;
            }
            
            let html = `
                <div class="scene-list">
                    ${scenes.map(scene => `
                        <div class="scene-item" onclick="selectSceneForCombination(${scene.id})">
                            <div class="scene-code">${scene.scene_code}</div>
                            <div class="scene-name">${scene.scene_name}</div>
                            <div class="scene-meta">
                                <span>部门: ${scene.department}</span>
                                <span>风险等级: ${getRiskLevelName(scene.risk_level)}</span>
                                <span>创建时间: ${new Date(scene.created_at).toLocaleDateString()}</span>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
            
            sceneListContainer.innerHTML = html;
        } catch (error) {
            sceneListContainer.innerHTML = `<div class="status-message status-error">加载场景列表失败: ${error.message}</div>`;
        }
    }, 100);
}

// 获取风险等级名称
function getRiskLevelName(level) {
    const levelMap = {
        'low': '低风险',
        'medium': '中风险',
        'high': '高风险',
        'critical': '极高风险'
    };
    return levelMap[level] || '未知';
}

// 选择场景进行组合配置
function selectSceneForCombination(sceneId) {
    currentSceneId = sceneId;
    showPage('sign-combination');
    loadSceneDetails(sceneId);
}

// 加载场景详情
async function loadSceneDetails(sceneId) {
    const container = document.getElementById('sign-combination-container');
    if (!container) return;
    
    container.innerHTML = '<div class="loading">加载场景详情...</div>';
    
    try {
        const response = await fetch(`${API_BASE_URL}/scenes/${sceneId}`);
        const scene = await response.json();
        
        // 清空已选标志
        selectedSigns = scene.signs || [];
        
        let html = `
            <div style="margin-bottom: 25px; padding: 20px; background: #f0f9ff; border-radius: 12px; border: 2px solid #93c5fd;">
                <h3 style="margin-bottom: 10px; color: #1e40af;">当前场景: ${scene.scene_name}</h3>
                <div style="color: #4b5563;">
                    <div><strong>场景编码:</strong> ${scene.scene_code}</div>
                    <div><strong>所属部门:</strong> ${scene.department}</div>
                    <div><strong>风险等级:</strong> ${getRiskLevelName(scene.risk_level)}</div>
                    ${scene.location_description ? `<div><strong>位置描述:</strong> ${scene.location_description}</div>` : ''}
                </div>
            </div>
            
            <h3 style="margin: 25px 0 15px 0;">步骤1: 从标志图库选择标志</h3>
            <p>点击下方的标志卡片将其添加到组合中，系统会自动按类型排序：警告 → 禁止 → 指令 → 提示</p>
            
            <div id="sign-selection-grid" class="loading">
                加载标志选择器...
            </div>
            
            <div class="selected-signs">
                <h3 style="margin-bottom: 15px;">步骤2: 已选择的标志组合</h3>
                ${renderSelectedSigns()}
            </div>
            
            <div style="margin-top: 30px;">
                <button class="btn btn-success" onclick="saveSignCombination()">保存标志组合</button>
                <button class="btn" onclick="clearSelectedSigns()" style="margin-left: 10px;">清空选择</button>
            </div>
        `;
        
        container.innerHTML = html;
        
        // 加载标志选择器
        loadSignSelectionGrid();
    } catch (error) {
        container.innerHTML = `<div class="status-message status-error">加载场景详情失败: ${error.message}</div>`;
    }
}

// 加载标志选择器网格
async function loadSignSelectionGrid() {
    const container = document.getElementById('sign-selection-grid');
    if (!container) return;
    
    try {
        const response = await fetch(`${API_BASE_URL}/signs`);
        const signs = await response.json();
        
        // 按类型分组
        const signsByType = {
            warning: signs.filter(s => s.sign_type === 'warning'),
            prohibition: signs.filter(s => s.sign_type === 'prohibition'),
            instruction: signs.filter(s => s.sign_type === 'instruction'),
            information: signs.filter(s => s.sign_type === 'information')
        };
        
        let html = '';
        
        // 警告标志（黄色）
        if (signsByType.warning.length > 0) {
            html += `<h4 style="margin: 20px 0 10px 0; color: #92400e;">⚠️ 警告标志（黄色）</h4>`;
            html += renderSignSelectionGrid(signsByType.warning, 'warning');
        }
        
        // 禁止标志（红色）
        if (signsByType.prohibition.length > 0) {
            html += `<h4 style="margin: 20px 0 10px 0; color: #991b1b;">🚫 禁止标志（红色）</h4>`;
            html += renderSignSelectionGrid(signsByType.prohibition, 'prohibition');
        }
        
        // 指令标志（蓝色）
        if (signsByType.instruction.length > 0) {
            html += `<h4 style="margin: 20px 0 10px 0; color: #1e40af;">📋 指令标志（蓝色）</h4>`;
            html += renderSignSelectionGrid(signsByType.instruction, 'instruction');
        }
        
        // 提示标志（绿色）
        if (signsByType.information.length > 0) {
            html += `<h4 style="margin: 20px 0 10px 0; color: #065f46;">💡 提示标志（绿色）</h4>`;
            html += renderSignSelectionGrid(signsByType.information, 'information');
        }
        
        container.innerHTML = html;
    } catch (error) {
        container.innerHTML = `<div class="status-message status-error">加载标志选择器失败: ${error.message}</div>`;
    }
}

// 渲染标志