import React, { useState, useEffect } from 'react';
import './App.css';

// 图片信息接口
interface ImageInfo {
  id: string;
  filename: string;
  originalname: string;
  size: number;
  mimetype: string;
  url: string;
  uploadTime: string;
  fullUrl?: string; // 完整的图片URL
}

// PostMessage事件接口
interface PostMessageEvent {
  type: string;
  data: ImageInfo;
}

function App() {
  const [currentImage, setCurrentImage] = useState<ImageInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'waiting' | 'connected' | 'error'>('waiting');

  // 监听postMessage事件
  useEffect(() => {
    const handleMessage = (event: MessageEvent<PostMessageEvent>) => {
      // 安全检查：验证消息来源
      const allowedOrigins = ['http://localhost:3003'];
      if (!allowedOrigins.includes(event.origin)) {
        console.warn('收到来自未授权源的消息:', event.origin);
        return;
      }

      console.log('收到postMessage:', event.data);

      if (event.data.type === 'SHOW_IMAGE' && event.data.data) {
        setIsLoading(true);
        setError(null);
        setConnectionStatus('connected');
        
        // 模拟加载延迟
        setTimeout(() => {
          setCurrentImage(event.data.data);
          setIsLoading(false);
        }, 300);
      }
    };

    // 添加事件监听器
    window.addEventListener('message', handleMessage);

    // 发送就绪消息给父窗口（适用于iframe和弹窗）
    if (window.parent && window.parent !== window) {
      // 在iframe中
      setTimeout(() => {
        try {
          window.parent.postMessage({ type: 'VIEWER_READY' }, '*');
          setConnectionStatus('connected');
        } catch (err) {
          console.error('发送就绪消息失败:', err);
          setConnectionStatus('error');
        }
      }, 1000);
    } else if (window.opener) {
      // 在弹出窗口中
      setTimeout(() => {
        try {
          window.opener.postMessage({ type: 'VIEWER_READY' }, '*');
          setConnectionStatus('connected');
        } catch (err) {
          console.error('发送就绪消息失败:', err);
          setConnectionStatus('error');
        }
      }, 1000);
    } else {
      // 独立窗口
      setConnectionStatus('waiting');
    }

    // 清理函数
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  // 格式化文件大小
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // 格式化上传时间
  const formatUploadTime = (uploadTime: string): string => {
    const date = new Date(uploadTime);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  // 下载图片
  const downloadImage = () => {
    if (!currentImage || !currentImage.fullUrl) return;

    const link = document.createElement('a');
    link.href = currentImage.fullUrl;
    link.download = currentImage.originalname;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 复制图片链接
  const copyImageLink = async () => {
    if (!currentImage || !currentImage.fullUrl) return;

    try {
      await navigator.clipboard.writeText(currentImage.fullUrl);
      alert('图片链接已复制到剪贴板');
    } catch (err) {
      console.error('复制失败:', err);
      alert('复制失败，请手动复制链接');
    }
  };

  // 全屏查看
  const toggleFullscreen = () => {
    const imageElement = document.querySelector('.main-image') as HTMLImageElement;
    if (!imageElement) return;

    if (!document.fullscreenElement) {
      imageElement.requestFullscreen().catch(err => {
        console.error('进入全屏失败:', err);
      });
    } else {
      document.exitFullscreen();
    }
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>图片查看器</h1>
        <p>项目4: 通过PostMessage接收图片信息</p>
        <div className={`connection-status ${connectionStatus}`}>
          <span className="status-dot"></span>
          {connectionStatus === 'waiting' && '等待连接...'}
          {connectionStatus === 'connected' && '已连接'}
          {connectionStatus === 'error' && '连接错误'}
        </div>
      </header>

      <main className="main-content">
        {isLoading ? (
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>加载图片中...</p>
          </div>
        ) : error ? (
          <div className="error-state">
            <div className="error-icon">⚠️</div>
            <h3>加载失败</h3>
            <p>{error}</p>
          </div>
        ) : currentImage ? (
          <div className="image-viewer">
            {/* 图片展示区域 */}
            <div className="image-display">
              <img
                src={currentImage.fullUrl}
                alt={currentImage.originalname}
                className="main-image"
                onError={() => setError('图片加载失败')}
              />
              <button 
                className="fullscreen-btn"
                onClick={toggleFullscreen}
                title="全屏查看"
              >
                🔍
              </button>
            </div>

            {/* 图片信息面板 */}
            <div className="image-details">
              <div className="details-header">
                <h2>{currentImage.originalname}</h2>
                <div className="action-buttons">
                  <button 
                    className="action-btn download-btn"
                    onClick={downloadImage}
                    title="下载图片"
                  >
                    📥 下载
                  </button>
                  <button 
                    className="action-btn copy-btn"
                    onClick={copyImageLink}
                    title="复制链接"
                  >
                    📋 复制链接
                  </button>
                </div>
              </div>

              <div className="details-grid">
                <div className="detail-item">
                  <span className="detail-label">文件名:</span>
                  <span className="detail-value">{currentImage.filename}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">文件大小:</span>
                  <span className="detail-value">{formatFileSize(currentImage.size)}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">文件类型:</span>
                  <span className="detail-value">{currentImage.mimetype}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">上传时间:</span>
                  <span className="detail-value">{formatUploadTime(currentImage.uploadTime)}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">图片ID:</span>
                  <span className="detail-value">{currentImage.id}</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="welcome-state">
            <div className="welcome-content">
              <p>等待从项目3接收图片信息...</p>
              

              
              <div className="instructions">
                <h3>使用说明:</h3>
                <ol>
                  <li>在项目3（图片列表页面）中点击任意图片</li>
                  <li>图片信息将通过PostMessage同时发送到项目4和项目5</li>
                  <li>支持下载图片和复制链接功能</li>
                  <li>点击图片可全屏查看</li>
                </ol>
              </div>

              <div className="tech-info">
                <h4>技术实现:</h4>
                <ul>
                  <li>使用 <code>window.postMessage</code> 进行iframe通信</li>
                  <li>安全的消息来源验证</li>
                  <li>支持全屏API</li>
                  <li>响应式图片展示</li>
                  <li>支持iframe和弹窗两种模式</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* PostMessage调试信息 */}
      <div className="debug-info">
        <details>
          <summary>调试信息</summary>
          <div className="debug-content">
            <p><strong>监听状态:</strong> {connectionStatus}</p>
            <p><strong>运行模式:</strong> {
              window.parent && window.parent !== window ? 'iframe' : 
              window.opener ? '弹窗' : '独立窗口'
            }</p>
            <p><strong>当前窗口:</strong> {window.location.href}</p>
            <p><strong>父窗口:</strong> {window.opener ? '存在' : '不存在'}</p>
            <p><strong>接收到的图片ID:</strong> {currentImage?.id || '无'}</p>
          </div>
        </details>
      </div>
    </div>
  );
}

export default App;