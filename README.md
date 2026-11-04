# Cài đặt Supabase cho THE TIU (đồng bộ nhân vật + đấu trường)

Game chạy hoàn toàn được **không cần** phần này. Chỉ làm khi muốn bật ☁ Đấu trường & Đồng bộ.

## 1. Tạo dự án
Vào https://supabase.com → New project. Chờ dự án khởi tạo xong.

## 2. Tạo bảng và hàm
Dashboard → **SQL Editor** → New query → dán toàn bộ `supabase/schema.sql` → **Run**.
(Chạy lại nhiều lần cũng an toàn.)

## 3. Deploy Edge Function mô phỏng trận (chống gian lận)
```bash
npm i -g supabase                      # hoặc: brew install supabase/tap/supabase
supabase login
supabase link --project-ref <PROJECT_REF>
node tools/build_engine.js             # gộp engine game vào function (chạy lại mỗi khi sửa cân bằng)
supabase functions deploy arena-match
```
- Nếu dự án dùng khóa kiểu mới (`sb_publishable_...`, không phải JWT) thì deploy thêm `--no-verify-jwt`.
  Việc này an toàn vì function tự xác thực người chơi bằng KEY của họ.
- `SUPABASE_URL` và `SUPABASE_SERVICE_ROLE_KEY` do Supabase tự cấp cho function, bạn không cần cấu hình.

## 4. Nối vào game
Project Settings → API → copy **Project URL** và **anon public key** → dán vào `supabase_config.js`.
> Chỉ dùng **anon** key trong game. TUYỆT ĐỐI không đưa `service_role` key vào file nào của game.

## 5. Kiểm tra nhanh
Mở game → Menu chính → **☁ ĐẤU TRƯỜNG & ĐỒNG BỘ** → Tạo key → chơi một ván → **⬆ Lưu nhân vật**.
Tạo thêm một key thứ hai (cửa sổ ẩn danh) và lưu một nhân vật khác để có đối thủ.

---

## Mô hình hoạt động & bảo mật
| Thành phần | Vai trò |
|---|---|
| **Key** `TIU-XXXXX-XXXXX-XXXXX-XXXXX` | Bí mật của người chơi (80 bit). DB chỉ lưu SHA-256 của key. Mất key = không khôi phục được. |
| Bảng `players/characters/matches` | Bật RLS, không có policy → client **không** đọc/ghi trực tiếp. |
| Hàm RPC (`save_character`, `list_opponents`...) | Client gọi bằng anon key; mỗi hàm tự kiểm tra key. |
| Edge Function `arena-match` | Mô phỏng trận **trên máy chủ** bằng đúng engine của game; hai bên đều do AI điều khiển; RNG có seed; ghi kết quả bằng `apply_match` (chỉ service role gọi được). |

**Chống gian lận:** người chơi chỉ gửi *bản dựng* (class, cấp, tài năng, trang bị). Chỉ số do engine tự tính; máy chủ
kiểm tra lại ngân sách điểm tài năng, thứ tự bậc, trang bị đúng ô, cấp ≤ 8 trước **mỗi** trận. Kết quả trận không thể bị client can thiệp.

**Giới hạn chống farm điểm:** ≥5 giây giữa các trận · tối đa 40 trận xếp hạng/ngày · tối đa 3 trận/ngày với cùng một đối thủ
(sửa trong `functions/arena-match/handler.mjs`, mục `LIMITS`).

**Chưa chống được (cần quyết định thêm):**
- Một người tạo nhiều tài khoản để tự "nuôi" điểm cho nhau. Có thể giảm bằng giới hạn đăng ký theo IP/captcha (Supabase Auth/Turnstile).
- Key lưu dạng văn bản trong `localStorage` của trình duyệt — ai truy cập máy bạn đều lấy được.
- Chỉnh sửa file game phía client (chỉ ảnh hưởng ván chơi đơn của chính họ; đấu trường vẫn bị engine server kiểm tra).

## Khi sửa cân bằng / engine
Server dùng bản engine **đã đóng gói** trong `functions/arena-match/engine.mjs`. Sau khi sửa `rpg_core.js`, `rpg_combat.js`
hay `arena_core.js`: chạy `node tools/build_engine.js` rồi `supabase functions deploy arena-match` để client và server luôn khớp luật.
