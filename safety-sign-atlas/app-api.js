// 安全标志图集管理系统 - 使用后端API版本

const API_BASE_URL = 'http://localhost:8000/api';

// API服务
const ApiService = {
    // 场景相关
    scenes: {
        getAll: async (filters = {}) => {
            const queryParams = new URLSearchParams();
            if (filters.department) queryParams.append('department', filters.department);
            if (filters.status) queryParams.append('status', filters.status);
            if (filters.search) queryParams.append('search', filters.search);
            
            const url = `${API_BASE_URL}/scenes${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
            const response = await fetch(url);
            if (!response.ok) throw new Error('获取场景列表失败');
            return await response.json();
        },
        
        getById: async (id) => {
            const response = await fetch(`${API_BASE_URL}/scenes/${id}`);
            if (!response.ok) throw new Error('获取场景失败');
            return await response.json();
        },
        
        create: async (sceneData) => {
            const response = await fetch(`${API_BASE_URL}/scenes`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(sceneData)
            });
            if (!response.ok) throw new Error('创建场景失败');
            return await response.json();
        },
        
        update: async (id, updateData) => {
            const response = await fetch(`${API_BASE_URL}/scenes/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updateData)
            });
            if (!response.ok) throw new Error('更新场景失败');
            return await response.json();
        },
        
        delete: async (id) => {
            const response = await fetch(`${API_BASE_URL}/scenes/${id}`, {
                method: 'DELETE'
            });
            if (!response.ok) throw new Error('删除场景失败');
            return await response.json();
        },
        
        getStats: async () => {
            const response = await fetch(`${API_BASE_URL}/scenes/stats`);
            if (!response.ok) throw new Error('获取统计失败');
            return await response.json();
        }
    },
    
    // 图片相关
    images: {
        upload: async (sceneId, file, imageType = 'scene_photo', description = '') => {
            const formData = new FormData();
            formData.append('image', file);
            formData.append('image_type', imageType);
            formData.append('description', description);
            
            const response = await fetch(`${API_BASE_URL}/scenes/${sceneId}/images`, {
                method: 'POST',
                body: formData
            });
            if (!response.ok) throw new Error('上传图片失败');
            return await response.json();
        },
        
        getBySceneId: async (sceneId, imageType = null) => {
            const url = `${API_BASE_URL}/scenes/${sceneId}/images${imageType ? '?type=' + imageType : ''}`;
            const response = await fetch(url);
            if (!response.ok) throw new Error('获取图片失败');
            return await response.json();
        },
        
        delete: async (imageId) => {
            const response = await fetch(`${API_BASE_URL}/images/${imageId}`, {
                method: 'DELETE'
            });
            if (!response.ok) throw new Error('删除图片失败');
            return await response.json();
        }
    },
    
    // 安全标志相关
    signs: {
        addToScene: async (sceneId, signData) => {
            const response = await fetch(`${API_BASE_URL}/scenes/${sceneId}/signs`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(signData)
            });
            if (!response.ok) throw new Error('添加标志失败');
            return await response.json();
        },
        
        update: async (signId, updateData) => {
            const response = await fetch(`${API_BASE_URL}/signs/${signId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updateData)
            });
            if (!response.ok) throw new Error('更新标志失败');
            return await response.json();
        },
        
        delete: async (signId) => {
            const response = await fetch(`${API_BASE_URL}/signs/${signId}`, {
                method: 'DELETE'
            });
            if (!response.ok) throw new Error('删除标志失败');
            return await response.json();
        }
    },
    
    // 健康检查
    health: async () => {
        const response = await fetch(`${API_BASE_URL}/health`);
        return response.ok;
    }
};

// 应用状态
let currentUser = '波仔';
let currentSceneSigns = [];
let editingSceneId = null;

// DOM加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    console.log('安全标志图集管理系统初始化...');
    
    // 检查API连接
    checkApiConnection();
    
    // 初始化导航
    initNavigation();
    
    // 初始化仪表板
    initDashboard();
});

// 检查API连接
async function checkApiConnection() {
    try {
        const isHealthy = await ApiService.health();
        if (!isHealthy) {
            showNotification('后端API连接失败，请确保服务器正在运行', 'error');
        }
    } catch (error) {
        console.error('API连接检查失败:', error);
        showNotification('无法连接到后端服务器', 'error');
    }
}

// 页面切换函数
window.showPage = function(pageId, params = {}) {
    console.log(`切换到页面: ${pageId}`, params);
    
    // 隐藏所有页面
    document.querySelectorAll('.page-section').forEach(p => p.classList.remove('active'));
    
    // 显示目标页面
    const targetPage = document.getElementById(pageId);
    if (targetPage) {
        targetPage.classList.add('active');
        
        // 加载页面内容
        if (pageId === 'dashboard') {
            initDashboard();
        } else if (pageId === 'scene-form') {
            if (params.sceneId) {
                loadSceneForEdit(params.sceneId);
            } else {
                loadSceneForm();
            }
        } else if (pageId === 'scene-list') {
            loadSceneList();
        } else if (pageId === 'scene-detail') {
            if (params.sceneId) {
                loadSceneDetail(params.sceneId);
            }
        }
    }
};

// 初始化导航
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

// 初始化仪表板
async function initDashboard() {
    console.log('初始化仪表板...');
    
    try {
        // 更新统计数据
        const stats = await ApiService.scenes.getStats();
        updateDashboardStats(stats);
        
        // 加载最近场景
        await loadRecentScenes();
        
        showNotification('仪表板加载完成', 'success');
    } catch (error) {
        console.error('初始化仪表板失败:', error);
        showNotification('加载仪表板数据失败', 'error');
    }
}

// 更新仪表板统计数据
function updateDashboardStats(stats) {
    document.getElementById('total-scenes').textContent = stats.totalScenes || 0;
    
    // 计算总标志数（需要从所有场景中统计）
    // 这里简化处理，实际应该从数据库统计
    document.getElementById('total-signs').textContent = '--';
}

// 加载最近场景
async function loadRecentScenes() {
    const container = document.getElementById('recent-scenes-list');
    
    try {
        const scenes = await ApiService.scenes.getAll({ limit: 5 });
        
        if (scenes.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-inbox"></i>
                    <p>还没有创建任何场景</p>
                    <button class="btn-primary" onclick="showPage('scene-form')">
                        <i class="fas fa-plus"></i> 创建第一个场景
                    </button>
                </div>
            `;
            return;
        }
        
        let html = '';
        
        scenes.forEach(scene => {
            const signCount = scene.signs ? scene.signs.length : 0;
            
            html += `
                <div class="scene-card">
                    <div class="scene-card-header">
                        <div class="scene-code">${scene.scene_code || '未设置'}</div>
                        <div class="scene-actions">
                            <button class="btn-icon" onclick="editScene(${scene.id})" title="编辑">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn-icon btn-danger" onclick="deleteScene(${scene.id})" title="删除">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                    <div class="scene-name">${scene.scene_name || '未命名'}</div>
                    <div class="scene-desc">${scene.description || '暂无描述'}</div>
                    <div class="scene-meta">
                        <span><i class="fas fa-building"></i> ${scene.department || '未指定'}</span>
                        <span><i class="fas fa-exclamation-triangle"></i> ${signCount}个标志</span>
                        <span><i class="fas fa-calendar"></i> ${formatDate(scene.created_at)}</span>
                    </div>
                    <div class="scene-card-footer">
                        <button class="btn-outline" onclick="viewSceneDetail(${scene.id})">
                            <i class="fas fa-eye"></i> 查看详情
                        </button>
                    </div>
                </div>
            `;
        });
        
        container.innerHTML = html;
    } catch (error) {
        console.error('加载最近场景失败:', error);
        container.innerHTML = `
            <div class="empty-state error">
                <i class="fas fa-exclamation-circle"></i>
                <p>加载场景列表失败</p>
                <button class="btn-primary" onclick="initDashboard()">
                    <i class="fas fa-redo"></i> 重试
                </button>
            </div>
        `;
    }
}

// 查看场景详情
function viewSceneDetail(sceneId) {
    showPage('scene-detail', { sceneId });
}

// 编辑场景
function editScene(sceneId) {
    showPage('scene-form', { sceneId });
}

// 删除场景
async function deleteScene(sceneId) {
    if (!confirm('确定要删除这个场景吗？此操作不可恢复。')) {
        return;
    }
    
    try {
        showLoading('正在删除场景...');
        await ApiService.scenes.delete(sceneId);
        showNotification('场景删除成功', 'success');
        initDashboard(); // 刷新列表
    } catch (error) {
        console.error('删除场景失败:', error);
        showNotification('删除场景失败: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
}

// 加载场景列表页面
async function loadSceneList() {
    const container = document.getElementById('scene-list');
    
    try {
        showLoading('正在加载场景列表...');
        const scenes = await ApiService.scenes.getAll();
        
        let html = `
            <div class="page-header">
                <h1><i class="fas fa-list"></i> 所有场景</h1>
                <p>共 ${scenes.length} 个安全场景</p>
            </div>
            
            <div class="scene-list-controls">
                <div class="search-box">
                    <input type="text" id="scene-search" placeholder="搜索场景编码、名称或描述...">
                    <button class="btn-icon" onclick="searchScenes()">
                        <i class="fas fa-search"></i>
                    </button>
                </div>
                <div class="filter-controls">
                    <select id="department-filter" onchange="filterScenes()">
                        <option value="">所有部门</option>
                        <option value="维修">维修</option>
                        <option value="工艺">工艺</option>
                        <option value="生产">生产</option>
                        <option value="其它">其它</option>
                    </select>
                </div>
            </div>
            
            <div class="scene-list-container" id="scene-list-container">
        `;
        
        if (scenes.length === 0) {
            html += `
                <div class="empty-state">
                    <i class="fas fa-inbox"></i>
                    <p>还没有创建任何场景</p>
                    <button class="btn-primary" onclick="showPage('scene-form')">
                        <i class="fas fa-plus"></i> 创建第一个场景
                    </button>
                </div>
            `;
        } else {
            scenes.forEach(scene => {
                const signCount = scene.signs ? scene.signs.length : 0;
                const imageCount = scene.images ? scene.images.length : 0;
                
                html += `
                    <div class="scene-list-item">
                        <div class="scene-list-header">
                            <div class="scene-code">${scene.scene_code}</div>
                            <div class="scene-status">
                                <span class="status-badge ${scene.status || 'active'}">${scene.status || '激活'}</span>
                            </div>
                        </div>
                        <div class="scene-list-content">
                            <h3 class="scene-name">${scene.scene_name}</h3>
                            <p class="scene-desc">${scene.description || '暂无描述'}</p>
                            <div class="scene-meta">
                                <span><i class="fas fa-building"></i> ${scene.department}</span>
                                <span><i class="fas fa-exclamation-triangle"></i> ${signCount}个标志</span>
                                <span><i class="fas fa-image"></i> ${imageCount}张图片</span>
                                <span><i class="fas fa-calendar"></i> ${formatDate(scene.created_at)}</span>
                            </div>
                        </div>
                        <div class="scene-list-actions">
                            <button class="btn-outline" onclick="viewSceneDetail(${scene.id})">
                                <i class="fas fa-eye"></i> 查看
                            </button>
                            <button class="btn-outline" onclick="editScene(${scene.id})">
                                <i class="fas fa-edit"></i> 编辑
                            </button>
                            <button class="btn-outline btn-danger" onclick="deleteScene(${scene.id})">
                                <i class="fas fa-trash"></i> 删除
                            </button>
                        </div>
                    </div>
                `;
            });
        }
        
        html += '</div>';
        container.innerHTML = html;
        
    } catch (error) {
        console.error('加载场景列表失败:', error);
        container.innerHTML = `
            <div class="empty-state error">
                <i class="fas fa-exclamation-circle"></i>
                <p>加载场景列表失败: ${error.message}</p>
                <button class="btn-primary" onclick="loadSceneList()">
                    <i class="fas fa-redo"></i> 重试
                </button>
            </div>
        `;
    } finally {
        hideLoading();
    }
}

// 搜索场景
async function searchScenes() {
    const searchInput = document.getElementById('scene-search');
    const searchTerm = searchInput.value.trim();
    
    // 这里实现搜索逻辑
    console.log('搜索:', searchTerm);
}

// 过滤场景
async function filterScenes() {
    const departmentFilter = document.getElementById('department-filter');
    const department = departmentFilter.value;
    
    // 这里实现过滤逻辑
    console.log('过滤部门:', department);
}

// 加载场景详情页面
async function loadSceneDetail(sceneId) {
    const container = document.getElementById('scene-detail');
    
    try {
        showLoading('正在加载场景详情...');
        const scene = await ApiService.scenes.getById(sceneId);
        
        let html = `
            <div class="page-header">
                <h1><i class="fas fa-info-circle"></i> 场景详情</h1>
                <p>${scene.scene_code} - ${scene.scene_name}</p>
            </div>
            
            <div class="scene-detail-container">
                <div class="scene-detail-actions">
                    <button class="btn-primary" onclick="editScene(${scene.id})">
                        <i class="fas fa-edit"></i> 编辑场景
                    </button>
                    <button class="btn-secondary" onclick="showPage('dashboard')">
                        <i class="fas fa-arrow-left"></i> 返回
                    </button>
                </div>
                
                <div class="scene-detail-content">
                    <div class="detail-section">
                        <h3><i class="fas fa-info-circle"></i> 基本信息</h3>
                        <div class="detail-grid">
                            <div class="detail-item">
                                <label>场景编码</label>
                                <div class="detail-value">${scene.scene_code}</div>
                            </div>
                            <div class="detail-item">
                                <label>场景名称</label>
                                <div class="detail-value">${scene.scene_name}</div>
                            </div>
                            <div class="detail-item">
                                <label>所属部门</label>
                                <div class="detail-value">${scene.department}</div>
                            </div>
                            <div class="detail-item">
                                <label>风险等级</label>
                                <div class="detail-value">${scene.risk_level || '未设置'}</div>
                            </div>
                            <div class="detail-item full-width">
                                <label>适用区域描述</label>
                                <div class="detail-value">${scene.description || '暂无描述'}</div>
                            </div>
                        </div>
                    </div>
        `;
