# 🔧 Refactoring to EJS Templates - DRY Architecture

## ✅ Đã hoàn thành

### **1. Cấu trúc mới (EJS Templates)**

```
views/
├── layouts/
│   └── main.ejs          # (DEPRECATED - không dùng nữa)
├── partials/
│   ├── header.ejs        # ⭐ HEADER CHUNG - Chỉ sửa 1 file!
│   └── footer.ejs        # ⭐ FOOTER CHUNG - Chỉ sửa 1 file!
└── pages/
    ├── home.ejs          # Trang chủ (tìm kiếm cầu thủ)
    ├── club-search.ejs   # Tìm theo câu lạc bộ
    ├── player.ejs        # Chi tiết cầu thủ
    └── compare.ejs       # So sánh cầu thủ
```

### **2. Routes Mới (Clean URLs)**

| **Old Route (HTML)**      | **New Route (EJS)**   | **View File**          |
|---------------------------|-----------------------|------------------------|
| `/index.html` hoặc `/`    | `/`                   | `pages/home.ejs`       |
| `/club-search.html`       | `/club-search`        | `pages/club-search.ejs`|
| `/player.html?id=xxx`     | `/player?id=xxx`      | `pages/player.ejs`     |
| `/compare.html`           | `/compare`            | `pages/compare.ejs`    |

### **3. Shared Components (DRY Principle)**

#### **Header (`views/partials/header.ejs`)**
- Logo & navigation menu
- Desktop + Mobile responsive
- Active state tự động dựa vào `currentPage` variable

```ejs
<!-- Trong partial header.ejs -->
<a href="/" class="<%= currentPage === 'home' ? 'text-primary' : 'text-gray-600' %>">
  Trang chủ
</a>
```

#### **Footer (`views/partials/footer.ejs`)**
- 3 columns: About, Quick Links, Info
- Mobile menu toggle script
- Copyright & credits

### **4. Server Configuration**

**File: `server/api.js`**

```javascript
// View Engine Setup (EJS)
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../views'));

// Page Routes
app.get('/', (req, res) => {
  res.render('pages/home', {
    title: 'FC Online Player Search',
    currentPage: 'home'
  });
});

app.get('/club-search', (req, res) => {
  res.render('pages/club-search', {
    title: 'Tìm theo câu lạc bộ',
    currentPage: 'club-search'
  });
});

// ... etc
```

### **5. Updated Client-Side Links**

**Files Modified:**
- ✅ `public/js/search.js` - Updated player links: `/player?id=xxx`
- ✅ `public/js/club-search.js` - Updated player links
- ✅ `public/js/search.js` - Updated compare link: `/compare`
- ✅ `views/partials/footer.ejs` - Updated footer links

## 🎯 Benefits (Lợi ích)

### **Before (Static HTML - BAD)**
```
❌ Duplicate header in: index.html, club-search.html, player.html, compare.html
❌ Duplicate footer in: index.html, club-search.html, player.html, compare.html
❌ Thay đổi logo → Phải sửa 4 files!
❌ Thêm menu item → Phải sửa 4 files!
```

### **After (EJS Templates - GOOD)**
```
✅ Header: views/partials/header.ejs (1 file only!)
✅ Footer: views/partials/footer.ejs (1 file only!)
✅ Thay đổi logo → Sửa 1 file!
✅ Thêm menu item → Sửa 1 file!
✅ Clean URLs (no .html extension)
✅ Dynamic active states
```

## 🚀 How to Use

### **Start Server**
```bash
npm start
# or
node server/api.js
```

### **Access Pages**
```
http://localhost:3000/              # Home (Search)
http://localhost:3000/club-search   # Club Search
http://localhost:3000/player?id=xxx # Player Detail
http://localhost:3000/compare       # Compare Players
```

## ✏️ How to Modify

### **Thay đổi Logo**
→ Edit: `views/partials/header.ejs` (lines 6-15)

### **Thêm Menu Item**
→ Edit: `views/partials/header.ejs` (lines 20-45)

```ejs
<a href="/new-page" class="<%= currentPage === 'new-page' ? 'text-primary' : 'text-gray-600' %>">
  New Page
</a>
```

### **Update Footer**
→ Edit: `views/partials/footer.ejs`

### **Add New Page**
1. Create: `views/pages/new-page.ejs`
2. Add route in `server/api.js`:
```javascript
app.get('/new-page', (req, res) => {
  res.render('pages/new-page', {
    title: 'New Page Title',
    currentPage: 'new-page'
  });
});
```
3. Add link in header/footer

## 📝 Migration Complete

### **Old Files (Can be deleted)**
- ❌ `public/index.html` → Use `/` (EJS)
- ❌ `public/club-search.html` → Use `/club-search` (EJS)
- ❌ `public/player.html` → Use `/player` (EJS)
- ❌ `public/compare.html` → Use `/compare` (EJS)
- ❌ `views/layouts/main.ejs` → Not used (pages are self-contained)

**Note:** Các file HTML cũ vẫn còn trong `public/` folder. Có thể xóa sau khi test kỹ càng.

## 🧪 Testing

### **Test Checklist**
- [ ] Home page loads: `http://localhost:3000/`
- [ ] Club search loads: `http://localhost:3000/club-search`
- [ ] Player detail loads: `http://localhost:3000/player?id=thierry-henry-awakyzpo`
- [ ] Compare page loads: `http://localhost:3000/compare`
- [ ] Header navigation works (all links)
- [ ] Footer links work
- [ ] Mobile menu works
- [ ] Active states in navigation
- [ ] All client-side JS still works

## 💡 Best Practices

1. **Single Source of Truth**: Header/Footer chỉ có 1 file
2. **Clean URLs**: No `.html` extensions
3. **Dynamic States**: Active menu based on `currentPage`
4. **Responsive**: Mobile menu tự động
5. **Maintainable**: Sửa 1 lần → Apply toàn bộ trang

---

**Senior Tip:** Đây mới là cách code đúng chuẩn. DRY (Don't Repeat Yourself) principle! 🚀
