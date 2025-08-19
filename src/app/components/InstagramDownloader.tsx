'use client';

import { useState } from 'react';
import axios from 'axios';

interface InstagramMedia {
  type: 'image' | 'video';
  url: string;
  thumbnail?: string;
}

interface InstagramPost {
  media: InstagramMedia[];
  caption?: string;
  username?: string;
}

export default function InstagramDownloader() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [post, setPost] = useState<InstagramPost | null>(null);

  const validateInstagramUrl = (url: string): boolean => {
    // Support all Instagram post formats:
    // https://www.instagram.com/p/ABC123/
    // https://www.instagram.com/username/p/ABC123/
    // https://www.instagram.com/reel/ABC123/
    // https://www.instagram.com/username/reel/ABC123/
    // https://www.instagram.com/tv/ABC123/
    // https://www.instagram.com/username/tv/ABC123/
    // With or without www, trailing slash, and query parameters
    const instagramUrlRegex = /^https?:\/\/(www\.)?instagram\.com\/([A-Za-z0-9_.]+\/)?(p|reel|tv)\/[A-Za-z0-9_-]+\/?(\?.*)?$/;
    return instagramUrlRegex.test(url);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedUrl = url.trim();

    if (!trimmedUrl) {
      setError('Vui lòng nhập URL Instagram');
      return;
    }

    if (!validateInstagramUrl(trimmedUrl)) {
      setError('URL không hợp lệ. Vui lòng nhập link Instagram hợp lệ:\n• Posts: https://www.instagram.com/p/ABC123/\n• Reels: https://www.instagram.com/reel/ABC123/\n• IGTV: https://www.instagram.com/tv/ABC123/');
      return;
    }

    setLoading(true);
    setError('');
    setPost(null);

    try {
      const response = await axios.post('/api/instagram', { url: trimmedUrl });
      setPost(response.data);
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Có lỗi xảy ra khi xử lý URL';

      // Provide more specific error messages
      if (err.response?.status === 404) {
        setError('Không thể tìm thấy bài post này. Vui lòng kiểm tra lại URL hoặc đảm bảo bài post là công khai.');
      } else if (err.response?.status === 429) {
        setError('Quá nhiều yêu cầu. Vui lòng thử lại sau ít phút.');
      } else if (err.code === 'NETWORK_ERROR') {
        setError('Lỗi kết nối mạng. Vui lòng kiểm tra kết nối internet và thử lại.');
      } else {
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const downloadMedia = async (mediaUrl: string, filename: string) => {
    try {
      // Show loading state for download
      const button = document.activeElement as HTMLButtonElement;
      const originalText = button?.textContent;
      if (button) {
        button.disabled = true;
        button.innerHTML = '<div class="flex items-center gap-2"><div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>Đang tải...</div>';
      }

      // Use our proxy API to download the media
      const proxyUrl = `/api/download?url=${encodeURIComponent(mediaUrl)}`;
      const response = await fetch(proxyUrl);

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('File không tồn tại hoặc đã bị xóa');
        } else if (response.status === 403) {
          throw new Error('Không có quyền truy cập file này');
        } else {
          throw new Error('Không thể tải xuống file');
        }
      }

      const blob = await response.blob();

      if (blob.size === 0) {
        throw new Error('File rỗng hoặc không hợp lệ');
      }

      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);

      // Reset button state
      if (button && originalText) {
        button.disabled = false;
        button.innerHTML = originalText;
      }
    } catch (error: any) {
      console.error('Error downloading media:', error);

      // Reset button state
      const button = document.activeElement as HTMLButtonElement;
      if (button) {
        button.disabled = false;
        button.innerHTML = '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>Tải xuống';
      }

      alert(error.message || 'Có lỗi xảy ra khi tải xuống file');
    }
  };

  const getFileExtension = (url: string, type: string) => {
    if (type === 'video') return 'mp4';
    if (url.includes('.jpg') || url.includes('.jpeg')) return 'jpg';
    if (url.includes('.png')) return 'png';
    return 'jpg'; // default
  };

  return (
    <div className="bg-white rounded-2xl shadow-2xl p-8">
      <form onSubmit={handleSubmit} className="mb-8">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Dán link Instagram vào đây... (Posts, Reels, IGTV)"
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none text-gray-700 placeholder-gray-400"
              disabled={loading}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-8 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-lg hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Đang xử lý...
              </div>
            ) : (
              'Tải xuống'
            )}
          </button>
        </div>
      </form>

      {error && (
        <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {error}
          </div>
        </div>
      )}

      {post && (
        <div className="space-y-6">
          {post.username && (
            <div className="flex items-center gap-3 pb-4 border-b border-gray-200">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold">
                {post.username.charAt(0).toUpperCase()}
              </div>
              <span className="font-semibold text-gray-800">@{post.username}</span>
            </div>
          )}

          {post.caption && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-700 leading-relaxed">{post.caption}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {post.media.map((media, index) => (
              <div key={index} className="bg-gray-50 rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow">
                <div className="aspect-square relative">
                  {media.type === 'image' ? (
                    <img
                      src={media.url}
                      alt={`Media ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center relative">
                      {media.thumbnail && (
                        <img
                          src={media.thumbnail}
                          alt={`Video thumbnail ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      )}
                      <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30">
                        <svg className="w-16 h-16 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600 capitalize">
                      {media.type === 'image' ? 'Ảnh' : 'Video'}
                    </span>
                    <button
                      onClick={() => downloadMedia(
                        media.url,
                        `instagram_${media.type}_${index + 1}.${getFileExtension(media.url, media.type)}`
                      )}
                      className="px-4 py-2 bg-blue-500 text-white text-sm font-medium rounded-md hover:bg-blue-600 transition-colors flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Tải xuống
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-8 space-y-4">
        <div className="p-4 bg-blue-50 rounded-lg">
          <h3 className="font-semibold text-blue-800 mb-2">Hướng dẫn sử dụng:</h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Sao chép link Instagram (hỗ trợ tất cả định dạng):</li>
            <li className="ml-4">- Posts: https://www.instagram.com/p/ABC123/</li>
            <li className="ml-4">- Reels: https://www.instagram.com/reel/ABC123/</li>
            <li className="ml-4">- IGTV: https://www.instagram.com/tv/ABC123/</li>
            <li className="ml-4">- Với username: https://www.instagram.com/username/p/ABC123/</li>
            <li>• Dán link vào ô input phía trên</li>
            <li>• Nhấn nút "Tải xuống" để xử lý</li>
            <li>• Chọn ảnh/video muốn tải và nhấn nút tải xuống tương ứng</li>
          </ul>
        </div>

        <div className="p-4 bg-yellow-50 rounded-lg">
          <h3 className="font-semibold text-yellow-800 mb-2">Lưu ý quan trọng:</h3>
          <ul className="text-sm text-yellow-700 space-y-1">
            <li>• Chỉ hoạt động với bài post Instagram công khai</li>
            <li>• Không hỗ trợ tài khoản riêng tư</li>
            <li>• Vui lòng tuân thủ bản quyền và điều khoản sử dụng của Instagram</li>
            <li>• Sử dụng có trách nhiệm và chỉ tải nội dung bạn có quyền sử dụng</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
