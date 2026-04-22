// 数据库模块 - 使用SQLite
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

// 数据库文件路径
const DB_PATH = path.join(__dirname, 'safety_signs.db');

// 确保数据库目录存在
const dbDir = path.dirname(DB_PATH);
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
}

// 创建数据库连接
let db = new sqlite3.Database(DB_PATH, (err) => {
    if (err) {
        console.error('数据库连接错误:', err.message);
    } else {
        console.log('已连接到SQLite数据库');
        initializeDatabase();
    }
});

// 初始化数据库表
function initializeDatabase() {
    // 场景表
    db.run(`CREATE TABLE IF NOT EXISTS scenes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        scene_code TEXT NOT NULL UNIQUE,
        scene_name TEXT NOT NULL,
        department TEXT NOT NULL,
        risk_level TEXT,
        description TEXT,
        material TEXT,
        installation_method TEXT,
        height_from_ground REAL DEFAULT 1.5,
        viewing_distance INTEGER DEFAULT 3,
        part_code TEXT,
        unit_price REAL DEFAULT 0,
        supplier TEXT,
        lead_time INTEGER DEFAULT 3,
        status TEXT DEFAULT 'active',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        created_by TEXT DEFAULT '波仔'
    )`);

    // 安全标志表
    db.run(`CREATE TABLE IF NOT EXISTS safety_signs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        scene_id INTEGER NOT NULL,
        sign_type TEXT NOT NULL,
        sign_name TEXT NOT NULL,
        sign_size TEXT DEFAULT 'Φ200mm',
        display_order INTEGER NOT NULL,
        FOREIGN KEY (scene_id) REFERENCES scenes (id) ON DELETE CASCADE
    )`);

    // 图片表
    db.run(`CREATE TABLE IF NOT EXISTS images (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        scene_id INTEGER NOT NULL,
        image_type TEXT NOT NULL, -- 'scene_photo', 'sign_photo', 'layout_diagram'
        filename TEXT NOT NULL,
        filepath TEXT NOT NULL,
        description TEXT,
        uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (scene_id) REFERENCES scenes (id) ON DELETE CASCADE
    )`);

    // 创建索引
    db.run('CREATE INDEX IF NOT EXISTS idx_scenes_department ON scenes(department)');
    db.run('CREATE INDEX IF NOT EXISTS idx_scenes_status ON scenes(status)');
    db.run('CREATE INDEX IF NOT EXISTS idx_signs_scene_id ON safety_signs(scene_id)');
    db.run('CREATE INDEX IF NOT EXISTS idx_images_scene_id ON images(scene_id)');

    console.log('数据库表初始化完成');
}

// 场景CRUD操作
const SceneModel = {
    // 创建场景
    create: (sceneData) => {
        return new Promise((resolve, reject) => {
            const {
                scene_code, scene_name, department, risk_level, description,
                material, installation_method, height_from_ground, viewing_distance,
                part_code, unit_price, supplier, lead_time, created_by
            } = sceneData;

            const sql = `INSERT INTO scenes (
                scene_code, scene_name, department, risk_level, description,
                material, installation_method, height_from_ground, viewing_distance,
                part_code, unit_price, supplier, lead_time, created_by
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

            db.run(sql, [
                scene_code, scene_name, department, risk_level, description,
                material, installation_method, height_from_ground, viewing_distance,
                part_code, unit_price, supplier, lead_time, created_by || '波仔'
            ], function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve(this.lastID);
                }
            });
        });
    },

    // 获取所有场景
    getAll: (filters = {}) => {
        return new Promise((resolve, reject) => {
            let sql = 'SELECT * FROM scenes WHERE 1=1';
            const params = [];

            if (filters.department) {
                sql += ' AND department = ?';
                params.push(filters.department);
            }

            if (filters.status) {
                sql += ' AND status = ?';
                params.push(filters.status);
            }

            if (filters.search) {
                sql += ' AND (scene_code LIKE ? OR scene_name LIKE ? OR description LIKE ?)';
                const searchTerm = `%${filters.search}%`;
                params.push(searchTerm, searchTerm, searchTerm);
            }

            sql += ' ORDER BY created_at DESC';

            db.all(sql, params, (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    },

    // 根据ID获取场景
    getById: (id) => {
        return new Promise((resolve, reject) => {
            db.get('SELECT * FROM scenes WHERE id = ?', [id], (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(row);
                }
            });
        });
    },

    // 根据编码获取场景
    getByCode: (sceneCode) => {
        return new Promise((resolve, reject) => {
            db.get('SELECT * FROM scenes WHERE scene_code = ?', [sceneCode], (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(row);
                }
            });
        });
    },

    // 更新场景
    update: (id, updateData) => {
        return new Promise((resolve, reject) => {
            const fields = [];
            const values = [];

            Object.keys(updateData).forEach(key => {
                if (key !== 'id') {
                    fields.push(`${key} = ?`);
                    values.push(updateData[key]);
                }
            });

            fields.push('updated_at = CURRENT_TIMESTAMP');
            values.push(id);

            const sql = `UPDATE scenes SET ${fields.join(', ')} WHERE id = ?`;

            db.run(sql, values, function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve(this.changes);
                }
            });
        });
    },

    // 删除场景
    delete: (id) => {
        return new Promise((resolve, reject) => {
            db.run('DELETE FROM scenes WHERE id = ?', [id], function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve(this.changes);
                }
            });
        });
    },

    // 获取场景统计
    getStats: () => {
        return new Promise((resolve, reject) => {
            const stats = {};

            // 总场景数
            db.get('SELECT COUNT(*) as total FROM scenes', (err, row) => {
                if (err) return reject(err);
                stats.totalScenes = row.total;

                // 按部门统计
                db.all('SELECT department, COUNT(*) as count FROM scenes GROUP BY department', (err, rows) => {
                    if (err) return reject(err);
                    stats.byDepartment = rows;

                    // 按状态统计
                    db.all('SELECT status, COUNT(*) as count FROM scenes GROUP BY status', (err, rows) => {
                        if (err) return reject(err);
                        stats.byStatus = rows;
                        resolve(stats);
                    });
                });
            });
        });
    }
};

// 安全标志CRUD操作
const SafetySignModel = {
    // 为场景添加标志
    addToScene: (sceneId, signData) => {
        return new Promise((resolve, reject) => {
            const { sign_type, sign_name, sign_size, display_order } = signData;
            const sql = `INSERT INTO safety_signs (scene_id, sign_type, sign_name, sign_size, display_order)
                        VALUES (?, ?, ?, ?, ?)`;

            db.run(sql, [sceneId, sign_type, sign_name, sign_size || 'Φ200mm', display_order], function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve(this.lastID);
                }
            });
        });
    },

    // 获取场景的所有标志
    getBySceneId: (sceneId) => {
        return new Promise((resolve, reject) => {
            db.all('SELECT * FROM safety_signs WHERE scene_id = ? ORDER BY display_order', [sceneId], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    },

    // 更新标志
    update: (id, updateData) => {
        return new Promise((resolve, reject) => {
            const fields = [];
            const values = [];

            Object.keys(updateData).forEach(key => {
                if (key !== 'id') {
                    fields.push(`${key} = ?`);
                    values.push(updateData[key]);
                }
            });

            values.push(id);
            const sql = `UPDATE safety_signs SET ${fields.join(', ')} WHERE id = ?`;

            db.run(sql, values, function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve(this.changes);
                }
            });
        });
    },

    // 删除标志
    delete: (id) => {
        return new Promise((resolve, reject) => {
            db.run('DELETE FROM safety_signs WHERE id = ?', [id], function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve(this.changes);
                }
            });
        });
    },

    // 删除场景的所有标志
    deleteBySceneId: (sceneId) => {
        return new Promise((resolve, reject) => {
            db.run('DELETE FROM safety_signs WHERE scene_id = ?', [sceneId], function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve(this.changes);
                }
            });
        });
    }
};

// 图片CRUD操作
const ImageModel = {
    // 添加图片
    add: (imageData) => {
        return new Promise((resolve, reject) => {
            const { scene_id, image_type, filename, filepath, description } = imageData;
            const sql = `INSERT INTO images (scene_id, image_type, filename, filepath, description)
                        VALUES (?, ?, ?, ?, ?)`;

            db.run(sql, [scene_id, image_type, filename, filepath, description], function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve(this.lastID);
                }
            });
        });
    },

    // 获取场景的所有图片
    getBySceneId: (sceneId, imageType = null) => {
        return new Promise((resolve, reject) => {
            let sql = 'SELECT * FROM images WHERE scene_id = ?';
            const params = [sceneId];

            if (imageType) {
                sql += ' AND image_type = ?';
                params.push(imageType);
            }

            sql += ' ORDER BY uploaded_at DESC';

            db.all(sql, params, (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    },

    // 删除图片
    delete: (id) => {
        return new Promise((resolve, reject) => {
            db.run('DELETE FROM images WHERE id = ?', [id], function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve(this.changes);
                }
            });
        });
    },

    // 删除场景的所有图片
    deleteBySceneId: (sceneId) => {
        return new Promise((resolve, reject) => {
            db.run('DELETE FROM images WHERE scene_id = ?', [sceneId], function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve(this.changes);
                }
            });
        });
    }
};

// 导出模块
module.exports = {
    db,
    SceneModel,
    SafetySignModel,
    ImageModel,
    initializeDatabase
};