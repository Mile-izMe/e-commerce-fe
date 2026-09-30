# Refresh khi gặp 401 và dark mode

## API cần đăng nhập

```ts
requestData<Cart>({ method: "GET", url: "/cart", requiresAuth: true });
```

Không truyền token thủ công vào từng API nữa. Interceptor đọc access token mới nhất từ Zustand trước khi gửi. API công khai và login/register không bật `requiresAuth`.

Luồng: request có token → BE trả 401 → `refreshSession()` → lưu token mới → thử lại request gốc đúng một lần. Những request 401 đồng thời trong cùng tab chờ chung một Promise. Nếu một 401 về muộn sau khi token đã được đổi, dùng token mới để thử lại, không refresh lần nữa.

`auth-session.ts` có transport riêng nên lỗi `/auth/refresh` không quay lại interceptor. Startup, hook refresh và interceptor dùng cùng hàm. Refresh trả 401/403 hoặc request retry vẫn 401 thì xóa phiên; lỗi mạng/5xx giữ phiên để thử lại. React Query không retry lỗi 401/403.

`sessionVersion` đổi khi login/logout, giữ nguyên khi rotate token. Response của phiên cũ không được cập nhật tài khoản mới. Logout xóa phiên ngay; refresh về trễ không đăng nhập người dùng trở lại. Provider dọn cache riêng `auth`/`cart` khi phiên đổi.

Chỉ replay POST khi BE trả 401 từ AuthGuard trước controller (đúng với BE hiện tại). Không retry POST vì timeout/lỗi mạng; không tự thêm lại cart trong trường hợp không biết request trước đã thành công chưa.

Refresh token vẫn nằm trong localStorage theo lựa chọn của dự án. Khóa Promise chỉ áp dụng trong một tab; chưa điều phối refresh-token rotation giữa nhiều tab bằng Web Locks/BroadcastChannel. Không có refresh token trong log hay query key.

## Theme

- Nút mặt trăng/mặt trời trên Navbar đổi sáng/tối; lưu vào `atelier.theme` trong localStorage.
- Khi chưa chọn, dùng theme hệ thống và theo dõi thay đổi hệ thống.
- Script nhỏ trong `<head>` đặt `data-theme` trước khi vẽ giao diện để hạn chế nháy sáng. Root HTML dùng `suppressHydrationWarning` vì thuộc tính theme được cập nhật trước hydration.
- CSS variables trong `app/globals.css` định nghĩa màu semantic: `background`, `surface`, `foreground`, `muted`, `line`, `action`… Component dùng các token này cho cả hai theme; ảnh sản phẩm không bị đảo màu.
- Theme tự đồng bộ giữa các tab qua storage event. Khi trình duyệt chặn storage, nút vẫn đổi được theme ở tab hiện tại.

## Kiểm tra

`pnpm test` chạy test refresh bằng Axios adapter giả lập; không gọi BE hay sửa database. Bao gồm concurrent 401, retry một lần, refresh thất bại, logout/đổi tài khoản trong lúc refresh và giữ nguyên body POST.

`pnpm lint` và `pnpm build` kiểm tra code và ranh giới server/client. Kiểm tra theme bằng nút Navbar, reload, form auth, trang category/detail và kích thước mobile.
