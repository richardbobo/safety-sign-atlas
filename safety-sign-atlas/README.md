# 安全标志图集管理系统

一个用于管理和展示安全标志的Web应用程序，支持场景创建、标志管理、图片上传和PDF导出功能。

## 功能特性

- 🏭 **场景管理**：创建、编辑、删除安全场景
- 🚸 **标志管理**：添加、删除、排序安全标志
- 📷 **图片上传**：支持场景图片和安全标志图片上传
- 📄 **PDF导出**：生成场景安全标志配置PDF文档
- 🏷️ **标签系统**：自定义危险标签和分类
- 📱 **响应式设计**：适配桌面和移动设备

## 技术栈

- **前端**：HTML5, CSS3, JavaScript (ES6+)
- **后端**：Node.js, Express.js
- **数据库**：SQLite3
- **文件上传**：Multer
- **PDF生成**：jsPDF, html2canvas

## 安装和运行

### 前置要求
- Node.js (v14+)
- npm 或 yarn

### 安装步骤

1. 克隆仓库：
```bash
git clone https://github.com/richardbobo/safety-sign-atlas.git
cd safety-sign-atlas
```

2. 安装依赖：
```bash
npm install
```

3. 启动服务器：
```bash
npm start
```

4. 开发模式（自动重启）：
```bash
npm run dev
```

5. 在浏览器中访问：
```
http://localhost:3000
```

## 项目结构

```
safety-sign-atlas/
├── index.html              # 主页面
├── app-improved.js         # 主JavaScript文件
├── server-optimized.js     # 服务器文件
├── database.js            # 数据库操作
├── style.css              # 样式文件
├── package.json           # 项目配置
├── components/            # 组件目录
├── add-signs-three-column.html  # 添加标志页面
├── new-scene-detail-simple.html # 场景详情页面
├── uploads/               # 上传文件目录
└── README.md              # 项目说明
```

## API接口

### 场景管理
- `GET /api/scenes` - 获取所有场景
- `GET /api/scenes/:id` - 获取单个场景
- `POST /api/scenes` - 创建场景
- `PUT /api/scenes/:id` - 更新场景
- `DELETE /api/scenes/:id` - 删除场景

### 标志管理
- `GET /api/signs` - 获取所有安全标志
- `GET /api/signs/:id` - 获取单个标志
- `POST /api/signs` - 创建标志
- `PUT /api/signs/:id` - 更新标志
- `DELETE /api/signs/:id` - 删除标志

### 文件上传
- `POST /api/upload/scene-image` - 上传场景图片
- `POST /api/upload/sign-image` - 上传标志图片

## 数据库设计

### scenes表
- id: 主键
- scene_code: 场景编码
- scene_name: 场景名称
- location_description: 位置描述
- hazard_tags: 危险标签
- scene_image_url: 场景图片URL
- created_at: 创建时间
- updated_at: 更新时间

### safety_signs表
- id: 主键
- sign_code: 标志编码
- sign_name: 标志名称
- sign_type: 标志类型（warning/prohibition/instruction/information）
- image_url: 图片URL
- description: 描述
- display_order: 显示顺序
- created_at: 创建时间

### scene_signs表（关联表）
- scene_id: 场景ID
- sign_id: 标志ID
- added_at: 添加时间

## 使用说明

1. **创建场景**：点击"创建新场景"按钮，填写场景信息
2. **添加标志**：在场景详情页面点击"添加标志"按钮
3. **上传图片**：支持拖拽上传或点击选择文件
4. **生成PDF**：在场景详情页面点击"生成PDF"按钮
5. **管理标志**：在标志管理页面可以查看、编辑、删除所有安全标志

## 开发说明

### 数据库初始化
项目首次运行时会自动创建数据库表和初始数据。

### 图片存储
上传的图片保存在`uploads/`目录下，按日期和类型分类存储。

### 环境配置
默认使用SQLite数据库，无需额外配置。如需更改数据库配置，请修改`database.js`文件。

## 许可证

MIT License

## 作者

Richard Bobo

## 联系方式

- GitHub: [@richardbobo](https://github.com/richardbobo)
- 项目地址: https://github.com/richardbobo/safety-sign-atlas