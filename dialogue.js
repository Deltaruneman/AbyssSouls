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
        {spk:'CHÀNG LÍNH NGU LẮM', text:'*ngáp* "Thật ra còn có hai chăng lính khác"'},
        {spk:'Bạn', text:'"Bạn của mày à"'},
        {spk:'CHÀNG LÍNH NGU LẮM', text:'*ngáp* "Đúng vậy"'},
        {spk:'CHÀNG LÍNH NGU LẮM', text:'*ngáp* "Tên thật của tao là Lý Sang Hiếc"'},
        {spk:'CHÀNG LÍNH NGU LẮM', text:'*ngáp* "Tao có thằng em đang du học bên Trung tên là Lý Sang Nai"'},
        {spk:'CHÀNG LÍNH NGU LẮM', text:'*ngáp* "Và người anh em Sobin Hoàng Cáp du học ở bên châu Âu"'},
        {spk:'CHÀNG LÍNH NGU LẮM', text:'*ngáp* "Ba chàng lính ngu lam là bất khả chiến bại"'},
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