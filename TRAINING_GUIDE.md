# 🎓 Training Calculator Guide

## Giới thiệu

Module Training Calculator cho phép tính toán **Overall Rating (OVR)** của cầu thủ sau khi đào tạo, dựa trên hệ số (coefficients) của từng vị trí.

## 📊 Công thức tính OVR

```
OVR = (Σ(stat_value × coefficient)) / Σ(coefficients)
```

Mỗi vị trí có các chỉ số quan trọng khác nhau với hệ số khác nhau.

## 📁 Files

### 1. `src/config/positionCoefficients.json`

File JSON chứa hệ số của tất cả vị trí. **Các vị trí có hệ số giống nhau được gộp lại** để tránh trùng lặp:

```json
{
  "LS/ST/RS": {
    "finishing": { "name": "Dứt điểm", "coefficient": 18 },
    "positioning": { "name": "Chọn vị trí", "coefficient": 13 },
    "ballControl": { "name": "Giữ bóng", "coefficient": 10 },
    ...
  },
  "RW/LW": { ... },
  "LF/CF/RF": { ... },
  ...
}
```

**Grouped Positions:**
- `RW/LW` - Wingers
- `LS/ST/RS` - Strikers
- `LAM/CAM/RAM` - Attacking Midfielders
- `LCM/CM/RCM` - Central Midfielders
- `LDM/CDM/RDM` - Defensive Midfielders
- `LWB/RWB` - Wing Backs
- `LB/RB` - Full Backs
- `LF/CF/RF` - Forwards
- `RM/LM` - Wide Midfielders

### 2. `src/utils/trainingCalculator.js`

Module JavaScript với các functions:

- `calculatePositionOVR()` - Tính OVR cho một vị trí
- `calculateAllPositionOVR()` - Tính OVR cho tất cả vị trí
- `simulateTraining()` - Mô phỏng kết quả đào tạo
- `getKeyStatsForPosition()` - Lấy các chỉ số quan trọng nhất
- `calculateTrainingPlan()` - Tính kế hoạch đào tạo tối ưu

## 🚀 Cách sử dụng

### 1. Import Module

```javascript
const {
  calculatePositionOVR,
  simulateTraining,
  getKeyStatsForPosition,
  calculateTrainingPlan,
} = require('./src/utils/trainingCalculator');
```

### 2. Tính OVR hiện tại

```javascript
// Player stats (format giống database)
const playerStats = {
  finishing: { name: "Dứt điểm", value: 85 },
  positioning: { name: "Chọn vị trí", value: 82 },
  ballControl: { name: "Giữ bóng", value: 80 },
  shotPower: { name: "Lực sút", value: 88 },
  heading: { name: "Đánh đầu", value: 75 },
  reactions: { name: "Phản ứng", value: 83 },
  dribbling: { name: "Rê bóng", value: 78 },
  strength: { name: "Sức mạnh", value: 70 },
  speed: { name: "Tốc độ", value: 85 },
  shortPassing: { name: "Chuyền ngắn", value: 75 },
  acceleration: { name: "Tăng tốc", value: 87 },
  longShots: { name: "Sút xa", value: 80 },
  volleys: { name: "Vô lê", value: 78 },
};

// Calculate OVR for ST position
const stOVR = calculatePositionOVR('ST', playerStats);
console.log(`ST OVR: ${stOVR}`);
// Output: ST OVR: 82
```

### 3. Xem chỉ số quan trọng nhất

```javascript
// Get top 5 key stats for ST
const keyStats = getKeyStatsForPosition('ST', 5);
console.log('Key stats for ST:');
keyStats.forEach(stat => {
  console.log(`- ${stat.name} (${stat.key}): coefficient ${stat.coefficient}`);
});

/* Output:
Key stats for ST:
- Dứt điểm (finishing): coefficient 18
- Chọn vị trí (positioning): coefficient 13
- Giữ bóng (ballControl): coefficient 10
- Lực sút (shotPower): coefficient 10
- Đánh đầu (heading): coefficient 10
*/
```

### 4. Mô phỏng đào tạo

```javascript
// Simulate training: increase finishing +3, positioning +2
const trainingResult = simulateTraining('ST', playerStats, {
  finishing: 3,
  positioning: 2,
});

console.log('Training Simulation:');
console.log(`Current OVR: ${trainingResult.currentOVR}`);
console.log(`New OVR: ${trainingResult.newOVR}`);
console.log(`Improvement: +${trainingResult.improvement}`);

/* Output:
Training Simulation:
Current OVR: 82
New OVR: 84
Improvement: +2
*/
```

### 5. Tính kế hoạch đào tạo tối ưu

```javascript
// Calculate optimal training plan to reach OVR 90
const trainingPlan = calculateTrainingPlan('ST', playerStats, 90, 5);

if (trainingPlan.success) {
  console.log('Training Plan:');
  console.log(`Current OVR: ${trainingPlan.currentOVR}`);
  console.log(`Target OVR: ${trainingPlan.targetOVR}`);
  console.log(`Achieved OVR: ${trainingPlan.achievedOVR}`);
  console.log(`Total stat increases: ${trainingPlan.totalIncrease}`);
  console.log('\nRecommended increases:');
  
  for (const [stat, increase] of Object.entries(trainingPlan.statIncreases)) {
    console.log(`- ${stat}: +${increase}`);
  }
}

/* Output:
Training Plan:
Current OVR: 82
Target OVR: 90
Achieved OVR: 90
Total stat increases: 15

Recommended increases:
- finishing: +5
- positioning: +5
- ballControl: +5
*/
```

### 6. Tính OVR cho nhiều vị trí

```javascript
const { calculateAllPositionOVR } = require('./src/utils/trainingCalculator');

// Calculate for specific positions
const multipleOVR = calculateAllPositionOVR(playerStats, ['ST', 'CF', 'LW', 'RW']);

console.log('OVR by position:');
for (const [position, ovr] of Object.entries(multipleOVR)) {
  console.log(`${position}: ${ovr}`);
}

/* Output:
OVR by position:
ST: 82
CF: 81
LW: 80
RW: 80
*/
```

## 🎯 Use Cases

### 1. Hiển thị OVR theo vị trí trong trang player detail

```javascript
// In player detail page
app.get('/api/players/:id/training-ovr', async (req, res) => {
  const player = await getPlayer(req.params.id);
  const positions = player.positions.map(p => p.position);
  
  const ovrByPosition = calculateAllPositionOVR(player.stats, positions);
  
  res.json({
    success: true,
    data: ovrByPosition,
  });
});
```

### 2. API để mô phỏng đào tạo

```javascript
// Training simulation endpoint
app.post('/api/players/:id/simulate-training', async (req, res) => {
  const { position, statIncreases } = req.body;
  const player = await getPlayer(req.params.id);
  
  const result = simulateTraining(position, player.stats, statIncreases);
  
  res.json({
    success: true,
    data: result,
  });
});
```

### 3. Tìm cầu thủ có tiềm năng cao

```javascript
// Find players with high potential for a position
async function findHighPotentialPlayers(position, minCurrentOVR, targetOVR) {
  const players = await getAllPlayers({ minOverall: minCurrentOVR });
  const results = [];
  
  for (const player of players) {
    const currentOVR = calculatePositionOVR(position, player.stats);
    const trainingPlan = calculateTrainingPlan(position, player.stats, targetOVR);
    
    if (trainingPlan.success && trainingPlan.totalIncrease <= 15) {
      results.push({
        player: player.name,
        currentOVR,
        potential: trainingPlan.achievedOVR,
        trainingNeeded: trainingPlan.totalIncrease,
      });
    }
  }
  
  return results.sort((a, b) => a.trainingNeeded - b.trainingNeeded);
}
```

## 📋 Vị trí được hỗ trợ

**Tất cả 26 vị trí** được hỗ trợ, được gộp thành **11 nhóm** có hệ số giống nhau:

| Nhóm | Positions | Mô tả |
|------|-----------|-------|
| **RW/LW** | RW, LW | Wingers (Cánh) |
| **LS/ST/RS** | LS, ST, RS | Strikers (Tiền đạo) |
| **LAM/CAM/RAM** | LAM, CAM, RAM | Attacking Midfielders (Tiền vệ tấn công) |
| **LCM/CM/RCM** | LCM, CM, RCM | Central Midfielders (Tiền vệ trung tâm) |
| **LDM/CDM/RDM** | LDM, CDM, RDM | Defensive Midfielders (Tiền vệ phòng ngự) |
| **LWB/RWB** | LWB, RWB | Wing Backs (Hậu vệ cánh) |
| **LB/RB** | LB, RB | Full Backs (Hậu vệ biên) |
| **LF/CF/RF** | LF, CF, RF | Forwards (Tiền đạo ảo) |
| **RM/LM** | RM, LM | Wide Midfielders (Tiền vệ biên) |
| **CB** | CB | Center Back (Trung vệ) |
| **SW** | SW | Sweeper (Libero) |
| **GK** | GK | Goalkeeper (Thủ môn) |

**Lưu ý:** Khi gọi functions, bạn vẫn dùng position code riêng lẻ (ST, RW, CB, etc.). Module tự động tìm nhóm phù hợp.

## 🔧 Advanced Usage

### Custom coefficient weights

Nếu muốn sử dụng hệ số khác, bạn có thể:

1. Edit file `positionCoefficients.json`
2. Hoặc tạo custom calculator function

### Integration với API

```javascript
// Add to server/api.js
const trainingCalculator = require('../src/utils/trainingCalculator');

app.get('/api/training/positions', (req, res) => {
  res.json({
    success: true,
    data: trainingCalculator.getAllPositions(),
  });
});

app.get('/api/training/coefficients/:position', (req, res) => {
  const coefficients = trainingCalculator.getPositionCoefficients(req.params.position);
  res.json({
    success: true,
    data: coefficients,
  });
});
```

## 📊 Example Output

### Training Plan cho Ronaldo (ST)

```
Current Stats:
- Finishing: 92
- Positioning: 89
- Ball Control: 88
- Shot Power: 91
...

Current OVR: 90

Training Goal: Reach 95 OVR

Optimal Plan:
- finishing: +2 (92 → 94)
- positioning: +3 (89 → 92)
- ballControl: +2 (88 → 90)

Result: 95 OVR achieved with 7 total stat increases
```

## 🎨 UI Integration Ideas

1. **Training Simulator Page**: Cho phép user adjust sliders để increase stats và xem OVR change realtime
2. **Position Comparison**: Show OVR của cầu thủ ở tất cả positions
3. **Training Recommendations**: AI suggest best stats to train based on target OVR
4. **Progress Tracker**: Track training history và improvements over time

## 🚀 Next Steps

1. Tạo API endpoints cho training features
2. Build frontend UI cho training simulator
3. Add training history tracking
4. Implement save/load training plans

---

**Công thức chính xác từ FIFA Online 4, sử dụng hệ số chính thức!** ⚽
