# Atelier Spaces — FE chat lab

Trang `/chat`, mở từ mục **Spaces** trên Navbar. `app/chat/page.tsx` là Server
Component để khai báo metadata; `ChatPage` là client boundary cho auth và UI.
Socket chỉ kết nối trong effect của workspace đã đăng nhập.

## Cấu trúc

```text
src/features/chat/
├── api/chat.api.ts             # HTTP guild/channel/member/history
├── hooks/useChat.ts            # React Query và lifecycle connection
├── lib/chat-connection.ts      # Socket events, auth refresh, room switching
├── lib/messages.ts             # Merge/deduplicate messages
├── types.ts                    # Contract dùng bởi API, socket và UI
└── components/
    ├── ChatPage.tsx            # Restore session / login / workspace
    ├── ChatWorkspace.tsx       # Guild/channel selection, create actions
    ├── GuildRail.tsx           # Guild navigation
    ├── ChannelSidebar.tsx      # Channels, owner actions, copy userId
    ├── Conversation.tsx        # Connection state + history + composer
    ├── MessageList.tsx         # Messages, dates, older history, scrolling
    ├── MessageComposer.tsx     # Send, preserve input/key after failure
    └── ResourceDialog.tsx      # Accessible native modal for creation
```

Desktop hiển thị ba vùng guild → channels → conversation. Trên mobile, danh
sách channels mở thành panel; khung chat giữ diện tích chính. Màu sử dụng
semantic tokens hiện có nên hỗ trợ light/dark mode.

## Cấu hình

FE `.env.local` hoặc `.env`:

```dotenv
BACKEND_URL=http://127.0.0.1:3001
NEXT_PUBLIC_CHAT_URL=http://localhost:3001
```

`NEXT_PUBLIC_CHAT_URL` là **base URL**, không có `/chat` hay `/socket.io`.
HTTP đi qua Next rewrite `/backend`; Socket.IO kết nối trực tiếp tới BE và
namespace `/chat`. Khi deploy HTTPS, dùng URL HTTPS của BE hỗ trợ WebSocket.
Giá trị `NEXT_PUBLIC_*` được nhúng lúc build, đổi URL cần build/restart lại FE.

BE `.env`:

```dotenv
CHAT_ALLOWED_ORIGINS=http://localhost:3000
```

Nếu FE chạy port/domain khác, thêm đúng origin vào danh sách phân cách dấu phẩy.
Không dùng wildcard origin. Không cần custom adapter ở FE; `socket.io-client`
kết nối tới IoAdapter mặc định của NestJS.

## Luồng kết nối và đổi channel

1. Restore/login tạo user + access token trong auth store.
2. Workspace tạo một connection cho user/session, gửi `auth: { token }`.
3. Lấy guilds và channels qua HTTP. Chọn channel gọi `channel.join`.
4. Đợi ack thành công trước khi cho phép gửi và tải history.
5. Đổi channel: serialize các thao tác `channel.leave` → `channel.join` để
   chuyển nhanh cũng không đánh dấu nhầm room là ready.
6. Reconnect: join lại channel đã chọn rồi refetch history.
7. Unmount/logout/đổi tài khoản: remove listeners, disconnect và xóa private
   chat query cache. Workspace key gồm userId và sessionVersion để reset draft.

Query keys đều bắt đầu `['chat', userId, ...]`. Refresh token vẫn thuộc cùng
session nên không reset workspace hay tạo socket mới mỗi lần access token đổi.
Các trạng thái connecting/reconnecting/joining/ready/error hiển thị trong UI.
Nút kết nối lại dùng khi retry tự động thất bại.

## Token hết hạn

`connect_error.data` hoặc `chat.error` với `AUTH_INVALID`/`AUTH_EXPIRED` gọi
`refreshSession()` dùng chung với Axios. Hàm này đã có single-flight trong một
tab. Sau refresh, socket nhận access token mới và connect/join lại.

Chỉ thử refresh một lần trước khi connect thành công; nếu token mới tiếp tục
bị từ chối, dừng và hiển thị lỗi. `FORBIDDEN`/network error không tự refresh.
Callback luôn kiểm tra user/session còn hiện tại để refresh cũ không reconnect
socket sau logout hoặc account switch.

## Gửi và hiển thị tin nhắn

- FE tạo `clientMessageId` UUID cho mỗi nội dung gửi.
- Gửi `message.send` với channelId, clientMessageId, content; author do BE xác định.
- Ack và `message.created` đều có thể chứa cùng tin. Merge history/live/ack theo
  `message.id`, rồi sắp xếp theo createdAt/id; không nhân đôi tin của chính mình.
- Timeout không chứng minh BE chưa lưu. Input giữ nguyên; gửi lại nội dung đó
  sẽ dùng lại key để BE trả tin đã lưu thay vì tạo thêm record.
- Enter gửi, Shift+Enter xuống dòng, không gửi khi IME còn composing.
- History là newest-first, mỗi page 30 tin; UI gộp thành oldest-first.
- Nút tin cũ hơn tải cursor page và giữ vị trí scroll. Tin mới không ép người
  đang đọc phía trên xuống cuối; có nút nhảy xuống tin mới nhất.

Live events được lọc theo channel đang chọn. Khi reconnect, refetch những page
đã tải để bù tin bị bỏ lỡ; nếu có khoảng mất kết nối dài, tiếp tục tải tin cũ
để nối lại lịch sử. BE hiện chưa có delivery receipts hay catch-up endpoint.
Draft chỉ sống trong component, đổi channel sẽ reset draft; selection chưa
đưa vào URL nên reload chọn guild/channel đầu tiên có quyền truy cập.

## Demo hai người

1. Tạo hai tài khoản trong ứng dụng.
2. Tài khoản A tạo guild và channel.
3. Tài khoản B sao chép ID của mình ở footer sidebar.
4. Owner A chọn **Thêm thành viên**, dán ID tài khoản B.
5. B chọn **Đã được mời? Làm mới danh sách guild** hoặc reload.
6. Hai người vào cùng channel rồi gửi tin nhắn.

Dùng hai browser profile/incognito để tách localStorage khi demo hai tài khoản.
Owner thấy thao tác tạo channel/thêm member; member không thấy các thao tác đó.
BE vẫn là nơi kiểm tra quyền, việc ẩn nút FE không thay thế authorization.

BE hiện chỉ trả authorId trong Message, nên tên người khác hiển thị dưới dạng
`Thành viên <ID ngắn>`. Tên tài khoản hiện tại được lấy từ auth store.
Chưa có typing indicator, presence, reactions, attachments hay quản lý member.

## Kiểm tra

`pnpm test` bao gồm tests HTTP refresh hiện có và tests ChatConnection:
room switch/reconnect, stale session, bounded auth refresh, timeout/key reuse,
React Strict Mode và message deduplication. `pnpm lint` và `pnpm build` kiểm tra FE.

Đã kiểm tra browser với hai tài khoản QA local: login, tạo guild/channel,
thêm member, gửi/nhận realtime, đổi channel, reload giữ phiên và history,
member-only UI, desktop và mobile 390px không tràn ngang. Dữ liệu QA được dọn
sau kiểm thử.
