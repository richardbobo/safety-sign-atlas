const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();
const multer = require('multer');

const app = express();
const PORT = 8000;

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.static('.'));
app.use('/uploads', express.static('uploads'));

// 确保uploads目录存在
if (!fs.existsSync('./uploads')) {
    fs.mkdirSync('./uploads');
}

// 数据库连接
const db = new sqlite3.Database('./safety_signs.db', (err) => {
    if (err) {
        console.error('数据库连接失败:', err.message);
    } else {
        console.log('已连接到SQLite数据库');
        initializeDatabase();
    }
});

// 初始化数据库
function initializeDatabase() {
    // 确保使用新的表结构
    db.run(`CREATE TABLE IF NOT EXISTS scenes_new (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        scene_code TEXT NOT NULL UNIQUE,
        scene_name TEXT NOT NULL,
        department TEXT NOT NULL,
        hazard_tags TEXT,
        location_description TEXT,
        installation_notes TEXT,
        scene_image_url TEXT,  -- 新增：场景图片URL
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS sign_library (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sign_code TEXT NOT NULL UNIQUE,
        sign_name TEXT NOT NULL,
        sign_type TEXT NOT NULL CHECK(sign_type IN ('warning', 'prohibition', 'instruction', 'information')),
        color_scheme TEXT NOT NULL,
        standard_size TEXT NOT NULL,
        material TEXT NOT NULL,
        description TEXT,
        image_url TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS scene_signs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        scene_id INTEGER NOT NULL,
        sign_id INTEGER NOT NULL,
        display_order INTEGER NOT NULL,
        installation_height TEXT,
        observation_distance TEXT,
        special_requirements TEXT,
        FOREIGN KEY (scene_id) REFERENCES scenes_new(id) ON DELETE CASCADE,
        FOREIGN KEY (sign_id) REFERENCES sign_library(id) ON DELETE CASCADE,
        UNIQUE(scene_id, sign_id, display_order)
    )`);

    console.log('数据库表初始化完成');
}

// 文件上传配置
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, './uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage });

// ==================== 通用文件上传API ====================

// 通用图片上传API
app.post('/api/uploads', upload.single('scene_image'), (req, res) => {
    if (!req.file) {
        res.status(400).json({ 
            success: false, 
            error: '请选择要上传的图片文件' 
        });
        return;
    }
    
    // 检查文件类型
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(req.file.mimetype)) {
        res.status(400).json({ 
            success: false, 
            error: '只支持 JPG、PNG、GIF、WEBP 格式的图片文件' 
        });
        return;
    }
    
    // 检查文件大小（最大5MB）
    if (req.file.size > 5 * 1024 * 1024) {
        res.status(400).json({ 
            success: false, 
            error: '图片文件大小不能超过5MB' 
        });
        return;
    }
    
    const image_url = `/uploads/${req.file.filename}`;
    
    res.json({ 
        success: true,
        message: '图片上传成功',
        image_url: image_url,
        filename: req.file.filename,
        size: req.file.size,
        mimetype: req.file.mimetype
    });
});

// ==================== 标志图集API ====================

// 获取所有标志（按类型排序）
app.get('/api/signs', (req, res) => {
    const sql = `
        SELECT * FROM sign_library 
        ORDER BY 
            CASE sign_type 
                WHEN 'warning' THEN 1
                WHEN 'prohibition' THEN 2
                WHEN 'instruction' THEN 3
                WHEN 'information' THEN 4
                ELSE 5
            END,
            sign_code
    `;
    
    db.all(sql, [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

// 按类型获取标志
app.get('/api/signs/type/:type', (req, res) => {
    const { type } = req.params;
    const validTypes = ['warning', 'prohibition', 'instruction', 'information'];
    
    if (!validTypes.includes(type)) {
        res.status(400).json({ error: '无效的标志类型' });
        return;
    }
    
    const sql = 'SELECT * FROM sign_library WHERE sign_type = ? ORDER BY sign_code';
    db.all(sql, [type], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

// 添加新标志
app.post('/api/signs', (req, res) => {
    const { sign_code, sign_name, sign_type, color_scheme, standard_size, material, description } = req.body;
    
    const sql = `
        INSERT INTO sign_library 
        (sign_code, sign_name, sign_type, color_scheme, standard_size, material, description) 
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    
    db.run(sql, [sign_code, sign_name, sign_type, color_scheme, standard_size, material, description], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ 
            id: this.lastID,
            message: '标志添加成功'
        });
    });
});

// 删除标志
app.delete('/api/signs/:id', (req, res) => {
    const signId = req.params.id;
    
    // 首先检查标志是否存在
    const checkSql = 'SELECT * FROM sign_library WHERE id = ?';
    db.get(checkSql, [signId], (err, row) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        
        if (!row) {
            res.status(404).json({ error: '标志不存在' });
            return;
        }
        
        // 删除标志
        const deleteSql = 'DELETE FROM sign_library WHERE id = ?';
        db.run(deleteSql, [signId], function(err) {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            
            // 同时删除关联的场景标志记录
            const deleteSceneSignsSql = 'DELETE FROM scene_signs WHERE sign_id = ?';
            db.run(deleteSceneSignsSql, [signId], function(err2) {
                if (err2) {
                    console.error('删除关联记录失败:', err2);
                }
                
                res.json({
                    success: true,
                    message: '标志删除成功',
                    deletedId: signId,
                    rowsAffected: this.changes
                });
            });
        });
    });
});

// 上传标志图片
app.post('/api/signs/upload', upload.single('image'), (req, res) => {
    try {
        const { sign_code, sign_name, sign_type, color_scheme, standard_size, material, description, is_ppe } = req.body;
        
        if (!req.file) {
            return res.status(400).json({ error: '请上传图片文件' });
        }
        
        // 构建图片URL
        const image_url = `/uploads/${req.file.filename}`;
        
        const sql = `
            INSERT INTO sign_library 
            (sign_code, sign_name, sign_type, color_scheme, standard_size, material, description, image_url, is_ppe) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        
        db.run(sql, [sign_code, sign_name, sign_type, color_scheme, standard_size, material, description, image_url, is_ppe || 0], function(err) {
            if (err) {
                // 删除已上传的文件
                fs.unlinkSync(req.file.path);
                res.status(500).json({ error: err.message });
                return;
            }
            res.json({ 
                id: this.lastID,
                message: '标志添加成功',
                image_url: image_url
            });
        });
    } catch (error) {
        if (req.file && req.file.path) {
            fs.unlinkSync(req.file.path);
        }
        res.status(500).json({ error: error.message });
    }
});

// ==================== 场景管理API ====================

// 获取所有场景
app.get('/api/scenes', (req, res) => {
    const sql = 'SELECT * FROM scenes_new ORDER BY scene_code';
    db.all(sql, [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

// 创建新场景
app.post('/api/scenes', (req, res) => {
    const { scene_code, scene_name, department, hazard_tags, location_description, installation_notes, scene_image_url } = req.body;
    
    const sql = `
        INSERT INTO scenes_new 
        (scene_code, scene_name, department, hazard_tags, location_description, installation_notes, scene_image_url) 
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    
    db.run(sql, [scene_code, scene_name, department, hazard_tags, location_description || '', installation_notes || '', scene_image_url || null], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ 
            id: this.lastID,
            message: '场景创建成功'
        });
    });
});

// 获取场景详情（包含标志组合）
app.get('/api/scenes/:id', (req, res) => {
    const sceneId = req.params.id;
    
    // 获取场景基本信息
    db.get('SELECT * FROM scenes_new WHERE id = ?', [sceneId], (err, scene) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        
        if (!scene) {
            res.status(404).json({ error: '场景不存在' });
            return;
        }
        
        // 获取场景的标志组合
        const sql = `
            SELECT ss.*, sl.sign_code, sl.sign_name, sl.sign_type, sl.color_scheme, sl.standard_size, sl.image_url, sl.is_ppe
            FROM scene_signs ss
            JOIN sign_library sl ON ss.sign_id = sl.id
            WHERE ss.scene_id = ?
            ORDER BY ss.display_order
        `;
        
        db.all(sql, [sceneId], (err, signs) => {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            
            res.json({
                ...scene,
                signs: signs
            });
        });
    });
});

// 获取下一个场景编码
app.get('/api/scenes/next-code', (req, res) => {
    // 获取当前最大的场景编码
    db.get('SELECT MAX(scene_code) as max_code FROM scenes_new', (err, result) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        
        let nextNumber = 1;
        if (result && result.max_code) {
            // 从格式 SCENE-001 中提取数字
            const match = result.max_code.match(/SCENE-(\d+)/);
            if (match && match[1]) {
                nextNumber = parseInt(match[1]) + 1;
            }
        }
        
        const nextCode = `SCENE-${nextNumber.toString().padStart(3, '0')}`;
        res.json({ next_code: nextCode });
    });
});

// 更新场景
app.put('/api/scenes/:id', (req, res) => {
    const sceneId = req.params.id;
    const { scene_name, department, hazard_tags, location_description, installation_notes, scene_image_url } = req.body;
    
    // 首先检查场景是否存在
    db.get('SELECT * FROM scenes_new WHERE id = ?', [sceneId], (err, scene) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        
        if (!scene) {
            res.status(404).json({ error: '场景不存在' });
            return;
        }
        
        const sql = `
            UPDATE scenes_new 
            SET scene_name = ?, 
                department = ?, 
                hazard_tags = ?, 
                location_description = ?,
                installation_notes = ?,
                scene_image_url = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `;
        
        db.run(sql, [scene_name, department, hazard_tags, location_description || '', installation_notes || '', scene_image_url || null, sceneId], function(err) {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            
            res.json({ 
                success: true,
                message: '场景更新成功',
                rowsAffected: this.changes
            });
        });
    });
});

// 上传场景图片
app.post('/api/scenes/:id/upload-image', upload.single('scene_image'), (req, res) => {
    const sceneId = req.params.id;
    
    if (!req.file) {
        res.status(400).json({ error: '请选择要上传的图片文件' });
        return;
    }
    
    // 检查场景是否存在
    db.get('SELECT * FROM scenes_new WHERE id = ?', [sceneId], (err, scene) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        
        if (!scene) {
            res.status(404).json({ error: '场景不存在' });
            return;
        }
        
        const scene_image_url = `/uploads/${req.file.filename}`;
        
        // 更新场景的图片URL
        const sql = 'UPDATE scenes_new SET scene_image_url = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?';
        db.run(sql, [scene_image_url, sceneId], function(err) {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            
            res.json({ 
                success: true,
                message: '场景图片上传成功',
                scene_image_url: scene_image_url,
                rowsAffected: this.changes
            });
        });
    });
});

// 删除场景
app.delete('/api/scenes/:id', (req, res) => {
    const sceneId = req.params.id;
    
    // 首先检查场景是否存在
    db.get('SELECT * FROM scenes_new WHERE id = ?', [sceneId], (err, scene) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        
        if (!scene) {
            res.status(404).json({ error: '场景不存在' });
            return;
        }
        
        // 删除场景（关联的scene_signs记录会自动级联删除）
        const deleteSql = 'DELETE FROM scenes_new WHERE id = ?';
        db.run(deleteSql, [sceneId], function(err) {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            
            res.json({
                success: true,
                message: '场景删除成功',
                deletedId: sceneId,
                rowsAffected: this.changes
            });
        });
    });
});

// 为场景添加标志
app.post('/api/scenes/:id/signs', (req, res) => {
    const sceneId = req.params.id;
    const { sign_id, installation_height, observation_distance, special_requirements } = req.body;
    
    // 获取当前最大排序值
    db.get('SELECT MAX(display_order) as max_order FROM scene_signs WHERE scene_id = ?', [sceneId], (err, result) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        
        const display_order = (result.max_order || 0) + 1;
        
        const sql = `
            INSERT INTO scene_signs 
            (scene_id, sign_id, display_order, installation_height, observation_distance, special_requirements) 
            VALUES (?, ?, ?, ?, ?, ?)
        `;
        
        db.run(sql, [sceneId, sign_id, display_order, installation_height, observation_distance, special_requirements], function(err) {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.json({ 
                id: this.lastID,
                message: '标志添加成功'
            });
        });
    });
});

// ==================== 其他API ====================

// 健康检查
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        service: '安全标志图集管理系统（优化版）'
    });
});

// 获取系统统计
app.get('/api/stats', (req, res) => {
    const queries = [
        'SELECT COUNT(*) as scene_count FROM scenes_new',
        'SELECT COUNT(*) as sign_count FROM sign_library',
        'SELECT sign_type, COUNT(*) as count FROM sign_library GROUP BY sign_type'
    ];
    
    const results = {};
    let completed = 0;
    
    queries.forEach((query, index) => {
        db.get(query, [], (err, row) => {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            
            if (index === 0) results.scene_count = row.scene_count;
            else if (index === 1) results.sign_count = row.sign_count;
            else results.sign_types = row;
            
            completed++;
            
            if (completed === queries.length) {
                res.json(results);
            }
        });
    });
});

// ======================
// 自定义危险源标签 API
// ======================

// 获取所有自定义危险源标签
app.get('/api/custom-hazard-tags', (req, res) => {
    const sql = 'SELECT * FROM custom_hazard_tags ORDER BY created_at DESC';
    db.all(sql, [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

// 创建新的自定义危险源标签
app.post('/api/custom-hazard-tags', (req, res) => {
    const { tag_id, tag_name, color } = req.body;
    
    if (!tag_id || !tag_name) {
        res.status(400).json({ error: 'tag_id和tag_name是必填字段' });
        return;
    }
    
    const sql = 'INSERT INTO custom_hazard_tags (tag_id, tag_name, color) VALUES (?, ?, ?)';
    db.run(sql, [tag_id, tag_name, color || '#a78bfa'], function(err) {
        if (err) {
            if (err.code === 'SQLITE_CONSTRAINT') {
                res.status(409).json({ error: '标签ID已存在' });
            } else {
                res.status(500).json({ error: err.message });
            }
            return;
        }
        res.json({ 
            id: this.lastID,
            tag_id,
            tag_name,
            color: color || '#a78bfa',
            message: '自定义标签创建成功'
        });
    });
});

// 删除自定义危险源标签
app.delete('/api/custom-hazard-tags/:tag_id', (req, res) => {
    const tagId = req.params.tag_id;
    
    const sql = 'DELETE FROM custom_hazard_tags WHERE tag_id = ?';
    db.run(sql, [tagId], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        if (this.changes === 0) {
            res.status(404).json({ error: '标签不存在' });
            return;
        }
        res.json({ 
            message: '自定义标签删除成功',
            deleted_count: this.changes
        });
    });
});

// 启动服务器
app.listen(PORT, () => {
    console.log(`安全标志图集管理系统（优化版）运行在 http://localhost:${PORT}`);
    console.log('API文档:');
    console.log('  GET  /api/health - 健康检查');
    console.log('  GET  /api/signs - 获取所有标志（按类型排序）');
    console.log('  GET  /api/signs/type/:type - 按类型获取标志');
    console.log('  POST /api/signs - 添加新标志');
    console.log('  GET  /api/scenes - 获取所有场景');
    console.log('  POST /api/scenes - 创建场景');
    console.log('  GET  /api/scenes/:id - 获取场景详情（包含标志组合）');
    console.log('  POST /api/scenes/:id/signs - 为场景添加标志');
    console.log('  GET  /api/custom-hazard-tags - 获取所有自定义危险源标签');
    console.log('  POST /api/custom-hazard-tags - 创建自定义危险源标签');
    console.log('  DELETE /api/custom-hazard-tags/:tag_id - 删除自定义危险源标签');
});