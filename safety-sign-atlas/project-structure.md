# 安全标志图集应用 - 项目结构

## 目录结构
```
safety-sign-atlas/
├── index.html                    # 主页面
├── style.css                     # 全局样式
├── script.js                     # 主JavaScript文件
├── data/                         # 数据存储
│   ├── scenes.json              # 场景数据
│   ├── signs-library.json       # 标志库
│   └── templates.json           # 模板数据
├── pages/                        # 页面组件
│   ├── scene-form.html          # 场景创建表单
│   ├── atlas-display.html       # 图集展示
│   ├── sign-library.html        # 标志库管理
│   └── purchase-system.html     # 采购系统
├── components/                   # 可复用组件
│   ├── sign-editor.js           # 标志编辑器
│   ├── image-uploader.js        # 图片上传
│   ├── pdf-generator.js         # PDF生成
│   └── qr-code-generator.js     # 二维码生成
├── assets/                       # 静态资源
│   ├── images/                  # 图片资源
│   ├── icons/                   # 图标
│   └── templates/               # 模板文件
└── docs/                        # 文档
    ├── api.md                   # API文档
    ├── user-guide.md            # 用户指南
    └── standards.md             # 标准规范
```

## 技术栈
- **前端**: HTML5, CSS3, JavaScript (ES6+)
- **UI框架**: 自定义CSS + 少量Bootstrap
- **数据存储**: localStorage + JSON文件
- **图表**: Chart.js (用于数据分析)
- **PDF生成**: jsPDF + html2canvas
- **二维码**: qrcode.js

## 开发阶段
### 阶段1：基础表单系统 (本周)
- [ ] 场景创建表单
- [ ] 标志组合配置器
- [ ] 图片上传管理
- [ ] 本地数据存储

### 阶段2：图集展示系统 (下周)
- [ ] 动态图集生成
- [ ] PDF导出功能
- [ ] 响应式设计

### 阶段3：管理系统 (下下周)
- [ ] 标志库管理
- [ ] 采购系统
- [ ] 用户权限

### 阶段4：高级功能 (月底)
- [ ] 二维码追溯
- [ ] 移动端APP
- [ ] API集成