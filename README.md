# THE TIU — Hướng dẫn dự án và gameplay

## Giới thiệu

Game sinh tồn chiến thuật theo lượt lấy bối cảnh khuôn viên UIT. Bạn vào vai một sinh viên tranh suất tốt nghiệp loại Giỏi: khám phá các tòa nhà, tránh The TIU, xử lý sự cố, thu thập tài nguyên, xây dựng quan hệ và đấu với những sinh viên khác để giữ ĐRL.

Game chạy trực tiếp trên trình duyệt, không cần bước build riêng. Mở `index.html` để chơi. Tiến trình được lưu trong bộ nhớ cục bộ của trình duyệt.

## Vòng chơi chính

1. **Khám phá khuôn viên:** đi giữa các phòng kề nhau để tìm NPC, linh kiện, vật phẩm và mảnh La Peace. Bản đồ nhỏ và bản đồ phóng to cho biết các lối nối giữa phòng.
2. **Quản lý thời gian và nguy hiểm:** mỗi đêm kéo dài 450 phút trong game (khoảng 7 phút 30 giây nếu thời gian chạy liên tục). The TIU tuần tra và tiến lại gần; đứng cùng phòng với nó ở khu vực không an toàn sẽ bị bắt và mất ĐRL.
3. **Chọn cách kiếm lợi thế:** giải sự cố để nhận ĐRL, chế tạo đồ từ linh kiện, mua vật phẩm ở căn tin, nói chuyện để tăng tin tưởng, hoặc khiêu chiến NPC để lấy ĐRL, EXP và chiến lợi phẩm.
4. **Sống sót qua các đêm:** cuối mỗi đêm Chapter 1, người còn ĐRL thấp nhất bị loại. Sau ba đêm, Chapter 2 đưa người chơi tới trận quyết định.

## Điều kiện thắng và thua

- **Chapter 1:** sống sót qua ba đêm loại trừ. NPC cũng có thể đấu với nhau; người có ĐRL thấp nhất ở cuối đêm bị loại.
- **Chapter 2:** vượt qua đêm chuẩn bị và thắng trận cuối để giành suất tốt nghiệp loại Giỏi.
- **Thua trận:** người chơi mất 25% ĐRL hiện có; đối thủ thắng nhận phần ĐRL tương ứng. HP còn lại được giữ giữa các trận trong cùng đêm.
- **Bị The TIU bắt:** bị trừ 5 ĐRL. Sau đó có một khoảng miễn nhiễm ngắn để tránh bị bắt liên tiếp.
- **Qua đêm mới:** HP được hồi đầy. ĐRL, cấp độ, vật phẩm, mối quan hệ và các mảnh La Peace tiếp tục theo người chơi.

## Hệ thống gameplay

### Di chuyển, thể lực và thời gian

- Mỗi lần sang phòng kề bên tốn 10 phút game và 20 thể lực. Thể lực hồi dần theo thời gian.
- Khi thể lực cạn, người chơi không thể tiếp tục di chuyển. Kiệt sức ở nơi không an toàn có thể dẫn tới một trận phục kích.
- Căn tin là nơi an toàn khi mở cửa. Cửa mở theo các khung giờ hiển thị trong game; nghỉ một giờ hồi HP và thể lực nhưng thời gian thế giới vẫn trôi.
- Mỗi trận đấu kéo dài 60 phút game. Thời gian này được cộng vào đồng hồ sau trận, nên cân nhắc nguy cơ tuần tra và hạn sự cố trước khi khiêu chiến.

### ĐRL, chiến đấu và phát triển nhân vật

- Người chơi bắt đầu với 30 ĐRL. Thắng trận cướp 25% ĐRL của đối thủ; thua mất 25% ĐRL của mình.
- Thắng trận nhận EXP và có thể nhận vật phẩm. Lên cấp mở kỹ năng ở Lv1, Lv3 và Lv5; cấp tối đa là Lv5.
- Mỗi lượt, người chơi chọn đánh thường, dùng kỹ năng, dùng Ultimate khi đủ Nộ, dùng vật phẩm hoặc phòng thủ. Đồng đội và đối thủ hành động tự động.
- Trước lượt người chơi, giao diện hiển thị kỹ năng đối thủ có thể dùng và cảnh báo khi họ đã đầy Nộ. Đây là thông tin chiến thuật, không phải cam kết AI sẽ chọn đúng đòn đó.
- QTE kỹ năng là tùy chọn: tự hoàn thành để đạt hiệu lực cao hơn, hoặc chọn **“BỎ QTE · THI TRIỂN Ở 70%”** để bỏ chuỗi phím và dùng kỹ năng với 70% hiệu lực. Bỏ QTE không áp dụng cho QTE phòng thủ.
- QTE tấn công có cùng số mũi tên cơ bản ở mọi lớp; Ultimate có thêm hai mũi tên. Chênh lệch lớp đến từ kỹ năng và chỉ số.
- HP được giữ lại giữa các trận trong đêm. Dùng Bim Bim, vật phẩm hồi phục hoặc nghỉ ở căn tin để chuẩn bị cho trận kế tiếp.

### Sự cố, vật phẩm và La Peace

- Sự cố xuất hiện trên bản đồ và có thời hạn. Hoàn thành minigame nhận 6, 8 hoặc 10 ĐRL tùy đêm; thất bại có thể khiến The TIU áp sát.
- Linh kiện có thể chế tạo lựu đạn điện, đèn flash, bẫy, áo giáp hoặc máy quay soi. Căn tin bán một số vật phẩm bằng ĐRL.
- Ba mảnh La Peace là vật phẩm độc nhất: **Spell Breaker** cho cơ hội parry Ultimate địch, **Mana Transfer** hồi một phần Nộ sau Ultimate, và **Die Twice** hồi sinh một lần trong mỗi trận. Mảnh chưa được nhặt trước 03:00 sẽ rơi vào tay đối thủ.

### Quan hệ với NPC

- Nói chuyện với mỗi NPC tối đa một lần mỗi đêm để tăng tin tưởng.
- Đạt 2 điểm tin tưởng có thể mời NPC vào đội. Đội hiện chỉ nhận tối đa một đồng đội.
- Đồng đội hỗ trợ chiến đấu và nhận EXP. Cốt truyện Chapter 2 hiện có biến cố phản bội đồng đội.

## Điều khiển

- **Di chuyển trong khuôn viên:** dùng các nút phòng kề nhau hoặc bấm phòng có viền hợp lệ trên bản đồ.
- **Thông tin ca đêm:** thẻ mục tiêu cho biết thứ hạng ĐRL, sự cố gần nhất, La Peace chưa nhặt và nơi The TIU được thấy lần cuối. Trước khi đấu NPC, game báo trước chi phí thời gian.
- **Trong khu vực dạng top-down:** dùng WASD hoặc phím mũi tên để đi; nhấn **E** để tương tác.
- **Trên điện thoại:** dùng D-pad cảm ứng và nút tương tác khi đi trong khu vực top-down; dùng cụm phím mũi tên trên màn hình cho QTE chiến đấu và minigame truy đuổi.
- **QTE:** nhấn hướng mũi tên hiện trên màn hình bằng phím mũi tên hoặc WASD; vùng sáng cho kết quả tốt nhất.
- **Hội thoại:** nhấn **J** hoặc Enter để tiếp tục.
- **Tạm dừng:** nhấn **Esc** khi không có cửa sổ tương tác đang mở.

## Tệp chính

| Tệp | Vai trò |
| --- | --- |
| `index.html` | Khung giao diện và nạp các module game |
| `script.js` | Vòng lặp ca đêm, bản đồ, sự kiện, UI, lưu game và QTE |
| `rpg_core.js` | Cấu hình, lớp nhân vật, ĐRL, EXP, vật phẩm, đội hình và mô phỏng NPC |
| `rpg_combat.js` | Luật chiến đấu, AI, sát thương, hiệu ứng và quyết toán trận |
| `dialogue.js` | Hội thoại và các đoạn truyện |
| `map.js` | Dữ liệu phòng, kết nối và bản đồ |
| `horrorpolish.js` | Hiệu ứng không khí kinh dị |
| `style.css` | Giao diện và hoạt ảnh |
| `assets/` | Hình ảnh, âm thanh và biểu tượng |

## Ghi chú cân bằng

Các con số trong README mô tả luật đang có trong mã nguồn; độ cân bằng giữa lớp, nhịp sự kiện và độ khó QTE cần được đánh giá thêm qua lượt chơi thực tế. Khi chỉnh cơ chế, cập nhật phần này cùng `RPG.CFG` và các hằng số liên quan trong `script.js` để tài liệu không lệch khỏi luật game.
