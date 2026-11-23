# THE TIU

THE TIU là game **chơi đơn**, sinh tồn pha nhập vai và chiến đấu theo lượt, lấy bối cảnh khuôn viên UIT. Năm sinh viên tranh suất tốt nghiệp loại Giỏi; người chơi phải kiếm Điểm Rèn Luyện (ĐRL), sống sót qua các đêm loại trừ và quyết định cách đối đầu với The TIU.

## Bắt đầu chơi

Game là ứng dụng web tĩnh, không cần cài gói hay chạy bước build để chơi.

1. Mở `index.html` trong trình duyệt hiện đại.
2. Nếu trình duyệt hạn chế tải tài nguyên khi mở trực tiếp, chạy máy chủ web tĩnh tại thư mục dự án:

   ```powershell
   py -m http.server 8000
   ```

   Sau đó mở <http://localhost:8000>. Nếu lệnh `py` không có, thử `python -m http.server 8000`.
3. Chọn **HÀNH TRÌNH MỚI**, nhập tên (Enter để xác nhận), rồi làm bài trắc nghiệm chọn Class. Chọn **TIẾP TỤC HÀNH TRÌNH** để tải bản lưu.
4. Mở **CÀI ĐẶT** để điều chỉnh âm lượng, rung/chớp màn hình, nhịp khám phá và tốc độ hiển thị lời thoại.

Tiến trình được lưu lâu dài trong trình duyệt trên thiết bị này, không cần tài khoản hoặc dịch vụ máy chủ. Dùng cùng trình duyệt và địa chỉ mở game để tìm lại bản lưu. Font trực tuyến có phông hệ thống thay thế khi mất mạng. NPC, đồng đội AI và các cuộc đối đầu trong cốt truyện vẫn thuộc chiến dịch chơi đơn.

## Điều khiển

| Thao tác | Điều khiển |
|---|---|
| Đi trong sơ đồ tòa nhà | `W A S D` hoặc phím mũi tên |
| Tương tác với vật thể gần nhất | `E` |
| Mở/đóng bản đồ khuôn viên | `M` hoặc nút phóng to bản đồ |
| Mở túi đồ | `B` |
| Mở tài năng | `T` |
| Mở/đóng nhật ký hành trình, nhiệm vụ và lời thoại đã nghe | `Q` |
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

- Mỗi đêm kéo dài từ 00:00 đến 07:30 theo giờ trong game. Mặc định **Nhịp khám phá chậm** cho mỗi phút game tương ứng 1,5 giây thực; tắt tùy chọn này để dùng nhịp gốc 1 giây. Chi phí di chuyển và chiến đấu không đổi.
- Khám phá các tòa nhà, nói chuyện hoặc thách đấu NPC, nhặt linh kiện và xử lý sự cố để kiếm tài nguyên và ĐRL.
- Cuối đêm, sinh viên còn sống có ĐRL thấp nhất bị loại. Nếu người chơi bị loại, có thể thử lại đêm đó từ checkpoint.
- Theo dõi **Mục tiêu đêm**, bản đồ và nhật ký để biết thứ hạng, sự cố, mini-boss và vị trí The TIU nhìn thấy gần nhất.

### Chapter 2 — Chuẩn bị và đại chiến

Sau ba đêm đầu, Chapter 2 có một đêm chuẩn bị và một trận cuối. Hãy tận dụng phần chuẩn bị để hoàn thiện tài năng, trang bị, vật phẩm, La Peace và các mối quan hệ trước đại chiến.

## Cơ chế chính

### Khám phá và sinh tồn

- Khuôn viên có bản đồ các phòng nối với nhau; bản đồ nhỏ và bản đồ lớn cho phép đi sang phòng liền kề. Mở bản đồ lớn để tạm dừng và lên kế hoạch; chọn phòng bằng mũi tên rồi Enter, hoặc bấm trực tiếp.
- Di chuyển giữa hai phòng tốn 10 phút game và 20 thể lực. Thể lực tối đa là 100 và hồi theo thời gian.
- Nếu tiếp tục đi khi thiếu thể lực, bạn có thể bị phục kích khi đến nơi. Phục kích khiến trận bắt đầu với tối đa 50% HP và kỹ năng đang hồi chiêu.
- Căn tin bán vật phẩm suốt đêm. Trong Chapter 1, đây là nơi an toàn để nghỉ từ 01:00–02:00 và 04:00–05:00. Nghỉ một giờ hồi HP cho bạn/đồng đội và hồi thể lực.
- The TIU tuần tra trong Chapter 1. Nếu bắt được người chơi, bạn phải chiến đấu; thua bị trừ ĐRL. Các biến cố đêm như mất điện, thi giữa kỳ, sương mù và trăng máu thay đổi cách sinh tồn.

### Sự cố và mini-boss

The TIU có thể gây sự cố ở một số phòng. Hãy đến nơi được báo trong mục tiêu đêm và hoàn thành mini-game trước khi hết hạn để nhận ĐRL. Thử thách có thể yêu cầu tìm hình khác biệt, chỉnh đèn, nối dây, trả lời câu hỏi, nhập chuỗi phím hoặc sắp xếp số. Đêm đầu cho người chơi thêm thời gian làm quen: The TIU tuần tra chậm hơn, sự cố xuất hiện muộn hơn, thời hạn xử lý dài hơn và sự cố không lan dây chuyền. Từ các đêm sau, nhịp đe dọa tăng dần. Trong mini-game, đồng hồ thế giới tạm dừng; thử thách vẫn có bộ đếm riêng. Các ô hình, đèn, đầu dây, đáp án và sách đều điều khiển được bằng Tab/mũi tên và Enter. Chuỗi hướng nhận cả WASD; Esc bỏ cuộc. Mini-boss có tay sai canh một số phòng; thắng nhận ĐRL, EXP và linh kiện, còn thua có thể mất tối đa 3 ĐRL.

### NPC và đồng đội

- NPC có thể di chuyển giữa các phòng. Lắng nghe và hoàn thành cam kết chiến đấu để tăng Tin tưởng; đạt ngưỡng cần thiết để mời họ vào đội hoặc nhận nhiệm vụ riêng.
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

### Nhánh bí mật — Dark Determination / The Escaped One

1. Trong **Chapter 1, đêm đầu**, thắng cả bốn NPC **Wibu Việt Nhật, Chàng Lính Ngu Lam, Trọng và Toby** để nhận **Dark Determination**. Chỉ chiến thắng của người chơi mới được tính; đấu lại một người không cộng thêm, trận thua và các trận NPC tự đánh nhau không tính.
2. Hiệu ứng tồn tại suốt hành trình, tăng **25% sát thương đòn đánh, kỹ năng và triệu hồi**; không tăng sát thương cố định của vật phẩm hay sát thương theo thời gian. Tiến độ hiện ở Mục tiêu đêm/nhật ký; hiệu ứng hiện trong túi đồ và trên thẻ chiến đấu.
3. Khi có Dark Determination, thắng **The TIU tuần tra** để nhận **Dark Core** một lần. Trận The TIU ở phần kết không mở nhánh này vì hành trình đã bước vào chung kết.
4. Mang Dark Core tới **tòa E**: bạn tự động được dịch chuyển lên **sân thượng tòa E**, gặp một sinh viên bí ẩn. Nếu đang ở tòa E khi nhận lõi, cuộc gặp bắt đầu sau khi đóng tổng kết trận. Cuộc gặp cũng có thể diễn ra trong đêm chuẩn bị Chapter 2.
5. Hội thoại nhắc tới sức mạnh bao phủ UIT và ép buộc số phận mọi người: cậu từng tưởng đã trốn thoát, nhưng bị The TIU hấp thụ và chỉ thoát ra bằng quyết tâm của mình — easter egg của **Escape UIT**. Sau đó là trận đấu một chọi một với secret boss **The Escaped One** (ID: TheEscapedOne), có QTE phòng thủ. Hội thoại dừng đồng hồ; trận đấu tốn 60 phút game.
6. **Thua:** The Escaped One thở dài thất vọng rồi biến mất, không trao vũ khí. **Thắng:** nhận **Will of the Escaped One**, tự trang bị vào **ô vũ khí**, cộng **24 ATK, 8 SPD và 10% tỉ lệ chí mạng**. Vũ khí không thể chế tạo; sau khi đổi sang vũ khí khác, có thể trang bị lại từ túi đồ.

Sau cả hai kết quả, thang máy đưa bạn về tòa E. Cuộc gặp chỉ xảy ra **một lần mỗi hành trình**; Dark Core được giữ làm kỷ vật. Tiến độ, hiệu ứng và kết quả được lưu qua các đêm và khi tải lại game. Đóng game giữa hội thoại/trận sân thượng sẽ trở lại mốc an toàn trước cuộc gặp. New Game+ giữ quyền sở hữu vũ khí đã nhận, còn điều kiện Dark Determination, Dark Core và cuộc gặp được làm lại từ đầu.

### Lưu game, hướng dẫn và kết thúc

- Game tự lưu ở trạng thái có thể khôi phục, định kỳ 15 giây khi khám phá và sau thao tác; đầu mỗi đêm tạo checkpoint. Không ghi trạng thái dở dang của trận đấu, câu đố hay hội thoại. Đóng trang giữa các hoạt động này sẽ trở lại mốc an toàn gần nhất. Màn hình thất bại cho phép thử lại đêm từ checkpoint.
- Menu Esc có **Lưu hành trình**. Cài đặt có **Xuất bản lưu (.json)** và **Nhập bản lưu** để sao lưu/chuyển máy. Bản lưu sai cấu trúc bị từ chối; bản chính hỏng có thể phục hồi từ bản dự phòng gần nhất. Dữ liệu chơi đơn v2 cũ được giữ; bản lưu tạm trong tab còn mở được chuyển sang lưu lâu dài nếu mới hơn.
- Rời cửa sổ lúc khám phá sẽ tự tạm dừng. Trở lại và bấm Esc để tiếp tục. Nhật ký Q giữ tối đa 120 dòng thoại/lựa chọn đã đọc.
- Tutorial tự giới thiệu một số cơ chế theo tình huống. Mở bằng `H`/❓ để xem tám chủ đề: điều khiển, sinh tồn, sự cố, quan hệ, chiến đấu, tài năng, đồ và chế tạo, cốt truyện. Chọn **Đặt lại tất cả** để xem lại từ đầu.
- Các lựa chọn, Gắn bó, La Peace và những lần đối đầu The TIU có thể dẫn đến kết thúc khác nhau. New Game+ giữ lại một phần tiến trình và tăng độ khó.

## Cấu trúc mã nguồn

- `index.html`: điểm vào game; giữ ở thư mục gốc để host tĩnh phục vụ game trực tiếp.
- `src/`: mã gameplay, RPG, chiến đấu, bản đồ, thoại, tutorial, lưu game và điều khiển bàn phím.
- `styles/style.css`: toàn bộ giao diện và bố cục.
- `assets/`: ảnh, bản đồ, nhạc, âm thanh và gói VFX.
- VFX chiến đấu dùng theme **Flat Night** tại `assets/vfx/Cooked_FX_FREE_Flat_Night/Cooked_FX_FREE/Flat_Night/PNG_1x/`; metadata frame nằm trong `Flat_Night/anims.json`, giấy phép gốc được giữ cùng gói tải về.

Frontend không cần bước build. Chạy game bằng máy chủ web tĩnh như hướng dẫn đầu README.

## Kiểm tra hồi quy

Cần Node.js 22 trở lên (không phải cài gói npm):

```powershell
node --test tools/regression.test.cjs
node tools/browser_smoke.cjs
```

Bộ kiểm tra lõi bao gồm lưu/tải, bản dự phòng, dữ liệu hỏng, hết dung lượng, di chuyển bản lưu cũ và 120 mô phỏng chiến đấu thường/The TIU cho năm Class ở cấp 1/3/5/8, 15 mô phỏng The Escaped One và kiểm tra điều kiện mở khóa, hệ số sát thương, phần thưởng một lần, dữ liệu lưu của nhánh bí mật. Kiểm tra trình duyệt mặc định dùng Microsoft Edge trên Windows với hồ sơ tạm riêng; có thể đặt biến môi trường BROWSER_PATH trỏ đến Chromium khác. Ảnh kiểm tra giao diện được lưu trong thư mục tạm và đường dẫn in ra khi chạy. Kiểm tra trình duyệt còn đi qua hai kết quả thắng/thua trên sân thượng, trang bị lại vũ khí và tải lại mốc an toàn. Các kiểm tra này không thay thế việc chơi thử toàn bộ nhánh cốt truyện hoặc cân bằng độ khó.

### Nhịp chiến đấu và tin cậy

Mọi trận thường (kể cả phục kích, quái, mini-boss và The TIU tuần tra) dùng đòn đánh riêng theo Class. Secret boss và toàn bộ đêm cuối giữ luật chiến đấu cũ.

- Đấu sĩ: đánh thường sau Phòng thủ mạnh thêm 35%; Trọng kích tốn 20 TL, sức đánh 165%, chậm 20 tốc độ.
- Sát thủ: đánh thường liên tiếp cùng mục tiêu tăng 12% mỗi lần (tối đa 36%); Liên kích tốn 20 TL cho hai nhát 70%.
- Pháp sư: đánh thường tích tối đa 3 ấn trên một mục tiêu; Kích nổ tốn 15 TL, sức đánh 80% + 50% mỗi ấn và tiêu hết ấn.
- Hộ tế: Hấp thu tốn 15 TL, sức đánh 85%, hồi 8% HP tối đa nếu gây sát thương.
- Triệu hồi: Hiệp kích tốn 15 TL, sức đánh 75%, mỗi vật triệu hồi có sức tấn công đang sống đánh thêm một nhát 50%.

Ultimate có nhịp QTE riêng theo Class. Trong trận thường, đúng hướng ngoài vùng sáng được nửa điểm; bỏ QTE bằng Q hoặc nút bấm luôn cho 70% hiệu lực. Đòn giả trong QTE phòng thủ trận thường cảnh báo trước 250 ms và cấp lại cửa sổ phản ứng sau khi đổi hướng.

Từ lượt 2 (hoặc khi đối thủ còn nửa HP), hội thoại có thể làm đối thủ mạnh/yếu hơn. Mỗi đối thủ chỉ mở thoại một lần, tối đa hai đối thủ trong trận nhóm. Quái không trao điểm tin cậy.

Tin cậy vẫn tối đa 3, cần 2 để mời đồng đội/nhận nhiệm vụ riêng. Không còn cộng điểm khi chỉ bắt đầu nói chuyện. Có ba nguồn thưởng, mỗi nguồn chỉ nhận một lần cho mỗi NPC trong cả hành trình:

1. Lắng nghe ít nhất hai cảnh và chọn một phản hồi có ý nghĩa: +1. Lời hứa ngoài trận chưa trao điểm.
2. Chọn cam kết trong trận và thắng đúng điều kiện: +1. Wibu cần Phòng thủ hai lần; Toby một lần; Linh cần chiến đấu thêm ít nhất hai lượt; Trọng cần thêm hai lượt và không dùng Ultimate. Mọi cam kết đều cấm vật phẩm sau khi hứa. Đối thủ được +10% Công trong ba lượt.
3. Hoàn thành cam kết khi thắng còn tối đa 35% HP và không bỏ QTE sau lời hứa: thêm +1.

Dùng vật phẩm hoặc vi phạm điều kiện cấm sẽ trừ 1 tin cậy khi kết toán. Thua hoặc chưa đủ số lượt/phòng thủ không nhận thưởng. Điểm đã có trong bản lưu cũ được giữ lại; các nguồn thưởng mới được lưu để chặn nhận lặp lại.
