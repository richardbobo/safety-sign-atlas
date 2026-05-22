# 安全标志图集应用 - 项目结构

## 目录结构
```
safety-sign-atlas/
├── index.html                    # 主页面（单页应用）
├── app-improved.js               # 主前端逻辑
├── server-optimized.js           # 后端服务（Express + SQLite）
├── style.css                     # 全局样式
├── package.json                  # 项目配置
├── data/                         # 初始数据（JSON，首次运行时自动迁移到SQLite）
│   ├── scenes.json              # 场景数据
│   ├── signs.json               # 标志库数据
│   ├── scene_signs.json         # 场景-标志关联
│   └── hazard_tags.json         # 危险源标签
├── uploads/                      # 上传图片存储
├── safety_signs.db              # SQLite数据库（运行时生成）
├── favicon.ico                   # 网站图标
└── README.md                     # 项目说明
```

## 技术栈
- **前端**: HTML5, CSS3, JavaScript (ES6+)
- **后端**: Node.js, Express.js
- **数据库**: SQLite3
- **文件上传**: Multer
- **PDF生成**: jsPDF + html2canvas (CDN)

## 数据库表结构

### scenes_new - 场景表
- id, scene_code, scene_name, department
- hazard_tags, location_description, installation_notes
- scene_image_url, created_at, updated_at

### sign_library - 标志库表
- id, sign_code, sign_name, sign_type (warning/prohibition/instruction/information)
- color_scheme, standard_size, material, description
- image_url, is_ppe, created_at, updated_at

### scene_signs - 场景标志关联表
- id, scene_id, sign_id, display_order
- installation_height, observation_distance, special_requirements, added_at

### custom_hazard_tags - 自定义危险源标签
- id, tag_id, tag_name, color, created_at

## 启动方式
```bash
npm install
PORT=3000 node server-optimized.js
# 访问 http://localhost:3000
```
