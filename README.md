# Instagram Downloader

Ứng dụng web để tải xuống ảnh và video từ Instagram một cách dễ dàng.

## Tính năng

- ✅ **Hỗ trợ đầy đủ tất cả định dạng Instagram:**
  - Posts (`/p/`) - Bài đăng thông thường
  - Reels (`/reel/`) - Video ngắn
  - IGTV (`/tv/`) - Video dài
- ✅ **Tải xuống đa phương tiện:**
  - Ảnh chất lượng cao
  - Video với âm thanh
  - Posts có nhiều ảnh/video
- ✅ **Hỗ trợ đa dạng format URL:**
  - Với/không có `www`
  - Với/không có username trong URL
  - Với/không có trailing slash
  - Với/không có query parameters
- ✅ Giao diện đẹp và dễ sử dụng
- ✅ Validation URL Instagram thông minh
- ✅ Xử lý lỗi chi tiết và thông báo rõ ràng
- ✅ Responsive design cho mọi thiết bị
- ✅ Loading states và feedback trực quan

## Cách sử dụng

1. Mở ứng dụng tại [http://localhost:3000](http://localhost:3000)
2. Sao chép link Instagram (hỗ trợ tất cả định dạng):
   - **Posts**: `https://www.instagram.com/p/ABC123/`
   - **Reels**: `https://www.instagram.com/reel/ABC123/`
   - **IGTV**: `https://www.instagram.com/tv/ABC123/`
   - **Với username**: `https://www.instagram.com/username/p/ABC123/`
3. Dán link vào ô input
4. Nhấn nút "Tải xuống"
5. Chọn ảnh/video muốn tải và nhấn nút tải xuống tương ứng

## Cài đặt và chạy

### Yêu cầu hệ thống
- Node.js 18+ hoặc Bun
- NPM, Yarn, PNPM hoặc Bun

### Cài đặt dependencies

```bash
bun install
# hoặc
npm install
```

### Chạy development server

```bash
bun dev
# hoặc
npm run dev
```

Mở [http://localhost:3000](http://localhost:3000) để xem ứng dụng.

### Build cho production

```bash
bun run build
# hoặc
npm run build
```

### Chạy production server

```bash
bun start
# hoặc
npm start
```

## Công nghệ sử dụng

- **Next.js 15** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Axios** - HTTP client
- **Cheerio** - HTML parsing

## Cấu trúc dự án

```
src/
├── app/
│   ├── api/
│   │   ├── instagram/
│   │   │   └── route.ts      # API xử lý Instagram URLs
│   │   └── download/
│   │       └── route.ts      # API proxy download media
│   ├── components/
│   │   └── InstagramDownloader.tsx  # Component chính
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx              # Trang chủ
```

## API Endpoints

### POST /api/instagram
Xử lý Instagram URL và trả về thông tin media

**Request:**
```json
{
  "url": "https://www.instagram.com/p/ABC123/"
}
```

**Response:**
```json
{
  "media": [
    {
      "type": "image",
      "url": "https://...",
      "thumbnail": "https://..."
    }
  ],
  "caption": "Caption text",
  "username": "username"
}
```

### GET /api/download
Proxy để tải media từ Instagram

**Query Parameters:**
- `url`: URL của media cần tải

## Lưu ý

- Ứng dụng chỉ hoạt động với các bài post Instagram công khai
- Một số bài post có thể không tải được do hạn chế của Instagram
- Ứng dụng tuân thủ các điều khoản sử dụng của Instagram

## Đóng góp

Mọi đóng góp đều được chào đón! Vui lòng tạo issue hoặc pull request.

## License

MIT License
