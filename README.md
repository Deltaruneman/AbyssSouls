# THE TIU

THE TIU là game sinh tồn pha nhập vai và chiến đấu theo lượt, lấy bối cảnh khuôn viên UIT. Năm sinh viên tranh suất tốt nghiệp loại Giỏi; người chơi phải kiếm Điểm Rèn Luyện (ĐRL), sống sót qua các đêm loại trừ và quyết định cách đối đầu với The TIU.

## Bắt đầu chơi

Game là ứng dụng web tĩnh, không cần cài gói hay chạy bước build để chơi.

1. Mở `index.html` trong trình duyệt hiện đại.
2. Nếu trình duyệt hạn chế tải tài nguyên khi mở trực tiếp, chạy máy chủ web tĩnh tại thư mục dự án:

   ```powershell
   py -m http.server 8000
   ```

   Sau đó mở <http://localhost:8000>. Nếu lệnh `py` không có, thử `python -m http.server 8000`.
3. Ở cổng người chơi, chọn **Đăng nhập** hoặc **Tạo tài khoản** để dùng hồ sơ và Đấu trường; hoặc chọn **Chơi với tư cách khách** để vào chơi ngay.
4. Sau khi vào game, chọn **BẮT ĐẦU**, nhập tên, rồi làm bài trắc nghiệm để chọn Class. Chọn **TIẾP TỤC** để tải bản lưu hiện có.

Chế độ khách lưu tiến trình, kết thúc đã mở và hướng dẫn đã xem trong phiên tab hiện tại, rồi xóa dữ liệu tạm khi rời trang/đóng tab; khách không thể dùng Đấu trường hoặc đồng bộ hồ sơ nhân vật. Tài khoản cần cấu hình Supabase để đăng nhập và dùng các tính năng trực tuyến. Có thể chơi khách mà không cần Supabase.

## Điều khiển

| Thao tác | Điều khiển |
|---|---|
| Đi trong sơ đồ tòa nhà | `W A S D` hoặc phím mũi tên |
| Tương tác với vật thể gần nhất | `E` |
| Mở/đóng bản đồ khuôn viên | `M` hoặc nút phóng to bản đồ |
| Mở túi đồ | `B` |
| Mở tài năng | `T` |
| Mở nhật ký nhiệm vụ | `Q` |
| Mở hướng dẫn | `H` hoặc nút ❓ |
| Tạm dừng | `Esc` |
| Tiếp tục thoại | `J`, `Enter`, `Space` hoặc bấm khung thoại |
| Tua thoại đến lựa chọn | `Ctrl` |
| Chọn đáp án thoại nhanh | `1`–`4` hoặc bấm đáp án |
| Điều hướng các menu | Mũi tên hoặc `W A S D`, xác nhận bằng `Enter`/`Space` |
| QTE trong trận | Bấm hướng mũi tên hiện trên màn hình, dùng `W A S D` hoặc chạm các nút mũi tên |

Các nút hành động trên giao diện cũng có thể bấm trực tiếp. Trên điện thoại, menu chiến đấu được xếp lại ở cạnh dưới để dễ chạm; chạm vào biểu tượng trạng thái trên thẻ nhân vật để xem tên và số lượt còn lại. Di chuyển nhân vật bên trong tòa nhà vẫn cần bàn phím.

## Vòng chơi

### Chapter 1 — Ba đêm loại trừ

- Mỗi đêm kéo dài từ 00:00 đến 07:30 theo giờ trong game. Một phút game tương ứng khoảng một giây thực khi thời gian đang chạy.
- Khám phá các tòa nhà, nói chuyện hoặc thách đấu NPC, nhặt linh kiện và xử lý sự cố để kiếm tài nguyên và ĐRL.
- Cuối đêm, sinh viên còn sống có ĐRL thấp nhất bị loại. Nếu người chơi bị loại, có thể thử lại đêm đó từ checkpoint.
- Theo dõi **Mục tiêu đêm**, bản đồ và nhật ký để biết thứ hạng, sự cố, mini-boss và vị trí The TIU nhìn thấy gần nhất.

### Chapter 2 — Chuẩn bị và đại chiến

Sau ba đêm đầu, Chapter 2 có một đêm chuẩn bị và một trận cuối. Hãy tận dụng phần chuẩn bị để hoàn thiện tài năng, trang bị, vật phẩm, La Peace và các mối quan hệ trước đại chiến.

## Cơ chế chính

### Khám phá và sinh tồn

- Khuôn viên có bản đồ các phòng nối với nhau; bản đồ nhỏ và bản đồ lớn cho phép đi sang phòng liền kề.
- Di chuyển giữa hai phòng tốn 10 phút game và 20 thể lực. Thể lực tối đa là 100 và hồi theo thời gian.
- Nếu tiếp tục đi khi thiếu thể lực, bạn có thể bị phục kích khi đến nơi. Phục kích khiến trận bắt đầu với tối đa 50% HP và kỹ năng đang hồi chiêu.
- Căn tin bán vật phẩm suốt đêm. Trong Chapter 1, đây là nơi an toàn để nghỉ từ 01:00–02:00 và 04:00–05:00. Nghỉ một giờ hồi HP cho bạn/đồng đội và hồi thể lực.
- The TIU tuần tra trong Chapter 1. Nếu bắt được người chơi, bạn phải chiến đấu; thua bị trừ ĐRL. Các biến cố đêm như mất điện, thi giữa kỳ, sương mù và trăng máu thay đổi cách sinh tồn.

### Sự cố và mini-boss

The TIU có thể gây sự cố ở một số phòng. Hãy đến nơi được báo trong mục tiêu đêm và hoàn thành mini-game trước khi hết hạn để nhận ĐRL. Thử thách có thể yêu cầu tìm hình khác biệt, chỉnh đèn, nối dây, trả lời câu hỏi, nhập chuỗi phím hoặc sắp xếp số. Đêm đầu cho người chơi thêm thời gian làm quen: The TIU tuần tra chậm hơn, sự cố xuất hiện muộn hơn, thời hạn xử lý dài hơn và sự cố không lan dây chuyền. Từ các đêm sau, nhịp đe dọa tăng dần. Mini-boss có tay sai canh một số phòng; thắng nhận ĐRL, EXP và linh kiện, còn thua có thể mất tối đa 3 ĐRL.

### NPC và đồng đội

- NPC có thể di chuyển giữa các phòng. Nói chuyện để tăng Tin tưởng; đạt ngưỡng cần thiết để mời họ vào đội hoặc nhận nhiệm vụ riêng.
- Đội hình gồm người chơi và tối đa một đồng đội. Đồng đội tự hành động trong chiến đấu.
- Đồng đội thường cần bạn duy trì ĐRL để tiếp tục ở lại. Hoàn thành nhiệm vụ riêng sẽ tạo Gắn bó, giúp mở thêm lựa chọn ở phần kết.
- Bấm `⋮` để xem thông tin NPC và La Peace mà bạn đã khám phá. Bấm `Q` để xem nhật ký nhiệm vụ.

### Chiến đấu và phát triển nhân vật

- Mỗi lượt, chọn tấn công, phòng thủ, kỹ năng, Ultimate hoặc vật phẩm. Tấn công và phòng thủ giúp hồi Thể Lực chiến đấu; kỹ năng tiêu Thể Lực và có hồi chiêu.
- Đầu lượt, game tiết lộ hành động đã khóa của từng địch, gồm mục tiêu nếu có. Dùng thông tin này để cân nhắc phòng thủ, hạ gục hoặc khống chế kẻ địch trước khi chúng ra tay.
- Trận thường tiêu tốn 40 phút, trận phục kích 45 phút, trận mini-boss 55 phút và trận The TIU 60 phút trong đồng hồ game. HP và hồi chiêu còn lại ảnh hưởng các trận sau.
- Nộ tích lũy trong trận. Khi đầy, Ultimate có thể được dùng; QTE mũi tên giúp tăng hiệu quả. Một số trận có QTE để né hoặc đỡ đòn.
- Hệ thuộc tính có điểm yếu và kháng. Trạng thái như Cháy, Độc, Đóng băng, Tê liệt và Choáng có thể ảnh hưởng sát thương hoặc lượt hành động; biểu tượng trên thẻ cho biết số lượt còn lại, chạm/bấm biểu tượng để đọc tên trạng thái.
- HP được giữ lại giữa các trận; nhân vật thua còn ít nhất 1 HP. Đầu đêm mới, đội hình hồi phục. Thắng trận có thể cho EXP, ĐRL, linh kiện hoặc vật phẩm.
- Có năm Class: Đấu Sĩ, Sát Thủ, Pháp Sư, Dược Sư và Triệu Hồi. Class quyết định chỉ số, hệ cơ bản, kỹ năng và Ultimate. Cấp tối đa là 8.
- Mở tài năng bằng `T`. Ba nhánh Công Kích, Bền Bỉ và Thể Lực cho phép xây dựng lối chơi khác nhau; có thể tẩy điểm miễn phí.

### Túi đồ, chế tạo và La Peace

- Nhặt đồ trong các phòng để lấy vật phẩm hoặc linh kiện. Vật phẩm có thể hồi máu, hỗ trợ chiến đấu, giải trạng thái hoặc đặt bẫy.
- Dùng quầy Căn tin để mua vật phẩm bằng ĐRL. Bàn chế tạo đổi linh kiện thành vật phẩm và trang bị; trang bị chế xong tự mang vào một trong ba ô: vũ khí, giáp, bùa.
- Ba mảnh La Peace đem lại các sức mạnh riêng. Mảnh chưa được ai nắm giữ có thể xuất hiện để nhặt; mảnh chưa nhặt trước 03:00 có thể rơi vào tay đối thủ. Thắng họ để cướp lại.
- Đánh bại The TIU có thể cho ĐRL vấy bẩn, dùng để đổi vật phẩm đặc biệt và mở thêm hướng kết thúc.

### Lưu game, hướng dẫn và kết thúc

- Game tự lưu tiến trình; đầu mỗi đêm tạo checkpoint. Màn hình thất bại cho phép thử lại đêm từ checkpoint.
- Tutorial tự giới thiệu một số cơ chế theo tình huống. Mở bằng `H`/❓ để xem chín chủ đề: điều khiển, sinh tồn, sự cố, quan hệ, chiến đấu, tài năng, đồ và chế tạo, cốt truyện, đấu trường. Chọn **Đặt lại tất cả** để xem lại từ đầu.
- Các lựa chọn, Gắn bó, La Peace và những lần đối đầu The TIU có thể dẫn đến kết thúc khác nhau. New Game+ giữ lại một phần tiến trình và tăng độ khó.

## Đấu trường và đồng bộ (tùy chọn)

Chế độ này cần dịch vụ Supabase hoạt động; phần chơi đơn không phụ thuộc vào nó. Chọn **⚔ ĐẤU TRƯỜNG** ở màn hình chính hoặc trong menu tạm dừng, đăng ký/đăng nhập email rồi chọn một trong **3 slot nhân vật**. Mỗi slot có hồ sơ và xếp hạng độc lập. Nhân vật mới được lưu riêng tư ngay khi tạo; chọn **Lưu nhân vật → Lưu & công khai** để dùng PvP mà không cần hoàn thành ending. PvP trực tiếp là trận giao hữu 1v1, không cộng/trừ điểm: hai người chọn hành động cùng lượt, trận đồng bộ qua Supabase và tự cập nhật khoảng mỗi giây. Đối thủ cần online để nhận/chấp nhận lời mời. Key cũ vẫn được hỗ trợ qua mục **Dùng key cũ**.

### Bật PvP trực tiếp trên Supabase

Sau khi chạy schema chính của game, chạy migration [`20261107000000_live_pvp.sql`](supabase/migrations/20261107000000_live_pvp.sql) một lần trong **Supabase Dashboard → SQL Editor**. Migration thêm bảng trận trực tiếp và các RPC có xác thực bằng key; bảng vẫn bật RLS và client không được đọc/ghi trực tiếp. Cả hai người phải lưu & công khai build để xuất hiện trong danh sách thách đấu. Nếu chưa chạy migration, PvP AI và phần chơi đơn vẫn hoạt động.

Để bật đăng ký/đăng nhập và ba slot, chạy tiếp [`20261107010000_account_auth_3_character_slots.sql`](supabase/migrations/20261107010000_account_auth_3_character_slots.sql). Supabase Auth cần bật nhà cung cấp **Email**. Nếu đang bật xác nhận email, người chơi phải xác nhận thư trước khi đăng nhập lần đầu.

`config/supabase_config.js` chứa URL và khóa công khai phía client. Chỉ dùng anon/publishable key tại đây; tuyệt đối không đặt `service_role` key trong game. File schema nền hiện không nằm trong checkout; cần có schema nền đã tạo các bảng `players`, `characters`, các RPC hồ sơ hiện có và hàm `_player_of(text)` trước khi chạy migration PvP trực tiếp. Cách cấu hình và deploy Edge Function được ghi trong [`supabase/README.md`](supabase/README.md).

## Cấu trúc mã nguồn

- `index.html`: điểm vào game; giữ ở thư mục gốc để host tĩnh phục vụ game trực tiếp.
- `src/`: mã gameplay, RPG, chiến đấu, bản đồ, thoại, tutorial, đấu trường và điều khiển bàn phím.
- `styles/style.css`: toàn bộ giao diện và bố cục.
- `assets/`: ảnh, bản đồ, nhạc, âm thanh và gói VFX.
- `config/supabase_config.js`: URL và khóa anon/publishable dùng ở phía trình duyệt; file này bị `.gitignore` bỏ qua, hãy tạo từ file mẫu nếu thiếu.
- `supabase/migrations/`: các migration SQL; `supabase/functions/arena-match/`: mã Edge Function và engine được tạo.
- `tools/build_engine.cjs`: tạo lại `engine.mjs` cho Edge Function từ các file lõi trong `src/`.
- VFX chiến đấu dùng theme **Flat Night** tại `assets/vfx/Cooked_FX_FREE_Flat_Night/Cooked_FX_FREE/Flat_Night/PNG_1x/`; metadata frame nằm trong `Flat_Night/anims.json`, giấy phép gốc được giữ cùng gói tải về.

Frontend không cần bước build. Chạy game bằng máy chủ web tĩnh như hướng dẫn đầu README. Sau khi chỉnh `src/rpg_core.js`, `src/rpg_combat.js` hoặc `src/arena_core.js`, chạy `node tools/build_engine.cjs` rồi deploy lại Edge Function nếu muốn cập nhật mô phỏng PvP xếp hạng.
