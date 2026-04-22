// 安全标志图集管理系统 - 后端服务器
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// 导入数据库模块
const dbModule = require('./database.js');

const app = express();
const PORT = 8000;

// 中间件
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('.')); // 提供静态文件

// 确保上传目录存在
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// 配置文件上传
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadsDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB限制
    fileFilter: function (req, file, cb) {
        const allowedTypes = /jpeg|jpg|png|gif|bmp/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        
        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('只允许上传图片文件 (jpeg, jpg, png, gif, bmp)'));
        }
    }
});

// API路由

// 健康检查
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 场景API

// 获取所有场景
app.get('/api/scenes', async (req, res) => {
    try {
        const filters = {
            department: req.query.department,
            status: req.query.status,
            search: req.query.search
        };
        
        const scenes = await dbModule.SceneModel.getAll(filters);
        
        // 为每个场景获取标志
        for (let scene of scenes) {
            scene.signs = await dbModule.SafetySignModel.getBySceneId(scene.id);
            scene.images = await dbModule.ImageModel.getBySceneId(scene.id);
        }
        
        res.json(scenes);
    } catch (error) {
        console.error('获取场景列表错误:', error);
        res.status(500).json({ error: '获取场景列表失败' });
    }
});

// 获取单个场景
app.get('/api/scenes/:id', async (req, res) => {
    try {
        const scene = await dbModule.SceneModel.getById(req.params.id);
        if (!scene) {
            return res.status(404).json({ error: '场景不存在' });
        }
        
        scene.signs = await dbModule.SafetySignModel.getBySceneId(scene.id);
        scene.images = await dbModule.ImageModel.getBySceneId(scene.id);
        
        res.json(scene);
    } catch (error) {
        console.error('获取场景错误:', error);
        res.status(500).json({ error: '获取场景失败' });
    }
});

// 创建场景
app.post('/api/scenes', async (req, res) => {
    try {
        const sceneData = req.body;
        
        // 验证场景编码是否唯一
        const existingScene = await dbModule.SceneModel.getByCode(sceneData.scene_code);
        if (existingScene) {
            return res.status(400).json({ error: '场景编码已存在' });
        }
        
        // 创建场景
        const sceneId = await dbModule.SceneModel.create(sceneData);
        
        // 添加安全标志
        if (sceneData.signs && Array.isArray(sceneData.signs)) {
            for (let i = 0; i < sceneData.signs.length; i++) {
                const sign = sceneData.signs[i];
                await dbModule.SafetySignModel.addToScene(sceneId, {
                    ...sign,
                    display_order: i + 1
                });
            }
        }
        
        // 获取完整的场景数据
        const newScene = await dbModule.SceneModel.getById(sceneId);
        newScene.signs = await dbModule.SafetySignModel.getBySceneId(sceneId);
        
        res.status(201).json(newScene);
    } catch (error) {
        console.error('创建场景错误:', error);
        res.status(500).json({ error: '创建场景失败' });
    }
});

// 更新场景
app.put('/api/scenes/:id', async (req, res) => {
    try {
        const sceneId = req.params.id;
        const updateData = req.body;
        
        // 检查场景是否存在
        const existingScene = await dbModule.SceneModel.getById(sceneId);
        if (!existingScene) {
            return res.status(404).json({ error: '场景不存在' });
        }
        
        // 如果更新了场景编码，检查是否唯一
        if (updateData.scene_code && updateData.scene_code !== existingScene.scene_code) {
            const duplicateScene = await dbModule.SceneModel.getByCode(updateData.scene_code);
            if (duplicateScene && duplicateScene.id !== parseInt(sceneId)) {
                return res.status(400).json({ error: '场景编码已存在' });
            }
        }
        
        // 更新场景
        await dbModule.SceneModel.update(sceneId, updateData);
        
        // 如果提供了新的标志列表，更新标志
        if (updateData.signs && Array.isArray(updateData.signs)) {
            // 删除旧的标志
            await dbModule.SafetySignModel.deleteBySceneId(sceneId);
            
            // 添加新的标志
            for (let i = 0; i < updateData.signs.length; i++) {
                const sign = updateData.signs[i];
                await dbModule.SafetySignModel.addToScene(sceneId, {
                    ...sign,
                    display_order: i + 1
                });
            }
        }
        
        // 获取更新后的场景数据
        const updatedScene = await dbModule.SceneModel.getById(sceneId);
        updatedScene.signs = await dbModule.SafetySignModel.getBySceneId(sceneId);
        
        res.json(updatedScene);
    } catch (error) {
        console.error('更新场景错误:', error);
        res.status(500).json({ error: '更新场景失败' });
    }
});

// 删除场景
app.delete('/api/scenes/:id', async (req, res) => {
    try {
        const sceneId = req.params.id;
        
        // 检查场景是否存在
        const existingScene = await dbModule.SceneModel.getById(sceneId);
        if (!existingScene) {
            return res.status(404).json({ error: '场景不存在' });
        }
        
        // 删除场景（数据库级联删除会同时删除关联的标志和图片）
        await dbModule.SceneModel.delete(sceneId);
        
        res.json({ message: '场景删除成功' });
    } catch (error) {
        console.error('删除场景错误:', error);
        res.status(500).json({ error: '删除场景失败' });
    }
});

// 获取场景统计
app.get('/api/scenes/stats', async (req, res) => {
    try {
        const stats = await dbModule.SceneModel.getStats();
        res.json(stats);
    } catch (error) {
        console.error('获取统计错误:', error);
        res.status(500).json({ error: '获取统计失败' });
    }
});

// 图片上传API

// 上传场景图片
app.post('/api/scenes/:id/images', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: '请选择要上传的图片' });
        }
        
        const sceneId = req.params.id;
        const { image_type, description } = req.body;
        
        // 检查场景是否存在
        const existingScene = await dbModule.SceneModel.getById(sceneId);
        if (!existingScene) {
            // 删除已上传的文件
            fs.unlinkSync(req.file.path);
            return res.status(404).json({ error: '场景不存在' });
        }
        
        // 保存图片信息到数据库
        const imageId = await dbModule.ImageModel.add({
            scene_id: sceneId,
            image_type: image_type || 'scene_photo',
            filename: req.file.originalname,
            filepath: `/uploads/${req.file.filename}`,
            description: description || ''
        });
        
        res.status(201).json({
            id: imageId,
            filename: req.file.originalname,
            filepath: `/uploads/${req.file.filename}`,
            image_type: image_type || 'scene_photo',
            description: description || '',
            uploaded_at: new Date().toISOString()
        });
    } catch (error) {
        console.error('上传图片错误:', error);
        if (req.file) {
            fs.unlinkSync(req.file.path);
        }
        res.status(500).json({ error: '上传图片失败' });
    }
});

// 获取场景的图片
app.get('/api/scenes/:id/images', async (req, res) => {
    try {
        const sceneId = req.params.id;
        const imageType = req.query.type;
        
        const images = await dbModule.ImageModel.getBySceneId(sceneId, imageType);
        res.json(images);
    } catch (error) {
        console.error('获取图片错误:', error);
        res.status(500).json({ error: '获取图片失败' });
    }
});

// 删除图片
app.delete('/api/images/:id', async (req, res) => {
    try {
        const imageId = req.params.id;
        
        // 先获取图片信息
        const db = dbModule.db;
        db.get('SELECT * FROM images WHERE id = ?', [imageId], async (err, image) => {
            if (err) {
                return res.status(500).json({ error: '获取图片信息失败' });
            }
            
            if (!image) {
                return res.status(404).json({ error: '图片不存在' });
            }
            
            // 删除文件
            const filePath = path.join(__dirname, image.filepath);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
            
            // 删除数据库记录
            await dbModule.ImageModel.delete(imageId);
            
            res.json({ message: '图片删除成功' });
        });
    } catch (error) {
        console.error('删除图片错误:', error);
        res.status(500).json({ error: '删除图片失败' });
    }
});

// 安全标志API

// 为场景添加标志
app.post('/api/scenes/:id/signs', async (req, res) => {
    try {
        const sceneId = req.params.id;
        const signData = req.body;
        
        // 检查场景是否存在
        const existingScene = await dbModule.SceneModel.getById(sceneId);
        if (!existingScene) {
            return res.status(404).json({ error: '场景不存在' });
        }
        
        // 获取当前最大顺序
        const signs = await dbModule.SafetySignModel.getBySceneId(sceneId);
        const maxOrder = signs.length > 0 ? Math.max(...signs.map(s => s.display_order)) : 0;
        
        // 添加标志
        const signId = await dbModule.SafetySignModel.addToScene(sceneId, {
            ...signData,
            display_order: maxOrder + 1
        });
        
        res.status(201).json({
            id: signId,
            scene_id: sceneId,
            ...signData,
            display_order: maxOrder + 1
        });
    } catch (error) {
        console.error('添加标志错误:', error);
        res.status(500).json({ error: '添加标志失败' });
    }
});

// 更新标志
app.put('/api/signs/:id', async (req, res) => {
    try {
        const signId = req.params.id;
        const updateData = req.body;
        
        await dbModule.SafetySignModel.update(signId, updateData);
        res.json({ message: '标志更新成功' });
    } catch (error) {
        console.error('更新标志错误:', error);
        res.status(500).json({ error: '更新标志失败' });
    }
});

// 删除标志
app.delete('/api/signs/:id', async (req, res) => {
    try {
        const signId = req.params.id;
        
        await dbModule.SafetySignModel.delete(signId);
        res.json({ message: '标志删除成功' });
    } catch (error) {
        console.error('删除标志错误:', error);
        res.status(500).json({ error: '删除标志失败' });
    }
});

// 提供上传的文件
app.use('/uploads', express.static(uploadsDir));

// 错误处理中间件
app.use((err, req, res, next) => {
    console.error('服务器错误:', err);
    
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ error: '文件大小超过限制（10MB）' });
        }
        return res.status(400).json({ error: '文件上传错误' });
    }
    
    res.status(500).json({ error: '服务器内部错误' });
});

// 启动服务器
app.listen(PORT, () => {
    console.log(`安全标志图集管理系统后端运行在 http://localhost:${PORT}`);
    console.log(`API文档:`);
    console.log(`  GET  /api/health - 健康检查`);
    console.log(`  GET  /api/scenes - 获取所有场景`);
    console.log(`  POST /api/scenes - 创建场景`);
    console.log(`  GET  /api/scenes/:id - 获取单个场景`);
    console.log(`  PUT  /api/scenes/:id - 更新场景`);
    console.log(`  DELETE /api/scenes/:id - 删除场景`);
    console.log(`  POST /api/scenes/:id/images - 上传图片`);
    console.log(`  POST /api/scenes/:id/signs - 添加安全标志`);
});