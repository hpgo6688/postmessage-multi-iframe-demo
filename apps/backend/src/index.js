const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs-extra');

const app = express();
const PORT = process.env.PORT || 3001;

// 中间件配置
app.use(cors()); // 跨域
app.use(express.json());

// 静态文件服务，用于图片预览
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// 配置multer用于文件上传
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../uploads');
    fs.ensureDirSync(uploadPath);
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // 生成唯一文件名：时间戳_原文件名
    const uniqueName = `${Date.now()}_${file.originalname}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 限制文件大小为10MB
  },
  fileFilter: (req, file, cb) => {
    // 只允许图片格式
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('只允许上传图片格式文件'));
    }
  }
});

// 存储图片信息的内存数据结构（实际项目中应使用数据库）
let images = [];

// 启动时扫描uploads文件夹并重建图片列表
const rebuildImageList = async () => {
  try {
    const uploadsPath = path.join(__dirname, '../uploads');
    const files = await fs.readdir(uploadsPath);
    
    for (const filename of files) {
      if (filename.startsWith('.')) continue; // 跳过隐藏文件
      
      const filePath = path.join(uploadsPath, filename);
      const stats = await fs.stat(filePath);
      
      if (stats.isFile()) {
        // 从文件名中提取时间戳和原始文件名
        const match = filename.match(/^(\d+)_(.+)$/);
        if (match) {
          const timestamp = match[1];
          const originalname = match[2];
          
          const imageInfo = {
            id: timestamp,
            filename: filename,
            originalname: originalname,
            size: stats.size,
            mimetype: `image/${path.extname(filename).slice(1)}`,
            url: `/uploads/${filename}`,
            uploadTime: new Date(parseInt(timestamp)).toISOString()
          };
          
          // 检查是否已存在，避免重复添加
          if (!images.find(img => img.id === imageInfo.id)) {
            images.push(imageInfo);
          }
        }
      }
    }
    
    // 按上传时间排序
    images.sort((a, b) => new Date(b.uploadTime) - new Date(a.uploadTime));
    
    console.log(`重建图片列表完成，找到 ${images.length} 张图片`);
  } catch (error) {
    console.error('重建图片列表失败:', error);
  }
};

// API路由

// 上传单个图片
app.post('/api/upload', upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: '没有文件被上传' });
    }

    const imageInfo = {
      id: Date.now().toString(),
      filename: req.file.filename,
      originalname: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype,
      url: `/uploads/${req.file.filename}`,
      uploadTime: new Date().toISOString()
    };

    images.push(imageInfo);

    res.json({
      success: true,
      message: '图片上传成功',
      data: imageInfo
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 批量上传图片
app.post('/api/upload/multiple', upload.array('images', 10), (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: '没有文件被上传' });
    }

    const uploadedImages = req.files.map(file => {
      const imageInfo = {
        id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        filename: file.filename,
        originalname: file.originalname,
        size: file.size,
        mimetype: file.mimetype,
        url: `/uploads/${file.filename}`,
        uploadTime: new Date().toISOString()
      };
      images.push(imageInfo);
      return imageInfo;
    });

    res.json({
      success: true,
      message: `成功上传${uploadedImages.length}张图片`,
      data: uploadedImages
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 获取所有图片列表
app.get('/api/images', (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;

  const paginatedImages = images
    .sort((a, b) => new Date(b.uploadTime) - new Date(a.uploadTime))
    .slice(startIndex, endIndex);

  res.json({
    success: true,
    data: {
      images: paginatedImages,
      total: images.length,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(images.length / limit)
    }
  });
});

// 根据ID获取单个图片信息
app.get('/api/images/:id', (req, res) => {
  const { id } = req.params;
  const image = images.find(img => img.id === id);
  
  if (!image) {
    return res.status(404).json({ error: '图片不存在' });
  }
  
  res.json({
    success: true,
    data: image
  });
});

// 删除图片
app.delete('/api/images/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const imageIndex = images.findIndex(img => img.id === id);
    
    if (imageIndex === -1) {
      return res.status(404).json({ error: '图片不存在' });
    }
    
    const image = images[imageIndex];
    const filePath = path.join(__dirname, '../uploads', image.filename);
    
    // 删除文件
    await fs.remove(filePath);
    
    // 从数组中移除
    images.splice(imageIndex, 1);
    
    res.json({
      success: true,
      message: '图片删除成功'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Backend service is running',
    timestamp: new Date().toISOString()
  });
});

// 重建图片列表
app.post('/api/rebuild', async (req, res) => {
  try {
    await rebuildImageList();
    res.json({
      success: true,
      message: `图片列表重建完成，找到 ${images.length} 张图片`,
      count: images.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 错误处理中间件
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: '文件大小超过限制' });
    }
  }
  res.status(500).json({ error: error.message });
});

// 404处理
app.use('*', (req, res) => {
  res.status(404).json({ error: 'API路径不存在' });
});

app.listen(PORT, async () => {
  console.log(`Backend server is running on http://localhost:${PORT}`);
  console.log(`Upload API: http://localhost:${PORT}/api/upload`);
  console.log(`Images API: http://localhost:${PORT}/api/images`);
  
  // 启动时重建图片列表, 以解决图片列表放到全局变量中的问题，其他接口都要用，这个相当于跳过每个接口查询数据库了。直接使用全局变量缓存。
  await rebuildImageList();
});

module.exports = app;