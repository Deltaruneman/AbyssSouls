/* ==============================================================
   DỮ LIỆU HỘI THOẠI — ĐỪNG NGỦ QUÊN Ở UIT
   File này chỉ chứa nội dung lời thoại (Visual Novel), tách riêng
   khỏi logic game trong script.js cho dễ chỉnh sửa / bổ sung.
   Phải được nạp (<script>) TRƯỚC script.js trong index.html.
   ============================================================== */
"use strict";
const VN_INTRO = {
  1: [
    {spk:'', text:'"Khuôn viên trường sẽ đóng cổng chính lúc 18:00. Sinh viên còn lại vui lòng rời khỏi trường trước giờ đóng cổng."'},
    {spk:'BẠN', text:'Z.'},
    {spk:'BẠN', text:'ZZ.'},
    {spk:'BẠN', text:'ZZZ.'},
    {spk:'BẠN', text:'.'},
    {spk:'BẠN', text:'..'},
    {spk:'BẠN', text:'...'},
    {spk:'BẠN', text:'Ahh'},
    {spk:'BẠN', text:'(Xem điện thoại)'},
    {spk:'BẠN', text:'12 giờ đêm à '},
    {spk:'BẠN', text:'Mà ban nãy học môn gì ấy nhỉ '},
    {spk:'BẠN', text:'Mà sao mình lại ngủ quên được cơ chứ??'},
    {spk:'BẠN', text:'Chắc tại tối qua ngồi fix bug tới 3 giờ sáng...'},
    {spk:'BẠN', text:'Giờ này chắc chẳng có xe bus hay các chú xe ôm công nghệ rồi.'},
    {spk:'BẠN', text:'!!!Tiếng gì vậy — hình như có ai đó đang lầm bầm than thở...'}
  ],
  2: [
    {spk:'BẠN', text:'Điều này rõ ràng không hề tự nhiên chút nào cả.'},
    {spk:'BẠN', text:'Mình rõ ràng không hề có thói quen ngủ trong tiết như thế này.'},
    {spk:'BẠN', text:'Đêm qua thứ đó cứ lầm bầm gì nhỉ... "lỗi rồi", "deadline", "sao chạy được trên máy tao mà"...'},
    {spk:'BẠN', text:'Đó đâu phải tiếng gầm của quái vật. Đó là tiếng than của sinh viên.'},
    {spk:'BẠN', text:'Quá nhiều chuyện kì lạ xẩy ra và cũng có khả năng mình không phải người duy nhất bị vậy.'},
    {spk:'BẠN', text:'Mà dù nó là gì, để nó tóm được thì toi. Phải lo giữ mạng cái đã.'}
  ],
  3: [
    {spk:'BẠN', text:'Ư..ư..ư.'},
    {spk:'BẠN', text:'Lại nữa rồi sao?'},
    {spk:'BẠN', text:'Lại nữa rồi sao?Lại nữa rồi sao?Lại nữa rồi sao?Lại nữa rồi sao?Lại nữa rồi sao?Lại nữa rồi sao?Lại nữa rồi sao?'},
    {spk:'BẠN', text:'Chết tiệt vì sao cơ chứ.'},
    {spk:'BẠN', text:'Mình cần phải làm gì bây giờ??'},
    {spk:'BẠN', text:'Chết tiệt!!Chết tiệt!!Chết tiệt!!Chết tiệt!!'},
     {spk:'BẠN', text:'Mình cần phải sống sót.'}
  ]
};
const VN_OUTRO = {
  1: [ {spk:'BẠN', text:'7:30 sáng. Ánh nắng đầu tiên len qua cửa sổ. Đêm trốn đầu tiên trong khuôn viên trường đã qua.'} ],
  2: [ {spk:'BẠN', text:'Một đêm nữa bình an vô sự. Thứ đó cứ than về bug... sao nghe quen tai thế nhỉ?? Thôi, mình muốn về nhà!!'} ],
  3: [
    {spk:'BẠN', text:'7:30 sáng, đêm thứ ba. Có lẽ đây là kết thúc chăng..'},
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
        {spk:'WIBU VIỆT NHẬT', text:'"Đêm nay tao nghe tiếng than thở rầu rĩ ở phía... hình như là gần Nhà C thì phải."'},
        {spk:'WIBU VIỆT NHẬT', text:'"Cẩn thận đó, hôm nay nó có vẻ bực hơn mọi khi. Chắc lại có đứa push code lỗi lên main rồi."'},
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
        {spk:'WIBU VIỆT NHẬT', text:'"Thật ra... tao cũng hơi sợ, nhưng có mày ở cùng nên đỡ hơn nhiều."'},
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
        {spk:'CHÀNG LÍNH NGU LẮM', text:'"À mà lúc nãy tao nghe có tiếng than lướt qua phía Nhà A, giống hệt giọng tao hồi nộp đồ án. Cậu để ý nhé."'},
        {spk:'Bạn', text:'"Riel ko vậy ông già??"'},
        {spk:'CHÀNG LÍNH NGU LẮM', text:'"Riel nha tao lấy năng lực ra đảm bảo!"'},
        {spk:'Bạn', text:'"Typeshit lo cho cái tay bị thương của mày đi"'},
        {spk:'CHÀNG LÍNH NGU LẮM', text:'"Ờ tao sẽ cố gắn!"'}
      ], reward:{type:'reveal', moves:2, msg:'Chàng Lính Ngu Lắm kể lại nơi cậu ta vừa nghe thấy tiếng than của The TIU.'}
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


const TRONG_DIALOGUE = {
  reward:{type:'special_trong', msg:'Trọng ban cho bạn 1 HP và 1 chai Nước tăng lực trước khi biến mất trong bóng tối.'}
};

function buildTrongLines(night, shards){
  const n = Math.max(0, Math.min(3, shards|0));
  const lines = [];

  if(night===1){
    lines.push(
      {spk:'TRỌNG', text:'"...Đứng lại. Tao thấy khí sắc của mày suy kiệt lắm rồi."'},
      {spk:'TRỌNG', text:'"Thứ đó, tên nó là TIU, mặt trái của UIT. Nó sinh ra từ thứ mà sinh viên chúng ta cứ dồn nén mãi không nói ra... chuyện đó dài dòng lắm."'},
      {spk:'Bạn', text:'"Khoan khoan mày là ai cơ."'},
      {spk:'TRỌNG', text:'"Cùng là sinh viên trong trường thôi. Tên tao là Trọng."'},
      {spk:'TRỌNG', text:'"Nghe cho kỹ: quanh trường có 3 mảnh La Peace — năng lượng ôn hòa, thứ duy nhất trái ngược với oán khí của TIU. Mỗi đêm sẽ có một mảnh ẩn ở đâu đó, Chỗ Gửi Xe với Sân Bóng hay có nhất."'},
      {spk:'TRỌNG', text:'"Phải gom đủ cả ba, thiếu một cũng không được. Đêm nào tao cũng ở Tòa C từ 4 đến 6 giờ sáng — đến đó tao sẽ hỏi mày gom được mấy mảnh."'},
      {spk:'TRỌNG', text:'"Nhận lấy thứ này, nó sẽ giúp mày cầm cự."'}
    );
    return lines;
  }

  lines.push(
    {spk:'TRỌNG', text: night===3
      ? '"Đêm cuối rồi. TIU sẽ điên cuồng nhất đêm nay. Nói cho tao biết — mày gom được mấy mảnh La Peace?"'
      : '"...Vẫn còn sống, tốt. Tao hỏi lại như hôm qua — mày gom được mấy mảnh La Peace rồi?"'},
    {spk:'Bạn', text: n===0 ? '"Tao chưa tìm thấy mảnh nào cả."' : '"Tao có '+n+' mảnh rồi."'}
  );

  if(night===3 && n>=3){
    lines.push({spk:'TRỌNG', text:'"...Khoan. Mày vừa nói là bao nhiêu?"'});
    return lines;
  }

  if(n===0){
    lines.push({spk:'TRỌNG', text: night===3
      ? '"Không có mảnh nào... Vậy là không thể làm tế lễ được rồi."'
      : '"Chưa có mảnh nào à... Không sao, còn thời gian. Nhưng đừng để sát đêm cuối mới đi tìm."'});
  } else {
    lines.push({spk:'TRỌNG', text: night===3
      ? '"'+n+'/3... Thiếu rồi. Thiếu một mảnh thôi cũng không đủ để làm tế lễ."'
      : '"'+n+'/3. Giữ chặt chúng, đừng để TIU đánh hơi được."'});
  }

  if(night===2){
    lines.push(
      {spk:'TRỌNG', text:'"Đêm mai là đêm cuối. Tao vẫn ở Tòa C từ 4 đến 6 giờ sáng — nhớ mang đủ ba mảnh đến."'},
      {spk:'TRỌNG', text:'"Cầm lấy, đỡ được chút nào hay chút đó."'}
    );
  } else {
    lines.push(
      {spk:'TRỌNG', text:'"Nếu đến sáng vẫn không đủ thì tao chỉ còn cách phong ấn nó bằng chính thân xác này."'},
      {spk:'Bạn', text:'"Mày điên à?! Phong ấn kiểu đó thì mày—"'},
      {spk:'TRỌNG', text:'"Kiếm tiếp đi. Còn không thì cứ giữ mạng mà sống sót. Cầm lấy — đây là thứ cuối tao giúp được mày."'}
    );
  }
  return lines;
}

const TRONG_SEAL_FAIL_ENDING = [
  {spk:'BẠN', text:'Ngay khi tôi tưởng đêm đã kết thúc, một tiếng nổ trầm vang lên từ phía Tòa C, làm rung cả mặt đất.'},
  {spk:'BẠN', text:'Tôi chạy tới. Giữa sân, Trọng đứng một mình, hai tay giơ cao, những đường phù văn đỏ thẫm chằng chịt trên nền đất.'},
  {spk:'BẠN', text:'Trước mặt cậu ấy là THE TIU — bị trói trong những sợi xích sáng, gào lên thứ tiếng than chẳng còn ra hình người.'},
  {spk:'BẠN', text:'Máu rỉ ra từ khoé miệng Trọng. Từng đường phù văn dưới chân cậu ấy đang nứt dần, từng đường một.'},
  {spk:'TRỌNG', text:'"Tao... vẫn phải giữ nó lại..."'},
  {spk:'BẠN', text:'Trọng đã đến giới hạn. Đầu gối cậu ấy khuỵu xuống, nhưng hai tay vẫn không chịu buông.'},
  {spk:'BẠN', text:'Tôi lao tới định giúp — rồi TIU quay đầu lại.'},
  {spk:'BẠN', text:'Khoảnh khắc thứ đó nhìn thẳng vào tôi, mọi suy nghĩ trong đầu tôi tắt ngấm. Đôi chân tự chuyển động — không phải do tôi quyết định.'},
  {spk:'BẠN', text:'Tôi quay lưng. Tôi chạy. Tiếng Trọng phía sau nhỏ dần... rồi tắt hẳn.'},
  {spk:'BẠN', text:'Tôi không ngoảnh lại. Và tôi không còn dám nghĩ về chuyện gì đã xảy ra với Trọng nữa.'}
];

const TRONG_SECRET_DIALOGUE = {
  lines:[
    {spk:'Bạn', text:'"Khoan đã Trọng — trước khi mày đi, tao có thứ này."'},
    {spk:'Bạn', text:'"(Rút ra 3 mảnh sáng lấp lánh mà mình nhặt được rải rác quanh trường)"'},
    {spk:'TRỌNG', text:'"...Không thể nào. Ba mảnh La Peace, đủ cả ba?"'},
    {spk:'TRỌNG', text:'"Tao đã tìm thứ này suốt bao lâu nay mà không dám tin có ai tìm đủ được."'},
    {spk:'TRỌNG', text:'"La Peace — năng lượng ôn hòa, thứ duy nhất đủ dịu để xoa dịu oán khí của TIU."'},
    {spk:'TRỌNG', text:'"Đưa hết cho tao. Tao sẽ bố trí tế lễ giải oán ngay bây giờ — nhưng cần thời gian để hoàn tất."'},
    {spk:'TRỌNG', text:'"Trong lúc đó, chúng ta cần cầm cự trước mặt nó. Gọi thêm hai đứa kia đến đây!"'},
    {spk:'WIBU VIỆT NHẬT', text:'"Nghe nói có trận đánh boss à?? Tao vào!!"'},
    {spk:'CHÀNG LÍNH NGU LẮM', text:'"Đù, cuối cùng cũng có cơ hội chứng minh tao không ngu lắm..."'},
    {spk:'TRỌNG', text:'"Nhận lấy — mana của tao, tạm thời đủ cho cả ba người cầm cự với nó."'},
    {spk:'', text:'"(Một luồng sáng ấm áp bao trùm lấy cả ba người)"'},
    {spk:'TRỌNG', text:'"Cầm cự đủ lâu, tao sẽ hoàn tất tế lễ giải oán cho TIU! Đi thôi!"'},
    {spk:'BẠN', text:'Không gian bỗng rung chuyển dữ dội — thực tại vỡ tan thành từng mảnh...'}
  ]
};


const TRONG_VICTORY_DIALOGUE = {
  lines:[
    {spk:'TRỌNG', text:'"...Xong rồi. Tế lễ đã hoàn tất."'},
    {spk:'TRỌNG', text:'"La Peace đã hòa tan vào TIU — không phải để tiêu diệt nó, mà là để xoa dịu nó."'},
    {spk:'TRỌNG', text:'"Oán niệm không tự biến mất đâu. Nó chỉ lắng xuống, cho tới lần tiếp theo có đứa nào đó gặp bug."'},
    {spk:'WIBU VIỆT NHẬT', text:'"Ơ... nó biến mất thật rồi à?"'},
    {spk:'CHÀNG LÍNH NGU LẮM', text:'"Tao... tao vẫn còn sống? TAO VẪN CÒN SỐNG!!"'},
    {spk:'TRỌNG', text:'"Cảm ơn cả ba người. Nếu không có các cậu cầm cự đủ lâu, tế lễ này đã không thể hoàn thành."'},
    {spk:'TRỌNG', text:'"Giờ thì... có lẽ tất cả chúng ta nên nghỉ ngơi một chút trước khi trời sáng hẳn."'},
    {spk:'BẠN', text:'Không gian dần lắng lại. Ánh sáng ấm áp nhạt dần, nhường chỗ cho bầu trời đang ửng hồng phía chân trời.'}
  ]
};


const EPILOGUE_INTRO_NORMAL = [
  {spk:'BẠN', text:'7:30 sáng. Ba đêm lẩn trốn cuối cùng cũng qua. Nhưng thay vì về thẳng phòng trọ, có gì đó thôi thúc mình đi một vòng quanh trường lần cuối.'},
  {spk:'BẠN', text:'Nắng đã lên cao, sân trường tấp nập người qua lại như chưa từng có chuyện gì xảy ra. Vậy mà sao mình vẫn thấy lạnh sống lưng.'}
];

const EPILOGUE_INTRO_SECRET = [
  {spk:'BẠN', text:'The TIU đã tan biến. Trọng nói tế lễ đã hoàn tất... nhưng lòng mình vẫn chưa thấy yên hẳn.'},
  {spk:'BẠN', text:'Dù đã 1 tuần trôi qua rồi nhưng mình muốn đi một vòng để chắc chắn rằng mọi thứ thật sự đã kết thúc.'}
];

const EPILOGUE_INTRO_SEALED = [
  {spk:'BẠN', text:'7:30 sáng. Tôi đã sống sót qua ba đêm — nhưng chẳng thấy nhẹ nhõm chút nào.'},
  {spk:'BẠN', text:'Không thấy Trọng ở đâu cả. Tôi tự nhủ cậu ấy chỉ đang nghỉ ngơi đâu đó... rồi không dám nghĩ tiếp.'},
  {spk:'BẠN', text:'Nhưng mình vẫn phải đi một vòng quanh trường lần cuối.'}
];

const EPILOGUE_LIB_NORMAL = [
  {spk:'BẠN', text:'Thư viện vắng tanh. Mình bước vào định kiểm tra lần cuối trước khi rời khỏi trường.'},
  {spk:'BẠN', text:'...Trên kệ sách gần cửa sổ có những dòng chữ bị cào sâu hoắm, còn mới nguyên: "undefined", "segmentation fault", "chạy được trên máy tao mà"...'},
  {spk:'BẠN', text:'Giữa sàn nhà là một vũng chất lỏng đen sệt — y hệt thứ mình từng thấy tối qua ở The TIU.'},
  {spk:'BẠN', text:'Nó... vẫn còn ở khuôn viên trường này. Mà sinh viên ở đây thì ngày nào chả gặp bug...'},
];

const EPILOGUE_LIB_SECRET = [
  {spk:'BẠN', text:'Trước khi về, mình ghé qua Thư viện — nơi cuối cùng còn chưa kiểm tra.'},
  {spk:'BẠN', text:'Không khí ở đây lạnh hơn hẳn những nơi khác, dù nắng đã lên cao ngoài kia.'},
  {spk:'BẠN', text:'Trên bàn đọc sách, ba mảnh La Peace mình từng đưa cho Trọng lại nằm ở đó, nguyên vẹn, như chưa từng được dùng đến.'},
  {spk:'BẠN', text:'Và ngay cạnh đó là một dòng chữ cào sâu, còn mới — "undefined is not a function" — nét cào y hệt những gì The TIU để lại.'},
  {spk:'BẠN', text:'Tế lễ có thật sự thành công không... hay đó chỉ là điều Trọng muốn mình tin?'},
];


const CHAPTER2_OPEN_NORMAL_BOTH = [
  {spk:'BẠN', text:'Những dòng lỗi bị cào trên kệ sách... vũng chất lỏng đen sệt giữa sàn. Dấu vết của The TIU, giữa ban ngày ban mặt.'},
  {spk:'BẠN', text:'Không thể giữ chuyện này một mình được. Phải tìm Wibu Việt Nhật với Chàng Lính Ngu Lắm.'},
  {spk:'BẠN', text:'(Chạy khắp khuôn viên, cuối cùng cũng tìm được cả hai đang đứng gần Tòa E)'},
  {spk:'WIBU VIỆT NHẬT', text:'"Ê ê, mặt mày tái mét vậy, có chuyện gì à?"'},
  {spk:'CHÀNG LÍNH NGU LẮM', text:'"Đù, lại The TIU nữa hả? Ngay giữa ban ngày ư?."'},
  {spk:'BẠN', text:'"Ra Tòa A đã. Tao có chuyện cần nói với cả hai đứa."'},
  {spk:'BẠN', text:'(Ba người lặng lẽ kéo nhau ra hiên Tòa A, ánh đèn hành lang chớp tắt yếu ớt dù trời đã sáng)'},
  {spk:'BẠN', text:'"Sáng nay tao thấy mấy dòng lỗi bị cào trên kệ với vũng chất lỏng đen trong Thư viện. Y hệt thứ The TIU để lại."'},
  {spk:'WIBU VIỆT NHẬT', text:'"Khoan, tụi mình chỉ thấy nó vào ban đêm thôi mà. Sao ban ngày cũng có dấu vết được?"'},
  {spk:'CHÀNG LÍNH NGU LẮM', text:'"Ý mày là... nó không còn chỉ hoạt động ban đêm nữa?"'},
  {spk:'WIBU VIỆT NHẬT', text:'"Mà... tụi mày có để ý nó toàn lầm bầm về lỗi với deadline không?"'},
  {spk:'CHÀNG LÍNH NGU LẮM', text:'"Đù, nghe y chang tao lúc ba giờ sáng..."'},
  {spk:'BẠN', text:'"Tao cũng không chắc. Nhưng nếu đúng vậy thì ba đêm tụi mình vừa sống sót... có khi chỉ là màn khởi đầu."'},
  {spk:'WIBU VIỆT NHẬT', text:'" Là nó tự thay đổi, hay có gì khác đang xảy ra với nó?"'},
  {spk:'CHÀNG LÍNH NGU LẮM', text:'"Ba chàng lính ngu lắm đã cầm cự qua bao đêm rồi, lần này chắc phải tính đường dài."'},
  {spk:'BẠN', text:'"Từ khi nào bọn tao trở thành Lính ngu lam rồi??..."'},
  {spk:'BẠN', text:'"Dù sao thì cũng phải tìm hiểu thêm. Nếu The TIU đã đổi luật chơi, tụi mình cũng phải đổi cách đối phó."'},
  {spk:'BẠN', text:'Ba người nhìn nhau, không ai nói thêm gì — nhưng ai cũng hiểu, những gì sắp tới sẽ khác hẳn ba đêm vừa qua.'}
];

const CHAPTER2_OPEN_NORMAL_SINGLE_E = [
  {spk:'BẠN', text:'Những dòng lỗi bị cào trên kệ sách... vũng chất lỏng đen sệt giữa sàn. Dấu vết của The TIU, giữa ban ngày ban mặt.'},
  {spk:'BẠN', text:'Chàng Lính Ngu Lắm thì mình chưa đủ thân, nhưng Wibu Việt Nhật chắc sẽ nghe mình nói.'},
  {spk:'BẠN', text:'(Tìm đến gần Nhà E, thấy Wibu Việt Nhật đang ngồi thẫn thờ)'},
  {spk:'WIBU VIỆT NHẬT', text:'"Ơ, mày còn sống à! Mà sao mặt như thấy ma vậy?"'},
  {spk:'BẠN', text:'"Đi ra Tòa A với tao. Có chuyện quan trọng."'},
  {spk:'BẠN', text:'(Hai người ra hiên Tòa A ngồi xuống, ánh đèn hành lang chớp tắt yếu ớt dù trời đã sáng)'},
  {spk:'BẠN', text:'"Sáng nay tao thấy mấy dòng lỗi bị cào trên kệ với vũng chất lỏng đen trong Thư viện. Y hệt thứ The TIU để lại."'},
  {spk:'WIBU VIỆT NHẬT', text:'"Khoan, tụi mình chỉ thấy nó vào ban đêm thôi mà. Ban ngày cũng có dấu vết luôn hả?"'},
  {spk:'BẠN', text:'"Tao cũng không chắc. Nhưng nếu đúng vậy thì ba đêm vừa qua có khi chỉ là màn khởi đầu thôi."'},
  {spk:'WIBU VIỆT NHẬT', text:'"Điên vậy... Nghe mày nói xong tao thấy khu KHTN của tao còn nguy hiểm hơn tao tưởng."'},
  {spk:'BẠN', text:'"Dù gì cũng phải tìm hiểu thêm. Đáng lẽ có thêm Chàng Lính Ngu Lắm thì tốt, nhưng thôi, hai đứa mình xoay xở trước."'},
  {spk:'BẠN', text:'Hai người ngồi lặng lẽ dưới hiên Tòa A, cố ghép lại từng manh mối — nhưng câu trả lời vẫn còn xa lắm.'}
];

const CHAPTER2_OPEN_NORMAL_SINGLE_B = [
  {spk:'BẠN', text:'Những dòng lỗi bị cào trên kệ sách... vũng chất lỏng đen sệt giữa sàn. Dấu vết của The TIU, giữa ban ngày ban mặt.'},
  {spk:'BẠN', text:'Wibu Việt Nhật thì mình chưa đủ thân, nhưng Chàng Lính Ngu Lắm chắc sẽ tin mình.'},
  {spk:'BẠN', text:'(Tìm đến gần Nhà B, thấy Chàng Lính Ngu Lắm đang ngáp ngắn ngáp dài)'},
  {spk:'CHÀNG LÍNH NGU LẮM', text:'"Ơ, mày tìm tao có việc gì á?"'},
  {spk:'BẠN', text:'"Đi ra Tòa A với tao. Có chuyện quan trọng."'},
  {spk:'BẠN', text:'(Hai người ra hiên Tòa A ngồi xuống, ánh đèn hành lang chớp tắt yếu ớt dù trời đã sáng)'},
  {spk:'BẠN', text:'"Sáng nay tao thấy mấy dòng lỗi bị cào trên kệ với vũng chất lỏng đen trong Thư viện. Y hệt thứ The TIU để lại."'},
  {spk:'CHÀNG LÍNH NGU LẮM', text:'"Khoan, tụi mình chỉ thấy nó vào ban đêm thôi mà. Ban ngày cũng ra tay luôn hả?"'},
  {spk:'BẠN', text:'"Tao cũng không chắc. Nhưng nếu đúng vậy thì ba đêm vừa qua có khi chỉ là màn khởi đầu thôi."'},
  {spk:'CHÀNG LÍNH NGU LẮM', text:'"Chàng lính ngu lắm này không ngu đến mức không sợ đâu nha... nhưng dù sao cũng phải tìm hiểu cho ra lẽ."'},
  {spk:'BẠN', text:'"Đáng lẽ có thêm Wibu Việt Nhật thì tốt, nhưng thôi, hai đứa mình xoay xở trước."'},
  {spk:'BẠN', text:'Hai người ngồi lặng lẽ dưới hiên Tòa A, cố ghép lại từng manh mối — nhưng câu trả lời vẫn còn xa lắm.'}
];

const CHAPTER2_OPEN_NORMAL_SOLO = [
  {spk:'BẠN', text:'Những dòng lỗi bị cào lên kệ, vũng chất lỏng đen sệt... The TIU để lại dấu vết ngay giữa ban ngày. Không thể tin nổi.'},
  {spk:'BẠN', text:'Ba đêm qua mình toàn tự xoay xở một mình, giờ chắc cũng vậy thôi.'},
  {spk:'BẠN', text:'(Đi bộ một mình ra Tòa A, ngồi xuống bậc thềm quen thuộc)'},
  {spk:'BẠN', text:'"Nếu nó hoạt động cả ban ngày... thì ba đêm mình vừa sống sót, có khi chỉ là màn dạo đầu."'},
  {spk:'BẠN', text:'"Không có ai để bàn bạc cùng. Được thôi — tự mình suy luận vậy."'},
  {spk:'BẠN', text:'Cố ghép lại từng manh mối: cái bóng ở Tòa A, tiếng than thở gần Tòa C... toàn là những câu than về lỗi. Liệu có liên hệ gì không?'},
  {spk:'BẠN', text:'Nắng đã lên, nhưng không khí vẫn lạnh như thể đêm qua chưa từng kết thúc.'}
];


const CHAPTER2_OPEN_SECRET = [
  {spk:'BẠN', text:'Trước khi kịp đi tìm hai đứa kia, một bóng người khoác áo choàng bước ra từ góc khuất của Thư viện.'},
  {spk:'TRỌNG', text:'"...Tao biết thế nào mày cũng tìm ra thôi. La Peace không giữ được nó mãi mãi."'},
  {spk:'BẠN', text:'"Trọng?! Mày... mày?? nó không biến mất sau tế lễ à?"'},
  {spk:'TRỌNG', text:'"Tế lễ chỉ xoa dịu, không tiêu diệt. Về cơ bản thì TIU chính là những gì còn thiếu của UIT, một cách nói khác là mặt trái."'},
  {spk:'TRỌNG', text:'"Sự thật là... TIU chưa từng là một con quái vật thuần túy. Nó vốn dĩ là tập hợp oán niệm của sinh viên — của các ngươi, và cả ta nữa — mỗi lần đối mặt với bug."'},
  {spk:'BẠN', text:'"...Cái gì cơ?"'},
  {spk:'TRỌNG', text:'"TIU kết tụ từ những đêm thức trắng vì code lỗi, những tính năng lỗi, những lần demo là sập, những lần ‘chạy được trên máy tao mà’ — toàn bộ oán khí mà chúng ta thở ra."'},
  {spk:'TRỌNG', text:'"Đó là lý do vì sao ta không thể ra tay dứt điểm với nó. Miễn là code còn bug thì nó sẽ không thể bị tiêu diệt."'},
  {spk:'TRỌNG', text:'"Ta đã cố khống chế nó bằng La Peace... nhưng nó đã xổng mất. Oán niệm của nó có lẽ vẫn còn quá lớn."'},
  {spk:'BẠN', text:'"Vậy La Peace — thứ năng lượng ôn hòa mày nói tới — thực chất là gì?"'},
  {spk:'TRỌNG', text:'"Là nguồn năng lượng ôn hòa khiến cho TIU trở nên dịu đi 1 chút."'},
  {spk:'TRỌNG', text:'"Đó là lý do tao phải đi tiềm kiếm chúng."'},
  {spk:'BẠN', text:'"..."'},
  {spk:'TRỌNG', text:'"Kết quả thì mày thấy rồi đấy, giờ tao không chắc bản thân còn dùng nổi ma lực không nữa."'},
  {spk:'TRỌNG', text:'"Tạm thời nhờ bọn mày vậy, tao đã trọng thương rồi."'},
  {spk:'BẠN', text:'"Trọng à, mày có lẽ đã bị TRỌNG thương NẶNG lắm nhỉ??"'},
  {spk:'TRỌNG', text:'"Mày... mày không hài đâu."'},
  {spk:'...', text:'(Wibu Việt Nhật và Chàng Lính Ngu Lắm gấp rút chạy đến khi nghe tiếng gọi)'},
  {spk:'WIBU VIỆT NHẬT', text:'"Trọng?? Ủa mày còn sống — ý tao là, còn ở đây à??"'},
  {spk:'CHÀNG LÍNH NGU LẮM', text:'"Chuyện gì đang xảy ra vậy trời..."'},
  {spk:'TRỌNG', text:'"Chuyện dài lắm. Ra Tòa A rồi kể."'},
  {spk:'BẠN', text:'Bốn người lặng lẽ tập hợp dưới hiên Tòa A.'}
];

const VN_CH2_VICTORY_DIALOGUE = {
  lines:[
    {spk:'BẠN', text:'Dòng điện cuối cùng cũng phóng thẳng vào TIU. Một tiếng rú xé toạc màn đêm — nghe như tiếng thở dài của cả nghìn sinh viên vừa nộp bài xong — rồi... im bặt.'},
    {spk:'WIBU VIỆT NHẬT', text:'"...Xong thật rồi à? Tao không dám tin luôn."'},
    {spk:'CHÀNG LÍNH NGU LẮM', text:'"Ê ê, sống rồi tụi mày ơi! SỐNG RỒI!!"'},
    {spk:'BẠN', text:'Giữa lúc cả hai còn đang reo hò, Trọng vẫn đứng lặng một góc, mắt dán vào đám tro tàn còn vương mùi điện cháy nơi TIU vừa tan biến.'},
    {spk:'BẠN', text:'"Trọng? Xong rồi mà, sao mặt mày như vậy?"'},
    {spk:'TRỌNG', text:'"...Xong rồi. Chúng ta thật sự thắng rồi nhỉ."'},
    {spk:'TRỌNG', text:'Trọng trầm ngân nghĩ về vài chuyện.'},
    {spk:'BẠN', text:'"...Này sao mày im lặng vậy"'},
    {spk:'TRỌNG', text:'"Tao không biết nữa..."'},
    {spk:'TRỌNG', text:'"Cứ có một chút cảm giác bug là 1 cái gì đó mà bản thân không thể tránh khỏi."'},
    {spk:'WIBU VIỆT NHẬT', text:'"Này... không phải lỗi của tao đâu."'},
    {spk:'TRỌNG', text:'"Ừ. Bug thật ra là người bạn đã đồng hành cùng chúng ta xuốt hành trình này mà."'},
    {spk:'TRỌNG', text:'"Tụi mày cứ về nghỉ đi. Tao đi về đây."'},
    {spk:'BẠN', text:'Trọng quay lưng, bước chậm rãi về phía chân trời đang ửng hồng, không nói thêm lời nào.'},
    {spk:'BẠN', text:'Bình minh đã lên. UIT lại một lần nữa im lìm như chưa từng có chuyện gì xảy ra. Nhưng có lẽ, không ai trong ba người bọn tôi còn nhìn nó bằng ánh mắt như cũ nữa.'},
  ]
};



const VN_TRONG_TEACH_SOLO_INTRO = {
  lines:[
    {spk:'BẠN', text:'Trời chạng vạng, tôi còn đang gói ghém đồ nghề thì Trọng bất ngờ xuất hiện, đứng chắn ngay lối đi.'},
    {spk:'TRỌNG', text:'"Khoan đã. Trước khi mày mò vào trỏng đêm nay — tao có thứ cần dạy mày."'},
    {spk:'BẠN', text:'"Dạy tôi? Giờ này á? Tôi tưởng ông chỉ đứng nhìn thôi chứ."'},
    {spk:'TRỌNG', text:'"Bình thường thì đúng vậy. Nhưng lần này khác — tụi mày đang định NHỐT một khối oán niệm khổng lồ vào ma trận La Peace. Không có dấu ấn cơ bản, ma trận đó chỉ là đống dây điện vô dụng."'},
    {spk:'TRỌNG', text:'"Dấu ấn không khó — chỉ cần mày nhớ đúng THỨ TỰ. Sai nhịp, năng lượng sẽ tản mất thay vì tụ lại."'},
    {spk:'TRỌNG', text:'"Tao sẽ đọc một chuỗi ký hiệu. Mày lặp lại y hệt bằng phím mũi tên. Càng chuẩn, dấu ấn càng bám chắc vào mày."'},
    {spk:'BẠN', text:'"...Rồi, thử thì thử."'},
  ]
};
const VN_TRONG_TEACH_SOLO_SUCCESS = {
  lines:[
    {spk:'TRỌNG', text:'"...Ừ. Không tệ. Dấu ấn đã ăn vào tay mày rồi đó."'},
    {spk:'BẠN', text:'Tôi thấy tay mình hơi ấm lên một chút, như thể vừa cầm một thứ gì đó vô hình.'},
    {spk:'TRỌNG', text:'"Giữ cảm giác đó. Đêm nay khi làm việc cùng Chàng Lính với Wibu, mày sẽ cần đến nó — nhất là lúc đồng bộ giật cầu dao."'},
    {spk:'TRỌNG', text:'"Tao sẽ dạy lại cho cả ba trước khi bước vào đêm quyết định. Còn giờ — cứ xem như bài khởi động."'},
    {spk:'TRỌNG', text:'Trọng gật đầu một cái rồi lặng lẽ biến mất vào bóng tối, như chưa từng xuất hiện.'},
  ]
};
const VN_TRONG_TEACH_SOLO_FAIL = {
  lines:[
    {spk:'TRỌNG', text:'"...Loạn nhịp hết trơn. Thứ tự sai lung tung."'},
    {spk:'BẠN', text:'"Tại mày đọc nhanh quá! Tao có phải phù thuỷ đâu."'},
    {spk:'TRỌNG', text:'"Không sao. Dấu ấn vẫn bám được — chỉ là lỏng lẻo hơn nhiều so với người luyện đúng nhịp."'},
    {spk:'TRỌNG', text:'"Nghĩa là đêm sau, lúc cần đồng bộ với hai đứa kia, phần của mày sẽ dễ trật nhịp hơn. Cẩn thận."'},
    {spk:'BẠN', text:'"...Được, tao sẽ cố gắng bù lại bằng cách khác."'},
    {spk:'TRỌNG', text:'"Ừ. Tao sẽ dạy lại lần nữa trước khi vào đêm quyết định — cả ba đứa cùng lúc. May ra nhịp chung sẽ kéo mày lên."'},
    {spk:'Trọng', text:'Trọng thở dài, rồi lặng lẽ biến mất vào bóng tối như chưa từng xuất hiện.'},
  ]
};

/* ---- Trước Đêm 2: Trọng dạy cùng lúc cho cả 3 ---- */
const VN_TRONG_TEACH_GROUP_INTRO = {
  lines:[
    {spk:'BẠN', text:'16:30. Trọng đã đứng đợi sẵn ở Căn tin, bên cạnh là Chàng Lính đang vươn vai và Wibu ôm khư khư cuốn sổ ghi chép.'},
    {spk:'TRỌNG', text:'"Lại đây, đêm nay là đêm quyết định — không có chỗ cho sai sót."'},
    {spk:'CHÀNG LÍNH NGU LẮM', text:'"Ơ, giờ tụi tao cũng phải học phép á? Tao tưởng tao chỉ vác đồ với dựng bẫy thôi chứ!"'},
    {spk:'TRỌNG', text:'"Lúc giật cầu dao đồng bộ, CẢ BA đứa phải cùng lúc kích hoạt đúng nhịp. Một đứa trật, cả ma trận sụp."'},
    {spk:'WIBU VIỆT NHẬT', text:'"...Nói vậy hồi nãy học một mình chưa đủ à?"'},
    {spk:'BẠN', text:'"Ổng nói vậy từ đầu rồi mà, mày không để ý à."'},
    {spk:'TRỌNG', text:'"Lần này tao sẽ đọc chuỗi ký hiệu dài hơn, khó hơn. Cả ba đứa cùng luyện chung một lượt — nhịp của đứa nào cũng ảnh hưởng tới đứa kia."'},
    {spk:'TRỌNG', text:'"Tập trung vào. Bắt đầu."'},
  ]
};
const VN_TRONG_TEACH_GROUP_SUCCESS = {
  lines:[
    {spk:'TRỌNG', text:'"...Tốt. Nhịp của cả ba khớp nhau gần như hoàn hảo."'},
    {spk:'CHÀNG LÍNH NGU LẮM', text:'"Hehe, tao cũng có khiếu phết chứ bộ!"'},
    {spk:'WIBU VIỆT NHẬT', text:'"...May mà tao là best osu VN, chứ không thì..."'},
    {spk:'TRỌNG', text:'"Đừng chủ quan. Trong trận địa thật, TIU sẽ không đứng yên cho tụi mày tập trung như vầy đâu."'},
    {spk:'TRỌNG', text:'"Nhưng ít nhất — nền tảng đã vững. Phần còn lại phụ thuộc vào lúc đó cả ba có giữ được bình tĩnh hay không."'},
    {spk:'BẠN', text:'Trọng nhìn cả ba một lượt, ánh mắt có gì đó vừa tin tưởng, vừa nặng trĩu.'},
    {spk:'TRỌNG', text:'"Nghỉ ngơi đi. 21:00 bắt đầu."'},
  ]
};
const VN_TRONG_TEACH_GROUP_FAIL = {
  lines:[
    {spk:'TRỌNG', text:'"...Loạn hết. Ba đứa ba nhịp khác nhau, không đứa nào khớp đứa nào."'},
    {spk:'CHÀNG LÍNH NGU LẮM', text:'"Ơ tại thằng Wibu bấm sai trước mà, em theo ổng lỡ nhịp luôn!"'},
    {spk:'WIBU VIỆT NHẬT', text:'"...Tao mà sai? Mày nhìn lộn hướng nãy giờ kìa."'},
    {spk:'TRỌNG', text:'"Thôi! Cãi nhau không giải quyết được gì."'},
    {spk:'TRỌNG', text:'"Nghe đây — không kịp luyện lại nữa, trời sắp tối rồi. Dấu ấn của cả ba sẽ không thật sự vững."'},
    {spk:'TRỌNG', text:'"Nghĩa là lúc đồng bộ giật cầu dao đêm nay, khả năng trật nhịp sẽ cao hơn bình thường. Tụi mày phải bù lại bằng sự tập trung."'},
    {spk:'BẠN', text:'"...Được. Tụi tôi sẽ cẩn thận hơn."'},
    {spk:'TRỌNG', text:'"Hy vọng vậy. 21:00, không còn thời gian để hối hận nữa đâu."'},
  ]
};

/* ==============================================================
   CHAPTER 2 — ĐÊM 2: SECRET ENDING (KHỞI ĐẦU ĐÊM 3)
   Chạy thay cho VN_CH2_VICTORY_DIALOGUE khi người chơi DO DỰ không tung đòn kết liễu lúc
   dòng điện quá tải đã tích đủ 100% (đỉnh điểm Giai đoạn Quá Tải — xem PHẦN 6.4 design doc).
   Route này hiện CHƯA được nối vào logic rẽ nhánh trong script.js (triggerNight2Climax() vẫn
   luôn đi thẳng route Normal) — đây là bước chuẩn bị nội dung, phần trigger/Đêm 3 sẽ làm sau.
   ============================================================== */
const VN_CH2_SECRET_HESITATION_DIALOGUE = {
  lines:[
    {spk:'BẠN', text:'Dòng điện đã tích đủ. Chỉ cần một cái gật đầu, ma trận sẽ phóng thẳng luồng năng lượng cuối cùng vào TIU.'},
    {spk:'BẠN', text:'Nhưng tay tôi không nhấc lên nổi.'},
    {spk:'CHÀNG LÍNH NGU LẮM', text:'"Ơ? Sao còn chưa hô lệnh? Giờ là lúc đó mà!"'},
    {spk:'BẠN', text:'"...Tôi không làm được."'},
    {spk:'WIBU VIỆT NHẬT', text:'"Mày điên à? Một là nó chết hai là chúng ta!"'},
    {spk:'BẠN', text:'"Tôi biết! Nhưng... nó... nó là oán niệm của chính chúng ta — của đứa nào từng chửi bug lúc ba giờ sáng. Chúng ta mới là căn nguyên, vậy mà giờ lại đi xoá sổ nó ư."'},
    {spk:'TRỌNG', text:'"Chứ còn gì nữa."'},
    {spk:'TRỌNG', text:'"Mày thử vào công ty xem code sai có bị trừ lương không."'},
    {spk:'BẠN', text:'"Trọng, mày..."'},
    {spk:'TRỌNG', text:'"Thật lòng mà nói thì nó chính là trách nhiệm của chúng ta, chúng ta phải giải quyết nó."'},
    {spk:'TRỌNG', text:'"Sự do dự của mày chỉ là hành động ng... á á á."'},
  ]
};
const VN_CH2_SECRET_TRANSFORM_DIALOGUE = {
  lines:[
    {spk:'BẠN', text:'Chưa kịp nói hết câu, một luồng sáng đen kịt bùng lên từ ngực Trọng, xé toạc cả không gian quanh Trận Địa.'},
    {spk:'CHÀNG LÍNH NGU LẮM', text:'"TRỌNG?! CÁI GÌ VẬY?!"'},
    {spk:'BẠN', text:'Thứ năng lượng đó không phóng vào TIU — nó NUỐT lấy TIU, cả một biển oán niệm ùa vào người hắn. Cả ma trận La Peace cũng bị hút theo, từng tia điện cuộn xoáy vào người Trọng như một cơn lốc.'},
    {spk:'WIBU VIỆT NHẬT', text:'"Chạy! Tránh xa ra!!"'},
    {spk:'BẠN', text:'Tiếng gào của TIU tắt lịm giữa chừng. Khi luồng sáng tan đi, thứ đứng đó không còn là Trọng như tôi từng biết.'},
    {spk:'BẠN', text:'Đôi mắt hắn giờ đen kịt không còn tròng, những đường vân đỏ như máu bò lan khắp cơ thể, run lên theo từng nhịp thở nặng nề.'},
    {spk:'TRỌNG', text:'"...ổn... tao... vẫn ổn..."'},
    {spk:'BẠN', text:'Giọng nói đó vẫn là Trọng. Nhưng có gì đó khác — trầm hơn, vang hơn, như có một thứ khác đang nói CÙNG LÚC với hắn.'},
    {spk:'WIBU VIỆT NHẬT', text:'"...Máy đo của tao vừa bắt được một tín hiệu lạ. Nó không nhận diện được là The TIU nữa."'},
    {spk:'WIBU VIỆT NHẬT', text:'"Chỉ hiện đúng một dòng: TRỌNG — THE CURSE ONE."'},
    {spk:'TRỌNG', text:'"Đi đi. Trước khi tao... không kiểm soát được nữa."'},
    {spk:'BẠN', text:'Nói xong, cơ thể Trọng bốc lên không trung, xé toạc màn đêm bằng một vệt sáng đỏ thẫm, rồi mất hút về phía chân trời.'},
    {spk:'CHÀNG LÍNH NGU LẮM', text:'"...tao vừa thấy gì vậy? Mọi người vừa thấy cái gì vậy?"'},
    {spk:'WIBU VIỆT NHẬT', text:'"...Tao không biết. Nhưng tao nghĩ tụi mình nên im lặng, ít nhất là đêm nay."'},
    {spk:'BẠN', text:'Không ai trong ba người dám nói thêm lời nào. Chúng tôi đứng đó, giữa Trận Địa đã tan hoang, chờ bình minh lên.'},
    {spk:'BẠN', text:'Nó không quay lại tấn công. Có lẽ — dù đã trở thành thứ gì đi nữa — vẫn còn sót lại chút gì đó của Trọng, đủ để kìm nó lại. Ít nhất là đêm nay.'},
    {spk:'BẠN', text:'Nhưng cả ba chúng tôi đều biết — chuyện này còn lâu mới kết thúc. Và đêm mai, 21:00, có lẽ chúng tôi sẽ phải đối mặt với chính người bạn của mình.'},
  ]
};


const VN_CH2_CLIMAX_CHOICE = {
  lines:[
    {spk:'TRỌNG', text:'"Dòng điện đã tích đủ. Chỉ cần ra lệnh, mọi chuyện sẽ kết thúc ngay bây giờ."'},
    {spk:'BẠN', text:'Ngón tay tôi dừng lại ngay phía trên công tắc kích hoạt. TIU — khối oán niệm kết tụ từ biết bao sinh viên từng bị bug hành, trong đó có cả chấp niệm của Sửu — đang run rẩy trong xích điện, gần như kiệt sức.'},
    {spk:'BẠN', text:'Chỉ cần một cái gật đầu.', choices:[
      {label:'⚡ RA LỆNH — kết liễu ngay, không do dự', insert:[]},
      {label:'✦ DO DỰ — khựng lại, nhìn nó lần cuối', insert:[]},
    ]},
  ]
};

const VN_CH2_NIGHT3_INTRO = [
  {spk:'BẠN', text:'21:00. Trận Địa hôm qua vẫn còn ngổn ngang. Wibu Việt Nhật với Chàng Lính Ngu Lắm đã trốn về ký túc xá — tôi bảo họ đi, chuyện này để một mình tôi lo.'},
  {spk:'BẠN', text:'Ba mảnh La Peace vẫn còn nằm trong túi tôi. Trọng nói đúng — chỉ có tôi là người duy nhất từng chạm vào cả ba mảnh cùng lúc.'},
  {spk:'BẠN', text:'Không biết phần La Peace ngủ quên trong người mình có thật hay không. Nhưng tối nay, có lẽ tôi sẽ phải tìm ra câu trả lời.'},
  {spk:'BẠN', text:'Khuôn viên trường im lặng đến rợn người — không giống bất kỳ đêm nào trước đó.'},
  {spk:'???', text:'"...còn đây à..."'},
  {spk:'BẠN', text:'!!! Tiếng gì vậy — đó là giọng Trọng. Nhưng trầm hơn, vang hơn, không còn chút gì con người.'}
];

const VN_CH3_LAPEACE_AWAKENING = {
  lines:[
    {spk:'BẠN', text:'Lần thứ ba. Lưng tôi va vào tường, hơi thở đứt quãng — không còn chạy nổi nữa.'},
    {spk:'TRỌNG', text:'"...vẫn cứ chạy. Chạy đi đâu được nữa."'},
    {spk:'BẠN', text:'Ba mảnh La Peace trong túi áo bỗng nóng rực lên, như thể chúng đang phản ứng lại với chính nỗi sợ của tôi.'},
    {spk:'BẠN', text:'"La Peace... là sức mạnh linh hồn của con người. Ai cũng có nó." — lời Trọng nói đêm đầu tiên, tôi chưa từng thật sự tin.'},
    {spk:'BẠN', text:'"Nhưng chỉ những ai CẢM NHẬN và SỬ DỤNG được nó, mới thật sự trở thành pháp sư."'},
    {spk:'BẠN', text:'Tôi không muốn chạy nữa. Tôi siết chặt ba mảnh sáng trong tay — không phải để trốn, mà để ĐỐI DIỆN.'},
    {spk:'BẠN', text:'Một luồng ánh sáng ấm áp bùng lên từ lồng ngực tôi, không đen kịt như thứ đã nuốt lấy Trọng, mà trong trẻo, ổn định, như một nhịp tim thứ hai.'},
    {spk:'TRỌNG', text:'"...cái gì..."'},
    {spk:'BẠN', text:'Lần đầu tiên sau ba đêm, tôi không còn là con mồi nữa.'},
    {spk:'BẠN', text:'Không biết là vì điều gì nhưng tôi cảm nhận được La Peace của chính tôi đang hút lấy năng lượng từ các La Peace khác.'},
    {spk:'BẠN', text:'Souls of the Undying One trỗi dậy trong tôi — sức mạnh của La Peace hoà cùng ý chí sinh tồn còn sót lại sau ba lần bị dồn vào đường cùng.'},
    {spk:'BẠN', text:'"Trọng. Tao sẽ không chạy nữa. Tao sẽ đối diện với mày — như một pháp sư thật sự."'},
    {spk:'TRỌNG', text:'"...vậy thì... cho tao thấy đi."'},
  ]
};


const VN_TRONG_CURSE_SEAL_PROMPT = {
  lines:[
    {spk:'BẠN', text:'Một đòn cuối cùng xé toạc lớp giáp tà thuật quanh người Trọng. Hắn khuỵu xuống một chân, hơi thở đứt quãng.'},
    {spk:'BẠN', text:'Trong khoảnh khắc đó, đôi mắt đen kịt của hắn thoáng ánh lên chút gì đó quen thuộc — như thể Trọng thật sự vẫn còn ở đâu đó bên trong.'},
    {spk:'TRỌNG', text:'"...làm đi..."'},
    {spk:'TRỌNG', text:'"...đừng để tao... hại thêm ai nữa..."'},
    {spk:'BẠN', text:'Tôi siết chặt La Peace đang rung lên trong lòng bàn tay. Chỉ cần dồn thêm một chút sức mạnh nữa thôi — Trọng sẽ không bao giờ đứng dậy được nữa.'},
    {spk:'BẠN', text:'Nhưng cũng chính sức mạnh đó, nếu dùng đúng cách, có thể GIAM CẦM thay vì HUỶ DIỆT. Không ai đảm bảo nó sẽ giữ được — nhưng ít nhất, Trọng còn có một cơ hội.'},
    {spk:'BẠN', text:'Không còn nhiều thời gian để do dự.', choices:[
      {label:'✦ PHONG ẤN — giữ lại một phần của Trọng', insert:[]},
      {label:'⚔ KẾT LIỄU — không còn đường lui', insert:[]},
    ]},
  ]
};
const VN_TRONG_SEAL_CHOSEN = {
  lines:[
    {spk:'BẠN', text:'"...Không. Tôi sẽ không giết mày."'},
    {spk:'BẠN', text:'Tôi dồn hết sức mạnh còn lại của Souls of the Undying One vào La Peace — không phải để đâm xuyên qua Trọng, mà để LỌC oán niệm ra khỏi hắn.'},
    {spk:'TRỌNG', text:'"...mày định... tách tụi nó ra khỏi tao?"'},
    {spk:'BẠN', text:'"Oán niệm nào cũng có lý do để tồn tại. Chỉ là chưa ai chịu lắng nghe chúng, thay vì đè chúng xuống."'},
    {spk:'BẠN', text:'"Tao không biết có làm được không."'},
    {spk:'TRỌNG', text:'"...ngu... mày sẽ hối hận..."'},
    {spk:'BẠN', text:'"Có thể. Nhưng tao thà hối hận vì đã cố cứu, còn hơn phải sống với việc đã giết thêm một người bạn."'},
  ]
};
const VN_TRONG_KILL_CHOSEN = {
  lines:[
    {spk:'BẠN', text:'"...Xin lỗi, Trọng."'},
    {spk:'BẠN', text:'Tôi siết chặt La Peace, dồn toàn bộ sức mạnh còn lại vào đòn đánh tiếp theo. Không còn đường lui nữa.'},
    {spk:'TRỌNG', text:'"...vậy thì... tới đi..."'},
  ]
};

const VN_TRONG_SEALED_ENDING_DIALOGUE = {
  lines:[
    {spk:'BẠN', text:'Ánh sáng từ La Peace không nuốt lấy Trọng như tôi tưởng — nó tách ra thành hai luồng khói, một xanh xám lạnh lẽo, một đỏ thẫm nặng nề, kéo ra khỏi lồng ngực hắn.'},
    {spk:'BẠN', text:'Trọng đứng sững, mắt nhắm nghiền.'},
    {spk:'BẠN', text:'Hai luồng khói dần thu nhỏ lại, cô đặc thành hai viên đá nhỏ tối màu, nằm yên trong lòng bàn tay Trọng — không còn hơi thở, không còn tiếng nói, chỉ còn sự tĩnh lặng.'},
    {spk:'BẠN', text:'Trọng mở mắt. Lần đầu tiên sau hai đêm, tôi thấy đúng đôi mắt của Trọng — không còn đen kịt, không còn đường vân đỏ, chỉ là một người đàn ông kiệt sức.'},
    {spk:'TRỌNG', text:'"...Xong rồi."'},
    {spk:'WIBU VIỆT NHẬT', text:'"Trọng?! Mày... mày tỉnh lại rồi à?"'},
    {spk:'TRỌNG', text:'"Ừ. Tao vẫn còn ở đây. Ít ra là tạm thời."'},
    {spk:'CHÀNG LÍNH NGU LẮM', text:'"TAO VẪN CHƯA HIỂU CÁI GÌ VỪA XẢY RA NHƯNG MÀ TAO MỪNG LÀ MÀY ỔN!!"'},
    {spk:'BẠN', text:'Trọng nhìn xuống hai viên đá tối màu trong tay, im lặng một lúc lâu trước khi cất chúng vào túi áo.'},
    {spk:'TRỌNG', text:'"Tao vừa nói chuyện với tụi nó. Sửu với Tý."'},
    {spk:'BẠN', text:'"...Nói chuyện gì?"'},
    {spk:'TRỌNG', text:'"Chuyện mà lẽ ra tao nên nói từ lâu rồi. Xin lỗi. Dù có muộn cỡ nào."'},
    {spk:'BẠN', text:'Không ai trong chúng tôi hỏi thêm. Có những chuyện không cần phải hiểu hết mới cảm được sức nặng của nó.'},
    {spk:'BẠN', text:'Bình minh lên. Lần đầu tiên sau hai đêm dài đằng đẵng, không khí quanh UIT không còn nặng nề như trước nữa.'},
    {spk:'CHÀNG LÍNH NGU LẮM', text:'"Ê, vậy coi như xong hết rồi hả? Tụi mình... sống sót thật rồi hả?"'},
    {spk:'TRỌNG', text:'"Đêm nay thì đúng vậy."'},
    {spk:'BẠN', text:'Trọng nhìn cả ba chúng tôi, nở một nụ cười mệt mỏi nhưng chân thật — lần đầu tiên tôi từng thấy ở hắn.'},
    {spk:'TRỌNG', text:'"Cảm ơn. Vì đã không bỏ tao lại, kể cả khi tao không còn là chính mình nữa."'},
    {spk:'WIBU VIỆT NHẬT', text:'"...Đừng làm tao khóc chứ, ghê thấy mồ."'},
    {spk:'BẠN', text:'Chúng tôi đứng đó, giữa Trận Địa đổ nát, giữa ánh nắng đầu tiên của một buổi sáng mà không ai trong chúng tôi dám chắc mình sẽ sống để thấy.'},
    {spk:'BẠN', text:'Nhưng câu chuyện này — có lẽ chưa dừng lại ở đây. Còn Sửu, còn Tý, còn lời hứa của Trọng, còn cả những câu hỏi mà đêm nay chưa kịp trả lời.'},
    {spk:'BẠN', text:'Bug thì vẫn còn đó, sinh viên thì vẫn cứ than. Chỉ mong lần sau, oán niệm sẽ có chỗ để nói ra, thay vì tích tụ lại thành quái vật.'},
    {spk:'BẠN', text:'Có lẽ, đó sẽ là một câu chuyện khác. Vào một ngày khác.'},
  ]
};


const TRONG_TAUNT_LINES = [
  'Yếu vậy thôi à, TRỌNG? Tao sẽ cho mày TRỌNG thương.',
  'The Curse One? Mày chỉ là một thứ lai tạp hạ đẳng.',
  'Tiếp tục chống cự đi, La Peace trong tao sẽ nghiền nát mày.',
  'TIU hẳn thất vọng lắm, TRỌNG à.',
  'Quá đổi kém cỏi, kể cả so với một con chimera',
  'Umm có vẻ có người không thể rời khỏi đây lành lặng rồi.',
  'Code của mày còn nhiều bug hơn cả tinh thần chiến đấu đó, TRỌNG.',
];
// Phản ứng của TRỌNG khi bị Chế nhạo — càng lúc càng mất kiểm soát, giận dữ.
const TRONG_TAUNT_REPLY_LINES = [
  '"...Câm miệng. Mày không hiểu tao đã phải đánh đổi những gì đâu."',
  '"TRỌNG THƯƠNG? Mày còn chưa thấy được một phần sức mạnh thật sự của tao!"',
  '"Lai tạp hay không, tao vẫn sẽ là thứ cuối cùng mày nhìn thấy đêm nay."',
  '"...Đừng nhắc tới TIU. ĐỪNG. NHẮC. TỚI. TIU."',
  '"Chimera? Mày sắp biết thế nào là thật sự tuyệt vọng rồi đó."',
  '"...Được thôi. Nếu mày muốn thấy tao mất kiểm soát đến mức nào."',
  '"...Bug? Mày dám nhắc tới bug trước mặt tao sao?!"',
];
const TRONG_REASSURE_LINES = [
  'Trọng tĩnh lại ngây đi!!',
  'Không ai trách mày cả. Bình tĩnh lại đi, TRỌNG.',
  'Mày không cần phải gồng mình làm quái vật đâu, TRỌNG.',
  'TRỌNG mày vẫn còn điều cần làm mà.',
  'Đừng NẶNG nề vậy chứ Trọng.',
  'Bug nào rồi cũng fix được mà, TRỌNG. Kể cả cái bug trong lòng mày.',
];
// Phản ứng của TRỌNG khi được Trấn an — dần dịu lại, vẫn còn giằng co với chính mình.
const TRONG_REASSURE_REPLY_LINES = [
  '"...Tao không biết mình còn có thể tĩnh lại được không nữa."',
  '"Trách? Không... chỉ là tao không còn lựa chọn nào khác."',
  '"Quái vật hay không, ít nhất... nó vẫn đang bảo vệ được điều gì đó."',
  '"...Điều tao cần làm. Phải rồi. Tao suýt quên mất."',
  '"...Được. Chỉ một chút thôi. Tao sẽ cố."',
  '"...Fix được thật không? Tao đã ngồi debug nó suốt bao lâu rồi."',
];

/* Câu thoại RIÊNG khi Chế nhạo đạt tối đa (3/3) và biến thành SÁT CHIÊU HOÀN HẢO — chiêu kết
   liễu gây sát thương lớn, hồi 3 lượt sau mỗi lần dùng (xem resolveActTaunt()). */
const TRONG_TAUNT_ULTIMATE_LINE = 'Đủ rồi TRỌNG — đây là đòn cuối cùng dành cho mày!';
const TRONG_TAUNT_ULTIMATE_REPLY = '"...Vậy thì tới đi. Cho tao thấy hết những gì mày có!"';

/* Câu thoại RIÊNG khi Trấn an đạt tối đa (3/3) và biến thành "TA SẼ KHÔNG BỎ AI Ở LẠI" —
   tăng HP tối đa của bản thân, cũng hồi 3 lượt sau mỗi lần dùng (xem resolveActReassure()). */
const TRONG_REASSURE_ULTIMATE_LINE = 'Ta sẽ không bỏ ai ở lại — kể cả mày, TRỌNG.';
const TRONG_REASSURE_ULTIMATE_REPLY = '"...Sao mày có thể nói câu đó, với thứ đang đứng trước mặt mày lúc này?"';

const VN_TRONG_BAD_ENDING_DIALOGUE = {
  lines:[
    {spk:'BẠN', text:'Đòn đánh cuối cùng xuyên thẳng qua lớp giáp tà thuật. Trọng gục xuống, không còn động đậy.'},
    {spk:'BẠN', text:'Không có tiếng gầm rú nào nữa. Chỉ có sự im lặng — thứ im lặng nặng nề nhất tôi từng nghe thấy trong đời.'},
    {spk:'WIBU VIỆT NHẬT', text:'"...Xong rồi."'},
    {spk:'CHÀNG LÍNH NGU LẮM', text:'"...Ừ. Xong rồi."'},
    {spk:'BẠN', text:'Không ai reo hò. Không ai thấy nhẹ nhõm. Ba chúng tôi đứng đó, nhìn cái xác không còn nhận ra là Trọng nữa, giữa đống đổ nát của Trận Địa.'},
    {spk:'BẠN', text:'Oán niệm không biến mất khi bị giết. Nó chỉ đổi chủ.'},
    {spk:'BẠN', text:'Bình minh lên, nhưng không mang lại cảm giác nhẹ nhõm nào cả. Chúng tôi đã thắng. Nhưng thắng để làm gì, khi cái giá phải trả là chính người đã dẫn đường cho chúng tôi suốt thời gian qua?'},
    {spk:'BẠN', text:'UIT lại im lìm như chưa từng có chuyện gì xảy ra. Nhưng lần này, không ai trong ba chúng tôi còn muốn quay lại nhìn nó một cách bình thường thêm một lần nào nữa.'},
  ]
};