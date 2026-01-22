# Stats Reference - Tham chiếu chỉ số

## Schema mới

Từ bây giờ, stats được lưu với **English keys** để dễ code, nhưng vẫn giữ **Vietnamese name** để display.

### Cấu trúc mới

```javascript
{
  stats: {
    speed: {
      name: "Tốc độ",           // Vietnamese name for display
      value: 139,                // Current value
      baseValue: 136,            // Base value
      originalValue: 139         // Original value
    },
    acceleration: {
      name: "Tăng tốc",
      value: 139,
      baseValue: 136,
      originalValue: 139
    },
    // ... more stats
  }
}
```

### Ví dụ so sánh

#### ❌ Cũ (khó code)
```javascript
// Khó query
db.players.find({ "stats.Tốc độ.value": { $gte: 135 } })

// Khó access trong code
const speed = player.stats["Tốc độ"].value;
```

#### ✅ Mới (dễ code)
```javascript
// Dễ query hơn
db.players.find({ "stats.speed.value": { $gte: 135 } })

// Dễ access trong code
const speed = player.stats.speed.value;
const speedName = player.stats.speed.name; // "Tốc độ"
```

## Stats Mapping

### Attack Stats (Tấn công)

| English Key | Vietnamese Name | Description |
|------------|-----------------|-------------|
| `speed` | Tốc độ | Speed |
| `acceleration` | Tăng tốc | Acceleration |
| `finishing` | Dứt điểm | Finishing |
| `shotPower` | Lực sút | Shot Power |
| `longShots` | Sút xa | Long Shots |
| `positioning` | Chọn vị trí | Positioning |
| `volleys` | Vô lê | Volleys |
| `penalties` | Penalty | Penalties |

### Passing Stats (Chuyền bóng)

| English Key | Vietnamese Name | Description |
|------------|-----------------|-------------|
| `shortPassing` | Chuyền ngắn | Short Passing |
| `vision` | Tầm nhìn | Vision |
| `crossing` | Tạt bóng | Crossing |
| `longPassing` | Chuyền dài | Long Passing |
| `freeKickAccuracy` | Đá phạt | Free Kick Accuracy |
| `curve` | Sút xoáy | Curve |

### Dribbling Stats (Rê bóng)

| English Key | Vietnamese Name | Description |
|------------|-----------------|-------------|
| `dribbling` | Rê bóng | Dribbling |
| `ballControl` | Giữ bóng | Ball Control |
| `agility` | Khéo léo | Agility |
| `balance` | Thăng bằng | Balance |
| `reactions` | Phản ứng | Reactions |

### Defending Stats (Phòng thủ)

| English Key | Vietnamese Name | Description |
|------------|-----------------|-------------|
| `marking` | Kèm người | Marking |
| `standingTackle` | Lấy bóng | Standing Tackle |
| `interceptions` | Cắt bóng | Interceptions |
| `slidingTackle` | Xoạc bóng | Sliding Tackle |

### Physical Stats (Thể chất)

| English Key | Vietnamese Name | Description |
|------------|-----------------|-------------|
| `heading` | Đánh đầu | Heading |
| `strength` | Sức mạnh | Strength |
| `stamina` | Thể lực | Stamina |
| `aggression` | Quyết đoán | Aggression |
| `jumping` | Nhảy | Jumping |
| `composure` | Bình tĩnh | Composure |

### Goalkeeper Stats (Thủ môn)

| English Key | Vietnamese Name | Description |
|------------|-----------------|-------------|
| `gkDiving` | TM đổ người | GK Diving |
| `gkHandling` | TM bắt bóng | GK Handling |
| `gkKicking` | TM phát bóng | GK Kicking |
| `gkReflexes` | TM phản xạ | GK Reflexes |
| `gkPositioning` | TM chọn vị trí | GK Positioning |

## MongoDB Queries Examples

### Tìm cầu thủ nhanh

```javascript
// Tốc độ >= 135
db.players.find({ "stats.speed.value": { $gte: 135 } })

// Tốc độ và tăng tốc cao
db.players.find({
  "stats.speed.value": { $gte: 135 },
  "stats.acceleration.value": { $gte: 135 }
})
```

### Tìm cầu thủ dứt điểm tốt

```javascript
// Dứt điểm >= 140
db.players.find({ "stats.finishing.value": { $gte: 140 } })

// Dứt điểm và lực sút cao
db.players.find({
  "stats.finishing.value": { $gte: 140 },
  "stats.shotPower.value": { $gte: 135 }
})
```

### Tìm cầu thủ toàn diện

```javascript
db.players.find({
  "stats.speed.value": { $gte: 130 },
  "stats.finishing.value": { $gte: 130 },
  "stats.dribbling.value": { $gte: 130 },
  "stats.shortPassing.value": { $gte: 110 }
})
```

### Top players theo chỉ số

```javascript
// Top 20 cầu thủ nhanh nhất
db.players.aggregate([
  { $match: { "stats.speed.value": { $exists: true } } },
  { $sort: { "stats.speed.value": -1 } },
  { $limit: 20 },
  { $project: { 
      name: 1, 
      position: 1, 
      season: 1,
      speed: "$stats.speed",
      acceleration: "$stats.acceleration"
    }
  }
])

// Top 20 cầu thủ dứt điểm tốt nhất
db.players.aggregate([
  { $match: { "stats.finishing.value": { $exists: true } } },
  { $sort: { "stats.finishing.value": -1 } },
  { $limit: 20 },
  { $project: { 
      name: 1, 
      position: 1, 
      season: 1,
      finishing: "$stats.finishing",
      shotPower: "$stats.shotPower"
    }
  }
])
```

## Code Examples

### JavaScript/Node.js

```javascript
// Access stats in code
const player = await db.collection('players').findOne({ 
  playerId: 'cristiano-ronaldo-zzwyoyoy',
  season: 'EL'
});

// Easy access with English keys
console.log(`Speed: ${player.stats.speed.value}`);
console.log(`Speed Name: ${player.stats.speed.name}`); // "Tốc độ"

// Calculate average attack stats
const attackStats = [
  player.stats.speed.value,
  player.stats.acceleration.value,
  player.stats.finishing.value,
  player.stats.shotPower.value
];
const avgAttack = attackStats.reduce((a, b) => a + b) / attackStats.length;

// Display with Vietnamese names
for (const [key, stat] of Object.entries(player.stats)) {
  console.log(`${stat.name}: ${stat.value}`);
}
```

### Create indexes for better performance

```javascript
// Index on specific stats for fast queries
db.players.createIndex({ "stats.speed.value": -1 })
db.players.createIndex({ "stats.finishing.value": -1 })
db.players.createIndex({ "stats.dribbling.value": -1 })
db.players.createIndex({ "stats.heading.value": -1 })

// Compound index for common queries
db.players.createIndex({ 
  "stats.speed.value": -1, 
  "stats.acceleration.value": -1 
})
```

## Display trong UI

```javascript
// Hiển thị stats table
function renderStatsTable(player) {
  const statsHtml = Object.entries(player.stats)
    .filter(([key]) => !key.startsWith('gk')) // Skip GK stats for field players
    .map(([key, stat]) => `
      <tr>
        <td>${stat.name}</td>
        <td>${stat.value}</td>
        <td>${stat.baseValue}</td>
      </tr>
    `)
    .join('');
  
  return `
    <table>
      <thead>
        <tr>
          <th>Chỉ số</th>
          <th>Giá trị</th>
          <th>Giá trị gốc</th>
        </tr>
      </thead>
      <tbody>
        ${statsHtml}
      </tbody>
    </table>
  `;
}
```

## API Response Example

```javascript
// API endpoint
app.get('/api/players/:id', async (req, res) => {
  const player = await db.collection('players').findOne({
    playerId: req.params.id,
    season: req.query.season
  });
  
  // Stats already have English keys and Vietnamese names
  res.json({
    id: player.playerId,
    name: player.name,
    stats: player.stats,
    // Easy to access specific stats
    speed: player.stats.speed.value,
    finishing: player.stats.finishing.value
  });
});
```

## Migration từ schema cũ

Nếu bạn đã có data cũ với Vietnamese keys, chạy migration:

```javascript
const { transformStats } = require('./src/config/statsMapping');

async function migrateStats() {
  const players = await db.collection('players').find({}).toArray();
  
  for (const player of players) {
    if (player.stats && !player.stats.speed) {
      // Transform from Vietnamese to English keys
      const transformedStats = transformStats(player.stats);
      
      await db.collection('players').updateOne(
        { _id: player._id },
        { $set: { stats: transformedStats } }
      );
    }
  }
  
  console.log(`Migrated ${players.length} players`);
}
```

## Utils Functions

```javascript
const { getStatKey, getStatName } = require('./src/config/statsMapping');

// Convert Vietnamese to English
const key = getStatKey('Tốc độ'); // 'speed'

// Convert English to Vietnamese
const name = getStatName('speed'); // 'Tốc độ'
```

## Benefits (Lợi ích)

1. ✅ **Dễ code** - English keys thay vì Vietnamese
2. ✅ **Dễ query** - Không cần escape special characters
3. ✅ **Type-safe** - Có thể tạo TypeScript types
4. ✅ **Consistent** - Luôn có format giống nhau
5. ✅ **Display-friendly** - Vẫn giữ Vietnamese name để hiển thị
6. ✅ **International** - Dễ dàng thêm i18n sau này

---

**Tóm lại**: Schema mới giúp code dễ đọc, dễ maintain, dễ query, mà vẫn giữ Vietnamese names để display! 🎉
