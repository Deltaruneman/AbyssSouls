/* =========================================================================
   tutorial.js — HƯỚNG DẪN TRỰC QUAN CHO NGƯỜI CHƠI MỚI
   Nạp SAU script.js. Hiện "đèn rọi" (spotlight) vào đúng phần giao diện đang được giải thích.
   - Hướng dẫn theo chủ đề, có thể mở lại bất cứ lúc nào; một số bài tự bật khi gặp cơ chế lần đầu.
   - Phím: Enter / → / Space = tiếp · ← = lùi · Esc = bỏ qua · H = mở menu hướng dẫn bất cứ lúc nào.
   - Trạng thái "đã xem" lưu theo phiên với khách, lưu lâu dài với tài khoản (tiu_tut_done).
   ========================================================================= */
(function () {
  "use strict";
  const LS = "tiu_tut_done";
  const storage = () => { try { return window.TiuAccess && window.TiuAccess.mode() === "guest" ? sessionStorage : localStorage; } catch (e) { return localStorage; } };
  const $ = (id) => document.getElementById(id);
  const done = () => { try { return JSON.parse(storage().getItem(LS) || "{}"); } catch (e) { return {}; } };
  const markDone = (k) => { try { const d = done(); d[k] = true; storage().setItem(LS, JSON.stringify(d)); } catch (e) { /* bỏ qua */ } };

  /* ------------------------------ NỘI DUNG CÁC BÀI ------------------------------ */
  const TOURS = {
    basic: { name: "Bắt đầu & điều khiển", icon: "🧭", steps: [
      { title: "Chào mừng đến The TIU", text: "Năm sinh viên cạnh tranh suất tốt nghiệp loại Giỏi. Bạn cần sống sót, kiếm <b>ĐRL</b> và chọn cách đối đầu với The TIU. Bấm <b>Enter / → / Space</b> để tiếp, <b>←</b> để lùi, <b>Esc</b> để đóng bài." },
      { sel: "#hud", title: "Thanh trạng thái", text: "Theo dõi giờ ca, HP, mức hoạt động của The TIU, thể lực đi lại và vị trí nó được nhìn thấy lần cuối. Khi hết giờ, đêm kết thúc và thứ hạng ĐRL được tính." },
      { sel: "#roomBanner", title: "Đi lại trong tòa nhà", text: "Dùng <b>WASD</b> hoặc phím mũi tên để đi trong sơ đồ tòa nhà. Đến gần vật thể sẽ thấy nhãn tương tác; bấm <b>E</b> để dùng NPC, cửa, điểm nhặt đồ, sự cố, quầy hoặc bàn chế tạo. Nếu bản đồ tòa nhà không khả dụng, dùng nút hành động bên dưới." },
      { sel: "#actionPane", title: "Hành động luôn có nút bấm", text: "Các hành động hợp lệ trong phòng hiện ở đây. Bạn có thể bấm nút trực tiếp; di chuyển giữa phòng cũng có nút đích đến, nên không cần dùng phím tắt để chơi." },
      { title: "Thoại và lựa chọn", text: "Bấm vào khung thoại hoặc dùng <b>J / Enter / Space</b> để hiện chữ và sang câu tiếp. <b>Ctrl</b> tua đến lựa chọn tiếp theo; phím <b>1–4</b> chọn nhanh, hoặc bấm đáp án trên màn hình. Lựa chọn có thể thay đổi quan hệ và kết thúc." },
      { sel: "#miniMapWrap", title: "Bản đồ khuôn viên", text: "Bản đồ nhỏ cho biết vị trí và các phòng nối trực tiếp. Bấm <b>M</b> hoặc <b>⤢</b> để mở bản đồ lớn; chọn phòng viền sáng để đi sang đó." },
      { sel: "#nightBrief", title: "Mục tiêu và cảnh báo", text: "Đọc mục tiêu đêm, thứ hạng ĐRL, sự cố gần nhất, mini-boss, biến cố thời tiết và vị trí The TIU. Sương mù che vị trí lần cuối; mất điện làm nó đi nhanh; trăng máu tốn thêm thể lực." },
      { sel: "#logPane", title: "Nhật ký ca trực", text: "Nhật ký ghi sự cố, NPC di chuyển, phần thưởng, trận đấu và cảnh báo. Nếu bảng bị thu gọn, bấm biểu tượng 📜 để mở lại." },
      { sel: "#talentBtn", title: "Điểm Tài Năng đầu tiên", text: "Bạn bắt đầu với một điểm. Bấm <b>T</b> hoặc ⭐ để chọn một tài năng; có thể đổi build miễn phí bằng nút Tẩy điểm. Bài riêng giải thích cách xây dựng nhân vật." },
      { sel: "#helpBtn", title: "Mở lại bất kỳ lúc nào", text: "Khi đang khám phá, nút ❓ hoặc phím <b>H</b> mở danh sách mọi bài. Bài đã xem vẫn có thể xem lại; dùng <b>Đặt lại tất cả</b> nếu muốn bật lại hướng dẫn tự động. Trong trận, hãy tập trung vào bảng lệnh chiến đấu." }
    ] },
    survival: { name: "Khám phá, thời gian & sinh tồn", icon: "🕯️", steps: [
      { sel: "#clockVal", title: "Thời gian chạy trong ca", text: "Một giây thực tương ứng một phút trong game. Đi giữa hai phòng tốn <b>10 phút</b>; hoạt động và nghỉ cũng làm thời gian trôi, nên hãy cân đối đường đi." },
      { sel: "#energyOuter", title: "Thể lực đi lại", text: "Đi sang phòng khác tiêu thể lực. Khi thấp hơn chi phí di chuyển, đi tiếp sẽ khiến bạn bị phục kích: vào trận với <b>50% HP</b> và kỹ năng hồi chiêu. Nghỉ ở Căn tin đang trong giờ an toàn để hồi thể lực." },
      { sel: "#staminaOuter", title: "HP và hồi phục", text: "HP giữa các trận được giữ lại; nhân vật thua trận còn ít nhất 1 HP. Đầu đêm mới cả đội hồi đầy. Dùng vật phẩm hoặc nghỉ Căn tin để hồi trong đêm." },
      { sel: "#miniMapWrap", title: "Lập lộ trình", text: "Di chuyển qua các phòng liền kề. Hãy ghé phòng có nhặt đồ, NPC, sự cố hoặc mini-boss nếu còn thời gian; đường đi xa sẽ tiêu thể lực và làm The TIU tiếp tục tuần tra." },
      { sel: "#nightBrief", title: "Căn tin và giờ an toàn", text: "Căn tin mở quầy suốt đêm. Trong Chapter 1, nơi này an toàn từ <b>01:00–02:00</b> và <b>04:00–05:00</b>; nghỉ tốn một giờ, hồi HP cho bạn/đồng đội và hồi thể lực. Sang Chapter 2, hãy kiểm tra nút Nghỉ vì nơi an toàn không còn áp dụng." },
      { title: "The TIU săn theo phòng", text: "The TIU tuần tra theo thời gian; khi ở cùng phòng, bạn có thể bị bắt và buộc phải chiến đấu. Sau khi thoát một lần, nó có khoảng thời gian bị đẩy lùi. Theo dõi thanh hoạt động và vị trí lần cuối để tránh chạm mặt." },
      { title: "Tạm dừng và lưu", text: "Bấm <b>Esc</b> để tạm dừng, mở cài đặt hoặc về menu. Tiến trình tự lưu; bắt đầu đêm mới tạo checkpoint để bạn có thể thử lại đêm đó. Ở menu chính, chọn <b>Tiếp tục</b> để tải bản lưu." },
      { title: "Đêm và thứ hạng", text: "Chapter 1 có ba đêm loại trừ: kiếm ĐRL, sống sót và tránh đứng cuối bảng. Mua đồ sẽ tiêu ĐRL nhưng phần đã tiêu không bị tính là mất điểm khi đồng đội xét lòng trung thành." }
    ] },
    events: { name: "Sự cố & mini-game", icon: "⚠️", steps: [
      { sel: "#nightBrief", title: "Sự cố do The TIU gây ra", text: "Sự cố xuất hiện ở một tòa và có hạn xử lý. Mục tiêu đêm cho biết nơi gần nhất và thời gian còn lại. Bỏ lỡ có thể khiến sự cố lan hoặc kéo The TIU đến gần." },
      { sel: "#resolveBtn", title: "Bắt đầu xử lý", text: "Đến đúng phòng có biểu tượng ⚠ rồi bấm <b>XỬ LÝ SỰ CỐ</b> (hoặc đến gần vật thể và bấm E). Hoàn thành mini-game nhận ĐRL; thất bại mất cơ hội nhận thưởng và có thể làm The TIU áp sát." },
      { title: "Các dạng thử thách", text: "Tìm biểu tượng khác lạ hoặc quả bóng thật; đảo đèn cho khớp mẫu; nối hai đầu dây cùng màu; trả lời câu hỏi; gõ lại chuỗi mũi tên; hoặc sắp số theo thứ tự. Màn hình của từng thử thách luôn ghi luật và thời gian còn lại. Làm sai có thể kết thúc ngay." },
      { title: "Ưu tiên theo khoảng cách", text: "Phần thưởng sự cố tăng theo đêm. Ưu tiên sự cố gần, còn nhiều thời gian và đường đi an toàn; đừng cố chạy vòng xa khi thể lực thấp hoặc The TIU đang sát bên." },
      { title: "Mini-boss canh phòng", text: "Một số đêm có phòng bị mini-boss và tay sai chặn. Mục tiêu đêm cho biết vị trí. Bạn có thể chọn chiến đấu hoặc lùi; thắng nhận ĐRL, EXP và linh kiện." },
      { title: "Bẫy và phục kích", text: "Bẫy gài đặt tại phòng hiện tại, tồn tại giới hạn thời gian và làm đối thủ bước vào mất HP, mất lượt đầu ở trận kế tiếp. Đổi lại, hoạt động gây tiếng động có thể khiến The TIU nhảy đến gần." }
    ] },
    social: { name: "NPC, đồng đội & nhiệm vụ", icon: "🤝", steps: [
      { sel: "#actionPane", title: "Gặp NPC", text: "NPC xuất hiện ở các phòng khác nhau và có thể đi lang thang. Đến gần họ bấm <b>E</b>, hoặc dùng nút Gặp trong bảng hành động." },
      { title: "Nói chuyện và Tin tưởng", text: "Nói chuyện giúp tăng Tin tưởng. Khi đủ ngưỡng, NPC có thể gia nhập đội và mở nhiệm vụ riêng. Nút thách đấu cho phép đấu trực tiếp; trận tiêu thời gian game và HP còn lại được giữ cho trận sau." },
      { sel: "#hiddenStatsBtn", title: "Theo dõi quan hệ", text: "Bấm <b>⋮</b> để xem Tin tưởng, thông tin đã dò và vị trí NPC đã được khám phá. Máy quay soi cũng có thể thu thập Class, cấp và vị trí đối thủ." },
      { title: "Đồng đội và lòng trung thành", text: "Đồng đội hỗ trợ chiến đấu nhưng có thể rời đi nếu bạn tụt quá xa về ĐRL trong đêm. Đồng đội Gắn bó sẽ ở lại. Giữ họ bằng cách kiếm điểm và hoàn thành nhiệm vụ." },
      { title: "Nhiệm vụ đồng đội", text: "Nói chuyện với người đủ Tin tưởng để nhận nhiệm vụ. Mở nhật ký bằng <b>Q</b> để xem tiến độ; hoàn thành từng bước bằng cách khám phá, thu thập hoặc chiến đấu theo yêu cầu. Thưởng gồm điểm Tài Năng và Gắn bó." },
      { title: "Đội hình và AI", text: "Đồng đội tự chọn hành động trong trận; bạn điều khiển người chơi. Họ có thể hồi máu, hỗ trợ hoặc gây sát thương tùy Class. HP của họ cũng cần được quản lý giữa các trận." }
    ] },
    battle: { name: "Chiến đấu từ cơ bản đến nâng cao", icon: "⚔️", steps: [
      { sel: "#pkAllyInfo", title: "Đọc thẻ chiến đấu", text: "<b>HP</b> là máu, <b>TL</b> là thể lực dùng kỹ năng, <b>Nộ</b> tích khi tấn công hoặc chịu đòn. Khi Nộ đầy và đạt cấp yêu cầu, bạn có thể dùng Ultimate." },
      { sel: "#pkEnemyInfo", title: "Theo dõi đối thủ", text: "Xem HP, Nộ, hiệu ứng và trạng thái. Dòng nhắc cho biết hệ địch khi đã khám phá; dấu hỏi nghĩa là bạn chưa biết. Máy quay soi cung cấp thêm thông tin về đối thủ." },
      { sel: "#pkMenu", title: "Lệnh mỗi lượt", text: "Chọn bằng nút, phím mũi tên + Enter, hoặc phím số. <b>Tấn công</b> tạo Nộ và hồi một ít TL; <b>Kỹ năng</b> tốn TL, có hồi chiêu; <b>Phòng thủ</b> giảm sát thương và hồi TL; vật phẩm có hiệu ứng riêng." },
      { title: "Chọn mục tiêu và lượt đi", text: "Tốc độ quyết định thứ tự hành động. Kỹ năng có thể đánh một mục tiêu, nhiều mục tiêu hoặc hỗ trợ đồng đội. Một số kẻ địch bị khiêu khích, tàng hình hoặc được triệu hồi nên lựa chọn mục tiêu hợp lệ sẽ thay đổi." },
      { sel: "#pkTextBox", title: "Hệ và điểm yếu", text: "Đòn trúng điểm yếu gây thêm sát thương; đòn bị kháng gây ít hơn. Điểm yếu: <b>Chém → Pháp sư</b>, <b>Lôi → Đấu sĩ</b>, <b>Băng → Sát thủ</b>, <b>Độc → Triệu hồi</b>, <b>Hỏa → Hộ tế</b>, <b>Hư Không → The TIU</b>. Thử đòn để khám phá hệ; thông tin đã biết được lưu lại." },
      { title: "QTE cho Ultimate", text: "Ultimate mở chuỗi mũi tên. Bấm hướng đúng lúc con trỏ nằm trong vùng sáng để tăng hiệu quả; sai dưới ngưỡng chính xác có thể làm chiêu thất bại. Một số tình huống cho phép bỏ QTE để thi triển ở hiệu lực giảm." },
      { title: "Hiệu ứng và khống chế", text: "Cháy, Độc, Đóng băng, Tê liệt và choáng gây sát thương hoặc hạn chế lượt. Buff/debuff có số lượt; Thuốc giải xóa một số hiệu ứng xấu. Độc có thể cộng dồn, còn đóng băng làm mục tiêu chịu thêm sát thương." },
      { title: "Phòng thủ đúng nhịp", text: "Phòng thủ giảm sát thương nhận vào. Khi đỡ đúng Ultimate, sát thương giảm mạnh hơn và bạn nhận thêm Nộ. Nếu có mảnh <b>Spell Breaker</b>, bạn được QTE phản đòn Ultimate của địch; trong trận cuối, né đòn bằng QTE giúp giảm hoặc tránh sát thương." },
      { sel: "#pkTurn", title: "Tài nguyên và hồi chiêu", text: "Đừng dùng hết TL ngay đầu trận. Đánh thường hoặc phòng thủ để hồi, theo dõi số lượt hồi chiêu. Canh Ultimate khi có thể kết liễu hoặc xoay chuyển trận; vật phẩm Nước tăng lực cho thêm Nộ và tốc độ." },
      { title: "Kết quả trận", text: "HP còn lại được lưu sang trận kế tiếp; người thua còn tối thiểu 1 HP. Đánh bại đối thủ cho EXP và có thể cướp ĐRL, linh kiện hoặc Mảnh La Peace. Thua trận có thể mất một phần ĐRL." }
    ] },
    talent: { name: "Class, lên cấp & tài năng", icon: "⭐", steps: [
      { title: "Class quyết định lối chơi", text: "Bài trắc nghiệm đầu game chọn một trong năm Class: Đấu sĩ, Sát thủ, Pháp sư, Hộ tế hoặc Triệu hồi. Mỗi Class có chỉ số, hệ cơ bản, bộ kỹ năng và Ultimate riêng; đọc mô tả kỹ năng trước khi chọn hướng build." },
      { sel: "#hud", title: "EXP và cấp độ", text: "EXP từ trận đấu giúp lên cấp, tăng chỉ số và mở kỹ năng theo cấp. Đối thủ được điều chỉnh theo đêm và cấp của bạn nên các đêm sau vẫn có thử thách." },
      { sel: "#talentBtn", title: "Ba nhánh Tài Năng", text: "Mở bằng <b>T</b> hoặc nút ⭐. Ba nhánh: Công kích, Bền bỉ và Thể lực. Mỗi 2 cấp nhận một điểm; nhiệm vụ đồng đội cũng thưởng điểm. Trong mỗi nhánh phải học từ bậc thấp lên bậc cao." },
      { title: "Chọn build có chủ đích", text: "Điểm tài năng có giới hạn, nên chọn giữa sát thương/chí mạng, HP/phòng thủ hoặc hồi TL/kỹ năng. Bạn có thể <b>Tẩy điểm</b> miễn phí để đổi cách xây dựng nhân vật." },
      { title: "Ultimate thức tỉnh", text: "Khi đạt cấp thức tỉnh, Ultimate được tăng sức mạnh. Tài năng và trang bị có thể bổ trợ thêm; xem mô tả ở bảng Tài Năng và chỉ số nhân vật để biết build hiện tại." }
    ] },
    gear: { name: "Túi đồ, chế tạo & La Peace", icon: "🎒", steps: [
      { sel: "#bagBtn", title: "Túi đồ", text: "Mở bằng <b>B</b>. Túi hiển thị vật phẩm tiêu hao, linh kiện, trang bị và La Peace. Một số vật phẩm dùng ngoài trận, một số chỉ dùng trong chiến đấu; đọc mô tả trước khi dùng." },
      { title: "Nhặt vật phẩm và linh kiện", text: "Trong mỗi phòng có thể có đồ giấu. Đi quanh bản đồ, đến gần điểm nhặt và bấm <b>E</b>. Linh kiện dùng để chế tạo; một số món hồi HP, giải hiệu ứng, làm choáng, gây sát thương hoặc đặt bẫy." },
      { title: "Quầy Căn tin", text: "Quầy bán Bim Bim, Nước tăng lực và Thuốc giải bằng ĐRL. Mua đồ làm giảm số ĐRL đang giữ; cân nhắc giữ điểm để bảo vệ thứ hạng và lòng trung thành đồng đội." },
      { title: "Bàn chế tạo", text: "Ở Căn tin, mở Bàn chế tạo để biến linh kiện thành vật phẩm chiến đấu hoặc trang bị. Có ba ô trang bị: vũ khí, giáp, bùa. Trang bị chế xong tự mang vào và thay món cũ cùng ô." },
      { title: "La Peace", text: "Tìm ba loại Mảnh La Peace trước hạn 03:00. Mảnh chưa nhặt sẽ có thể rơi vào tay đối thủ; bạn có thể đánh bại họ để cướp lại. Theo dõi số mảnh ở túi, bản đồ và mục tiêu đêm." },
      { title: "Sức mạnh của từng mảnh", text: "<b>Spell Breaker</b> mở QTE phá Ultimate của địch; <b>Mana Transfer</b> hồi một phần Nộ sau Ultimate; <b>Die Twice</b> hồi sinh một lần trong trận. Mỗi mảnh chỉ có một và có thể bị đối thủ nắm giữ." },
      { title: "ĐRL vấy bẩn", text: "Hạ The TIU có thể nhận ĐRL vấy bẩn và mở vật phẩm đặc biệt ở Căn tin. Chúng rất mạnh nhưng cũng liên quan đến lựa chọn và kết thúc câu chuyện." }
    ] },
    story: { name: "Chương, lựa chọn & kết thúc", icon: "📖", steps: [
      { title: "Chapter 1: vòng loại", text: "Ba đêm đầu là giai đoạn loại trừ. Tăng ĐRL, sống sót và giữ đồng đội bên mình. Mỗi đêm có thể đổi biến cố, đường đi và cơ hội thu thập." },
      { title: "Chapter 2: chuẩn bị", text: "Sau vòng loại, bạn được hồi phục và bước vào đêm chuẩn bị trước đại chiến. Dùng thời gian để hồi máu, hoàn thiện trang bị, nhiệm vụ, tài năng và đội hình." },
      { title: "Đại chiến và lựa chọn", text: "Trận cuối kiểm tra khả năng chiến đấu và né QTE. Tùy những gì bạn đã làm, có thể chọn đối đầu theo luật, dùng La Peace cùng đồng đội Gắn bó hoặc đi theo sức mạnh vấy bẩn." },
      { title: "Điều kiện kết thúc", text: "Xây dựng Gắn bó, thu thập đủ La Peace và hạ The TIU nhiều lần để mở các nhánh kết thúc khác nhau. Màn kết thúc cho biết còn bao nhiêu kết cục chưa khám phá." },
      { title: "New Game+", text: "Sau khi hoàn thành, New Game+ giữ lại cấp, tài năng và trang bị cùng phần thưởng theo kết thúc. Địch và The TIU mạnh hơn, đồng thời biến cố xuất hiện mọi đêm." }
    ] },
    arena: { name: "Đấu trường & đồng bộ (tùy chọn)", icon: "☁️", steps: [
      { title: "Chế độ trực tuyến là tùy chọn", text: "Đấu trường và đồng bộ không cần để chơi cốt truyện. Nếu chưa cấu hình dịch vụ, phần chơi đơn vẫn hoạt động bình thường." },
      { title: "Key tài khoản", text: "Tạo key trong màn Đấu trường để liên kết nhân vật. Hãy giữ key riêng tư; mất key có thể đồng nghĩa không truy cập lại dữ liệu gắn với key đó." },
      { title: "Lưu và tải build", text: "Bạn có thể lưu build nhân vật lên dịch vụ, tải lại hoặc công khai để người khác thách đấu. Build gồm Class, cấp, tài năng và trang bị." },
      { title: "Đấu giao hữu và xếp hạng", text: "Chọn đối thủ để mô phỏng trận tự động theo luật chiến đấu. Kết quả, điểm xếp hạng và lịch sử trận được đồng bộ khi dịch vụ được bật." }
    ] }
  };

  /* ------------------------------ ENGINE ĐÈN RỌI ------------------------------ */
  let active = null;            // { key, steps, i, prevPaused, shownAt }
  const snoozed = {};           // bài đã bị đóng bằng Esc trong phiên này (không tự bật lại, chưa tính là "đã xem")
  let lastInputAt = 0;          // lần cuối người chơi bấm phím / chuột (để không bật hướng dẫn khi họ đang bấm liên tục để bỏ qua thoại)
  let idleSince = 0;
  const STEP_GUARD_MS = 700;    // sau khi một bước hiện ra, bỏ qua phím trong 0,7 giây để không bị "nhảy bước" do bấm nhanh
  let layer = null, spot = null, card = null;

  const CSS = "#tutLayer{display:none;position:fixed;left:0;top:0;right:0;bottom:0;z-index:150;}#tutLayer.on{display:block;}#tutShield{position:absolute;left:0;top:0;right:0;bottom:0;background:transparent;}#tutLayer.nospot #tutShield{background:rgba(0,0,0,.78);}"
    + "#tutSpot{position:fixed;border:2px solid #e2b65c;border-radius:6px;box-shadow:0 0 0 9999px rgba(0,0,0,.76),0 0 20px rgba(226,182,92,.65);transition:left .25s ease,top .25s ease,width .25s ease,height .25s ease;pointer-events:none;}"
    + "#tutCard{position:fixed;background:#14110d;color:#e8e0d0;border:1px solid #e2b65c;border-radius:6px;padding:14px 16px;box-shadow:0 8px 30px rgba(0,0,0,.7);font-size:15px;line-height:1.55;z-index:2;max-width:94vw;box-sizing:border-box;font-family:inherit;}"
    + "#tutTitle{font-size:20px;letter-spacing:1px;color:#e2b65c;margin-bottom:6px;font-weight:700;}#tutText b{color:#f3e2b3;}#tutFoot{display:flex;justify-content:space-between;align-items:center;margin-top:12px;gap:10px;}#tutCount{font-size:13px;color:#a89e8e;}#tutBtns{display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end;}"
    + "#tutBtns button{background:#241f18;color:#e8e0d0;border:1px solid #6b5a3a;padding:7px 12px;font-size:14px;cursor:pointer;font-family:inherit;}#tutBtns button.primary{border-color:#e2b65c;background:#3a2f1a;}"
    + "#tutToast{position:fixed;left:50%;bottom:26px;transform:translateX(-50%) translateY(20px);background:#14110d;border:1px solid #e2b65c;color:#e8e0d0;padding:10px 16px;font-size:15px;border-radius:6px;opacity:0;pointer-events:none;transition:all .3s;z-index:160;max-width:92vw;text-align:center;}#tutToast.on{opacity:1;transform:translateX(-50%) translateY(0);}";
  function injectCss() {
    if (document.getElementById("tutStyle")) return;
    const st = document.createElement("style"); st.id = "tutStyle"; st.textContent = CSS;
    (document.head || document.documentElement).appendChild(st);
  }
  /* Lớp hướng dẫn có thực sự đang phủ màn hình không? (nếu không -> hủy, tuyệt đối không chặn phím) */
  function layerWorks() {
    try { const cs = getComputedStyle(layer); return cs.position === "fixed" && cs.display !== "none"; } catch (e) { return false; }
  }
  function build() {
    injectCss();
    if (layer) return;
    layer = document.createElement("div"); layer.id = "tutLayer";
    layer.innerHTML = '<div id="tutShield"></div><div id="tutSpot"></div><div id="tutCard" role="dialog" aria-live="polite"><div id="tutTitle"></div><div id="tutText"></div><div id="tutFoot"><span id="tutCount"></span><span id="tutBtns"><button class="btn" id="tutSkip">Bỏ qua</button><button class="btn" id="tutBack">← Lùi</button><button class="btn primary" id="tutNext">Tiếp ▶</button></span></div></div>';
    document.body.appendChild(layer);
    spot = $("tutSpot"); card = $("tutCard");
    $("tutNext").onclick = next; $("tutBack").onclick = back; $("tutSkip").onclick = () => finish("never");
    $("tutSkip").textContent = "Bỏ qua (không hiện lại)";
  }
  function toast(msg) {
    injectCss();
    let el = $("tutToast");
    if (!el) { el = document.createElement("div"); el.id = "tutToast"; document.body.appendChild(el); }
    el.textContent = msg; el.classList.add("on");
    clearTimeout(toast._t); toast._t = setTimeout(() => el.classList.remove("on"), 4500);
  }
  function visible(el) { return !!el && el.getClientRects().length > 0 && !el.closest(".hidden"); }

  function place(step) {
    const el = step.sel ? document.querySelector(step.sel) : null;
    const W = window.innerWidth, H = window.innerHeight;
    card.style.left = card.style.top = card.style.right = card.style.bottom = card.style.transform = "";
    if (!visible(el)) {
      spot.style.display = "none"; layer.classList.add("nospot");
      card.style.left = "50%"; card.style.top = "50%"; card.style.transform = "translate(-50%,-50%)";
      return;
    }
    const r = el.getBoundingClientRect(), pad = 6;
    spot.style.display = "block"; layer.classList.remove("nospot");
    spot.style.left = (r.left - pad) + "px"; spot.style.top = (r.top - pad) + "px";
    spot.style.width = (r.width + pad * 2) + "px"; spot.style.height = (r.height + pad * 2) + "px";
    // đặt thẻ ở phía có nhiều chỗ nhất (trên / dưới / giữa)
    const cw = Math.min(380, W - 24), spaceBelow = H - r.bottom, spaceAbove = r.top;
    card.style.width = cw + "px";
    let left = Math.max(12, Math.min(W - cw - 12, r.left + r.width / 2 - cw / 2));
    card.style.left = left + "px";
    if (spaceBelow >= 190) card.style.top = Math.min(H - 190, r.bottom + 14) + "px";
    else if (spaceAbove >= 190) card.style.top = Math.max(12, r.top - 14 - card.offsetHeight) + "px";
    else { card.style.top = Math.max(12, (H - card.offsetHeight) / 2) + "px"; card.style.left = (r.left > W / 2 ? 12 : W - cw - 12) + "px"; }
  }
  function render() {
    const st = active.steps[active.i];
    $("tutTitle").textContent = st.title;
    $("tutText").innerHTML = st.text;
    $("tutCount").textContent = (active.i + 1) + " / " + active.steps.length;
    $("tutBack").style.visibility = active.i === 0 ? "hidden" : "visible";
    $("tutNext").textContent = active.i === active.steps.length - 1 ? "Xong ✓" : "Tiếp ▶";
    place(st); place(st);   // gọi 2 lần: lần 2 có chiều cao thật của thẻ
  }
  function start(key, force) {
    if (active) return false;
    const t = TOURS[key];
    if (!t || (!force && done()[key])) return false;
    build();
    active = { key: key, steps: t.steps, i: 0, shownAt: Date.now(), prevPaused: (typeof S !== "undefined" && S) ? !!S.paused : false };
    if (typeof S !== "undefined" && S && S.running && typeof isBattleActive === "function" && !isBattleActive()) S.paused = true;
    layer.classList.add("on");
    if (!layerWorks()) {   // hiển thị lỗi -> hủy ngay, trả lại trạng thái game, không đánh dấu đã xem
      layer.classList.remove("on");
      if (typeof S !== "undefined" && S && S.running) { S.paused = active.prevPaused; S.lastTick = performance.now(); }
      active = null; snoozed[key] = true;
      try { console.warn("[tutorial] Lớp hướng dẫn không hiển thị được — đã hủy."); } catch (e) { /* bỏ qua */ }
      return false;
    }
    render();
    return true;
  }
  function next() { if (!active) return; if (active.i >= active.steps.length - 1) finish("done"); else { active.i++; active.shownAt = Date.now(); render(); } }
  function back() { if (active && active.i > 0) { active.i--; active.shownAt = Date.now(); render(); } }
  /* mode: 'done' = xem hết · 'never' = bấm "Bỏ qua" (không hiện lại) · 'snooze' = Esc (hôm nay thôi, chưa tính đã xem) */
  function finish(mode) {
    if (!active) return;
    if (mode === "snooze") { snoozed[active.key] = true; toast("Bấm H hoặc nút ❓ để xem lại hướng dẫn bất cứ lúc nào."); }
    else markDone(active.key);
    layer.classList.remove("on");
    if (typeof S !== "undefined" && S && S.running && typeof isBattleActive === "function" && !isBattleActive()) { S.paused = active.prevPaused; S.lastTick = performance.now(); }
    active = null;
  }

  /* ------------------------------ MENU HƯỚNG DẪN (H) ------------------------------ */
  function openMenu() {
    if (active) finish("snooze");           // đang có hướng dẫn mở: đóng nó trước, rồi mở menu
    if (typeof showModal !== "function") return;
    const rows = Object.keys(TOURS).map((k) => `<div class="shopItem"><span>${TOURS[k].icon} <b>${TOURS[k].name}</b><br><span style="font-size:12px;color:var(--text-dim);">${TOURS[k].steps.length} bước${done()[k] ? " · đã xem" : ""}</span></span><button class="btn primary" data-tut="${k}">Xem</button></div>`).join("");
    try { showModal("❓ HƯỚNG DẪN", rows + `<p style="font-size:12px;color:var(--text-dim);margin-top:8px;">Bài Chiến đấu cần đang trong một trận để rọi đúng vào từng phần giao diện.</p>`, [
      { label: "Đặt lại tất cả (xem lại từ đầu)", onClick: () => { try { storage().removeItem(LS); } catch (e) { /* bỏ qua */ } Object.keys(snoozed).forEach((k) => delete snoozed[k]); idleSince = 0; openMenu(); } },
      { label: "Đóng", primary: true, onClick: () => closeModal() }]); } catch (e) { toast("Không mở được menu hướng dẫn: " + (e && e.message)); try { console.error(e); } catch (x) { /* bỏ qua */ } return; }
    document.querySelectorAll("#mgBody [data-tut]").forEach((b) => {
      b.onclick = () => { const k = b.getAttribute("data-tut"); delete snoozed[k]; closeModal(); setTimeout(() => start(k, true), 60); };
    });
  }

  /* ------------------------------ TỰ BẬT ĐÚNG LÚC ------------------------------ */
  function idle() {
    return typeof S !== "undefined" && S && S.running && !active &&
      !(typeof isBlockingOverlayOpen === "function" && isBlockingOverlayOpen()) &&
      !(typeof VN_ACTIVE !== "undefined" && VN_ACTIVE) && !(typeof TRAVEL !== "undefined" && TRAVEL.busy);
  }
  function poll() {
    if (active) { if (layer && !layerWorks()) finish("snooze"); return; }
    const d = done();
    const calm = Date.now() - lastInputAt > 1500;
    if (!idle()) idleSince = 0; else if (!idleSince) idleSince = Date.now();
    const settled = idleSince && Date.now() - idleSince > 1500 && calm;
    // Trận đầu tiên: khi menu lệnh đã hiện
    if (typeof isBattleActive === "function" && isBattleActive()) {
      const m = $("pkMenu");
      if (!d.battle && !snoozed.battle && calm && m && m.children.length > 0) start("battle");
      return;
    }
    if (!idle() || !settled) return;
    if (!d.basic && !snoozed.basic && !(S.ng > 0) && S.chapter === 1 && S.night === 1) { start("basic"); return; }
    if (d.basic && !d.talent && !snoozed.talent && RPG.getState && RPG.getState() && RPG.player().level >= 3 && RPG.talentPoints(RPG.player()) > 0) { start("talent"); return; }
    // Dạy đúng lúc gặp cơ chế lần đầu thay vì bắt người chơi phải tự tìm trong menu.
    if (!d.events && !snoozed.events && S.activeEvents && S.activeEvents[S.playerRoom]) { start("events"); return; }
    if (!d.social && !snoozed.social && typeof getRoomNPCs === "function" && getRoomNPCs(S.playerRoom).length) { start("social"); return; }
    if (!d.gear && !snoozed.gear && S.scavenge && S.scavenge[S.playerRoom]) start("gear");
  }

  function mount() {
    const hb = $("helpBtn");
    if (hb) { hb.onclick = openMenu; setInterval(() => hb.classList.toggle("pulse", !done().basic), 1000); }
    window.addEventListener("keydown", (e) => {
      const t = e.target; if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA")) return;
      const k = (e.key || "").toLowerCase();
      if (active) {
        e.preventDefault(); e.stopImmediatePropagation();
        if (e.repeat || Date.now() - active.shownAt < STEP_GUARD_MS) return;   // đang bấm dồn để bỏ qua thoại -> không nhảy bước
        if (k === "h") { finish("snooze"); openMenu(); }
        else if (k === "enter" || k === "arrowright" || k === " ") next();
        else if (k === "arrowleft") back();
        else if (k === "escape") finish("snooze");
        return;
      }
      if (k === "h" && !e.ctrlKey && !e.metaKey && !e.altKey && typeof S !== "undefined" && S && S.running && typeof isBlockingOverlayOpen === "function" && !isBlockingOverlayOpen() && !(typeof isBattleActive === "function" && isBattleActive())) {
        e.preventDefault(); e.stopImmediatePropagation(); openMenu();
      }
    }, true);
    window.addEventListener("keydown", () => { lastInputAt = Date.now(); }, true);
    window.addEventListener("mousedown", () => { lastInputAt = Date.now(); }, true);
    window.addEventListener("resize", () => { if (active) render(); });
    setInterval(poll, 800);
  }
  window.TiuTutorial = { start: start, openMenu: openMenu, isActive: () => !!active };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mount); else mount();
})();
