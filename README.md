# FC Online Training Lab

Ứng dụng mô phỏng đào tạo cầu thủ FC Online bằng dữ liệu được lấy trực tiếp từ FIFA Addict theo link người dùng nhập. Dự án không có crawler nền, không dùng MongoDB và không lưu kho dữ liệu cầu thủ.

## Tính năng

- Nhập link `https://vn.fifaaddict.com/fo4db/pid...`.
- Lấy ảnh, logo mùa, thông tin cá nhân, vị trí, 34 chỉ số, trait và lịch sử câu lạc bộ.
- Mô phỏng cấp thẻ, level, Team Color và đào tạo theo hệ số từng vị trí.
- Cache kết quả trong RAM 5 phút để giảm request lặp.
- Chỉ có một API ứng dụng: `POST /api/player/import`.

## Chạy local

Yêu cầu Node.js 18 trở lên.

```bash
npm install
npm start
```

Mở [http://localhost:3000](http://localhost:3000).

Không cần `.env`, MongoDB hay bước crawl dữ liệu.

## API

```http
POST /api/player/import
Content-Type: application/json

{
  "url": "https://vn.fifaaddict.com/fo4db/pidaavmwaaqy"
}
```

API chỉ chấp nhận HTTPS và các hostname FIFA Addict nằm trong allowlist.

## Cấu trúc chính

```text
api/index.js                              Vercel entrypoint
server/api.js                             Express app và API duy nhất
src/services/fifaAddictPlayerService.js  Lấy và chuẩn hóa dữ liệu cầu thủ
public/config/positionCoefficients.json   Hệ số OVR tĩnh
public/js/player-detail.js                Giao diện và bộ tính đào tạo
views/pages/home.ejs                      Trang ứng dụng
test/fifaAddictPlayerService.test.js      Kiểm thử parser/normalizer
```

## Kiểm thử

```bash
npm test
```
