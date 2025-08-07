import React, { useState, useEffect } from 'react';
import axios from 'axios';
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
}

// API响应接口
interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

interface ImageListData {
  images: ImageInfo[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const API_BASE_URL = 'http://localhost:3001';
const VIEWER_URL = 'http://localhost:3005'; // 项目5的地址
const VIEWER4_URL = 'http://localhost:3004'; // 项目4的地址

function App() {
  const [images, setImages] = useState<ImageInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // 获取图片列表
  const fetchImages = async (page: number = 1) => {
    try {
      setLoading(true);
      const response = await axios.get<ApiResponse<ImageListData>>(
        `${API_BASE_URL}/api/images?page=${page}&limit=12`
      );
      
      if (response.data.success) {
        setImages(response.data.data.images);
        setCurrentPage(response.data.data.page);
        setTotalPages(response.data.data.totalPages);
      }
    } catch (error) {
      console.error('获取图片列表失败:', error);
      alert('获取图片列表失败');
    } finally {
      setLoading(false);
    }
  };

  // 发送postMessage到项目4
  const sendImageToViewer4 = (image: ImageInfo) => {
    const imageData = {
      type: 'SHOW_IMAGE',
      data: {
        ...image,
        fullUrl: `${API_BASE_URL}${image.url}`
      }
    };

    const iframe4 = document.getElementById('viewer4-iframe') as HTMLIFrameElement;
    if (iframe4 && iframe4.contentWindow) {
      console.log('发送到项目4:', `${API_BASE_URL}${image.url}`);
      try {
        iframe4.contentWindow.postMessage(imageData, VIEWER4_URL);
      } catch (error) {
        console.error('发送消息到项目4失败:', error);
      }
    }
  };

  // 发送postMessage到项目5
  const sendImageToViewer5 = (image: ImageInfo) => {
    const imageData = {
      type: 'SHOW_IMAGE',
      data: {
        ...image,
        fullUrl: `${API_BASE_URL}${image.url}`
      }
    };

    const iframe5 = document.getElementById('viewer-iframe') as HTMLIFrameElement;
    if (iframe5 && iframe5.contentWindow) {
      console.log('发送到项目5:', `${API_BASE_URL}${image.url}`);
      try {
        iframe5.contentWindow.postMessage(imageData, VIEWER_URL);
      } catch (error) {
        console.error('发送消息到项目5失败:', error);
      }
    }
  };

  // 发送到两个查看器（点击图片时的默认行为）
  const sendImageToViewer = (image: ImageInfo) => {
    sendImageToViewer4(image);
    sendImageToViewer5(image);
  };

  // 格式化文件大小
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // 组件加载时获取图片列表
  useEffect(() => {
    fetchImages();
  }, []);

  return (
    <div className="app">
      <header className="app-header">
        <h1>图片列表预览</h1>
        <p>项目3: 点击图片发送postMessage到项目4</p>
      </header>

      <main className="main-content">
        <div className="layout-container">
          {/* 左侧图片列表 */}
          <section className="images-section">
            <div className="section-header">
              <h2>图片画廊</h2>
              <div className="header-actions">
                <button onClick={() => fetchImages(currentPage)} className="refresh-btn">
                  刷新列表
                </button>
                <div className="viewer-info">
                  <span>点击图片在右侧查看</span>
                </div>
              </div>
            </div>

          {loading ? (
            <div className="loading">
              <div className="loading-spinner"></div>
              <p>加载中...</p>
            </div>
          ) : (
            <>
              {images.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">📷</div>
                  <h3>暂无图片</h3>
                  <p>请先在项目2中上传一些图片</p>
                </div>
              ) : (
                <div className="images-grid">
                  {images.map((image) => (
                    <div 
                      key={image.id} 
                      className="image-card"
                    >
                      <div className="image-container">
                        <img
                          src={`${API_BASE_URL}${image.url}`}
                          alt={image.originalname}
                          className="image"
                        />
                        <div className="image-overlay">
                          <div className="overlay-content">
                            <span className="view-icon">👁️</span>
                            <span className="view-text">选择查看器</span>
                          </div>
                        </div>
                      </div>
                      <div className="image-info">
                        <h3 className="image-title">{image.originalname}</h3>
                        <div className="image-meta">
                          <span className="image-size">{formatFileSize(image.size)}</span>
                          <span className="image-date">
                            {new Date(image.uploadTime).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="image-actions">
                          <button
                            className="viewer-btn viewer4-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              sendImageToViewer4(image);
                            }}
                            title="发送到项目4"
                          >
                            📺 项目4
                          </button>
                          <button
                            className="viewer-btn viewer5-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              sendImageToViewer5(image);
                            }}
                            title="发送到项目5"
                          >
                            ✨ 项目5
                          </button>
                          <button
                            className="viewer-btn both-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              sendImageToViewer(image);
                            }}
                            title="发送到两个查看器"
                          >
                            🔄 同时发送
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* 分页 */}
              {totalPages > 1 && (
                <div className="pagination">
                  <button
                    onClick={() => fetchImages(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="page-btn prev-btn"
                  >
                    ← 上一页
                  </button>
                  
                  <div className="page-numbers">
                    {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      
                      return (
                        <button
                          key={pageNum}
                          onClick={() => fetchImages(pageNum)}
                          className={`page-btn number-btn ${currentPage === pageNum ? 'active' : ''}`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    onClick={() => fetchImages(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="page-btn next-btn"
                  >
                    下一页 →
                  </button>
                </div>
              )}
            </>
          )}
          </section>

          {/* 右侧查看器区域 */}
          <section className="viewers-section">
             {/* 项目4查看器 */}
             <div className="viewer-section">
              <div className="viewer-header">
                <h2>项目4 查看器</h2>
                <div className="viewer-status">
                  <span className="status-dot"></span>
                  项目4 iframe
                </div>
              </div>
              <div className="iframe-container">
                <iframe
                  id="viewer4-iframe"
                  src={VIEWER4_URL}
                  title="项目4图片查看器"
                  className="viewer-iframe"
                />
              </div>
            </div>
            
            {/* 项目5查看器 */}
            <div className="viewer-section">
              <div className="viewer-header">
                <h2>项目5 查看器</h2>
                <div className="viewer-status">
                  <span className="status-dot"></span>
                  项目5 iframe
                </div>
              </div>
              <div className="iframe-container">
                <iframe
                  id="viewer-iframe"
                  src={VIEWER_URL}
                  title="项目5图片查看器"
                  className="viewer-iframe"
                />
              </div>
            </div>

           
          </section>
        </div>

        {/* 使用说明 */}
        <section className="instructions">
          <h3>使用说明</h3>
          <div className="instruction-steps">
            <div className="step">
              <span className="step-number">1</span>
              <p>确保项目4和项目5都在运行（<code>localhost:3004</code> 和 <code>localhost:3005</code>）</p>
            </div>
            <div className="step" style={{display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
              <span className="step-number">2</span>
              <p>每张图片下方有三个按钮：</p>
              <ul>
                <li><strong>📺 项目4</strong> - 只发送到项目4（标准版）</li>
                <li><strong>✨ 项目5</strong> - 只发送到项目5（增强版）</li>
                <li><strong>🔄 同时发送</strong> - 同时发送到两个查看器</li>
              </ul>
            </div>
            <div className="step">
              <span className="step-number">3</span>
              <p>点击对应按钮，右侧iframe将通过postMessage显示图片详情</p>
            </div>
            <div className="step">
              <span className="step-number">4</span>
              <p>上方是项目5（增强版），下方是项目4（标准版）</p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;