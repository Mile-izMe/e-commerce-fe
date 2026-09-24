# E-commerce FE

Frontend dùng Next.js App Router. Cấu trúc được chia theo **route** và **tính năng**:

```text
app/
  (store)/
    products/
      [slug]/
    cart/
  (auth)/
    login/
    register/
  (account)/
    account/
      addresses/
  layout.tsx
  page.tsx
  globals.css
src/
  features/
    catalog/
      api/
      components/
      types/
    auth/
      api/
      components/
      types/
    cart/
      api/
      components/
      types/
    account/
      api/
      components/
      types/
  shared/
    components/
      ui/
    lib/
    types/
public/
```

`app/` định nghĩa URL, layout và trang. Các thư mục trong ngoặc chỉ nhóm route,
không xuất hiện trên URL: `app/(store)/cart/page.tsx` sẽ là `/cart`. Hiện
các thư mục route mới chỉ là khung; thêm `page.tsx` khi triển khai màn hình.
`app/page.tsx` đang là trang mặc định của Next.js và có thể thay bằng trang
catalog khi bắt đầu demo.

`src/features/<tính năng>/api` chứa hàm gọi backend và chuyển đổi dữ liệu;
`components` chứa UI riêng của tính năng; `types` chứa kiểu dữ liệu của tính
năng. Logic của Catalog, Auth, Cart và Account nên nằm tại feature tương ứng.
`src/shared/` chỉ chứa phần thực sự được nhiều feature dùng chung. Đặt UI
dùng chung trong `shared/components/ui`, tiện ích HTTP/formatting trong
`shared/lib`, và kiểu dùng chung trong `shared/types`.

Khi viết API, dùng endpoint hiện có của backend: `/products`, `/auth`,
`/users/me` và `/cart`. Chưa tạo màn hình checkout thành công vì backend chưa
có Orders/Payment. Không đặt secret hoặc refresh token trong source code.

Để chạy:

```bash
pnpm install
pnpm dev
```
