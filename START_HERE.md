# 🚀 START HERE - Hướng dẫn bắt đầu nhanh

## 📋 Yêu cầu đã hoàn thành

✅ Crawl danh sách cầu thủ theo vị trí và mùa giải  
✅ Crawl chi tiết từng cầu thủ (stats, hidden stats, club career)  
✅ Lưu vào MongoDB với schema tối ưu  
✅ Retry logic và rate limiting  
✅ Skip existing players  
✅ CLI interface đầy đủ  
✅ Documentation hoàn chỉnh  

---

## ⚡ Bắt đầu trong 3 bước

### Bước 1: Cài đặt dependencies

```bash
npm install
```

### Bước 2: Tạo file .env

Tạo file `.env` với nội dung:

```
MONGODB_URI=mongodb://localhost:27017/fconline
DB_NAME=fconline
PLAYERS_COLLECTION=players
REQUEST_DELAY=1000
MAX_RETRIES=3
BASE_URL=https://automua.com
```

### Bước 3: Chạy test

```bash
# Đảm bảo MongoDB đang chạy
brew services start mongodb-community  # MacOS
# hoặc
sudo systemctl start mongod  # Linux

# Test scraper
npm run test:scraper

# Crawl thử (ST position, EL season)
npm run quickstart
```

---

## 📚 Tài liệu

| File | Mô tả |
|------|-------|
| **QUICKSTART.md** | 👈 **ĐỌC ĐẦU TIÊN** - Setup trong 5 phút |
| **README.md** | Tổng quan project |
| **SETUP.md** | Hướng dẫn cài đặt chi tiết |
| **USAGE_EXAMPLES.md** | Ví dụ queries và use cases |
| **PROJECT_STRUCTURE.md** | Kiến trúc code |
| **SUMMARY.md** | Tóm tắt toàn bộ project |

---

## 🎯 Các lệnh thường dùng

```bash
# 🌟 MỚI: Crawl nhiều mùa giải - AUTO-RESUME nếu bị ngắt! (Khuyến nghị)
npm start seasons 10
# ✅ Crawl 10 mùa giải tuần tự
# ✅ Auto-save checkpoint sau mỗi mùa
# ✅ Nếu bị ngắt (Ctrl+C), chạy lại sẽ tự động tiếp tục!
# ✅ An toàn 100%, không crawl lại mùa đã xong

# Crawl một mùa giải - TỰ ĐỘNG CRAWL TẤT CẢ 15 VỊ TRÍ TUẦN TỰ
npm start season EL
# ✅ Tự động crawl: ST → LW → RW → CF → CAM → ... → GK
# ✅ Hiển thị progress bar và ETA
# ✅ Tự động resume nếu bị ngắt trong mùa

# Crawl một vị trí cụ thể
npm start position ST EL

# Crawl nhiều vị trí và mùa giải
npm start custom ST,LW,RW EL,ICON

# Force update (xóa progress và crawl lại từ đầu)
npm start seasons 10 --force
npm start season EL --force

# Test không lưu DB
npm run test:scraper

# Quick test với DB
npm run quickstart
```

**🎉 Tính năng nổi bật:**
- ✅ **Multi-season crawl với auto-resume** - Crawl nhiều mùa an toàn
- ✅ Progress tracking - tự động resume nếu bị ngắt
- ✅ Parallel processing - nhanh gấp 5x với concurrency
- ✅ ETA (thời gian dự kiến còn lại)
- ✅ Detailed progress cho từng player và position

---

## 🗂️ Cấu trúc project

```
Drawl_FCONLINE/
├── src/                    # Source code
│   ├── config/            # Configuration
│   ├── database/          # MongoDB operations
│   ├── services/          # Crawling logic
│   ├── utils/             # Utilities
│   └── index.js           # Entry point
├── examples/              # Example scripts
│   ├── testScraper.js    # Test mà không lưu DB
│   └── quickStart.js     # Quick test với DB
├── package.json          # Dependencies
├── .env                  # Config (bạn tạo)
└── *.md                  # Documentation
```

---

## 💾 Kiểm tra dữ liệu trong MongoDB

```bash
# Mở MongoDB shell
mongosh

# Chọn database
use fconline

# Đếm số cầu thủ
db.players.countDocuments()

# Xem một cầu thủ
db.players.findOne()

# Top 10 cầu thủ
db.players.find().sort({ overallRating: -1 }).limit(10)
```

---

## 🎨 Data Schema

Mỗi cầu thủ được lưu với:

```javascript
{
  playerId: "cristiano-ronaldo-zzwyoyoy",
  name: "Cristiano Ronaldo",
  season: "EL",
  position: "ST",
  overallRating: 38,
  starRating: 5,
  avatarUrl: "https://...",
  stats: { /* 30+ chỉ số */ },
  hiddenStats: [ /* kỹ năng ẩn */ ],
  clubCareer: [ /* sự nghiệp CLB */ ]
}
```

---

## 🔧 Troubleshooting nhanh

| Vấn đề | Giải pháp |
|--------|-----------|
| Cannot connect to MongoDB | `brew services start mongodb-community` |
| Cannot find module | `npm install` |
| Request timeout | Tăng `REQUEST_DELAY` trong `.env` |
| ECONNREFUSED | Check internet, thử lại sau |

---

## 📖 Workflow khuyến nghị

### Lần đầu sử dụng:

1. ✅ `npm install`
2. ✅ Tạo `.env` file
3. ✅ Start MongoDB
4. ✅ `npm run test:scraper`
5. ✅ `npm run quickstart`
6. ✅ Verify trong MongoDB
7. ✅ `npm start season EL`

### Sử dụng thường xuyên:

```bash
# Crawl mùa mới
npm start season <SEASON_CODE>

# Crawl vị trí cụ thể
npm start position <POSITION> <SEASON>

# Update data
npm start season <SEASON> --force
```

---

## 🌟 Features chính

- ✅ **Automatic retry** - Tự động retry khi request fail
- ✅ **Rate limiting** - Delay giữa requests để tránh quá tải
- ✅ **Skip existing** - Không crawl lại data đã có
- ✅ **Comprehensive logging** - Theo dõi progress chi tiết
- ✅ **Error isolation** - Lỗi 1 player không ảnh hưởng cả crawl
- ✅ **Flexible commands** - CLI interface đa dạng
- ✅ **Database indexes** - Query nhanh
- ✅ **Clean architecture** - Code dễ maintain và extend

---

## 📊 Positions & Seasons

### Positions (15 vị trí)
```
ST, LW, RW, CF, CAM, LM, RM, CM, CDM, LWB, RWB, LB, RB, CB, GK
```

### Popular Seasons
```
EL      - Evolution (mùa hiện tại)
ICON    - Icon
ICONTM  - Icon Team of the Match
25TY    - Team of the Year 2025
24TY    - Team of the Year 2024
... và 100+ mùa giải khác
```

---

## 🎓 Learning Path

1. **Đọc QUICKSTART.md** (5 phút)
2. **Chạy test scripts** (10 phút)
3. **Crawl nhỏ** (npm run quickstart)
4. **Explore data trong MongoDB** (10 phút)
5. **Đọc USAGE_EXAMPLES.md** để học queries
6. **Crawl theo nhu cầu**

---

## 💡 Tips

1. **Test trước** - Luôn test với data nhỏ trước
2. **Monitor logs** - Theo dõi terminal output
3. **Backup DB** - Backup trước khi force update
4. **Start small** - Crawl 1 vị trí trước khi crawl cả mùa
5. **Be patient** - Crawl lớn mất thời gian (có rate limiting)

---

## 🆘 Cần giúp đỡ?

1. Check **QUICKSTART.md** cho quick setup
2. Check **SETUP.md** cho troubleshooting
3. Check **USAGE_EXAMPLES.md** cho queries
4. Check logs trong terminal
5. Verify MongoDB đang chạy

---

## ✨ Quick Commands Reference

```bash
# TEST
npm run test:scraper          # Test mà không lưu DB
npm run quickstart            # Test nhỏ với DB

# CRAWL
npm start season EL           # Crawl 1 mùa giải
npm start position ST EL      # Crawl 1 vị trí
npm start custom ST,LW EL     # Crawl custom

# UPDATE
npm start season EL --force   # Force update

# HELP
npm start help                # Xem hướng dẫn
```

---

## 🚦 Status: READY TO USE! ✅

Project đã hoàn thành và sẵn sàng sử dụng!

**Next step**: Đọc **QUICKSTART.md** và bắt đầu crawl! 🎉

---

**Happy Crawling! 🚀⚽**
