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

`src/shared/lib/api.ts` là Axios client dùng chung. `requestData<T>` trả về
`data`, `requestCursorPage<T>` trả về `{ items, meta }`, còn lỗi được đổi thành
`ApiClientError` với `message`, `statusCode`, `errorCode`, `traceId` và
`subErrors`. API của từng feature chỉ khai báo endpoint; xem
`src/features/catalog/api/catalog.api.ts` để gọi `/products` với `cursor`,
`limit` và `category`. Khi cần gửi Bearer token, truyền `headers` trong cấu hình
request; không lưu refresh token trong source code.

Trên trình duyệt, request tới `/backend/*` được Next.js chuyển tiếp tới BE.
Mặc định BE ở `http://127.0.0.1:3000`; nếu khác, đặt `BACKEND_URL` trong
`.env.local` ở thư mục gốc FE rồi khởi động lại Next.js. Server-side request
gọi thẳng `BACKEND_URL`. Cấu hình proxy giúp gọi API trên browser mà không cần
CORS ở BE.

Chưa tạo màn hình checkout thành công vì backend chưa có Orders/Payment.

Để chạy:

```bash
pnpm install
pnpm dev --port 3001
```
