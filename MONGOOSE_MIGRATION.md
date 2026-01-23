# Migration từ MongoDB Native Driver sang Mongoose

## Tổng quan

Project đã được refactor từ MongoDB Native Driver sang Mongoose để:
- **Code dễ đọc và maintain hơn**: Schema-based validation và type safety
- **Tự động tạo indexes**: Mongoose tự động tạo indexes từ schema definition
- **Better error handling**: Mongoose cung cấp validation errors rõ ràng hơn
- **Middleware support**: Pre/post hooks cho save, find, etc.
- **Query builder**: Dễ dàng xây dựng queries phức tạp

## Thay đổi chính

### 1. Package Dependencies
- ✅ Thêm `mongoose` vào `package.json`
- ✅ Giữ `mongodb` (Mongoose sử dụng nó internally)

### 2. Connection (`src/database/connection.js`)
- ✅ Thay `MongoClient` bằng `mongoose.connect()`
- ✅ Sử dụng `mongoose.connection` thay vì `db` object
- ✅ Thêm connection state checking với `isDatabaseConnected()`

### 3. Player Model (`src/models/Player.js`)
- ✅ Tạo Mongoose schema với đầy đủ validation
- ✅ Định nghĩa indexes trong schema (unique, compound, text)
- ✅ Thêm static methods: `findByPlayerIdAndSeason()`, `exists()`, `search()`, `upsert()`
- ✅ Sử dụng `Schema.Types.Mixed` cho `stats` object (flexible structure)

### 4. Player Repository (`src/database/playerRepository.js`)
- ✅ Refactor để sử dụng Mongoose `Player` model
- ✅ Giữ nguyên API interface (backward compatible)
- ✅ Export `Player` model để có thể dùng trực tiếp nếu cần

### 5. API Server (`server/api.js`)
- ✅ Thay tất cả `db.collection('players')` bằng `Player` model
- ✅ Sử dụng Mongoose query methods: `find()`, `findOne()`, `countDocuments()`, `aggregate()`
- ✅ Sử dụng `.lean()` để trả về plain JavaScript objects (tăng performance)

## Cách sử dụng

### Cài đặt
```bash
npm install
```

### Chạy server
```bash
npm start
```

### Tạo indexes
```bash
npm run create-text-index
```

## Lợi ích của Mongoose

1. **Schema Validation**: Tự động validate data trước khi lưu
2. **Type Safety**: Định nghĩa rõ ràng types cho mỗi field
3. **Indexes**: Tự động tạo indexes từ schema definition
4. **Middleware**: Pre/post hooks cho các operations
5. **Query Builder**: Dễ dàng xây dựng queries phức tạp
6. **Population**: Dễ dàng join documents (nếu cần trong tương lai)

## Backward Compatibility

- ✅ Tất cả API endpoints giữ nguyên interface
- ✅ Data structure trong MongoDB không thay đổi
- ✅ Existing queries vẫn hoạt động bình thường
- ✅ Crawler (`src/index.js`) vẫn sử dụng `playerRepository` như cũ

## Notes

- **Stats field**: Sử dụng `Schema.Types.Mixed` để linh hoạt với dynamic keys
- **Text Index**: Mongoose tự động tạo text index từ schema definition
- **Lean queries**: Sử dụng `.lean()` trong API để tăng performance (trả về plain objects thay vì Mongoose documents)
- **Connection pooling**: Mongoose tự động quản lý connection pool

## Troubleshooting

### Lỗi "Schema hasn't been registered"
- Đảm bảo `require('../models/Player')` được gọi trước khi sử dụng model

### Lỗi "Cannot read property 'find' of undefined"
- Đảm bảo đã `connect()` trước khi query
- Kiểm tra `isDatabaseConnected()` trước khi query

### Stats không hiển thị đúng
- Stats được lưu dưới dạng plain object trong MongoDB
- Mongoose sẽ trả về object, không phải Map (điều này là đúng)
