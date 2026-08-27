/* ==============================================================
   DỮ LIỆU HỘI THOẠI — ĐỪNG NGỦ QUÊN Ở UIT
   File này chỉ chứa nội dung lời thoại (Visual Novel), tách riêng
   khỏi logic game trong script.js cho dễ chỉnh sửa / bổ sung.
   Phải được nạp (<script>) TRƯỚC script.js trong index.html.
   ============================================================== */
"use strict";

/* ---- Lời thoại mở màn / kết màn mỗi đêm ---- */
const VN_INTRO = {
  1: [
    {spk:'', text:'"Khuôn viên trường sẽ đóng cổng chính lúc 18:00. Sinh viên còn lại vui lòng rời khỏi trường trước giờ đóng cổng."'},
    {spk:'BẠN', text:'Trọ của mình còn 3 ngày nữa mới dọn vào được... thôi thì tối nay lại phải lén ở lại trường một mình rồi.'},
    {spk:'BẠN', text:'Nah tìm một chỗ nào đó mà ngủ cho ấm.'},
    {spk:'BẠN', text:'.'},
    {spk:'BẠN', text:'..'},
    {spk:'BẠN', text:'...'},
    {spk:'BẠN', text:'Ahh, ngủ chẳng sâu tí nào cả'},
    {spk:'BẠN', text:'(Xem điện thoại)'},
    {spk:'BẠN', text:'12 giờ đêm à thôi thì đành ng...'},
    {spk:'BẠN', text:'!!!Tiếng gì vậy'}
  ],
  2: [
    {spk:'BẠN', text:'Đêm thứ hai lén ở lại trường.Typeshit.'},
    {spk:'BẠN', text:'Ráng thêm 2 đêm nữa thôi... rồi mình sẽ có chỗ ở đàng hoàng.'},
    {spk:'BẠN', text:'Hy vọng con quái vật đó ko xiêng 2 người kia'},
    {spk:'BẠN', text:'Thôi thì đành sinh tồn đêm nay vậy.'}
  ],
  3: [
    {spk:'BẠN', text:'Đêm cuối cùng phải trốn ở đây. Ngày mai phòng trọ sẽ sẵn sàng — chỉ cần qua được đêm nay.'},
    {spk:'BẠN', text:'Sao không khí đêm nay lại nặng nề đến vậy?'},
     {spk:'BẠN', text:'Khá chắc đây sẽ là 1 đêm khó khăn rồi đây'}
  ]
};
const VN_OUTRO = {
  1: [ {spk:'BẠN', text:'7:30 sáng. Ánh nắng đầu tiên len qua cửa sổ. Đêm trốn đầu tiên trong khuôn viên trường đã qua — còn 2 đêm nữa mới đến ngày dọn vào trọ.'} ],
  2: [ {spk:'BẠN', text:'Lại một đêm lén ở trường nữa trôi qua an toàn. Chỉ còn 1 đêm nữa là mình có chỗ ở hẳn hoi.'} ],
  3: [
    {spk:'BẠN', text:'7:30 sáng, đêm thứ ba — cũng là đêm cuối cùng phải trốn ở trường — đã kết thúc. Từ mai mình đã có phòng trọ.'},
    {spk:'???', text:'"...Hahaha"'}
  ]
};

/* ---- NPC cố định trong các tòa nhà: mỗi đêm một đoạn hội thoại khác nhau ---- */
const NPC_DIALOGUES = {
  E: { // Wibu Việt Nhật — Tòa E
    1: {
      lines:[
        {spk:'WIBU VIỆT NHẬT', text:'"Oi!!"'},
        {spk:'WIBU VIỆT NHẬT', text:'"Theo phân tích của tao thì chúng ta đang ở đây vào buổi đêm."'},
        {spk:'Bạn', text:'"Yeh tao khá chắc là tao có thấy trời tối."'},
        {spk:'Bạn', text:'"(Mấy thằng Việt Nhật dị vl)"'},
        {spk:'Bạn', text:'"(Mà mình cũng là Việt Nhật mà nhỉ!!)"'},
        {spk:'WIBU VIỆT NHẬT', text:'"Tao đoán chúng ta đã bị isekai!!."'},
        {spk:'Bạn', text:'"À không không"'},
        {spk:'Bạn', text:'"Không có chúng ta nào ở đây hết."'},
        {spk:'WIBU VIỆT NHẬT', text:'"Ồ tiếc vậy, một lolicon trong thế giới pháp quyên này như tao..."'},
        {spk:'Bạn', text:'"(Ai đó xin hãy gọi cảnh sát)"'},
        {spk:'WIBU VIỆT NHẬT', text:'"Dù sao thì,"'},
        {spk:'WIBU VIỆT NHẬT', text:'"Cầm lấy chai nước này đi, nó sẽ có ích cho mày đó"'},
        {spk:'Bạn', text:'"À ờ cảm ơn nha!"'},
        {spk:'Bạn', text:'"(Lolicon có lẽ cũng không tệ đến vậy!)"'}
      ], reward:{type:'item', item:'water', qty:1, msg:'Wibu Việt Nhật tặng bạn 1 chai Nước tăng lực.'}
    },
    2: {
      lines:[
        {spk:'WIBU VIỆT NHẬT', text:'"Đêm nay tao nghe tiếng bước chân nặng nề ở phía... hình như là gần Nhà C thì phải."'},
        {spk:'WIBU VIỆT NHẬT', text:'"Cẩn thận đó, thứ đó hôm nay có vẻ khó chịu hơn mọi khi."'},
        {spk:'Bạn', text:'"À ờ cảm ơn nha!"'},
        {spk:'Bạn', text:'"Mà sao mày vẫn ở đây vậy."'},
        {spk:'WIBU VIỆT NHẬT', text:'"Mày biết khu KHTN không?."'},
        {spk:'WIBU VIỆT NHẬT', text:'"Trọ cũ tao đó :)))."'},
        {spk:'WIBU VIỆT NHẬT', text:'"Tao quá nghèo và dính debuff ko thể chủ động nhắn tin nên chưa tìm được trọ"'},
        {spk:'Bạn', text:'"Vậy mày định ở đây với thứ đó cả kì à."'},
        {spk:'Bạn', text:'"Hetcuu."'}
      ], reward:{type:'reveal', moves:2, msg:'Wibu Việt Nhật tiết lộ hướng đi gần đây của The TIU.'}
    },
    3: {
      lines:[
        {spk:'WIBU VIỆT NHẬT', text:'"Đêm cuối của mày rồi ha. Thật ra... tớ cũng hơi sợ, nhưng có cậu trực cùng nên đỡ hơn nhiều."'},
        {spk:'WIBU VIỆT NHẬT', text:'"Nếu qua được đêm nay, tao đãi cậu ăn ramen. Cố lên!"'},
        {spk:'Bạn', text:'"Hôm nay sẽ là chiều thứ 6 kì lạ nhất đời tao"'},
        {spk:'WIBU VIỆT NHẬT', text:'"Không có gì kì lạ hơn lịch học môn tiếng Nhật của chúng ta đâu lil bro!"'},
        {spk:'WIBU VIỆT NHẬT', text:'"Biết gì nữa không, chúng ta sắp thất nghiệp và bị bỏ lại."'},
        {spk:'WIBU VIỆT NHẬT', text:'"Hãy nhảy công ty hay bất kì chỗ nào mày tìm được ngay lập tức."'},
        {spk:'WIBU VIỆT NHẬT', text:'"Chỉ khi đi làm có tiền mày mới mua được plush Gardevoir."'},
        {spk:'Bạn', text:'"À ở.."'},
        {spk:'Bạn', text:'"Tao sẽ mua figure Rem nếu mày có hỏi."'},
        {spk:'Bạn', text:'"(Bro ấy vừa lolicon và vừa smash pokemon...)"'},
        {spk:'Bạn', text:'"(Chúng ta có thể trở thành bạn tốt)"'}
      ], reward:{type:'points', amount:20, msg:'Wibu Việt Nhật động viên bạn (+20 điểm).'}
    }
  },
  B: { // Chàng Lính Ngu Lắm — Tòa B
    1: {
      lines:[
        {spk:'CHÀNG LÍNH NGU LẮM', text:'*ngáp* "Ơ... mấy giờ rồi ta? Tại tao xếp TKB ngu quá nên học tới giờ này luôn..."'},
        {spk:'Bạn', text:'"À ờ cảm ơn nha!"'},
        {spk:'CHÀNG LÍNH NGU LẮM', text:'"Thật ra còn có hai chăng lính khác"'},
        {spk:'Bạn', text:'"Bạn của mày à"'},
        {spk:'CHÀNG LÍNH NGU LẮM', text:' "Đúng vậy"'},
        {spk:'CHÀNG LÍNH NGU LẮM', text:' "Tên thật của tao là Lý Sang Hiếc"'},
        {spk:'CHÀNG LÍNH NGU LẮM', text:' "Tao có thằng em đang du học bên Trung tên là Lý Sang Nai"'},
        {spk:'CHÀNG LÍNH NGU LẮM', text:' "Và người anh em Sobin Hoàng Cáp du học ở bên châu Âu"'},
        {spk:'CHÀNG LÍNH NGU LẮM', text:' "Ba chàng lính ngu lam là bất khả chiến bại"'},
        {spk:'CHÀNG LÍNH NGU LẮM', text:'"Cầm bịch Bim Bim này ăn tạm đi, đêm nay chàng lính ngu lam này sẽ bảo vệ mày"'},
        {spk:'CHÀNG LÍNH NGU LẮM', text:'"Hoặc không"'},
      ], reward:{type:'item', item:'bimbim', qty:1, msg:'Chàng Lính Ngu Lắm chia cho bạn 1 gói Bim Bim.'}
    },
    2: {
      lines:[
        {spk:'CHÀNG LÍNH NGU LẮM', text:'"Hôm qua tao suýt bị bắt vì ngủ gật giữa hành lang... !"'},
        {spk:'CHÀNG LÍNH NGU LẮM', text:'"À mà lúc nãy tao thấy có bóng gì đó lướt qua phía Nhà A, cậu để ý nhé."'},
        {spk:'Bạn', text:'"Riel ko vậy ông già??"'},
        {spk:'CHÀNG LÍNH NGU LẮM', text:'"Riel nha tao lấy năng lực ra đảm bảo!"'},
        {spk:'Bạn', text:'"Typeshit lo cho cái tay bị thương của mày đi"'},
        {spk:'CHÀNG LÍNH NGU LẮM', text:'"Ờ tao sẽ cố gắn!"'}
      ], reward:{type:'reveal', moves:2, msg:'Chàng Lính Ngu Lắm kể lại nơi cậu ta vừa thấy bóng The TIU.'}
    },
    3: {
      lines:[
        {spk:'CHÀNG LÍNH NGU LẮM', text:'"Đêm nay sẽ thật dài đây"'},
        {spk:'CHÀNG LÍNH NGU LẮM', text:'"Một cảm giác ớn lạnh chạy dọc sống lưng."'},
        {spk:'CHÀNG LÍNH NGU LẮM', text:'"Tao không hy vọng gì nhiều,"'},
        {spk:'CHÀNG LÍNH NGU LẮM', text:'"Chỉ mong là chúng ta sống sót đêm nay được chứ??."'},
        {spk:'', text:'"*CHÀNG LÍNH NGU LẮM dúi cho bạn 20 điểm!!."'}
      ], reward:{type:'points', amount:20, msg:'Chàng Lính Ngu Lắm cổ vũ bạn (+20 điểm).'}
    }
  }
};

/* ---- Trọng: pháp sư bí ẩn — chỉ xuất hiện tại Nhà C, đêm 3, khi người chơi còn 1 HP ---- */
const TRONG_DIALOGUE = {
  lines:[
    {spk:'TRỌNG', text:'"...Đứng lại. Tao thấy khí sắc của ngươi đã suy kiệt lắm rồi."'},
    {spk:'TRỌNG', text:'"Thứ đó, tên nó là TIU, một thực thể trái ngược với UIT được tạo nên từ... mà chuyện đó không quan trọng."'},
    {spk:'TRỌNG', text:'" Nhận lấy thứ này — nó sẽ giúp ngươi cầm cự."'},
    {spk:'Bạn', text:'"Khoan khoan mày là ai cơ."'},
    {spk:'TRỌNG', text:'"Cùng là sinh viên trong trường thôi."'},
    {spk:'TRỌNG', text:'"Nếu có được thứ gì đó có khi chúng ta sẽ đánh bại được TIU cũng nên."'},
    {spk:'Bạn', text:'"Cụ thể là gì??"'},
    {spk:'TRỌNG', text:'"Chịu, tao thậm chí còn đang chạy trốn nó đây, theo tao nghĩ đó là 1 sức mạnh nào đó trái người với TIU."'},
  ],
  reward:{type:'special_trong', msg:'Trọng ban cho bạn 1 HP và 1 chai Nước tăng lực trước khi biến mất trong bóng tối.'}
};

/* ---- Hội thoại bí mật: chỉ xảy ra khi người chơi đã nhặt đủ 3 mảnh La Peace
   (mảnh năng lượng ôn hòa), ĐÃ nói chuyện với cả Wibu Việt Nhật (Tòa E) VÀ Chàng Lính
   Ngu Lắm (Tòa B) trong CẢ 3 đêm (đủ 3/3 mỗi người — xem campaignNpcTalks trong script.js),
   và nói chuyện với Trọng trong lần gặp duy nhất tại Nhà C, đêm 3, lúc HP = 1.
   Chỉ kích hoạt trong chế độ chơi thường (nút BẮT ĐẦU).
   Đoạn hội thoại này dẫn thẳng vào trận đánh boss bí mật (xem BATTLE SYSTEM trong script.js). ---- */
const TRONG_SECRET_DIALOGUE = {
  lines:[
    {spk:'Bạn', text:'"Khoan đã Trọng — trước khi mày đi, tao có thứ này."'},
    {spk:'Bạn', text:'"(Rút ra 3 mảnh sáng lấp lánh mà mình nhặt được rải rác quanh trường)"'},
    {spk:'TRỌNG', text:'"...Không thể nào. Ba mảnh La Peace, đủ cả ba?"'},
    {spk:'TRỌNG', text:'"Tao đã tìm thứ này suốt bao lâu nay mà không dám tin có ai tìm đủ được."'},
    {spk:'TRỌNG', text:'"La Peace — năng lượng ôn hòa, thứ đối nghịch hoàn toàn với bản chất của TIU."'},
    {spk:'TRỌNG', text:'"Đưa hết cho tao. Tao sẽ bố trí tế lễ thanh tẩy ngay bây giờ — nhưng cần thời gian để hoàn tất."'},
    {spk:'TRỌNG', text:'"Trong lúc đó, chúng ta cần cầm cự trước mặt nó. Gọi thêm hai đứa kia đến đây!"'},
    {spk:'WIBU VIỆT NHẬT', text:'"Nghe nói có trận đánh boss à?? Tao vào!!"'},
    {spk:'CHÀNG LÍNH NGU LẮM', text:'"Đù, cuối cùng cũng có cơ hội chứng minh tao không ngu lắm..."'},
    {spk:'TRỌNG', text:'"Nhận lấy — mana của tao, tạm thời đủ cho cả ba người cầm cự với nó."'},
    {spk:'', text:'"(Một luồng sáng ấm áp bao trùm lấy cả ba người)"'},
    {spk:'TRỌNG', text:'"Cầm cự đủ lâu, tao sẽ hoàn tất tế lễ và thanh tẩy TIU vĩnh viễn! Đi thôi!"'},
    {spk:'BẠN', text:'Không gian bỗng rung chuyển dữ dội — thực tại vỡ tan thành từng mảnh...'}
  ]
};

/* ---- Hội thoại chiến thắng của Trọng: chạy ngay sau khi party cầm cự đủ 15 lượt trong
   trận đánh boss bí mật, trước khi triggerSecretEnding() được gọi (xem finishBattle trong
   script.js). ---- */
const TRONG_VICTORY_DIALOGUE = {
  lines:[
    {spk:'TRỌNG', text:'"...Xong rồi. Tế lễ đã hoàn tất."'},
    {spk:'TRỌNG', text:'"La Peace đã hòa tan vào TIU — không phải để tiêu diệt nó, mà là để xoa dịu nó."'},
    {spk:'WIBU VIỆT NHẬT', text:'"Ơ... nó biến mất thật rồi à?"'},
    {spk:'CHÀNG LÍNH NGU LẮM', text:'"Tao... tao vẫn còn sống? TAO VẪN CÒN SỐNG!!"'},
    {spk:'TRỌNG', text:'"Cảm ơn cả ba người. Nếu không có các cậu cầm cự đủ lâu, tế lễ này đã không thể hoàn thành."'},
    {spk:'TRỌNG', text:'"Giờ thì... có lẽ tất cả chúng ta nên nghỉ ngơi một chút trước khi trời sáng hẳn."'},
    {spk:'BẠN', text:'Không gian dần lắng lại. Ánh sáng ấm áp nhạt dần, nhường chỗ cho bầu trời đang ửng hồng phía chân trời.'}
  ]
};

/* ==============================================================
   EPILOGUE — BUỔI SÁNG SAU CÙNG
   Chạy sau khi kết thúc thành công (đêm 3 sinh tồn bình thường HOẶC
   thắng trận đánh boss bí mật). Người chơi lang thang tự do quanh
   trường trong buổi sáng (15:00 -> 18:00 trên đồng hồ) trước khi đi
   đến Thư viện, nơi hé lộ đoạn kết thật sự — xem startEpilogue() /
   triggerEpilogueLibraryDiscovery() trong script.js.
   ============================================================== */
const EPILOGUE_INTRO_NORMAL = [
  {spk:'BẠN', text:'7:30 sáng. Ba đêm lẩn trốn cuối cùng cũng qua. Nhưng thay vì về thẳng phòng trọ, có gì đó thôi thúc mình đi một vòng quanh trường lần cuối.'},
  {spk:'BẠN', text:'Nắng đã lên cao, sân trường tấp nập người qua lại như chưa từng có chuyện gì xảy ra. Vậy mà sao mình vẫn thấy lạnh sống lưng.'}
];

const EPILOGUE_INTRO_SECRET = [
  {spk:'BẠN', text:'The TIU đã tan biến. Trọng nói tế lễ đã hoàn tất... nhưng lòng mình vẫn chưa thấy yên hẳn.'},
  {spk:'BẠN', text:'Dù đã 1 tuần trôi qua rồi nhưng mình muốn đi một vòng để chắc chắn rằng mọi thứ thật sự đã kết thúc.'}
];

const EPILOGUE_LIB_NORMAL = [
  {spk:'BẠN', text:'Thư viện vắng tanh. Mình bước vào định kiểm tra lần cuối trước khi rời khỏi trường.'},
  {spk:'BẠN', text:'...Trên kệ sách gần cửa sổ có những vết cào dài, sâu hoắm, còn mới nguyên.'},
  {spk:'BẠN', text:'Giữa sàn nhà là một vũng chất lỏng đen sệt — y hệt thứ mình từng thấy tối qua ở The TIU.'},
  {spk:'BẠN', text:'Nó... chưa từng thật sự rời khỏi khuôn viên trường này.'},
  {spk:'???', text:'"...Hahaha"'}
];

const EPILOGUE_LIB_SECRET = [
  {spk:'BẠN', text:'Trước khi về, mình ghé qua Thư viện — nơi cuối cùng còn chưa kiểm tra.'},
  {spk:'BẠN', text:'Không khí ở đây lạnh hơn hẳn những nơi khác, dù nắng đã lên cao ngoài kia.'},
  {spk:'BẠN', text:'Trên bàn đọc sách, ba mảnh La Peace mình từng đưa cho Trọng lại nằm ở đó, nguyên vẹn, như chưa từng được dùng đến.'},
  {spk:'BẠN', text:'Và ngay cạnh đó là một vết cào dài, còn mới — y hệt móng vuốt của The TIU.'},
  {spk:'BẠN', text:'Tế lễ có thật sự thành công không... hay đó chỉ là điều Trọng muốn mình tin?'},
  {spk:'???', text:'"...Hahaha"'}
];

/* ==============================================================
   CHAPTER 2 — MỞ ĐẦU
   Chạy ngay sau showChapterEndScreen() của Chapter 1 (xem
   startChapter2Opening() trong script.js). Nội dung rẽ nhánh theo
   S.epilogueVariant ('normal' | 'secret') của lần chơi Chapter 1
   vừa hoàn thành:

   - normal: nhân vật chính tự tìm NPC nào mình đã có đủ tin tưởng
     (campaignNpcTalks.E / .B, xem script.js) rồi tập hợp tại Tòa A.
     Không có NPC nào tin tưởng thì vẫn một mình ra Tòa A.
   - secret: Trọng xuất hiện trước khi kịp tìm ai khác, giải thích
     sự thật về TIU / tà thần / 12 con giáp / La Peace, hỏi người
     chơi đoán con giáp của TIU (dùng cơ chế `choices`/`insert` mới
     trong playVN — xem script.js), rồi kể về thân thế của chính
     mình (hiện tượng thai trong thai) trước khi cùng cả nhóm ra
     Tòa A.
   ============================================================== */

/* ---- Normal: cả hai NPC (Wibu Việt Nhật + Chàng Lính Ngu Lắm) đã đủ tin tưởng ---- */
const CHAPTER2_OPEN_NORMAL_BOTH = [
  {spk:'BẠN', text:'Vết cào trên kệ sách... vũng chất lỏng đen sệt giữa sàn. Dấu vết của The TIU, giữa ban ngày ban mặt.'},
  {spk:'BẠN', text:'Không thể giữ chuyện này một mình được. Phải tìm Wibu Việt Nhật với Chàng Lính Ngu Lắm.'},
  {spk:'BẠN', text:'(Chạy khắp khuôn viên, cuối cùng cũng tìm được cả hai đang đứng gần Tòa E)'},
  {spk:'WIBU VIỆT NHẬT', text:'"Ê ê, mặt mày tái mét vậy, có chuyện gì à?"'},
  {spk:'CHÀNG LÍNH NGU LẮM', text:'"Đù, lại The TIU nữa hả? Ngay giữa ban ngày ư?."'},
  {spk:'BẠN', text:'"Ra Tòa A đã. Tao có chuyện cần nói với cả hai đứa."'},
  {spk:'BẠN', text:'(Ba người lặng lẽ kéo nhau ra hiên Tòa A, ánh đèn hành lang chớp tắt yếu ớt dù trời đã sáng)'},
  {spk:'BẠN', text:'"Sáng nay tao thấy vết cào với vũng chất lỏng đen trong Thư viện. Y hệt thứ The TIU để lại."'},
  {spk:'WIBU VIỆT NHẬT', text:'"Khoan, tụi mình chỉ thấy nó vào ban đêm thôi mà. Sao ban ngày cũng có dấu vết được?"'},
  {spk:'CHÀNG LÍNH NGU LẮM', text:'"Ý mày là... nó không còn chỉ hoạt động ban đêm nữa?"'},
  {spk:'BẠN', text:'"Tao cũng không chắc. Nhưng nếu đúng vậy thì ba đêm tụi mình vừa sống sót... có khi chỉ là màn khởi đầu."'},
  {spk:'WIBU VIỆT NHẬT', text:'" Là con quái đó tự thay đổi, hay có gì khác đang xảy ra với nó?"'},
  {spk:'CHÀNG LÍNH NGU LẮM', text:'"Ba chàng lính ngu lắm đã cầm cự qua bao đêm rồi, lần này chắc phải tính đường dài."'},
  {spk:'BẠN', text:'"Từ khi nào bọn tao trở thành Lính ngu lam rồi??..."'},
  {spk:'BẠN', text:'"Dù sao thì cũng phải tìm hiểu thêm. Nếu The TIU đã đổi luật chơi, tụi mình cũng phải đổi cách đối phó."'},
  {spk:'BẠN', text:'Ba người nhìn nhau, không ai nói thêm gì — nhưng ai cũng hiểu, những gì sắp tới sẽ khác hẳn ba đêm vừa qua.'}
];

/* ---- Normal: chỉ Wibu Việt Nhật (Tòa E) đủ tin tưởng ---- */
const CHAPTER2_OPEN_NORMAL_SINGLE_E = [
  {spk:'BẠN', text:'Vết cào trên kệ sách... vũng chất lỏng đen sệt giữa sàn. Dấu vết của The TIU, giữa ban ngày ban mặt.'},
  {spk:'BẠN', text:'Chàng Lính Ngu Lắm thì mình chưa đủ thân, nhưng Wibu Việt Nhật chắc sẽ nghe mình nói.'},
  {spk:'BẠN', text:'(Tìm đến gần Nhà E, thấy Wibu Việt Nhật đang ngồi thẫn thờ)'},
  {spk:'WIBU VIỆT NHẬT', text:'"Ơ, mày còn sống à! Mà sao mặt như thấy ma vậy?"'},
  {spk:'BẠN', text:'"Đi ra Tòa A với tao. Có chuyện quan trọng."'},
  {spk:'BẠN', text:'(Hai người ra hiên Tòa A ngồi xuống, ánh đèn hành lang chớp tắt yếu ớt dù trời đã sáng)'},
  {spk:'BẠN', text:'"Sáng nay tao thấy vết cào với vũng chất lỏng đen trong Thư viện. Y hệt thứ The TIU để lại."'},
  {spk:'WIBU VIỆT NHẬT', text:'"Khoan, tụi mình chỉ thấy nó vào ban đêm thôi mà. Ban ngày cũng có dấu vết luôn hả?"'},
  {spk:'BẠN', text:'"Tao cũng không chắc. Nhưng nếu đúng vậy thì ba đêm vừa qua có khi chỉ là màn khởi đầu thôi."'},
  {spk:'WIBU VIỆT NHẬT', text:'"Điên vậy... Nghe mày nói xong tao thấy khu KHTN của tao còn nguy hiểm hơn tao tưởng."'},
  {spk:'BẠN', text:'"Dù gì cũng phải tìm hiểu thêm. Đáng lẽ có thêm Chàng Lính Ngu Lắm thì tốt, nhưng thôi, hai đứa mình xoay xở trước."'},
  {spk:'BẠN', text:'Hai người ngồi lặng lẽ dưới hiên Tòa A, cố ghép lại từng manh mối — nhưng câu trả lời vẫn còn xa lắm.'}
];

/* ---- Normal: chỉ Chàng Lính Ngu Lắm (Tòa B) đủ tin tưởng ---- */
const CHAPTER2_OPEN_NORMAL_SINGLE_B = [
  {spk:'BẠN', text:'Vết cào trên kệ sách... vũng chất lỏng đen sệt giữa sàn. Dấu vết của The TIU, giữa ban ngày ban mặt.'},
  {spk:'BẠN', text:'Wibu Việt Nhật thì mình chưa đủ thân, nhưng Chàng Lính Ngu Lắm chắc sẽ tin mình.'},
  {spk:'BẠN', text:'(Tìm đến gần Nhà B, thấy Chàng Lính Ngu Lắm đang ngáp ngắn ngáp dài)'},
  {spk:'CHÀNG LÍNH NGU LẮM', text:'"Ơ, mày tìm tao có việc gì á?"'},
  {spk:'BẠN', text:'"Đi ra Tòa A với tao. Có chuyện quan trọng."'},
  {spk:'BẠN', text:'(Hai người ra hiên Tòa A ngồi xuống, ánh đèn hành lang chớp tắt yếu ớt dù trời đã sáng)'},
  {spk:'BẠN', text:'"Sáng nay tao thấy vết cào với vũng chất lỏng đen trong Thư viện. Y hệt thứ The TIU để lại."'},
  {spk:'CHÀNG LÍNH NGU LẮM', text:'"Khoan, tụi mình chỉ thấy nó vào ban đêm thôi mà. Ban ngày cũng ra tay luôn hả?"'},
  {spk:'BẠN', text:'"Tao cũng không chắc. Nhưng nếu đúng vậy thì ba đêm vừa qua có khi chỉ là màn khởi đầu thôi."'},
  {spk:'CHÀNG LÍNH NGU LẮM', text:'"Chàng lính ngu lắm này không ngu đến mức không sợ đâu nha... nhưng dù sao cũng phải tìm hiểu cho ra lẽ."'},
  {spk:'BẠN', text:'"Đáng lẽ có thêm Wibu Việt Nhật thì tốt, nhưng thôi, hai đứa mình xoay xở trước."'},
  {spk:'BẠN', text:'Hai người ngồi lặng lẽ dưới hiên Tòa A, cố ghép lại từng manh mối — nhưng câu trả lời vẫn còn xa lắm.'}
];

/* ---- Normal: không NPC nào đủ tin tưởng, người chơi một mình ---- */
const CHAPTER2_OPEN_NORMAL_SOLO = [
  {spk:'BẠN', text:'Vết cào, vũng chất lỏng đen sệt... The TIU để lại dấu vết ngay giữa ban ngày. Không thể tin nổi.'},
  {spk:'BẠN', text:'Ba đêm qua mình toàn tự xoay xở một mình, giờ chắc cũng vậy thôi.'},
  {spk:'BẠN', text:'(Đi bộ một mình ra Tòa A, ngồi xuống bậc thềm quen thuộc)'},
  {spk:'BẠN', text:'"Nếu nó hoạt động cả ban ngày... thì ba đêm mình vừa sống sót, có khi chỉ là màn dạo đầu."'},
  {spk:'BẠN', text:'"Không có ai để bàn bạc cùng. Được thôi — tự mình suy luận vậy."'},
  {spk:'BẠN', text:'Cố ghép lại từng manh mối: cái bóng ở Tòa A, tiếng bước chân gần Tòa C... liệu có liên hệ gì không?'},
  {spk:'BẠN', text:'Nắng đã lên, nhưng không khí vẫn lạnh như thể đêm qua chưa từng kết thúc.'}
];

/* ---- Secret: Trọng xuất hiện, giải thích sự thật, hỏi người chơi đoán con giáp của
   TIU (đáp án đúng: Sửu), rồi tự kể thân thế của mình trước khi cả nhóm — có thêm
   Trọng — tập hợp tại Tòa A. ---- */
const CHAPTER2_OPEN_SECRET = [
  {spk:'BẠN', text:'Trước khi kịp đi tìm hai đứa kia, một bóng người khoác áo choàng bước ra từ góc khuất của Thư viện.'},
  {spk:'TRỌNG', text:'"...Tao biết thế nào mày cũng tìm ra thôi. La Peace không giữ được nó mãi mãi."'},
  {spk:'BẠN', text:'"Trọng?! Mày... mày?? nó không biến mất sau tế lễ à?"'},
  {spk:'TRỌNG', text:'"Tế lễ chỉ xoa dịu, không tiêu diệt. Về cơ bản thì TIU chính là những gì còn thiếu của UIT, một cách nói khác là mặt trái."'},
  {spk:'TRỌNG', text:'"Sự thật là... TIU chưa từng là một con quái vật thuần túy. Nó vốn dĩ là một con người."'},
  {spk:'BẠN', text:'"...Cái gì cơ?"'},
  {spk:'TRỌNG', text:'"Một con người đã giao kèo với tà thần. Đổi lấy sức mạnh, đổi lấy một điều ước — và cái giá là để tà thần dần dần chiếm lấy thân xác, dung hợp với mặt trái của UIT để tạo ra TIU."'},
  {spk:'TRỌNG', text:'"Đó là lý do vì sao ta không thể ra tay dứt điểm với nó. Sâu bên trong lớp vỏ đó, vẫn còn một con người đang mắc kẹt."'},
  {spk:'TRỌNG', text:'"Ta đã cố khống chế nó bằng La Peace... nhưng nó đã xổng mất. Ý chí của tà thần bên trong có lẽ vẫn còn quá mạnh."'},
  {spk:'BẠN', text:'"Vậy La Peace — thứ năng lượng ôn hòa mày nói tới — thực chất là gì?"'},
  {spk:'TRỌNG', text:'"Là mana thuần khiết, được ngưng tụ lại từ linh hồn con người. Càng có nhiều La Peace, tà thần cần nó để hồi sinh."'},
  {spk:'TRỌNG', text:'"Đó là lý do ta phải giữ La Peace tránh xa TIU bằng mọi giá."'},
  {spk:'BẠN', text:'"..."'},
  {spk:'TRỌNG', text:'"Ngươi có biết TIU vốn mang dáng dấp của con vật nào trong 12 con giáp không?"',
   choices:[
     {label:'Tý (Chuột)', insert:[{spk:'TRỌNG', text:'"Không phải. Thử nghĩ lại xem."'}]},
     {label:'Sửu (Trâu)', insert:[{spk:'TRỌNG', text:'"...Đúng vậy. Sửu."'}]},
     {label:'Dần (Hổ)', insert:[{spk:'TRỌNG', text:'"Không phải, nhưng cách nó gầm gừ cũng dễ khiến người ta nghĩ vậy."'}]},
     {label:'Mão (Mèo)', insert:[{spk:'TRỌNG', text:'"Không, nhưng cách nó rình rập trong bóng tối cũng khiến người ta liên tưởng."'}]}
   ]},
  {spk:'TRỌNG', text:'"Là Sửu — con Trâu."'},
  {spk:'TRỌNG', text:'"Tà thần đó ban phát sức mạnh của cả 12 con giáp cho những kẻ khốn khổ và bất lực nhất."'},
  {spk:'TRỌNG', text:'"Đổi lại là một lời hứa: nó sẽ thực hiện điều ước của họ — nếu họ thu thập đủ La Peace để giúp nó hồi sinh sang dạng hoàn chỉnh."'},
  {spk:'BẠN', text:'"Vậy con người mang hình dạng Sửu đó... đã ước điều gì mà phải trả giá bằng cả thân xác mình?"'},
  {spk:'TRỌNG', text:'"Ta không biết. Có lẽ chính người đó cũng không còn nhớ nữa."'},
  {spk:'BẠN', text:'"Còn mày? Sao mày lại biết rõ đến vậy, Trọng?"'},
  {spk:'TRỌNG', text:'"...Vì ta cũng đang mang trên mình một phần của tà thần đó."'},
  {spk:'BẠN', text:'"!!"'},
  {spk:'TRỌNG', text:'"Ta sinh ra với hai linh hồn trong cùng một cơ thể. Một là của ta, một là của người anh song sinh."'},
  {spk:'TRỌNG', text:'"Anh ấy đã mất từ trong bụng mẹ — một hiện tượng hiếm gặp gọi là thai trong thai."'},
  {spk:'TRỌNG', text:'"Nhưng linh hồn anh ấy chưa từng hoàn toàn biến mất. Nó vẫn ở đó, gắn chặt lấy tao."'},
  {spk:'TRỌNG', text:'"Tà thần tìm đến những kẻ mang bất lực nhất.. vừa hay là... mấy hiểu đúng chứ. Tao đoán, đó là lý do nó chọn ký sinh lên tao."'},
  {spk:'BẠN', text:'"Vậy... mày cũng có thể trở thành như TIU sao?"'},
  {spk:'TRỌNG', text:'"Có thể lắm. Nhưng hiện tại nó chỉ chiếm được linh hồn kia nên tao vẫn kiểm soát được."'},
  {spk:'TRỌNG', text:'"Thôi, không còn nhiều thời gian đâu. Gọi hai đứa kia lại, ra Tòa A. Lần này ta sẽ đi cùng."'},
  {spk:'BẠN', text:'"...Được."'},
  {spk:'BẠN', text:'(Wibu Việt Nhật và Chàng Lính Ngu Lắm gấp rút chạy đến khi nghe tiếng gọi)'},
  {spk:'WIBU VIỆT NHẬT', text:'"Trọng?? Ủa mày còn sống — ý tao là, còn ở đây à??"'},
  {spk:'CHÀNG LÍNH NGU LẮM', text:'"Chuyện gì đang xảy ra vậy trời..."'},
  {spk:'TRỌNG', text:'"Chuyện dài lắm. Ra Tòa A rồi kể."'},
  {spk:'BẠN', text:'Bốn người lặng lẽ tập hợp dưới hiên Tòa A — lần này, có thêm một người mà không ai ngờ tới.'}
];