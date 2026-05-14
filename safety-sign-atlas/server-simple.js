// 简化的安全标志图集服务器 - 使用JSON文件代替SQLite
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const multer = require('multer');

const app = express();
const PORT = 3000;

// 配置文件上传
const uploadStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path.join(__dirname, 'uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, uniqueSuffix + ext);
    }
});
const upload = multer({ storage: uploadStorage });

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.static('.'));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 数据文件路径
const DATA_DIR = path.join(__dirname, 'data');
const SCENES_FILE = path.join(DATA_DIR, 'scenes.json');
const SIGNS_FILE = path.join(DATA_DIR, 'signs.json');

// 确保数据目录存在
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

// 初始化数据文件
function initializeDataFiles() {
    if (!fs.existsSync(SCENES_FILE)) {
        fs.writeFileSync(SCENES_FILE, JSON.stringify([], null, 2));
    }
    if (!fs.existsSync(SIGNS_FILE)) {
        // 添加一些示例安全标志
        const sampleSigns = [
            {
                id: 1,
                sign_code: "S001",
                sign_name: "禁止吸烟",
                sign_type: "prohibition",
                color_scheme: "红圈红斜杠，白底黑图",
                standard_size: "300x300mm",
                material: "铝板反光",
                description: "表示禁止吸烟",
                image_url: "/images/no-smoking.png"
            },
            {
                id: 2,
                sign_code: "S002",
                sign_name: "注意安全",
                sign_type: "warning",
                color_scheme: "黄底黑边黑图",
                standard_size: "300x300mm",
                material: "铝板反光",
                description: "表示注意安全，小心危险",
                image_url: "/images/warning.png"
            },
            {
                id: 3,
                sign_code: "S003",
                sign_name: "必须戴安全帽",
                sign_type: "instruction",
                color_scheme: "蓝底白图",
                standard_size: "300x300mm",
                material: "铝板反光",
                description: "表示必须戴安全帽",
                image_url: "/images/helmet.png"
            },
            {
                id: 4,
                sign_code: "S004",
                sign_name: "紧急出口",
                sign_type: "information",
                color_scheme: "绿底白图",
                standard_size: "400x200mm",
                material: "铝板反光",
                description: "表示紧急出口位置",
                image_url: "/images/exit.png"
            }
        ];
        fs.writeFileSync(SIGNS_FILE, JSON.stringify(sampleSigns, null, 2));
    }
}

// 读取数据
function readScenes() {
    try {
        const data = fs.readFileSync(SCENES_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('读取场景数据失败:', error);
        return [];
    }
}

function readSigns() {
    try {
        const data = fs.readFileSync(SIGNS_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('读取标志数据失败:', error);
        return [];
    }
}

// 写入数据
function writeScenes(scenes) {
    try {
        fs.writeFileSync(SCENES_FILE, JSON.stringify(scenes, null, 2));
        return true;
    } catch (error) {
        console.error('写入场景数据失败:', error);
        return false;
    }
}

function writeSigns(signs) {
    try {
        fs.writeFileSync(SIGNS_FILE, JSON.stringify(signs, null, 2));
        return true;
    } catch (error) {
        console.error('写入标志数据失败:', error);
        return false;
    }
}

// 初始化数据
initializeDataFiles();

// ==================== API 路由 ====================

// 获取所有场景
app.get('/api/scenes', (req, res) => {
    const scenes = readScenes();
    res.json(scenes);
});

// 获取单个场景
app.get('/api/scenes/:id', (req, res) => {
    const scenes = readScenes();
    const scene = scenes.find(s => s.id === parseInt(req.params.id));
    if (scene) {
        // 获取关联的标志
        const sceneSigns = readSceneSigns();
        const signs = readSigns();
        const relations = sceneSigns.filter(r => r.scene_id === parseInt(req.params.id));
        const relatedSigns = relations.map(r => {
            const sign = signs.find(s => s.id === r.sign_id);
            return sign ? { ...sign, ...r } : null;
        }).filter(Boolean);
        
        res.json({ ...scene, signs: relatedSigns });
    } else {
        res.status(404).json({ success: false, error: '场景不存在' });
    }
});

// 创建场景
app.post('/api/scenes', (req, res) => {
    const scenes = readScenes();
    const newScene = {
        id: scenes.length > 0 ? Math.max(...scenes.map(s => s.id)) + 1 : 1,
        ...req.body,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    };
    
    scenes.push(newScene);
    if (writeScenes(scenes)) {
        res.json({ success: true, data: newScene });
    } else {
        res.status(500).json({ success: false, error: '保存失败' });
    }
});

// 更新场景
app.put('/api/scenes/:id', (req, res) => {
    const scenes = readScenes();
    const index = scenes.findIndex(s => s.id === parseInt(req.params.id));
    
    if (index !== -1) {
        scenes[index] = {
            ...scenes[index],
            ...req.body,
            updated_at: new Date().toISOString()
        };
        
        if (writeScenes(scenes)) {
            res.json({ success: true, data: scenes[index] });
        } else {
            res.status(500).json({ success: false, error: '更新失败' });
        }
    } else {
        res.status(404).json({ success: false, error: '场景不存在' });
    }
});

// 删除场景
app.delete('/api/scenes/:id', (req, res) => {
    const scenes = readScenes();
    const filteredScenes = scenes.filter(s => s.id !== parseInt(req.params.id));
    
    if (filteredScenes.length < scenes.length) {
        if (writeScenes(filteredScenes)) {
            res.json({ success: true, message: '删除成功' });
        } else {
            res.status(500).json({ success: false, error: '删除失败' });
        }
    } else {
        res.status(404).json({ success: false, error: '场景不存在' });
    }
});

// 获取所有安全标志
app.get('/api/signs', (req, res) => {
    const signs = readSigns();
    res.json(signs);
});

// 获取单个标志
app.get('/api/signs/:id', (req, res) => {
    const signs = readSigns();
    const sign = signs.find(s => s.id === parseInt(req.params.id));
    if (sign) {
        res.json(sign);
    } else {
        res.status(404).json({ success: false, error: '标志不存在' });
    }
});

// 创建标志
app.post('/api/signs', (req, res) => {
    const signs = readSigns();
    const newSign = {
        id: signs.length > 0 ? Math.max(...signs.map(s => s.id)) + 1 : 1,
        ...req.body,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    };
    
    signs.push(newSign);
    if (writeSigns(signs)) {
        res.json({ success: true, data: newSign });
    } else {
        res.status(500).json({ success: false, error: '保存失败' });
    }
});

// 更新标志
app.put('/api/signs/:id', (req, res) => {
    const signs = readSigns();
    const index = signs.findIndex(s => s.id === parseInt(req.params.id));
    
    if (index !== -1) {
        signs[index] = {
            ...signs[index],
            ...req.body,
            updated_at: new Date().toISOString()
        };
        
        if (writeSigns(signs)) {
            res.json({ success: true, data: signs[index] });
        } else {
            res.status(500).json({ success: false, error: '更新失败' });
        }
    } else {
        res.status(404).json({ success: false, error: '标志不存在' });
    }
});

// 删除标志
app.delete('/api/signs/:id', (req, res) => {
    const signs = readSigns();
    const filteredSigns = signs.filter(s => s.id !== parseInt(req.params.id));
    
    if (filteredSigns.length < signs.length) {
        if (writeSigns(filteredSigns)) {
            res.json({ success: true, message: '删除成功' });
        } else {
            res.status(500).json({ success: false, error: '删除失败' });
        }
    } else {
        res.status(404).json({ success: false, error: '标志不存在' });
    }
});

// 场景-标志关联数据文件
const SCENE_SIGNS_FILE = path.join(DATA_DIR, 'scene_signs.json');

function readSceneSigns() {
    try {
        console.log('readSceneSigns path:', SCENE_SIGNS_FILE);
        const data = fs.readFileSync(SCENE_SIGNS_FILE, 'utf8');
        console.log('readSceneSigns data length:', data.length);
        return JSON.parse(data);
    } catch (e) { console.error('readSceneSigns error:', e.message); return []; }
}
function writeSceneSigns(data) {
    fs.writeFileSync(SCENE_SIGNS_FILE, JSON.stringify(data, null, 2));
}

// 获取场景关联的标志
app.get('/api/scenes/:id/signs', (req, res) => {
    const sceneSigns = readSceneSigns();
    const signs = readSigns();
    const relations = sceneSigns.filter(r => r.scene_id === parseInt(req.params.id));
    const result = relations.map(r => {
        const sign = signs.find(s => s.id === r.sign_id);
        return sign ? { ...sign, ...r } : null;
    }).filter(Boolean);
    res.json(result);
});

// 向场景添加标志
app.post('/api/scenes/:id/signs', (req, res) => {
    const sceneSigns = readSceneSigns();
    const newRelation = {
        id: sceneSigns.length > 0 ? Math.max(...sceneSigns.map(s => s.id)) + 1 : 1,
        scene_id: parseInt(req.params.id),
        sign_id: req.body.sign_id,
        installation_height: req.body.installation_height || 1.5,
        observation_distance: req.body.observation_distance || 3,
        special_requirements: req.body.special_requirements || '',
        added_at: new Date().toISOString()
    };
    sceneSigns.push(newRelation);
    writeSceneSigns(sceneSigns);
    res.json({ success: true, data: newRelation });
});

// 上传标志（含图片）
app.post('/api/signs/upload', upload.single('image'), (req, res) => {
    const signs = readSigns();
    const newSign = {
        id: signs.length > 0 ? Math.max(...signs.map(s => s.id)) + 1 : 1,
        sign_code: req.body.sign_code || '',
        sign_name: req.body.sign_name || '',
        sign_type: req.body.sign_type || 'warning',
        color_scheme: req.body.color_scheme || '',
        standard_size: req.body.standard_size || '',
        material: req.body.material || '',
        description: req.body.description || '',
        is_ppe: req.body.is_ppe ? parseInt(req.body.is_ppe) : 0,
        image_url: req.file ? '/uploads/' + req.file.filename : '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    };

    signs.push(newSign);
    if (writeSigns(signs)) {
        res.json({ success: true, data: newSign });
    } else {
        res.status(500).json({ success: false, error: '保存失败' });
    }
});

// 批量上传安全标志
app.post('/api/signs/batch-upload', upload.array('images', 20), (req, res) => {
    const signs = readSigns();
    const newSigns = [];
    let nextId = signs.length > 0 ? Math.max(...signs.map(s => s.id)) + 1 : 1;
    
    const signType = req.body.sign_type || 'warning';
    const colorScheme = req.body.color_scheme || getColorScheme(signType);
    const standardSize = req.body.standard_size || '300x300mm';
    const material = req.body.material || '铝板反光';
    const description = req.body.description || '';
    const isPpe = req.body.is_ppe || '0';
    
    // 支持 sign_names 以逗号分隔传入
    const signNames = req.body.sign_names ? req.body.sign_names.split(',') : [];
    
    if (!req.files || req.files.length === 0) {
        return res.status(400).json({ success: false, error: '未收到图片文件' });
    }
    
    req.files.forEach((file, index) => {
        const fileName = file.originalname;
        const nameWithoutExt = fileName.substring(0, fileName.lastIndexOf('.')) || fileName;
        const signName = signNames[index] || nameWithoutExt;
        
        const typePrefix = { warning: 'W', prohibition: 'P', instruction: 'I', information: 'N' }[signType] || 'X';
        const timestamp = Date.now().toString(36).toUpperCase();
        const randomStr = Math.random().toString(36).substring(2, 5).toUpperCase();
        const signCode = `${typePrefix}${timestamp}-${randomStr}`;
        
        const newSign = {
            id: nextId++,
            sign_code: signCode,
            sign_name: signName,
            sign_type: signType,
            color_scheme: colorScheme,
            standard_size: standardSize,
            material: material,
            description: description || signName,
            image_url: '/uploads/' + file.filename,
            is_ppe: parseInt(isPpe),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };
        
        newSigns.push(newSign);
        signs.push(newSign);
    });
    
    if (writeSigns(signs)) {
        res.json({ success: true, count: newSigns.length, data: newSigns });
    } else {
        res.status(500).json({ success: false, error: '保存失败' });
    }
});

// 辅助函数：获取颜色方案
function getColorScheme(signType) {
    const schemes = {
        'warning': 'yellow-black',
        'prohibition': 'red-white',
        'instruction': 'blue-white',
        'information': 'green-white'
    };
    return schemes[signType] || 'standard';
}

// 上传场景图片
app.post('/api/uploads', upload.single('scene_image'), (req, res) => {
    if (req.file) {
        res.json({ success: true, image_url: '/uploads/' + req.file.filename });
    } else {
        res.status(400).json({ success: false, error: '未收到图片' });
    }
});

// 自定义危险标签接口
const TAGS_FILE = path.join(DATA_DIR, 'hazard_tags.json');

function readHazardTags() {
    try {
        if (fs.existsSync(TAGS_FILE)) {
            const data = fs.readFileSync(TAGS_FILE, 'utf8');
            return JSON.parse(data);
        }
        return [];
    } catch { return []; }
}
function writeHazardTags(tags) {
    fs.writeFileSync(TAGS_FILE, JSON.stringify(tags, null, 2));
}

// 处理 favicon 请求
app.get('/favicon.ico', (req, res) => res.status(204).end());

app.get('/api/custom-hazard-tags', (req, res) => {
    res.json(readHazardTags());
});

app.post('/api/custom-hazard-tags', (req, res) => {
    const tags = readHazardTags();
    const newTag = {
        id: tags.length > 0 ? Math.max(...tags.map(t => t.id)) + 1 : 1,
        ...req.body,
        created_at: new Date().toISOString()
    };
    tags.push(newTag);
    writeHazardTags(tags);
    res.json({ success: true, data: newTag });
});

app.delete('/api/custom-hazard-tags/:id', (req, res) => {
    let tags = readHazardTags();
    const before = tags.length;
    // 支持用数字 id 或字符串 tag_id 删除
    const paramId = req.params.id;
    tags = tags.filter(t => t.id !== parseInt(paramId) && t.tag_id !== paramId);
    if (tags.length < before) {
        writeHazardTags(tags);
        res.json({ success: true });
    } else {
        res.status(404).json({ success: false, error: '标签不存在' });
    }
});

// 健康检查
app.get('/api/health', (req, res) => {
    res.json({ 
        success: true, 
        message: '安全标志图集服务器运行正常',
        timestamp: new Date().toISOString()
    });
});

// 启动服务器
app.listen(PORT, () => {
    console.log(`安全标志图集服务器运行在 http://localhost:${PORT}`);
    console.log('API 文档:');
    console.log('  GET  /api/scenes     - 获取所有场景');
    console.log('  POST /api/scenes     - 创建场景');
    console.log('  GET  /api/signs      - 获取所有安全标志');
    console.log('  POST /api/signs      - 创建安全标志');
    console.log('  GET  /api/health     - 健康检查');
    console.log(`\n前端页面: http://localhost:${PORT}/index.html`);
});
