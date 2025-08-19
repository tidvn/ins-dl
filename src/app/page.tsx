'use client';

import InstagramDownloader from './components/InstagramDownloader';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-500 to-red-500">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
            Instagram Downloader
          </h1>
          <p className="text-xl text-white/80 max-w-2xl mx-auto">
            Tải xuống ảnh và video từ Instagram một cách dễ dàng.
            Hỗ trợ tất cả định dạng: Posts, Reels, IGTV!
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <InstagramDownloader />
        </div>
      </div>
    </div>
  );
}
