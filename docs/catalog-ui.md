# Catalog trên trang chủ

`app/page.tsx` và `CatalogHero` là Server Components. `CatalogProducts` là Client Component gọi `useProducts`; `ProductCard` nằm trong cây client để xử lý lỗi ảnh.

`GET /categories` trả danh mục đang hoạt động. Trang chủ dùng `useCategories` rồi `useCategoryPreview` để lấy tối đa 4 sản phẩm riêng cho từng category (`GET /products?category=<slug>&limit=4`). Nếu danh mục ít hơn 4 sản phẩm, chỉ hiển thị số hiện có.

Tên danh mục, chip danh mục và “Xem tất cả” dẫn tới `/categories/[slug]`. Route là Server Component; `CategoryProducts` là Client Component dùng `useProducts({ category: slug, limit: 10 })`. Nó nối các trang cursor và dùng IntersectionObserver tải tiếp khi người dùng cuộn gần cuối danh sách. Khi lỗi, tự tải dừng để người dùng bấm thử lại; vẫn có nút tải thêm cho bàn phím hoặc trình duyệt không hỗ trợ observer. Query key chứa category nên cache không trộn sản phẩm giữa các danh mục.

Tên, ảnh, giá, số biến thể và trạng thái hết hàng đều dùng dữ liệu API. Hero là ảnh minh họa, không phải ảnh xác nhận hàng bán. ProductCard không giả lập thêm vào giỏ hay liên kết tới trang chi tiết chưa có. Seed BE đang dùng ảnh placehold.co; thêm ảnh thật vào ProductImage để có hình sản phẩm thật.

## Ảnh hero

- File: `public/images/atelier-everyday-hero.png`
- Tạo bằng công cụ image_gen tích hợp, không dùng ảnh chụp màn hình tham khảo.
- Prompt:

> Use case: ads-marketing. Asset type: original website hero photograph for a minimalist premium everyday-goods shop. Create a wide 3:2 editorial still-life photograph: a sculptural ivory cotton shirt loosely folded over a low travertine pedestal, a natural canvas tote bag, and unbranded charcoal over-ear headphones carefully arranged together. Warm plaster studio backdrop, soft directional morning sunlight from upper left, long soft shadows, muted sand, cream and charcoal palette, tactile materials, refined and quiet luxury. Composition has generous breathing space and objects concentrated centrally and to the right; no people, no typography, no lettering, no logos, no watermark. Original composition, not an imitation of any existing website or campaign.
