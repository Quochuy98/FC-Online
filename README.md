# FC Online Player Database

🎮 **Full-stack application** để crawl và tra cứu thông tin cầu thủ FC Online

## 📦 Dự án bao gồm

### 1. 🕷️ **Crawler** - Thu thập dữ liệu
- Crawl từ https://automua.com/players
- Lưu vào MongoDB
- Auto-resume, parallel processing

### 2. 🌐 **Web Application** - Tra cứu cầu thủ
- Giao diện đẹp, dễ sử dụng
- Tìm kiếm với filters (position, season, overall)
- Season badges với spritesheet icons
- Trang chi tiết đầy đủ thông tin

### 3. 🔌 **REST API** - API Server
- Search players
- Get player details
- Stats aggregation

## ✨ Tính năng

### Crawler
- ✅ Crawl theo vị trí và mùa giải
- ✅ Multi-season crawl với auto-resume
- ✅ Parallel processing (3-40 concurrent)
- ✅ Progress tracking & ETA
- ✅ Lưu stats, hidden stats, club career
- ✅ Retry logic và rate limiting

### Web App
- ✅ **Tailwind CSS** - Modern, beautiful UI
- ✅ Tìm kiếm cầu thủ nhanh chóng
- ✅ Filters: tên, vị trí, mùa giải, overall
- ✅ Season badges với spritesheet icons
- ✅ Chi tiết đầy đủ chỉ số với color-coding
- ✅ Fully responsive design
- ✅ Smooth animations & transitions
- ✅ Gradient backgrounds & modern styling

## Yêu cầu hệ thống

- Node.js >= 14.x
- MongoDB >= 4.x

## Cài đặt

1. Clone repository hoặc tải source code

2. Cài đặt dependencies:

```bash
npm install
```

3. Tạo file `.env` (copy từ `.env.example`):

```bash
# MongoDB Connection String
MONGODB_URI=mongodb://localhost:27017/fconline

# Database Name
DB_NAME=fconline

# Collections
PLAYERS_COLLECTION=players

# Crawl Configuration
REQUEST_DELAY=1000
MAX_RETRIES=3

# Base URL
BASE_URL=https://automua.com
```

4. Đảm bảo MongoDB đã chạy

## 🚀 Quick Start

### Option 1: Chạy Web Application (Khuyến nghị)

```bash
# 1. Đảm bảo đã có dữ liệu (crawl trước)
npm start season ICON

# 2. Khởi động web server
npm run server

# 3. Mở trình duyệt
# Truy cập: http://localhost:3000
```

**Xem chi tiết:** [QUICK_START_WEB.md](QUICK_START_WEB.md)

### Option 2: Crawl dữ liệu

```bash
# Crawl một mùa giải
npm start season ICON

# Crawl nhiều mùa với auto-resume
npm start seasons 10
```

## Sử dụng

### 🌐 Web Application

### Crawl tất cả vị trí cho một mùa giải (Khuyến nghị)

```bash
# Tự động crawl tuần tự tất cả 15 vị trí: ST → LW → RW → ... → GK
npm start season EL

# Crawl mùa ICON
npm start season ICON

# Crawl mùa 25TY  
npm start season 25TY
```

**Lưu ý quan trọng:** Mỗi lần crawl sẽ lấy **TẤT CẢ** cầu thủ có thẻ mùa đó. Ví dụ:
- `npm start season EL` → Lấy tất cả cầu thủ có thẻ EL
- `npm start season ICON` → Lấy tất cả cầu thủ có thẻ ICON

### Crawl một vị trí cụ thể cho một mùa giải

```bash
npm start position ST EL
```

### Crawl nhiều vị trí và mùa giải

```bash
# Crawl 3 vị trí tấn công cho 3 mùa giải riêng biệt
npm start custom ST,LW,RW EL,ICON,ICONTM
```

**Chi tiết về URL parameters:** Xem [URL_PARAMS_EXPLAINED.md](./URL_PARAMS_EXPLAINED.md)

### Crawl toàn bộ (WARNING: Sẽ mất rất nhiều thời gian!)

```bash
npm start all
```

### Force re-crawl (cập nhật lại dữ liệu đã có)

```bash
npm start season EL --force
```

### Xem hướng dẫn

```bash
npm start help
```

## Cấu trúc dữ liệu

Mỗi cầu thủ được lưu trong MongoDB với cấu trúc sau:

```javascript
{
  playerId: "cristiano-ronaldo-zzwyoyoy",
  name: "Cristiano Ronaldo",
  season: "EL",
  position: "ST",
  playerUrl: "https://automua.com/players/cristiano-ronaldo-zzwyoyoy",
  avatarUrl: "https://i.automua.com/fo4/players/zzwyoyoy.png?v=20112025",
  mainImageUrl: "https://i.automua.com/fo4/players/zzwyoyoy.png?v=20112025",
  overallRating: 38,
  starRating: 5,
  positions: [
    { position: "ST", rating: "135" },
    { position: "LW", rating: "134" }
  ],
  // Stats with English keys for easy querying
  stats: {
    speed: { name: "Tốc độ", value: 139, baseValue: 136, originalValue: 139 },
    acceleration: { name: "Tăng tốc", value: 139, baseValue: 136, originalValue: 139 },
    finishing: { name: "Dứt điểm", value: 141, baseValue: 138, originalValue: 141 },
    shotPower: { name: "Lực sút", value: 140, baseValue: 137, originalValue: 140 },
    // ... 30+ stats with English keys and Vietnamese names
  },
  hiddenStats: [
    {
      name: "Sát thủ băng cắt",
      description: "Di chuyển nhanh đến điểm rơi trong các tình huống tạt bóng",
      iconUrl: "https://..."
    },
    // ... các chỉ số ẩn khác
  ],
  clubCareer: [
    { period: "2023", club: "Al Nassr" },
    { period: "2021 - 2022", club: "Manchester United" },
    // ... các CLB khác
  ],
  scrapedAt: "2026-01-21T10:30:00.000Z",
  createdAt: "2026-01-21T10:30:00.000Z",
  updatedAt: "2026-01-21T10:30:00.000Z"
}
```

**Lưu ý**: Stats sử dụng English keys (`speed`, `finishing`, etc.) để dễ query và code, nhưng vẫn giữ Vietnamese name để display. Xem [STATS_REFERENCE.md](./STATS_REFERENCE.md) để biết chi tiết.

## Cấu trúc thư mục

```
.
├── src/
│   ├── config/
│   │   └── constants.js          # Hằng số và cấu hình
│   ├── database/
│   │   ├── connection.js         # Kết nối MongoDB
│   │   └── playerRepository.js   # Database operations
│   ├── services/
│   │   ├── httpClient.js         # HTTP client với retry logic
│   │   ├── playerListScraper.js  # Scraper cho danh sách cầu thủ
│   │   ├── playerDetailScraper.js # Scraper cho chi tiết cầu thủ
│   │   └── crawlerService.js     # Orchestration service
│   ├── utils/
│   │   ├── logger.js             # Logger utility
│   │   └── delay.js              # Delay utility
│   └── index.js                  # Entry point
├── package.json
├── .env
├── .env.example
└── README.md
```

## Các vị trí hỗ trợ

ST, LW, RW, CF, CAM, LM, RM, CM, CDM, LWB, RWB, LB, RB, CB, GK

## Các mùa giải hỗ trợ

ICONTM, ICON, ICONTMB, FAC, 25DP, FSL, WS, DCB, CH, 25IM, 25IMF, LE, NO7, WB, GRU, BDO, BLD, PRM, 24EP, CU, MDL, LD, UT, JNM, DC, FC, 23HW, CC, HG, RTN, BWC, WC22, và nhiều mùa khác...

(Xem danh sách đầy đủ trong `src/config/constants.js`)

## Lưu ý

- Crawler tự động delay 1 giây giữa các requests để tránh quá tải server
- Mặc định sẽ skip các cầu thủ đã có trong database. Dùng `--force` để cập nhật lại
- Crawl toàn bộ sẽ mất rất nhiều thời gian do có hàng nghìn cầu thủ
- Nên crawl theo từng mùa giải hoặc vị trí để dễ quản lý
- Database sẽ tự động tạo indexes để tối ưu query performance

## Troubleshooting

### Lỗi kết nối MongoDB

Đảm bảo MongoDB đã chạy và connection string trong `.env` đúng.

### Request timeout

Có thể tăng `REQUEST_DELAY` trong `.env` nếu gặp lỗi rate limiting.

### Memory issues

Nếu crawl số lượng lớn, có thể restart crawler theo từng batch nhỏ hơn.

## 📚 Documentation

### Web Application
- **[QUICK_START_WEB.md](QUICK_START_WEB.md)** - Quick start cho web app
- **[WEB_APP_GUIDE.md](WEB_APP_GUIDE.md)** - Hướng dẫn đầy đủ web app & API
- **[FRONTEND_GUIDE.md](FRONTEND_GUIDE.md)** - Tailwind CSS guide & best practices

### Crawler
- **[START_HERE.md](START_HERE.md)** - Getting started với crawler
- **[CRAWLING_GUIDE.md](CRAWLING_GUIDE.md)** - Hướng dẫn crawl chi tiết
- **[MULTI_SEASON_CRAWL.md](MULTI_SEASON_CRAWL.md)** - Crawl nhiều mùa với auto-resume
- **[PERFORMANCE_TUNING.md](PERFORMANCE_TUNING.md)** - Tối ưu tốc độ crawl
- **[STATS_REFERENCE.md](STATS_REFERENCE.md)** - Reference cho stats schema
- **[URL_PARAMS_EXPLAINED.md](URL_PARAMS_EXPLAINED.md)** - Giải thích URL parameters

## 📖 Project Structure

```
Drawl_FCONLINE/
├── server/
│   └── api.js                    # Express API server + EJS routes
├── views/                        # ⭐ EJS Templates (Server-side rendering)
│   ├── partials/
│   │   ├── header.ejs            # Shared header (DRY)
│   │   └── footer.ejs            # Shared footer (DRY)
│   └── pages/
│       ├── home.ejs              # Trang tìm kiếm cầu thủ (/)
│       ├── club-search.ejs       # Tìm theo câu lạc bộ (/club-search)
│       ├── player.ejs            # Chi tiết cầu thủ (/player)
│       └── compare.ejs           # So sánh cầu thủ (/compare)
├── public/                       # Static assets
│   ├── css/
│   │   ├── badge.css             # Spritesheet CSS (seasons)
│   │   ├── seasons.css           # Season sprites
│   │   └── upgrade.css           # Upgrade level sprites
│   ├── js/
│   │   ├── api.js                # API client
│   │   ├── search.js             # Search page logic
│   │   ├── club-search.js        # Club search logic
│   │   ├── player-detail.js      # Player detail + training
│   │   └── compare.js            # Player comparison logic
│   └── images/
│       ├── enchant.png           # Upgrade level spritesheet
│       └── spritesheet*.png      # Season sprites
├── src/
│   ├── config/
│   │   ├── constants.js          # Constants
│   │   ├── statsMapping.js       # Stats mapping (VN → EN)
│   │   └── positionCoefficients.json # Position coefficients
│   ├── database/
│   │   ├── connection.js         # MongoDB connection
│   │   └── playerRepository.js   # Database operations
│   ├── services/
│   │   ├── httpClient.js         # HTTP client with retry
│   │   ├── playerListScraper.js  # List scraper
│   │   ├── playerDetailScraper.js # Detail scraper
│   │   └── crawlerService.js     # Crawler orchestration
│   ├── utils/
│   │   ├── logger.js             # Winston logger
│   │   ├── delay.js              # Delay utility
│   │   ├── promisePool.js        # Concurrency control
│   │   ├── progressTracker.js    # Progress tracking
│   │   └── seasonsProgress.js    # Multi-season progress
│   └── index.js                  # Crawler entry point
├── examples/
│   ├── testScraper.js            # Test scraper
│   ├── quickStart.js             # Quick start example
│   └── queryStatsExample.js     # Query examples
├── package.json
├── .env
├── README.md
└── REFACTORING.md               # EJS migration documentation
```

## License

MIT
