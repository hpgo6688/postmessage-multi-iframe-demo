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

function App() {
  const [images, setImages] = useState<ImageInfo[]>([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // 获取图片列表
  const fetchImages = async (page: number = 1) => {
    try {
      setLoading(true);
      const response = await axios.get<ApiResponse<ImageListData>>(
        `${API_BASE_URL}/api/images?page=${page}&limit=10`
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

  // 上传单个文件
  const uploadSingleFile = async (file: File) => {
    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await axios.post<ApiResponse<ImageInfo>>(
        `${API_BASE_URL}/api/upload`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      if (response.data.success) {
        return response.data.data;
      }
    } catch (error) {
      console.error('上传失败:', error);
      throw error;
    }
  };

  // 批量上传文件
  const uploadMultipleFiles = async (files: FileList) => {
    const formData = new FormData();
    
    for (let i = 0; i < files.length; i++) {
      formData.append('images', files[i]);
    }

    try {
      const response = await axios.post<ApiResponse<ImageInfo[]>>(
        `${API_BASE_URL}/api/upload/multiple`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      if (response.data.success) {
        return response.data.data;
      }
    } catch (error) {
      console.error('批量上传失败:', error);
      throw error;
    }
  };

  // 处理文件上传
  const handleUpload = async () => {
    if (!selectedFiles || selectedFiles.length === 0) {
      alert('请选择要上传的文件');
      return;
    }

    try {
      setUploading(true);

      if (selectedFiles.length === 1) {
        await uploadSingleFile(selectedFiles[0]);
        alert('图片上传成功！');
      } else {
        await uploadMultipleFiles(selectedFiles);
        alert(`成功上传 ${selectedFiles.length} 张图片！`);
      }

      // 清空选择的文件并刷新列表
      setSelectedFiles(null);
      const fileInput = document.getElementById('fileInput') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
      
      fetchImages(currentPage);
    } catch (error) {
      alert('上传失败，请重试');
    } finally {
      setUploading(false);
    }
  };

  // 删除图片
  const deleteImage = async (id: string) => {
    if (!confirm('确定要删除这张图片吗？')) return;

    try {
      await axios.delete(`${API_BASE_URL}/api/images/${id}`);
      alert('图片删除成功');
      fetchImages(currentPage);
    } catch (error) {
      console.error('删除失败:', error);
      alert('删除失败，请重试');
    }
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
        <h1>图片上传与预览系统</h1>
        <p>项目2: 图片上传与列表预览</p>
      </header>

      <main className="main-content">
        {/* 上传区域 */}
        <section className="upload-section">
          <h2>图片上传</h2>
          <div className="upload-area">
            <input
              id="fileInput"
              type="file"
              multiple
              accept="image/*"
              onChange={(e) => setSelectedFiles(e.target.files)}
              className="file-input"
            />
            <div className="upload-info">
              {selectedFiles && selectedFiles.length > 0 && (
                <p>已选择 {selectedFiles.length} 个文件</p>
              )}
            </div>
            <button
              onClick={handleUpload}
              disabled={uploading || !selectedFiles}
              className="upload-btn"
            >
              {uploading ? '上传中...' : '上传图片'}
            </button>
          </div>
        </section>

        {/* 图片列表区域 */}
        <section className="images-section">
          <div className="section-header">
            <h2>图片列表</h2>
            <button onClick={() => fetchImages(currentPage)} className="refresh-btn">
              刷新列表
            </button>
          </div>

          {loading ? (
            <div className="loading">加载中...</div>
          ) : (
            <>
              <div className="images-grid">
                {images.map((image) => (
                  <div key={image.id} className="image-card">
                    <div className="image-container">
                      <img
                        src={`${API_BASE_URL}${image.url}`}
                        alt={image.originalname}
                        className="image"
                      />
                    </div>
                    <div className="image-info">
                      <h3 className="image-title">{image.originalname}</h3>
                      <p className="image-details">
                        大小: {formatFileSize(image.size)}
                      </p>
                      <p className="image-details">
                        上传时间: {new Date(image.uploadTime).toLocaleString()}
                      </p>
                      <div className="image-actions">
                        <button
                          onClick={() => window.open(`${API_BASE_URL}${image.url}`, '_blank')}
                          className="view-btn"
                        >
                          查看原图
                        </button>
                        <button
                          onClick={() => deleteImage(image.id)}
                          className="delete-btn"
                        >
                          删除
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* 分页 */}
              {totalPages > 1 && (
                <div className="pagination">
                  <button
                    onClick={() => fetchImages(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="page-btn"
                  >
                    上一页
                  </button>
                  <span className="page-info">
                    第 {currentPage} 页，共 {totalPages} 页
                  </span>
                  <button
                    onClick={() => fetchImages(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="page-btn"
                  >
                    下一页
                  </button>
                </div>
              )}
            </>
          )}
        </section>
      </main>
    </div>
  );
}

export default App;