# PostMessage Demo - 图片上传与跨窗口通信演示

这是一个使用 pnpm workspace + Turbo 构建的 monorepo 项目，演示了图片上传、预览以及跨窗口 PostMessage 通信。

## 项目结构

```
postmessage-demo/
├── apps/
│   ├── backend/           # 项目1: 后端API服务
│   ├── upload-frontend/   # 项目2: 图片上传与列表预览
│   ├── list-frontend/     # 项目3: 图片列表预览
│   ├── viewer-frontend/   # 项目4: 图片查看器（接收PostMessage）
│   └── viewer2-frontend/  # 项目5: 图片查看器v2（增强版）
├── package.json
├── pnpm-workspace.yaml
└── turbo.json
```

## 项目功能

### 项目1: Backend (端口 3001)
- **技术栈**: Node.js + Express + Multer
- **功能**: 
  - 图片上传API (`POST /api/upload`, `POST /api/upload/multiple`)
  - 图片查询API (`GET /api/images`)
  - 图片删除API (`DELETE /api/images/:id`)
  - 静态文件服务

### 项目2: Upload Frontend (端口 3002)
- **技术栈**: React + TypeScript + Vite + Axios
- **功能**:
  - 单个/批量图片上传
  - 图片列表展示
  - 图片预览和删除
  - 分页浏览

### 项目3: List Frontend (端口 3003)
- **技术栈**: React + TypeScript + Vite + Axios
- **功能**:
  - 图片列表展示（只读）
  - 点击图片发送PostMessage到项目4
  - 美观的图片网格布局

### 项目4: Viewer Frontend (端口 3004)
- **技术栈**: React + TypeScript + Vite
- **功能**:
  - 接收来自项目3的PostMessage
  - 展示图片详细信息
  - 支持图片下载和链接复制
  - 全屏查看功能

### 项目5: Viewer2 Frontend (端口 3005)
- **技术栈**: React + TypeScript + Vite
- **功能**:
  - 与项目4相同的基础功能
  - 🆕 增强版视觉设计（紫色主题）
  - 🆕 新增分享图片功能
  - 🆕 更丰富的加载动画
  - 支持Web Share API

## 快速开始

### 1. 安装依赖

```bash
# 在项目根目录下
pnpm install
```

### 2. 启动所有服务

```bash
# 在项目根目录下
pnpm dev
```


### 3. 使用流程

1. **上传图片** - 访问 http://localhost:3002
   - 选择单个或多个图片文件
   - 点击上传按钮
   - 查看上传结果

2. **浏览图片** - 访问 http://localhost:3003
   - 查看已上传的图片列表
   - 点击任意图片

3. **查看详情** - 自动打开 http://localhost:3004 或 http://localhost:3005
   - 通过PostMessage接收图片信息
   - 查看图片详细信息
   - 支持下载和复制链接
   - 项目5还支持分享功能

## PostMessage 通信机制

### 发送方 (项目3)
```javascript
// 打开新窗口
const viewerWindow = window.open('http://localhost:3004', 'imageViewer');

// 发送消息
viewerWindow.postMessage({
  type: 'SHOW_IMAGE',
  data: imageData
}, 'http://localhost:3004');
```

### 接收方 (项目4)
```javascript
// 监听消息
window.addEventListener('message', (event) => {
  // 验证来源
  if (event.origin !== 'http://localhost:3003') return;
  
  // 处理消息
  if (event.data.type === 'SHOW_IMAGE') {
    setCurrentImage(event.data.data);
  }
});
```

## API 接口

### 后端API (http://localhost:3001)

| 方法 | 路径 | 描述 |
|------|------|------|
| POST | `/api/upload` | 上传单个图片 |
| POST | `/api/upload/multiple` | 批量上传图片 |
| GET | `/api/images` | 获取图片列表 |
| GET | `/api/images/:id` | 获取单个图片信息 |
| DELETE | `/api/images/:id` | 删除图片 |
| GET | `/uploads/:filename` | 访问图片文件 |

### 查询参数
- `page`: 页码 (默认: 1)
- `limit`: 每页数量 (默认: 10)

## 技术特性

- ✅ **Monorepo**: 使用 pnpm workspace 管理多个项目
- ✅ **构建工具**: Turbo 并行构建和开发
- ✅ **类型安全**: 全面使用 TypeScript
- ✅ **跨窗口通信**: PostMessage API
- ✅ **文件上传**: 支持单个和批量上传
- ✅ **响应式设计**: 适配移动端和桌面端
- ✅ **安全验证**: PostMessage 来源验证
- ✅ **错误处理**: 完善的错误处理机制

## 开发脚本

```bash
# 开发模式（所有项目）
pnpm dev

# 构建所有项目
pnpm build

# 清理所有项目
pnpm clean

# 运行测试
pnpm test
```

## 目录说明

- `apps/backend/src/`: 后端源代码
- `apps/backend/uploads/`: 图片存储目录
- `apps/*/src/`: 各前端项目源代码
- `apps/*/dist/`: 构建输出目录

## 注意事项

1. **端口配置**: 确保各项目使用不同端口避免冲突
2. **CORS设置**: 后端已配置CORS允许前端访问
3. **PostMessage安全**: 已实现来源验证防止恶意消息
4. **文件大小限制**: 后端限制单个文件最大10MB
5. **文件类型限制**: 只允许图片格式文件

## 故障排除

### 网络问题
如果在安装依赖时遇到网络问题，可以：
1. 使用国内镜像源
2. 配置代理
3. 分别在各项目目录下手动安装

### 端口冲突
如果端口被占用，可以修改各项目的配置文件：
- Backend: `apps/backend/src/index.js` 中的 PORT
- Frontend: `apps/*/vite.config.ts` 中的 server.port

### PostMessage不工作
确保：
1. 项目3和项目4都在运行
2. 浏览器允许弹出窗口
3. 没有浏览器插件阻止跨窗口通信

## 许可证

MIT License