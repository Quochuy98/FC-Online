# Changelog

## [Latest] - 2026-01-21

### 🐛 Bug Fixes

#### Fixed seasons parameter logic
**Vấn đề:** Code cũ tự động thêm `EL` vào mọi request, dẫn đến:
- `npm start season ICON` → URL: `positions[0]=ST&seasons[0]=ICON&seasons[1]=EL`
- Kết quả: Chỉ lấy được cầu thủ có **CẢ HAI** thẻ ICON và EL → **Thiếu data**

**Giải pháp:** ✅ Fixed
- `npm start season ICON` → URL: `positions[0]=ST&seasons[0]=ICON`  
- Kết quả: Lấy **TẤT CẢ** cầu thủ có thẻ ICON → **Đầy đủ data**

**Files changed:**
- `src/services/playerListScraper.js` - Removed auto-append EL logic

**Documentation added:**
- `URL_PARAMS_EXPLAINED.md` - Chi tiết về cách hoạt động của URL parameters

### ✨ New Features

#### Stats Schema Improvement
**Cải tiến:** Stats giờ dùng English keys thay vì Vietnamese keys

**Trước:**
```javascript
stats: {
  "Tốc độ": { value: 139, baseValue: 136 }
}
// Query: db.players.find({ "stats.Tốc độ.value": { $gte: 135 } })
```

**Sau:**
```javascript
stats: {
  speed: { 
    name: "Tốc độ",  // Vietnamese name for display
    value: 139, 
    baseValue: 136 
  }
}
// Query: db.players.find({ "stats.speed.value": { $gte: 135 } })
```

**Benefits:**
- ✅ Dễ code (English keys)
- ✅ Dễ query (không cần escape đặc tả)
- ✅ Display-friendly (giữ Vietnamese names)

**Files added:**
- `src/config/statsMapping.js` - Stats mapping constants
- `STATS_REFERENCE.md` - Documentation
- `examples/queryStatsExample.js` - Query examples

#### Enhanced Crawling Experience

**Progress Tracking:**
- ✅ Auto-save checkpoint sau mỗi vị trí
- ✅ Auto-resume nếu bị ngắt
- ✅ ETA (thời gian dự kiến còn lại)
- ✅ Detailed progress bars với emojis

**Logging Improvements:**
```
🚀 STARTING SEASON CRAWL: ICON
🎯 [1/15] Starting position: ST
[1/47] 🔄 Processing: Cristiano Ronaldo...
[1/47] ✅ Saved: Cristiano Ronaldo
⏱️  Progress: 1/15 positions | ETA: 28.5m
```

**Files added:**
- `src/utils/progressTracker.js` - Progress tracking system
- `CRAWLING_GUIDE.md` - Comprehensive crawling guide

### 📚 Documentation

**New documents:**
- `URL_PARAMS_EXPLAINED.md` - URL parameters explained
- `STATS_REFERENCE.md` - Stats mapping reference
- `CRAWLING_GUIDE.md` - Detailed crawling guide
- `CHANGELOG.md` - This file

**Updated documents:**
- `README.md` - Updated usage examples
- `START_HERE.md` - Added new features info
- `USAGE_EXAMPLES.md` - Updated queries to use English keys

### 🔧 Technical Changes

**Dependencies:**
- Compatible with Node.js 16+ (downgraded from 18+)
- `axios`: 0.27.2 (Node 16 compatible)
- `cheerio`: 1.0.0-rc.10 (Node 16 compatible)
- `mongodb`: 5.9.0 (Node 16 compatible)

### 🎯 Usage Examples

#### Crawl một mùa giải
```bash
# Tự động crawl tất cả 15 vị trí
npm start season ICON

# Nếu bị ngắt, chạy lại sẽ tự động resume
npm start season ICON

# Force crawl lại từ đầu
npm start season ICON --force
```

#### Query với English keys
```javascript
// Tìm cầu thủ nhanh
db.players.find({ "stats.speed.value": { $gte: 135 } })

// Top 10 cầu thủ dứt điểm tốt
db.players.find({ "stats.finishing.value": { $exists: true } })
  .sort({ "stats.finishing.value": -1 })
  .limit(10)
```

### 🐛 Known Issues

None at the moment.

### 📝 Notes

- Crawler giờ chỉ filter theo mùa giải được chỉ định, không tự động thêm mùa khác
- Để có data đầy đủ, nên crawl từng mùa giải riêng biệt
- Stats schema mới tương thích ngược (có thể migrate data cũ)

---

## How to Update

### Nếu đã crawl data với bug cũ

**Option 1: Re-crawl (Khuyến nghị)**
```bash
# Xóa data cũ và crawl lại
mongosh
use fconline
db.players.deleteMany({ season: "ICON" })

# Crawl lại với fix mới
npm start season ICON
```

**Option 2: Migrate stats schema**
```bash
# Chạy migration script (nếu có data nhiều)
npm run example:query
```

### Nếu mới bắt đầu

Chỉ cần:
```bash
npm install
npm start season EL
```

---

**Version:** 1.0.0  
**Date:** 2026-01-21  
**Status:** ✅ Production Ready
