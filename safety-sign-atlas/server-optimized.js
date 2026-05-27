const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();
const multer = require('multer');

const app = express();
const PORT = Number(process.env.PORT) || 8000;

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
const db = new sqlite3.Database('./safety_signs.db', sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
    if (err) {
        console.error('数据库连接失败:', err.message);
    } else {
        console.log('已连接到SQLite数据库');
        initializeDatabase();
    }
});

// 数据库辅助函数
function runSql(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.run(sql, params, function(err) { if (err) return reject(err); resolve(this); });
    });
}
function getSql(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.get(sql, params, (err, row) => { if (err) return reject(err); resolve(row); });
    });
}
function allSql(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => { if (err) return reject(err); resolve(rows); });
    });
}
function readJsonData(fileName) {
    const fp = path.join(__dirname, 'data', fileName);
    if (!fs.existsSync(fp)) return [];
    try { return JSON.parse(fs.readFileSync(fp, 'utf8')); }
    catch (e) { console.warn('JSON read failed', fileName, e.message); return []; }
}
function normalizeSignType(type) {
    const t = type === 'notification' ? 'information' : type;
    return ['warning','prohibition','instruction','information'].includes(t) ? t : 'warning';
}
async function migrateJsonDataIfNeeded() {
    try {
        const sc = await getSql('SELECT COUNT(*) as c FROM sign_library');
        if (sc.c === 0) {
            const signs = readJsonData('signs.json');
            for (const s of signs) {
                await runSql('INSERT OR IGNORE INTO sign_library(id,sign_code,sign_name,sign_type,color_scheme,standard_size,material,description,image_url,is_ppe,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)',
                    [s.id||null, s.sign_code||'SIGN-'+Date.now(), s.sign_name||'', normalizeSignType(s.sign_type), s.color_scheme||'', s.standard_size||'', s.material||'', s.description||'', s.image_url||'', s.is_ppe?1:0, s.created_at||new Date().toISOString(), s.updated_at||s.created_at||new Date().toISOString()]);
            }
            console.log('迁移', signs.length, '个标志');
        }
        const cc = await getSql('SELECT COUNT(*) as c FROM scenes_new');
        if (cc.c === 0) {
            const scenes = readJsonData('scenes.json');
            for (const s of scenes) {
                await runSql('INSERT OR IGNORE INTO scenes_new(id,scene_code,scene_name,department,hazard_tags,location_description,installation_notes,scene_image_url,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?)',
                    [s.id||null, s.scene_code||'SCENE-'+String(s.id||Date.now()).padStart(3,'0'), s.scene_name||'', s.department||'', s.hazard_tags||'', s.location_description||'', s.installation_notes||'', s.scene_image_url||'', s.created_at||new Date().toISOString(), s.updated_at||s.created_at||new Date().toISOString()]);
            }
            console.log('迁移', scenes.length, '个场景');
        }
        const rc = await getSql('SELECT COUNT(*) as c FROM scene_signs');
        if (rc.c === 0) {
            const rels = readJsonData('scene_signs.json');
            for (const r of rels) {
                await runSql('INSERT OR IGNORE INTO scene_signs(id,scene_id,sign_id,display_order,installation_height,observation_distance,special_requirements,added_at) VALUES(?,?,?,?,?,?,?,?)',
                    [r.id||null, r.scene_id, r.sign_id, r.display_order||r.id||1, r.installation_height||'', r.observation_distance||'', r.special_requirements||'', r.added_at||new Date().toISOString()]);
            }
            console.log('迁移', rels.length, '条关联');
        }
        const tc = await getSql('SELECT COUNT(*) as c FROM custom_hazard_tags');
        if (tc.c === 0) {
            const tags = readJsonData('hazard_tags.json');
            for (const t of tags) {
                if (!t.tag_id||!t.tag_name) continue;
                await runSql('INSERT OR IGNORE INTO custom_hazard_tags(id,tag_id,tag_name,color,created_at) VALUES(?,?,?,?,?)',
                    [t.id||null, t.tag_id, t.tag_name, t.color||'#a78bfa', t.created_at||new Date().toISOString()]);
            }
            console.log('迁移', tags.length, '个标签');
        }
        // 工作岗位迁移：为每个场景创建默认岗位
        const wc = await getSql('SELECT COUNT(*) as c FROM workstations');
        if (wc.c === 0) {
            await runSql(`INSERT INTO workstations (workstation_code, workstation_name, scene_id, department)
                SELECT 'WS-' || printf('%03d', id), scene_name, id, department FROM scenes_new`);
            console.log('已为现有场景创建默认工作岗位');
        }
    } catch (e) { console.error('数据迁移失败:', e.message); }
}

// 初始化数据库
function initializeDatabase() {
    db.serialize(() => {
    db.run('PRAGMA foreign_keys = ON');
    db.run('CREATE TABLE IF NOT EXISTS scenes_new (id INTEGER PRIMARY KEY AUTOINCREMENT, scene_code TEXT NOT NULL UNIQUE, scene_name TEXT NOT NULL, department TEXT NOT NULL, hazard_tags TEXT, location_description TEXT, installation_notes TEXT, scene_image_url TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)');
    db.run('CREATE TABLE IF NOT EXISTS sign_library (id INTEGER PRIMARY KEY AUTOINCREMENT, sign_code TEXT NOT NULL UNIQUE, sign_name TEXT NOT NULL, sign_type TEXT NOT NULL CHECK(sign_type IN (\'warning\',\'prohibition\',\'instruction\',\'information\')), color_scheme TEXT NOT NULL, standard_size TEXT NOT NULL, material TEXT NOT NULL, description TEXT, image_url TEXT, is_ppe INTEGER DEFAULT 0, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)');
    db.run('CREATE TABLE IF NOT EXISTS scene_signs (id INTEGER PRIMARY KEY AUTOINCREMENT, scene_id INTEGER NOT NULL, sign_id INTEGER NOT NULL, display_order INTEGER NOT NULL, installation_height TEXT, observation_distance TEXT, special_requirements TEXT, added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (scene_id) REFERENCES scenes_new(id) ON DELETE CASCADE, FOREIGN KEY (sign_id) REFERENCES sign_library(id) ON DELETE CASCADE, UNIQUE(scene_id, sign_id, display_order))');
    db.run('CREATE TABLE IF NOT EXISTS custom_hazard_tags (id INTEGER PRIMARY KEY AUTOINCREMENT, tag_id TEXT NOT NULL UNIQUE, tag_name TEXT NOT NULL, color TEXT DEFAULT \'#a78bfa\', created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)');
    db.run('CREATE TABLE IF NOT EXISTS workstations (id INTEGER PRIMARY KEY AUTOINCREMENT, workstation_code TEXT NOT NULL UNIQUE, workstation_name TEXT NOT NULL, scene_id INTEGER NOT NULL, department TEXT, location TEXT, notes TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (scene_id) REFERENCES scenes_new(id) ON DELETE RESTRICT)');
    db.run('CREATE INDEX IF NOT EXISTS idx_workstations_scene ON workstations(scene_id)');
    db.run('CREATE INDEX IF NOT EXISTS idx_workstations_dept ON workstations(department)', (err) => {
        if (err) { console.error('index creation failed:', err.message); return; }
        migrateJsonDataIfNeeded();
    });
    });
    console.log('数据库表初始化完成');
}

// 文件上传配置
const ALLOWED_MIMES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, './uploads/');
    },
    filename: (req, file, cb) => {
        const safeExt = path.extname(file.originalname).replace(/[^a-zA-Z0-9.]/g, '');
        cb(null, Date.now() + (safeExt || '.jpg'));
    }
});
const upload = multer({
    storage,
    limits: { fileSize: MAX_FILE_SIZE },
    fileFilter: (req, file, cb) => {
        if (ALLOWED_MIMES.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('不支持的文件类型，仅允许 JPG/PNG/GIF/WEBP'));
        }
    }
});

// ==================== 通用文件上传API ====================

// 通用图片上传API
app.post('/api/uploads', (req, res, next) => {
    upload.single('scene_image')(req, res, (err) => {
        if (err) {
            if (err.code === 'LIMIT_FILE_SIZE') {
                return res.status(400).json({ success: false, error: '图片文件大小不能超过5MB' });
            }
            return res.status(400).json({ success: false, error: '文件上传失败' });
        }
        if (!req.file) {
            return res.status(400).json({ success: false, error: '请选择要上传的图片文件' });
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
            res.status(500).json({ error: '服务器错误' });
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
            res.status(500).json({ error: '服务器错误' });
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
            res.status(500).json({ error: '服务器错误' });
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
    
    // 检查标志是否存在；scene_signs 通过 ON DELETE CASCADE 自动清理
    db.get('SELECT id FROM sign_library WHERE id = ?', [signId], (err, row) => {
        if (err) { return res.status(500).json({ error: '服务器错误' }); }
        if (!row) { return res.status(404).json({ error: '标志不存在' }); }
        db.run('DELETE FROM sign_library WHERE id = ?', [signId], function(delErr) {
            if (delErr) { return res.status(500).json({ error: '删除失败，请重试' }); }
            res.json({
                success: true,
                message: '标志删除成功',
                deletedId: signId,
                rowsAffected: this.changes
            });
        });
    });
});

// 上传标志图片
app.post('/api/signs/upload', (req, res, next) => {
    upload.single('image')(req, res, (err) => {
        if (err) {
            if (err.code === 'LIMIT_FILE_SIZE') {
                return res.status(400).json({ error: '图片文件大小不能超过5MB' });
            }
            return res.status(400).json({ error: '文件上传失败' });
        }
        if (!req.file) {
            return res.status(400).json({ error: '请上传图片文件' });
        }
        const { sign_code, sign_name, sign_type, color_scheme, standard_size, material, description, is_ppe } = req.body;
        const image_url = `/uploads/${req.file.filename}`;
        const sql = `
            INSERT INTO sign_library
            (sign_code, sign_name, sign_type, color_scheme, standard_size, material, description, image_url, is_ppe)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        db.run(sql, [sign_code, sign_name, sign_type, color_scheme, standard_size, material, description, image_url, is_ppe || 0], function(insertErr) {
            if (insertErr) {
                try { fs.unlinkSync(req.file.path); } catch (e) { /* ignore */ }
                return res.status(500).json({ error: '保存标志失败，请重试' });
            }
            res.json({
                id: this.lastID,
                message: '标志添加成功',
                image_url: image_url
            });
        });
    });
});

// ==================== 场景管理API ====================

// 获取所有场景
app.get('/api/scenes', (req, res) => {
    const sql = `
        SELECT sn.*,
            (SELECT COUNT(*) FROM scene_signs ss WHERE ss.scene_id = sn.id) as sign_count,
            (SELECT json_group_array(json_object('id',ss.id,'sign_code',sl.sign_code,'sign_name',sl.sign_name,'sign_type',sl.sign_type,'image_url',sl.image_url,'installation_height',ss.installation_height,'observation_distance',ss.observation_distance,'special_requirements',ss.special_requirements))
             FROM scene_signs ss JOIN sign_library sl ON ss.sign_id = sl.id WHERE ss.scene_id = sn.id) as signs_json,
            (SELECT COUNT(*) FROM workstations w WHERE w.scene_id = sn.id) as workstation_count,
            (SELECT json_group_array(json_object('id',w.id,'workstation_code',w.workstation_code,'workstation_name',w.workstation_name))
             FROM workstations w WHERE w.scene_id = sn.id) as workstations_json
        FROM scenes_new sn
        ORDER BY sn.scene_code
    `;
    db.all(sql, [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: '服务器错误' });
            return;
        }
        rows.forEach(r => {
            r.sign_count = r.sign_count || 0;
            r.workstation_count = r.workstation_count || 0;
            try { r.signs = JSON.parse(r.signs_json || '[]'); } catch(e) { r.signs = []; }
            try { r.workstations = JSON.parse(r.workstations_json || '[]'); } catch(e) { r.workstations = []; }
            delete r.signs_json;
            delete r.workstations_json;
        });
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
            res.status(500).json({ error: '服务器错误' });
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
            res.status(500).json({ error: '服务器错误' });
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
                res.status(500).json({ error: '服务器错误' });
                return;
            }

            // 获取该场景下的工作岗位
            db.all('SELECT id, workstation_code, workstation_name FROM workstations WHERE scene_id = ?', [sceneId], (err, workstations) => {
                if (err) { workstations = []; }
                res.json({ ...scene, signs: signs, workstations: workstations || [] });
            });
        });
    });
});

// 获取下一个场景编码
app.get('/api/scenes/next-code', (req, res) => {
    // 获取当前最大的场景编码
    db.get('SELECT MAX(scene_code) as max_code FROM scenes_new', (err, result) => {
        if (err) {
            res.status(500).json({ error: '服务器错误' });
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
            res.status(500).json({ error: '服务器错误' });
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
                res.status(500).json({ error: '服务器错误' });
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
app.post('/api/scenes/:id/upload-image', (req, res, next) => {
    const sceneId = req.params.id;
    upload.single('scene_image')(req, res, (err) => {
        if (err) {
            if (err.code === 'LIMIT_FILE_SIZE') {
                return res.status(400).json({ error: '图片文件大小不能超过5MB' });
            }
            return res.status(400).json({ error: '文件上传失败' });
        }
        if (!req.file) {
            return res.status(400).json({ error: '请选择要上传的图片文件' });
        }
        db.get('SELECT * FROM scenes_new WHERE id = ?', [sceneId], (dbErr, scene) => {
            if (dbErr) { return res.status(500).json({ error: '服务器错误' }); }
            if (!scene) { return res.status(404).json({ error: '场景不存在' }); }
            const scene_image_url = `/uploads/${req.file.filename}`;
            const sql = 'UPDATE scenes_new SET scene_image_url = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?';
            db.run(sql, [scene_image_url, sceneId], function(updateErr) {
                if (updateErr) { return res.status(500).json({ error: '保存图片失败，请重试' }); }
                res.json({
                    success: true,
                    message: '场景图片上传成功',
                    scene_image_url: scene_image_url,
                    rowsAffected: this.changes
                });
            });
        });
    });
});

// 删除场景
app.delete('/api/scenes/:id', (req, res) => {
    const sceneId = req.params.id;
    
    // 检查是否有关联岗位
    db.get('SELECT COUNT(*) as cnt FROM workstations WHERE scene_id = ?', [sceneId], (wsErr, wsRow) => {
        if (wsErr) { res.status(500).json({ error: wsErr.message }); return; }
        if (wsRow && wsRow.cnt > 0) {
            res.status(400).json({ error: '该场景下有'+wsRow.cnt+'个关联岗位，请先移除岗位后再删除场景' });
            return;
        }

        // 检查场景是否存在
        db.get('SELECT * FROM scenes_new WHERE id = ?', [sceneId], (err, scene) => {
            if (err) { res.status(500).json({ error: '服务器错误' }); return; }
            if (!scene) { res.status(404).json({ error: '场景不存在' }); return; }

            // 删除场景（关联的scene_signs记录会自动级联删除）
            db.run('DELETE FROM scenes_new WHERE id = ?', [sceneId], function(err) {
                if (err) {
                    res.status(500).json({ error: '服务器错误' });
                    return;
                }
                res.json({ success: true, message: '场景删除成功', deletedId: sceneId, rowsAffected: this.changes });
            });
        });
        });
    });

// 为场景添加标志
app.post('/api/scenes/:id/signs', (req, res) => {
    const sceneId = req.params.id;
    const { sign_id, installation_height, observation_distance, special_requirements } = req.body;

    if (!sign_id) {
        return res.status(400).json({ error: '请选择要添加的标志' });
    }

    // 检查场景是否存在
    db.get('SELECT id FROM scenes_new WHERE id = ?', [sceneId], (err, scene) => {
        if (err) { return res.status(500).json({ error: '服务器错误' }); }
        if (!scene) { return res.status(404).json({ error: '场景不存在' }); }

        // 检查是否已存在相同标志
        db.get('SELECT id FROM scene_signs WHERE scene_id = ? AND sign_id = ?', [sceneId, sign_id], (dupErr, dup) => {
            if (dupErr) { return res.status(500).json({ error: '服务器错误' }); }
            if (dup) { return res.status(409).json({ error: '该标志已存在于场景中' }); }

            // 获取当前最大排序值
            db.get('SELECT MAX(display_order) as max_order FROM scene_signs WHERE scene_id = ?', [sceneId], (orderErr, result) => {
                if (orderErr) { return res.status(500).json({ error: '服务器错误' }); }
                const display_order = (result.max_order || 0) + 1;
                const sql = `
                    INSERT INTO scene_signs
                    (scene_id, sign_id, display_order, installation_height, observation_distance, special_requirements)
                    VALUES (?, ?, ?, ?, ?, ?)
                `;
                db.run(sql, [sceneId, sign_id, display_order, installation_height, observation_distance, special_requirements], function(insErr) {
                    if (insErr) { return res.status(500).json({ error: '添加失败，请重试' }); }
                    res.json({ id: this.lastID, message: '标志添加成功' });
                });
            });
        });
    });
});

// 从场景中移除单个标志
app.delete('/api/scene-signs/:id', (req, res) => {
    const relationId = req.params.id;
    db.get('SELECT * FROM scene_signs WHERE id = ?', [relationId], (err, row) => {
        if (err) { res.status(500).json({ error: '服务器错误' }); return; }
        if (!row) { res.status(404).json({ error: '关联记录不存在' }); return; }
        db.run('DELETE FROM scene_signs WHERE id = ?', [relationId], function(err) {
            if (err) { res.status(500).json({ error: '服务器错误' }); return; }
            res.json({ success: true, message: '标志已从场景移除', deletedId: relationId });
        });
    });
});

// ==================== 工作岗位管理API ====================

// 获取所有岗位（支持按scene_id和department筛选）
app.get('/api/workstations', (req, res) => {
    var sql = `SELECT w.*, s.scene_name, s.scene_code,
        (SELECT COUNT(*) FROM scene_signs ss WHERE ss.scene_id = w.scene_id) as sign_count
        FROM workstations w
        LEFT JOIN scenes_new s ON w.scene_id = s.id WHERE 1=1`;
    var params = [];
    if (req.query.scene_id) { sql += ' AND w.scene_id = ?'; params.push(req.query.scene_id); }
    if (req.query.department) { sql += ' AND w.department = ?'; params.push(req.query.department); }
    sql += ' ORDER BY w.workstation_code';
    db.all(sql, params, (err, rows) => {
        if (err) { res.status(500).json({ error: '服务器错误' }); return; }
        res.json(rows);
    });
});

// 获取单个岗位
// 获取下一个岗位编码（必须在 /:id 之前注册）
app.get('/api/workstations/next-code', (req, res) => {
    db.all('SELECT workstation_code FROM workstations', (err, rows) => {
        if (err) { res.status(500).json({ error: '服务器错误' }); return; }
        var maxNum = 0;
        (rows || []).forEach(function(r) {
            var m = (r.workstation_code || '').match(/^WS-(\d+)$/);
            if (m) { var n = parseInt(m[1]); if (n > maxNum) maxNum = n; }
        });
        res.json({ next_code: 'WS-' + String(maxNum + 1).padStart(3, '0') });
    });
});

app.get('/api/workstations/:id', (req, res) => {
    db.get('SELECT w.*, s.scene_name, s.scene_code FROM workstations w LEFT JOIN scenes_new s ON w.scene_id = s.id WHERE w.id = ?', [req.params.id], (err, row) => {
        if (err) { res.status(500).json({ error: '服务器错误' }); return; }
        if (!row) { res.status(404).json({ error: '岗位不存在' }); return; }
        res.json(row);
    });
});

// 创建岗位
app.post('/api/workstations', (req, res) => {
    var { workstation_code, workstation_name, scene_id, department, location, notes } = req.body;
    if (!workstation_code || !workstation_name || !scene_id) {
        res.status(400).json({ error: '岗位编码、名称和场景ID为必填项' }); return;
    }
    db.run('INSERT INTO workstations (workstation_code, workstation_name, scene_id, department, location, notes) VALUES (?,?,?,?,?,?)',
        [workstation_code, workstation_name, scene_id, department||'', location||'', notes||''], function(err) {
        if (err) {
            if (err.code === 'SQLITE_CONSTRAINT') { res.status(409).json({ error: '岗位编码已存在或场景不存在' }); return; }
            res.status(500).json({ error: '服务器错误' }); return;
        }
        res.json({ id: this.lastID, message: '岗位创建成功' });
    });
});

// 更新岗位
app.put('/api/workstations/:id', (req, res) => {
    var { workstation_code, workstation_name, scene_id, department, location, notes } = req.body;
    var fields = [], vals = [];
    if (workstation_code !== undefined) { fields.push('workstation_code = ?'); vals.push(workstation_code); }
    if (workstation_name !== undefined) { fields.push('workstation_name = ?'); vals.push(workstation_name); }
    if (scene_id !== undefined) { fields.push('scene_id = ?'); vals.push(scene_id); }
    if (department !== undefined) { fields.push('department = ?'); vals.push(department); }
    if (location !== undefined) { fields.push('location = ?'); vals.push(location); }
    if (notes !== undefined) { fields.push('notes = ?'); vals.push(notes); }
    if (!fields.length) { res.status(400).json({ error: '没有要更新的字段' }); return; }
    fields.push('updated_at = CURRENT_TIMESTAMP');
    vals.push(req.params.id);
    db.run('UPDATE workstations SET '+fields.join(',')+' WHERE id = ?', vals, function(err) {
        if (err) { res.status(500).json({ error: '服务器错误' }); return; }
        if (!this.changes) { res.status(404).json({ error: '岗位不存在' }); return; }
        res.json({ success: true, message: '岗位更新成功' });
    });
});

// 删除岗位
app.delete('/api/workstations/:id', (req, res) => {
    db.run('DELETE FROM workstations WHERE id = ?', [req.params.id], function(err) {
        if (err) { res.status(500).json({ error: '服务器错误' }); return; }
        if (!this.changes) { res.status(404).json({ error: '岗位不存在' }); return; }
        res.json({ success: true, message: '岗位删除成功' });
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
                res.status(500).json({ error: '服务器错误' });
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
            res.status(500).json({ error: '服务器错误' });
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
                res.status(500).json({ error: '服务器错误' });
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
            res.status(500).json({ error: '服务器错误' });
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