# Multi-Season Crawl Guide

## 🌟 Tính năng Auto-Resume

Bây giờ bạn có thể crawl nhiều mùa giải một cách an toàn với **Auto-Resume**!

Nếu bị ngắt giữa chừng (Ctrl+C, lỗi, mất mạng), chỉ cần chạy lại command và crawler sẽ tự động tiếp tục từ checkpoint!

## 🚀 Sử dụng

### Crawl tất cả các mùa giải

```bash
npm start seasons
```

**Mô tả:**
- Crawl **TẤT CẢ 100+ mùa giải** tuần tự
- Tự động save checkpoint sau mỗi mùa
- Auto-resume nếu bị ngắt

**Thời gian ước tính:** Nhiều giờ (tùy CONCURRENCY)

### Crawl N mùa giải đầu tiên

```bash
# Crawl 10 mùa đầu
npm start seasons 10

# Crawl 5 mùa phổ biến nhất
npm start seasons 5

# Crawl 20 mùa
npm start seasons 20
```

**Thời gian ước tính:**
- 5 mùa: ~30-50 phút (với CONCURRENCY=5)
- 10 mùa: ~1-2 giờ
- 20 mùa: ~2-4 giờ

## ⚡ Auto-Resume Feature

### Cách hoạt động

```bash
# Lần 1: Bắt đầu crawl 10 mùa
$ npm start seasons 10

🌟 SEASON 1/10: ICONTM
✅ Completed! Checkpoint saved.

🌟 SEASON 2/10: ICON  
✅ Completed! Checkpoint saved.

🌟 SEASON 3/10: ICONTMB
[Đang crawl...]
^C  # Bạn nhấn Ctrl+C hoặc lỗi xảy ra

# Lần 2: Chạy lại command y hệt
$ npm start seasons 10

🔄 RESUMING SEASONS CRAWL FROM CHECKPOINT
   Total: 10 seasons
   Completed: 2 seasons
   Remaining: 8 seasons
   Completed seasons: ICONTM, ICON

🌟 SEASON 3/10: ICONTMB (1/8 remaining)
# Tự động tiếp tục từ mùa thứ 3!
```

### Checkpoint tự động

- ✅ Checkpoint được lưu sau **mỗi mùa giải hoàn thành**
- ✅ An toàn với Ctrl+C
- ✅ An toàn với crashes/errors
- ✅ Không crawl lại mùa đã xong

## 🔄 Force Re-crawl

Nếu muốn crawl lại từ đầu:

```bash
npm start seasons 10 --force
```

**Effect:**
- Xóa tất cả checkpoints
- Crawl lại từ mùa đầu tiên
- Cập nhật lại data cũ

## 📊 Ví dụ thực tế

### Scenario 1: Crawl bị ngắt giữa chừng

```bash
# Bắt đầu
$ npm start seasons 10

# Output
🌟 SEASON 1/10: ICONTM
📊 Summary: Found: 250 | Scraped: 245 | Skipped: 5
✅ Season ICONTM completed!

🌟 SEASON 2/10: ICON
📊 Summary: Found: 300 | Scraped: 295 | Skipped: 5  
✅ Season ICON completed!

🌟 SEASON 3/10: ICONTMB
[1/50] 🔄 Processing: Player Name...
^C  # Ctrl+C

# Chạy lại
$ npm start seasons 10

# Output
🔄 RESUMING FROM CHECKPOINT
   Completed: 2 seasons (ICONTM, ICON)
   Remaining: 8 seasons

🌟 SEASON 3/10: ICONTMB (1/8 remaining)
# Tiếp tục!
```

### Scenario 2: Crawl nhiều lần trong nhiều ngày

```bash
# Ngày 1: Crawl 5 mùa đầu
$ npm start seasons 20
# Crawl được 5 mùa, sau đó Ctrl+C để ngủ

# Ngày 2: Tiếp tục
$ npm start seasons 20
# Tự động crawl từ mùa thứ 6

# Ngày 3: Tiếp tục
$ npm start seasons 20  
# Tự động crawl từ mùa chưa xong
```

### Scenario 3: Check progress

Không có command riêng, nhưng bạn có thể xem file:

```bash
cat .progress/seasons-crawl-progress.json
```

Output:
```json
{
  "lastUpdated": "2026-01-21T05:30:00.000Z",
  "completedSeasons": ["ICONTM", "ICON", "ICONTMB", "FAC", "25DP"],
  "startedAt": "2026-01-21T04:00:00.000Z"
}
```

## 🎯 Best Practices

### 1. Crawl từng batch nhỏ

```bash
# Tốt: Crawl 10 mùa một lúc
npm start seasons 10

# Không tốt: Crawl hết 100 mùa cùng lúc
npm start seasons  # Mất quá nhiều thời gian
```

### 2. Crawl offline hours

```bash
# Crawl vào ban đêm với concurrency cao
CONCURRENCY=10 npm start seasons 10
```

### 3. Monitor progress

```bash
# Chạy và redirect logs
npm start seasons 10 2>&1 | tee crawl-seasons.log

# Hoặc chạy trong screen/tmux
screen -S crawl
npm start seasons 10
# Ctrl+A, D để detach
# screen -r crawl để attach lại
```

### 4. Resume là default

```bash
# Không cần flag gì, mặc định sẽ resume
npm start seasons 10

# Chỉ dùng --force khi muốn crawl lại từ đầu
npm start seasons 10 --force
```

## ⚙️ Performance Tips

### Fast crawl

```bash
# Set concurrency cao + delay thấp
CONCURRENCY=10 REQUEST_DELAY=200 npm start seasons 5
```

### Safe crawl

```bash
# Concurrency thấp + delay cao
CONCURRENCY=3 REQUEST_DELAY=500 npm start seasons 10
```

### Balanced (Khuyến nghị)

```bash
# Set trong .env
CONCURRENCY=5
REQUEST_DELAY=300

# Sau đó
npm start seasons 10
```

## 🐛 Troubleshooting

### Checkpoint không hoạt động

**Kiểm tra:**
```bash
ls -la .progress/
cat .progress/seasons-crawl-progress.json
```

**Giải pháp:**
```bash
# Xóa checkpoint cũ
rm -rf .progress/seasons-crawl-progress.json

# Chạy lại
npm start seasons 10
```

### Muốn crawl lại một mùa cụ thể đã hoàn thành

**Option 1: Crawl mùa đó riêng với --force**
```bash
npm start season ICON --force
```

**Option 2: Clear checkpoint và crawl lại tất cả**
```bash
npm start seasons 10 --force
```

### Muốn xem đã crawl những mùa nào

```bash
# Xem file progress
cat .progress/seasons-crawl-progress.json

# Hoặc query MongoDB
mongosh
use fconline
db.players.distinct("season")
```

## 📈 Estimated Times

Với **CONCURRENCY=5, REQUEST_DELAY=300** (Balanced):

| Seasons | Players (avg) | Time |
|---------|---------------|------|
| 5 | ~1500 | 30-50 phút |
| 10 | ~3000 | 1-2 giờ |
| 20 | ~6000 | 2-4 giờ |
| 50 | ~15000 | 5-10 giờ |
| 100+ | ~30000+ | 10-20+ giờ |

**Lưu ý:** Thời gian thực tế phụ thuộc vào:
- Network speed
- MongoDB write speed
- Server response time
- Số lượng players per season (varies)

## 🎮 Use Cases

### Use Case 1: Crawl mùa phổ biến

```bash
# Crawl 10 mùa phổ biến nhất
npm start seasons 10

# Mùa 1-10 trong constants.js thường là phổ biến nhất:
# ICONTM, ICON, ICONTMB, FAC, 25DP, FSL, WS, DCB, CH, 25IM
```

### Use Case 2: Crawl tất cả dữ liệu

```bash
# Chia làm nhiều lần
npm start seasons 20  # Lần 1: 20 mùa đầu
npm start seasons 40  # Lần 2: 40 mùa đầu (resume từ 21)
npm start seasons 60  # Lần 3: 60 mùa đầu (resume từ 41)
npm start seasons     # Lần 4: Tất cả (resume từ 61)
```

### Use Case 3: Overnight crawl

```bash
# Setup nohup để chạy qua đêm
nohup npm start seasons 20 > crawl.log 2>&1 &

# Check progress
tail -f crawl.log

# Check process
ps aux | grep node
```

## 💡 Tips

1. **Luôn dùng resume** - Mặc định an toàn, chỉ dùng --force khi cần
2. **Crawl theo batch** - 10-20 mùa một lúc thay vì crawl hết
3. **Monitor logs** - Theo dõi để catch errors sớm
4. **Backup database** - Backup sau mỗi batch lớn
5. **Use screen/tmux** - Để crawl không bị ngắt khi đóng terminal

## 🚦 Command Reference

```bash
# Crawl tất cả mùa (100+) - auto resume
npm start seasons

# Crawl N mùa đầu - auto resume
npm start seasons <N>

# Force re-crawl từ đầu
npm start seasons --force
npm start seasons 10 --force

# Crawl một mùa riêng
npm start season <SEASON>

# Xem help
npm start help
```

---

**Tóm lại:** 
- ✅ Auto-resume by default
- ✅ Safe với Ctrl+C
- ✅ Checkpoint sau mỗi mùa
- ✅ Dễ dàng tiếp tục sau khi ngắt

**Happy Crawling! 🚀**
