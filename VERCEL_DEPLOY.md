# Hướng dẫn Deploy lên Vercel

## Bước 1: Chuẩn bị

1. Đảm bảo project đã commit lên Git (GitHub, GitLab, hoặc Bitbucket)

## Bước 2: Deploy trên Vercel

### Cách 1: Sử dụng Vercel CLI

```bash
# Cài đặt Vercel CLI
npm i -g vercel

# Login vào Vercel
vercel login

# Deploy
vercel

# Deploy production
vercel --prod
```

### Cách 2: Sử dụng Vercel Dashboard

1. Truy cập [vercel.com](https://vercel.com)
2. Đăng nhập/Đăng ký
3. Click "Add New Project"
4. Import repository từ GitHub/GitLab/Bitbucket
5. Cấu hình:
   - **Framework Preset**: Other
   - **Root Directory**: ./
   - **Build Command**: (để trống)
   - **Output Directory**: (để trống)

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

## Bước 4: Deploy

Sau khi setup xong, Vercel sẽ tự động deploy mỗi khi bạn push code lên repository.

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
