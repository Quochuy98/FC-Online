# Hướng dẫn Deploy lên Vercel

## Bước 1: Chuẩn bị

1. Đảm bảo project đã commit lên Git (GitHub, GitLab, hoặc Bitbucket)

## Bước 2: Deploy trên Vercel

### Cách 1: Sử dụng Vercel Dashboard (Khuyến nghị - Tự động deploy)

1. Truy cập [vercel.com](https://vercel.com)
2. Đăng nhập/Đăng ký (nên dùng GitHub/GitLab/Bitbucket account)
3. Click **"Add New Project"** hoặc **"Import Project"**
4. **Kết nối Git Repository**:
   - Chọn Git provider (GitHub/GitLab/Bitbucket)
   - Authorize Vercel để truy cập repositories
   - Chọn repository của bạn
5. Cấu hình Project:
   - **Framework Preset**: Other
   - **Root Directory**: `./` (hoặc để trống)
   - **Build Command**: (để trống - không cần build)
   - **Output Directory**: (để trống)
   - **Install Command**: `npm install` (hoặc để mặc định)
6. Click **"Deploy"**

**Sau khi deploy lần đầu, Vercel sẽ tự động:**
- Tạo webhook với Git provider của bạn
- Tự động deploy mỗi khi có push lên branch `main`/`master` (production)
- Tạo preview deployment cho mỗi pull request

### Cách 2: Sử dụng Vercel CLI (Manual deploy)

```bash
# Cài đặt Vercel CLI
npm i -g vercel

# Login vào Vercel
vercel login

# Link project với Vercel (chỉ cần làm 1 lần)
vercel link

# Deploy production
vercel --prod
```

**Lưu ý**: Với CLI, bạn cần chạy `vercel --prod` thủ công mỗi lần muốn deploy.

## Bước 3: Cấu hình Environment Variables

Trong Vercel Dashboard, vào **Settings > Environment Variables** và thêm:

```
MONGODB_URI=mongodb+srv://quochuy98:Quochuy98@cluster0.qimhtpw.mongodb.net
DB_NAME=fconline
NODE_ENV=production
```

**Lưu ý**: 
- Không commit file `.env` lên Git
- Chỉ thêm environment variables trên Vercel Dashboard

## Bước 4: Kiểm tra Auto-Deploy

Sau khi setup xong, Vercel sẽ tự động deploy mỗi khi bạn push code lên repository.

### Kiểm tra Auto-Deploy đã hoạt động:

1. **Vào Vercel Dashboard** → Chọn project của bạn
2. **Vào Settings → Git**:
   - Kiểm tra xem repository đã được connect chưa
   - Kiểm tra Production Branch (thường là `main` hoặc `master`)
3. **Test auto-deploy**:
   ```bash
   # Tạo một commit nhỏ
   git add .
   git commit -m "test auto-deploy"
   git push origin main
   ```
4. **Kiểm tra Vercel Dashboard**:
   - Vào tab **"Deployments"**
   - Sẽ thấy deployment mới tự động được tạo sau vài giây

### Nếu Auto-Deploy không hoạt động:

1. **Kiểm tra Git Integration**:
   - Vào **Settings → Git** trong Vercel Dashboard
   - Đảm bảo repository đã được connect
   - Nếu chưa, click **"Connect Git Repository"** và chọn lại repo

2. **Kiểm tra Webhook**:
   - Vào GitHub/GitLab/Bitbucket → Repository Settings → Webhooks
   - Tìm webhook từ Vercel (URL có dạng `https://api.vercel.com/v1/integrations/...`)
   - Đảm bảo webhook đang **Active**

3. **Reconnect Repository**:
   - Vào Vercel Dashboard → Project Settings → Git
   - Click **"Disconnect"** rồi **"Connect"** lại repository

4. **Kiểm tra Branch**:
   - Đảm bảo bạn đang push lên branch được set làm Production Branch
   - Mặc định là `main` hoặc `master`

## Kiểm tra

Sau khi deploy thành công, bạn sẽ nhận được URL như:
- Production: `https://your-project.vercel.app`
- Preview: `https://your-project-git-branch.vercel.app`

## Troubleshooting

### Lỗi MongoDB Connection
- Kiểm tra MongoDB Atlas Network Access đã cho phép IP `0.0.0.0/0` (all IPs)
- Kiểm tra MongoDB Atlas Database User có đúng password
- Kiểm tra environment variables trên Vercel đã được set đúng

### Lỗi Build
- Kiểm tra Node.js version trong `package.json` (engines.node)
- Vercel hỗ trợ Node.js 18.x và 20.x mặc định

### Static Files không load
- Đảm bảo `public` folder được include trong project
- Kiểm tra paths trong code (sử dụng relative paths)

### Auto-Deploy không hoạt động
- Kiểm tra Git Integration trong Vercel Dashboard (Settings → Git)
- Đảm bảo repository đã được connect với Vercel
- Kiểm tra webhook trong Git provider (GitHub/GitLab/Bitbucket)
- Đảm bảo đang push lên đúng branch (main/master)
- Thử disconnect và reconnect repository trong Vercel
