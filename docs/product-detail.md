# Product detail & demo catalog

## Luồng hoạt động

`ProductCard → /products/[slug] → ProductDetail → useProductDetail → catalogApi.getBySlug → GET /products/:slug`.

- `page.tsx` là Server Component: đọc/validate slug, khai báo metadata, truyền slug vào Client Component.
- `ProductDetail` dùng React Query: tải dữ liệu công khai, hiển thị loading, lỗi và trường hợp không tìm thấy.
- `ProductGallery` quản lý ảnh đang chọn, chỉ hiện thumbnails khi API trả nhiều ảnh. `ProductPhoto` dùng chung với card và có fallback khi ảnh lỗi.
- `ProductPurchase` quản lý biến thể, số lượng và form đăng nhập. `VariantSelector`, `QuantitySelector` chỉ nhận props và callback.
- `useAddCartItem → cartApi.addItem → POST /cart/items` gửi Bearer token và `{ variantId, quantity }`. Cache giỏ hàng có user ID trong key để không trộn dữ liệu các tài khoản.
- Không tự retry POST cộng số lượng để tránh thêm hai lần nếu response đầu bị mất. Backend vẫn kiểm tra tồn kho, giá và quyền sở hữu giỏ.

## Seed ở BE

`catalog.seed-data.ts` chứa 20 sản phẩm: 14 Clothing, 3 Electronics, 3 Accessories. 10 sản phẩm mới có size S/M/L; SKU cũ giữ nguyên để không làm hỏng cart/order đang tham chiếu. Tồn kho ban đầu của SKU mới là 50.

Chạy `pnpm seed` trong BE với `DATABASE_URL` của database development. Không cần reset/migration schema vì chỉ đổi dữ liệu. Seed tạo các bản ghi còn thiếu, thay ảnh `placehold.co`, nâng cấp description mặc định cũ. Giá, tồn kho, trạng thái và ảnh tự sửa được giữ nguyên. Mỗi lần chạy nằm trong một transaction; chạy tuần tự, không chạy nhiều seed cùng lúc.

Ảnh stock minh họa cho dữ liệu học tập, không phải ảnh của một nhà cung cấp thực. Nguồn và tác giả từng ảnh có tại `https://www.pexels.com/photo/<photoId>/`, với `photoId` trong seed. Xem [Pexels License](https://www.pexels.com/license/). Ảnh hiện tải trực tiếp từ CDN Pexels; có thể thay bằng object storage/CDN của dự án sau này.

Homepage lấy tối đa 4 sản phẩm mỗi danh mục. Trang category lấy 10 sản phẩm/lần và tải tiếp bằng cursor khi cuộn. Clothing có 14 sản phẩm để demo luồng 10 + 4.

## Giới hạn hiện tại

- Mỗi sản phẩm seed có một ảnh; gallery đã hỗ trợ nhiều ảnh từ API.
- CTA thêm vào giỏ thật; trang giỏ hàng và checkout chưa nằm trong thay đổi này.
- API có `requiresAuth: true` tự refresh khi gặp 401 rồi thử lại một lần. Xem [session-and-theme.md](./session-and-theme.md) để hiểu cách xử lý phiên và request đồng thời.
- Detail tải bằng hook phía client như catalog hiện tại. Khi cần SEO, có thể fetch/hydrate trên server và thêm metadata riêng từng sản phẩm.

## Kiểm tra thủ công

1. Trang chủ → click card → detail đúng slug, tên, ảnh và giá.
2. Mở `demo-studio-tee`, chọn S/M/L; đổi biến thể đưa số lượng về 1.
3. Chưa đăng nhập → thêm giỏ → modal đăng nhập. Đăng nhập xong → thêm giỏ → thông báo thành công.
4. Mở slug không tồn tại → thông báo không tìm thấy, có link về bộ sưu tập.
5. Category Clothing → 10 sản phẩm đầu, cuộn cuối → đủ 14, không trùng ID.
