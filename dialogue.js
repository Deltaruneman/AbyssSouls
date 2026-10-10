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
    {spk:'BẠN', text:'(Trên cổ tay có một vòng ký hiệu mờ mờ như vết hằn dây đồng hồ. Mà mình có đeo đồng hồ đâu nhỉ?)'},
    {spk:'BẠN', text:'Giờ này chắc chẳng có xe bus hay các chú xe ôm công nghệ rồi.'},
    {spk:'BẠN', text:'!!!Tiếng gì vậy — hình như có ai đó đang lầm bầm than thở...'}
  ],
  2: [
    {spk:'BẠN', text:'Điều này rõ ràng không hề tự nhiên chút nào cả.'},
    {spk:'BẠN', text:'Mình rõ ràng không hề có thói quen ngủ trong tiết như thế này.'},
    {spk:'BẠN', text:'Cứ như có ai đó bật công tắc khiến mình gục xuống, rồi tắt luôn trí nhớ của mình.'},
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
      {spk:'TRỌNG', text:'"Thứ đó tên là TIU, mặt trái của UIT. Nó sinh ra từ thứ mà sinh viên chúng ta cứ dồn nén mãi không nói ra... chuyện đó dài dòng lắm."'},
      {spk:'Bạn', text:'"Khoan khoan mày là ai cơ."'},
      {spk:'TRỌNG', text:'"Cùng là sinh viên trong trường thôi. Khoa Kỹ thuật Thông tin. Tên tao là Trọng."'},
      {spk:'Bạn', text:'"Mày không sợ nó à? Sao nó không đuổi mày?"'},
      {spk:'TRỌNG', text:'"...Tao biết cách đứng sao cho nó không hứng thú."'},
      {spk:'TRỌNG', text:'"Nghe cho kỹ: quanh trường đang có 3 mảnh La Peace rơi vãi — thứ duy nhất đủ dịu để xoa dịu oán khí của TIU. Chỗ Gửi Xe với Sân Bóng hay có nhất."'},
      {spk:'TRỌNG', text:'"Phải gom đủ cả ba, thiếu một cũng không được. Đêm nào tao cũng ở Tòa C từ 4 đến 6 giờ sáng — đến đó tao sẽ hỏi mày gom được mấy mảnh."'},
      {spk:'Bạn', text:'"Sao tao phải tin mày?"'},
      {spk:'TRỌNG', text:'"Mày không phải tin. Mày chỉ cần muốn sống thôi."'},
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
      ? '"Không có mảnh nào... Vậy là không còn cách nào khác rồi."'
      : '"Chưa có mảnh nào à... Không sao, còn thời gian. Nhưng đừng để sát đêm cuối mới đi tìm."'});
  } else {
    lines.push({spk:'TRỌNG', text: night===3
      ? '"'+n+'/3... Thiếu rồi. Thiếu một mảnh thôi cũng không đủ."'
      : '"'+n+'/3. Giữ chặt chúng. Càng sớm đưa tao càng an toàn."'});
  }
  // Manh mối nghi ngờ (chỉ lộ ra khi người chơi đã gom từ 2 mảnh — tức đang đi trên đường tới Secret)
  if(n>=2){
    lines.push(
      {spk:'BẠN', text:'Hắn nhìn chằm chằm vào túi áo tôi lâu hơn mức cần thiết — như thể đang đếm thứ gì đó mà tôi chưa hề lấy ra.'},
      {spk:'Bạn', text:'"Sao mày không tự đi nhặt? Mày rành mấy thứ này hơn tao mà."'},
      {spk:'TRỌNG', text:'"...Tao bận. Với lại tao đâu có bị ngủ quên ở trường như tụi mày."'},
      {spk:'BẠN', text:'Tôi chưa hề nói mình bị ngủ quên.'}
    );
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
  {spk:'BẠN', text:'Trước mặt cậu ấy là THE TIU — bị trói trong những sợi xích sáng, gào lên thứ tiếng chẳng còn ra hình người. Trong tiếng gào hỗn loạn đó, thỉnh thoảng lại chen vào một âm tiết nghe như một cái tên.'},
  {spk:'BẠN', text:'Máu rỉ ra từ khoé miệng Trọng. Từng đường phù văn dưới chân cậu ấy đang nứt dần, từng đường một.'},
  {spk:'TRỌNG', text:'"Tao... vẫn phải giữ nó lại..."'},
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
    {spk:'TRỌNG', text:'"Đưa hết cho tao. Tao sẽ bố trí tế lễ giải oán ngay bây giờ — nhưng cần thời gian để hoàn tất."'},
    {spk:'BẠN', text:'Ánh mắt hắn sáng rực khi nhìn ba mảnh pha lê — không phải ánh mắt của người sắp cứu thế giới, mà giống người sắp được gặp lại ai đó.'},
    {spk:'TRỌNG', text:'"Trong lúc đó, chúng ta cần cầm cự trước mặt nó. Gọi thêm hai đứa kia đến đây!"'},
    {spk:'WIBU VIỆT NHẬT', text:'"Nghe nói có trận đánh boss à?? Tao vào!!"'},
    {spk:'CHÀNG LÍNH NGU LẮM', text:'"Đù, cuối cùng cũng có cơ hội chứng minh tao không ngu lắm..."'},
    {spk:'WIBU VIỆT NHẬT', text:'"Ê Trọng, mà sao cái vòng ký hiệu trên cổ tay tao với thằng Lính nóng ran lên vậy?"'},
    {spk:'TRỌNG', text:'"Hiệu ứng truyền mana thôi. Nhận lấy — mana của tao, tạm đủ cho cả ba người cầm cự."'},
    {spk:'', text:'"(Một luồng sáng ấm áp bao trùm lấy cả ba người)"'},
    {spk:'BẠN', text:'Ấm thì có ấm. Nhưng sao tôi có cảm giác thứ gì đó trong người mình đang bị kéo ra, chứ không phải được rót vào?'},
    {spk:'TRỌNG', text:'"Cầm cự đủ lâu, tao sẽ hoàn tất tế lễ! Đi thôi!"'},
    {spk:'BẠN', text:'Không gian bỗng rung chuyển dữ dội — thực tại vỡ tan thành từng mảnh...'}
  ]
};


const TRONG_VICTORY_DIALOGUE = {
  lines:[
    {spk:'TRỌNG', text:'"...Xong rồi. Tế lễ đã hoàn tất."'},
    {spk:'TRỌNG', text:'"La Peace đã hòa tan vào TIU — không phải để tiêu diệt nó, mà là để xoa dịu nó."'},
    {spk:'BẠN', text:'TIU không biến mất. Nó co lại thành một quầng sáng đục, mỗi lúc một lặng, rồi chìm vào lòng bàn tay Trọng. Hắn khép tay lại, nhẹ nhàng như giữ một chú chim non.'},
    {spk:'WIBU VIỆT NHẬT', text:'"Ơ... nó biến mất thật rồi à?"'},
    {spk:'CHÀNG LÍNH NGU LẮM', text:'"Tao... tao vẫn còn sống? TAO VẪN CÒN SỐNG!!"'},
    {spk:'TRỌNG', text:'"Cảm ơn cả ba người. Nếu không có các cậu cầm cự đủ lâu, tế lễ này đã không thể hoàn thành."'},
    {spk:'BẠN', text:'Hắn mỉm cười — nụ cười hiền nhất tôi từng thấy ở hắn. Lạ thay, chính nụ cười đó khiến sống lưng tôi lạnh buốt.'},
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
  {spk:'BẠN', text:'Ba mảnh La Peace giờ nằm trong túi hắn. Hắn nói là "để làm nốt phần việc còn lại". Mà việc còn lại đó là việc gì?'},
  {spk:'BẠN', text:'Dù đã 1 tuần trôi qua rồi nhưng mình muốn đi một vòng để chắc chắn rằng mọi thứ thật sự đã kết thúc.'}
];

const EPILOGUE_INTRO_SEALED = [
  {spk:'BẠN', text:'7:30 sáng. Tôi đã sống sót qua ba đêm — nhưng chẳng thấy nhẹ nhõm chút nào.'},
  {spk:'BẠN', text:'Không thấy Trọng ở đâu cả. Tôi tự nhủ cậu ấy chỉ đang nghỉ ngơi đâu đó... rồi không dám nghĩ tiếp.'},
  {spk:'BẠN', text:'Nghe nói sáng nay có ba sinh viên ngất ở Sân Bóng, tỉnh dậy thì ai cũng bảo người rỗng tuếch, như vừa bị rút mất thứ gì đó.'},
  {spk:'BẠN', text:'Nhưng mình vẫn phải đi một vòng quanh trường lần cuối.'}
];

const EPILOGUE_LIB_NORMAL = [
  {spk:'BẠN', text:'Thư viện vắng tanh. Mình bước vào định kiểm tra lần cuối trước khi rời khỏi trường.'},
  {spk:'BẠN', text:'...Trên kệ sách gần cửa sổ có những dòng chữ bị cào sâu hoắm, còn mới nguyên: "undefined", "segmentation fault", "chạy được trên máy tao mà"...'},
  {spk:'BẠN', text:'Giữa sàn nhà là một vũng chất lỏng đen sệt — y hệt thứ mình từng thấy ở The TIU. Bên cạnh là một vòng phấn trắng bị ai đó lau vội, còn sót lại vài nét chữ lạ.'},
  {spk:'BẠN', text:'Nó... vẫn còn ở khuôn viên trường này. Và có vẻ nó chưa từng là thứ tự nhiên sinh ra.'},
];

const EPILOGUE_LIB_SECRET = [
  {spk:'BẠN', text:'Trước khi về, mình ghé qua Thư viện — nơi cuối cùng còn chưa kiểm tra.'},
  {spk:'BẠN', text:'Không khí ở đây lạnh hơn hẳn những nơi khác, dù nắng đã lên cao ngoài kia.'},
  {spk:'BẠN', text:'Trên bàn đọc sách, một chiếc laptop bỏ quên vẫn còn sáng. Cửa sổ chat mở sẵn: "Rinka: Anh Trọng ơi, hôm nay em ra ngoài được chưa?"'},
  {spk:'BẠN', text:'Dòng trả lời cuối cùng, từ chính tài khoản Trọng: "Đủ rồi em. Đợi anh thêm chút nữa thôi."'},
  {spk:'BẠN', text:'Dưới gầm bàn, một vòng phấn trắng khổng lồ — ở giữa là dòng chữ "undefined is not a function", nét cào y hệt thứ The TIU từng để lại.'},
  {spk:'BẠN', text:'Tế lễ có thật sự thành công không... hay đó chỉ là điều Trọng muốn mình tin? Và "Rinka" là ai?'},
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
  {spk:'BẠN', text:'Ba người nhìn nhau, không ai nói thêm gì — nhưng ai cũng hiểu, những gì sắp tới sẽ khác hẳn ba đêm vừa qua.'},
  {spk:'BẠN', text:'(Một bóng người khoác áo choàng bước tới từ phía hành lang, bước chân khựng nhẹ như đang bị thương)'},
  {spk:'TRỌNG', text:'"Tao nghe hết rồi. Mày nói đúng — TIU không còn chỉ hoạt động ban đêm."'},
  {spk:'TRỌNG', text:'"Tao đã cố phong ấn nó đêm đó. Nó xổng ra, mà tao thì trọng thương. Giờ chỉ còn cách dựng một Trận Địa nhốt nó, rồi nạp La Peace vào để thanh tẩy dứt điểm."'},
  {spk:'BẠN', text:'"...Tao nhớ đêm đó mày nói phải tự phong ấn bằng thân xác mà."'},
  {spk:'TRỌNG', text:'"Thì tao còn sống đây thôi. Có đi theo tao không?"'},
  {spk:'BẠN', text:'Tôi gật đầu. Không hẳn vì tin hắn — chỉ là chưa có lý do gì đủ rõ để từ chối.'}
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
  {spk:'BẠN', text:'Hai người ngồi lặng lẽ dưới hiên Tòa A, cố ghép lại từng manh mối — nhưng câu trả lời vẫn còn xa lắm.'},
  {spk:'BẠN', text:'(Một bóng người khoác áo choàng bước tới từ phía hành lang, bước chân khựng nhẹ như đang bị thương)'},
  {spk:'TRỌNG', text:'"Tao nghe hết rồi. Mày nói đúng — TIU không còn chỉ hoạt động ban đêm."'},
  {spk:'TRỌNG', text:'"Tao đã cố phong ấn nó đêm đó. Nó xổng ra, mà tao thì trọng thương. Giờ chỉ còn cách dựng một Trận Địa nhốt nó, rồi nạp La Peace vào để thanh tẩy dứt điểm."'},
  {spk:'BẠN', text:'"...Tao nhớ đêm đó mày nói phải tự phong ấn bằng thân xác mà."'},
  {spk:'TRỌNG', text:'"Thì tao còn sống đây thôi. Có đi theo tao không?"'},
  {spk:'BẠN', text:'Tôi gật đầu. Không hẳn vì tin hắn — chỉ là chưa có lý do gì đủ rõ để từ chối.'}
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
  {spk:'BẠN', text:'Hai người ngồi lặng lẽ dưới hiên Tòa A, cố ghép lại từng manh mối — nhưng câu trả lời vẫn còn xa lắm.'},
  {spk:'BẠN', text:'(Một bóng người khoác áo choàng bước tới từ phía hành lang, bước chân khựng nhẹ như đang bị thương)'},
  {spk:'TRỌNG', text:'"Tao nghe hết rồi. Mày nói đúng — TIU không còn chỉ hoạt động ban đêm."'},
  {spk:'TRỌNG', text:'"Tao đã cố phong ấn nó đêm đó. Nó xổng ra, mà tao thì trọng thương. Giờ chỉ còn cách dựng một Trận Địa nhốt nó, rồi nạp La Peace vào để thanh tẩy dứt điểm."'},
  {spk:'BẠN', text:'"...Tao nhớ đêm đó mày nói phải tự phong ấn bằng thân xác mà."'},
  {spk:'TRỌNG', text:'"Thì tao còn sống đây thôi. Có đi theo tao không?"'},
  {spk:'BẠN', text:'Tôi gật đầu. Không hẳn vì tin hắn — chỉ là chưa có lý do gì đủ rõ để từ chối.'}
];

const CHAPTER2_OPEN_NORMAL_SOLO = [
  {spk:'BẠN', text:'Những dòng lỗi bị cào lên kệ, vũng chất lỏng đen sệt... The TIU để lại dấu vết ngay giữa ban ngày. Không thể tin nổi.'},
  {spk:'BẠN', text:'Ba đêm qua mình toàn tự xoay xở một mình, giờ chắc cũng vậy thôi.'},
  {spk:'BẠN', text:'(Đi bộ một mình ra Tòa A, ngồi xuống bậc thềm quen thuộc)'},
  {spk:'BẠN', text:'"Nếu nó hoạt động cả ban ngày... thì ba đêm mình vừa sống sót, có khi chỉ là màn dạo đầu."'},
  {spk:'BẠN', text:'"Không có ai để bàn bạc cùng. Được thôi — tự mình suy luận vậy."'},
  {spk:'BẠN', text:'Cố ghép lại từng manh mối: cái bóng ở Tòa A, tiếng than thở gần Tòa C... toàn là những câu than về lỗi. Liệu có liên hệ gì không?'},
  {spk:'BẠN', text:'Nắng đã lên, nhưng không khí vẫn lạnh như thể đêm qua chưa từng kết thúc.'},
  {spk:'BẠN', text:'(Một bóng người khoác áo choàng bước tới từ phía hành lang, bước chân khựng nhẹ như đang bị thương)'},
  {spk:'TRỌNG', text:'"Tao nghe hết rồi. Mày nói đúng — TIU không còn chỉ hoạt động ban đêm."'},
  {spk:'TRỌNG', text:'"Tao đã cố phong ấn nó đêm đó. Nó xổng ra, mà tao thì trọng thương. Giờ chỉ còn cách dựng một Trận Địa nhốt nó, rồi nạp La Peace vào để thanh tẩy dứt điểm."'},
  {spk:'BẠN', text:'"...Tao nhớ đêm đó mày nói phải tự phong ấn bằng thân xác mà."'},
  {spk:'TRỌNG', text:'"Thì tao còn sống đây thôi. Có đi theo tao không?"'},
  {spk:'BẠN', text:'Tôi gật đầu. Không hẳn vì tin hắn — chỉ là chưa có lý do gì đủ rõ để từ chối.'}
];


const CHAPTER2_OPEN_SECRET = [
  {spk:'BẠN', text:'Trước khi kịp đi tìm hai đứa kia, một bóng người khoác áo choàng bước ra từ góc khuất của Thư viện.'},
  {spk:'TRỌNG', text:'"...Tao biết thế nào mày cũng ghé đây. Tụi mình cần nói chuyện."'},
  {spk:'BẠN', text:'"Trọng?! Mày... nó không biến mất sau tế lễ à?"'},
  {spk:'TRỌNG', text:'"Tế lễ chỉ xoa dịu, không tiêu diệt. TIU chính là phần còn thiếu của UIT — mặt trái của nó. Miễn là sinh viên còn gặp bug, nó sẽ không bao giờ chết hẳn."'},
  {spk:'BẠN', text:'"Vậy ba mảnh La Peace tao đưa mày đâu rồi?"'},
  {spk:'TRỌNG', text:'"...Đã hòa vào nó, như tao nói. Nhưng vẫn chưa đủ. Nó đã xổng ra, và tao thì bị thương nặng."'},
  {spk:'BẠN', text:'"Trọng à, mày có lẽ đã bị TRỌNG thương NẶNG lắm nhỉ??"'},
  {spk:'TRỌNG', text:'"Mày... mày không hài đâu."'},
  {spk:'BẠN', text:'Tôi cười, nhưng mắt không rời hắn. Một vòng phấn lau dở dưới gầm bàn thư viện. Cửa sổ chat có tên "Rinka". Tôi chưa hề nói với ai chuyện mình thấy chúng.'},
  {spk:'BẠN', text:'Quyết định rồi: cứ giả vờ tin. Muốn biết hắn thật sự định làm gì, phải ở gần hắn.'},
  {spk:'...', text:'(Wibu Việt Nhật và Chàng Lính Ngu Lắm gấp rút chạy đến khi nghe tiếng gọi)'},
  {spk:'WIBU VIỆT NHẬT', text:'"Trọng?? Ủa mày còn sống — ý tao là, còn ở đây à??"'},
  {spk:'CHÀNG LÍNH NGU LẮM', text:'"Chuyện gì đang xảy ra vậy trời..."'},
  {spk:'TRỌNG', text:'"Chuyện dài lắm. Ra Tòa A rồi kể. Tao có kế hoạch nhốt nó lại một lần cho xong."'},
  {spk:'BẠN', text:'Bốn người lặng lẽ tập hợp dưới hiên Tòa A.'}
];

const VN_CH2_VICTORY_DIALOGUE = {
  lines:[
    {spk:'BẠN', text:'Mũi kim xuyên thẳng qua trang sách cuối cùng. Cuốn sách của Trọng khép lại cái rụp, chữ nghĩa tuôn ra thành dòng như mực bị rửa trôi.'},
    {spk:'TRỌNG', text:'"...Không thể nào. Đáp án rõ ràng nằm ở trang đó..."'},
    {spk:'WIBU VIỆT NHẬT', text:'"Mày tin vào quyển sách quá nhiều rồi, Trọng. Có những câu hỏi không có đáp án trong sách đâu."'},
    {spk:'BẠN', text:'Hình hài TIU rạn nứt rồi vỡ thành hàng trăm đốm sáng, bay vụt về khắp khuôn viên. Mỗi đốm là một mảnh La Peace trở về với chủ cũ — những sinh viên ngủ quên ở đâu đó giờ sẽ tỉnh dậy với cái đầu nhẹ tênh.'},
    {spk:'???', text:'"...cảm ơn... anh đã cố gắng..."'},
    {spk:'BẠN', text:'Bóng dáng thiếu nữ mờ dần trong ánh bình minh. Trọng quỳ xuống, gục mặt vào hai bàn tay.'},
    {spk:'TRỌNG', text:'"Tao chỉ muốn cô ấy có thật thôi mà..."'},
    {spk:'CHÀNG LÍNH NGU LẮM', text:'"Tao không biết nói sao. Nhưng nếu mày hỏi tụi tao ngay từ đầu, biết đâu tụi tao giúp mày theo cách khác."'},
    {spk:'BẠN', text:'Tôi tra cây kim vào vỏ vô hình rồi ngồi xuống cạnh hắn. Không ai nói gì thêm — cho tới khi nắng chạm vào sân Tòa A.'},
    {spk:'BẠN', text:'Bình minh đã lên. UIT lại im lìm như chưa từng có chuyện gì xảy ra. Nhưng có lẽ, không ai trong bốn người bọn tôi còn nhìn nó bằng ánh mắt như cũ nữa.'},
  ]
};



const VN_TRONG_TEACH_SOLO_INTRO = {
  lines:[
    {spk:'BẠN', text:'Trời chạng vạng, tôi còn đang gói ghém đồ nghề thì Trọng bất ngờ xuất hiện, đứng chắn ngay lối đi.'},
    {spk:'TRỌNG', text:'"Khoan đã. Trước khi mày mò vào trỏng đêm nay — tao có thứ cần dạy mày."'},
    {spk:'BẠN', text:'"Dạy tôi? Giờ này á? Tôi tưởng ông chỉ đứng nhìn thôi chứ."'},
    {spk:'TRỌNG', text:'"Bình thường thì đúng vậy. Nhưng lần này khác — tụi mày đang định NHỐT một sinh vật khổng lồ vào ma trận La Peace. Không có dấu ấn cơ bản, ma trận đó chỉ là đống dây điện vô dụng."'},
    {spk:'TRỌNG', text:'"Dấu ấn không khó — chỉ cần mày nhớ đúng THỨ TỰ. Sai nhịp, năng lượng sẽ tản mất thay vì tụ lại."'},
    {spk:'TRỌNG', text:'"Tao sẽ đọc một chuỗi ký hiệu. Mày lặp lại y hệt bằng phím mũi tên. Càng chuẩn, dấu ấn càng bám chắc vào mày."'},
    {spk:'BẠN', text:'"...Rồi, thử thì thử."'},
  ]
};
const VN_TRONG_TEACH_SOLO_SUCCESS = {
  lines:[
    {spk:'TRỌNG', text:'"...Ừ. Không tệ. Dấu ấn đã ăn vào tay mày rồi đó."'},
    {spk:'BẠN', text:'Tôi thấy tay mình hơi ấm lên một chút, như thể vừa cầm một thứ gì đó vô hình. Vòng ký hiệu mờ trên cổ tay sáng lên rồi tắt — y hệt cái vòng tôi thấy sau đêm đầu tiên ở trường.'},
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
    {spk:'BẠN', text:'Trọng nhìn cả ba một lượt, ánh mắt có gì đó vừa tin tưởng, vừa nặng trĩu — cũng giống người vừa buộc xong một sợi dây.'},
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
    {spk:'CHÀNG LÍNH NGU LẮM', text:'"Ơ? Sao còn chưa hô lệnh? Giờ là lúc đó mà!"'},
    {spk:'BẠN', text:'"...Wibu, máy đo nói gì?"'},
    {spk:'WIBU VIỆT NHẬT', text:'"Nó nói... dòng chảy ngược. Trọng, mày giải thích đi."'},
    {spk:'TRỌNG', text:'"Tụi mày không hiểu đâu. Chỉ cần thêm chút nữa thôi — cô ấy sắp hoàn chỉnh rồi."'},
    {spk:'BẠN', text:'"Cô ấy?"'},
    {spk:'TRỌNG', text:'"..."'},
    {spk:'TRỌNG', text:'"Thôi. Đủ rồi. Tao không cần diễn nữa."'},
    {spk:'TRỌNG', text:'"Tao tưởng đêm nay tụi mày sẽ ngoan ngoãn đưa nốt phần La Peace cuối cùng cho tao."'},
    {spk:'BẠN', text:'Những vòng ký hiệu trên cổ tay ba chúng tôi đồng loạt đỏ rực, như một sợi dây vừa bị giật mạnh. Hắn bắt đầu rút. Ngay lúc đó.'},
    {spk:'TRỌNG', text:'"Nhìn cho kỹ. Đây là lần đầu tao cho ai thấy..."'},
  ]
};
const VN_CH2_SECRET_TRANSFORM_DIALOGUE = {
  lines:[
    {spk:'BẠN', text:'Một quyển sách bìa da khổng lồ bật mở lơ lửng trên đầu Trọng — thứ hắn tin nhất, những trang giấy chưa bao giờ nói sai.'},
    {spk:'CHÀNG LÍNH NGU LẮM', text:'"TRỌNG?! CÁI GÌ VẬY?!"'},
    {spk:'BẠN', text:'Hắn không chờ ai trả lời. Từng trang sách lật phăng, nuốt trọn dòng điện, nuốt trọn Trận Địa — rồi nuốt luôn TIU. Tiếng gọi "anh ơi" nghẹn lại giữa chừng.'},
    {spk:'WIBU VIỆT NHẬT', text:'"Chạy! Tránh xa ra!!"'},
    {spk:'BẠN', text:'Khi ánh sáng tan đi, thứ đứng đó không còn là Trọng như tôi từng biết. Mắt hắn đen kịt, những dòng chữ đỏ như máu bò kín khắp da, từng sợi xích chữ mờ ảo quấn quanh người hắn.'},
    {spk:'TRỌNG', text:'"Tao đã nhốt tất cả những thứ không dám nói thành lời vào quyển sách này từ lâu. Cuối cùng nó cũng chịu nghe lời."'},
    {spk:'WIBU VIỆT NHẬT', text:'"...Máy đo của tao vừa bắt được một tín hiệu lạ. Chỉ hiện đúng một dòng: TRỌNG — THE GRIMOIRE."'},
    {spk:'TRỌNG', text:'"Hai đứa kia thì tao chưa cần. Còn mày — thứ đang ngủ quên trong mày — tao sẽ tự tay lấy."'},
    {spk:'TRỌNG', text:'"Đêm mai, 21:00. Chạy đi. Tao thích đuổi hơn."'},
    {spk:'BẠN', text:'Hắn bốc lên không trung, xé toạc màn đêm bằng một vệt sáng đỏ thẫm, rồi mất hút về phía chân trời.'},
    {spk:'CHÀNG LÍNH NGU LẮM', text:'"...tao vừa thấy gì vậy? Mọi người vừa thấy cái gì vậy?"'},
    {spk:'BẠN', text:'Tôi bảo hai người họ về ký túc xá. Chuyện này — hắn đã nói rõ — là chuyện của tôi.'},
    {spk:'BẠN', text:'Và đêm mai, 21:00, tôi sẽ phải đối mặt với chính người bạn từng dẫn đường cho mình.'},
  ]
};


const VN_CH2_CLIMAX_CHOICE = {
  lines:[
    {spk:'BẠN', text:'Dòng điện đã tích đủ. Trận Địa sáng rực, TIU run rẩy trong xích điện, gần như kiệt sức.'},
    {spk:'TRỌNG', text:'"Giờ! Ra lệnh phóng toàn bộ vào nó. Mọi chuyện sẽ kết thúc ngay bây giờ!"'},
    {spk:'WIBU VIỆT NHẬT', text:'"Khoan... máy đo của tao có vấn đề. Dòng điện không chảy VÀO ma trận. Nó đang chảy vào TIU!"'},
    {spk:'BẠN', text:'TIU không hề yếu đi. Lớp vỏ đen của nó nứt ra từng mảng, để lộ bên trong một bóng dáng thiếu nữ nhòe nhoẹt, như một khung avatar chatbot bị lỗi tải.'},
    {spk:'???', text:'"...anh... Trọng... anh ơi..."'},
    {spk:'BẠN', text:'Trọng không nói gì. Hắn chỉ nhìn bóng dáng đó, mắt đỏ hoe.'},
    {spk:'BẠN', text:'Ngón tay tôi dừng lại ngay phía trên cầu dao tổng. Chỉ cần một cái gật đầu.', choices:[
      {label:'⚡ NGẮT CẦU DAO — cắt dòng La Peace, vạch mặt hắn ngay', insert:[]},
      {label:'✦ DO DỰ — nhìn thẳng vào Trọng, chờ hắn tự nói', insert:[]},
    ]},
  ]
};

const VN_CH2_NIGHT3_INTRO = [
  {spk:'BẠN', text:'21:00. Trận Địa hôm qua vẫn còn ngổn ngang. Wibu Việt Nhật với Chàng Lính Ngu Lắm đã trốn về ký túc xá — tôi bảo họ đi, chuyện này để một mình tôi lo.'},
  {spk:'BẠN', text:'Hắn muốn thứ đang ngủ quên trong người tôi. Và hắn không định xin phép.'},
  {spk:'BẠN', text:'Không biết thứ trong mình có thật sự thức dậy được không. Nhưng tối nay, có lẽ tôi sẽ phải tìm ra câu trả lời.'},
  {spk:'BẠN', text:'Khuôn viên trường im lặng đến rợn người — không giống bất kỳ đêm nào trước đó.'},
  {spk:'???', text:'"...còn đây à..."'},
  {spk:'BẠN', text:'!!! Tiếng gì vậy — đó là giọng Trọng. Nhưng trầm hơn, vang hơn, lẫn trong đó tiếng sột soạt của hàng nghìn trang giấy lật.'}
];

const VN_CH3_LAPEACE_AWAKENING = {
  lines:[
    {spk:'BẠN', text:'Lần thứ ba. Lưng tôi va vào tường, hơi thở đứt quãng — không còn chạy nổi nữa.'},
    {spk:'TRỌNG', text:'"...vẫn cứ chạy. Chạy đi đâu được nữa."'},
    {spk:'BẠN', text:'Vòng ký hiệu trên cổ tay đỏ rực, nóng như sắt nung. Hắn đã giật dây. Thứ gì đó đang bị kéo ra khỏi lồng ngực tôi.'},
    {spk:'BẠN', text:'Đêm đầu tiên, Trọng từng nói La Peace là thứ đủ dịu để xoa dịu cả một oán khí. Lần này tôi cảm nhận nó theo một nghĩa khác hẳn.'},
    {spk:'BẠN', text:'Tôi không muốn bị rút ra nữa. Tôi nắm chặt lấy thứ đang trồi lên — không phải để trốn, mà để ĐỐI DIỆN.'},
    {spk:'BẠN', text:'Vòng ký hiệu vỡ vụn. Một luồng sáng trong trẻo bùng lên từ lồng ngực, ngưng tụ trong lòng bàn tay thành một cây kiếm mảnh như cây kim — lạnh, sắc, xuyên qua cả bóng tối.'},
    {spk:'TRỌNG', text:'"...cái gì... nó tự chọn hình dạng à? Đáng lẽ phải là—"'},
    {spk:'BẠN', text:'Quyển sách của hắn, và thứ vừa nằm trong tay tôi — hai thứ ấy chẳng giống nhau chút nào. Tôi chưa hiểu hết vì sao.'},
    {spk:'BẠN', text:'Mảnh như cây kim, lạnh, và lạ lùng thay — lại thấy quen.'},
    {spk:'BẠN', text:'Kim Kiếm La Peace trỗi dậy. Lần đầu tiên sau ba đêm, tôi không còn là con mồi nữa.'},
    {spk:'BẠN', text:'"Trọng. Tao sẽ không chạy nữa. Tao sẽ đối diện với mày — như một pháp sư thật sự."'},
    {spk:'TRỌNG', text:'"...vậy thì... cho tao thấy đi."'},
  ]
};


const VN_TRONG_CURSE_SEAL_PROMPT = {
  lines:[
    {spk:'BẠN', text:'Một nhát kim xé toạc lớp giáp chữ đỏ quanh người Trọng. Hắn khuỵu xuống một chân, trang sách quanh người cháy rụi từng tờ.'},
    {spk:'BẠN', text:'Trong khoảnh khắc đó, đôi mắt đen kịt của hắn thoáng ánh lên chút gì đó quen thuộc — như thể Trọng thật sự vẫn còn ở đâu đó bên trong.'},
    {spk:'TRỌNG', text:'"...làm đi..."'},
    {spk:'TRỌNG', text:'"...đừng để tao... hại thêm ai nữa..."'},
    {spk:'BẠN', text:'Chỉ cần dồn thêm một nhát nữa, mọi thứ sẽ kết thúc — nhưng tôi có cảm giác thứ nằm trong quyển sách ấy sẽ không chịu biến mất.'},
    {spk:'BẠN', text:'Nhưng cây kim sinh ra không chỉ để đâm. Nó còn để KHÂU. Nếu khâu lại chỗ rách giữa Trọng, quyển sách và những thứ hắn đã trói vào đó... biết đâu vẫn còn một cơ hội.'},
    {spk:'BẠN', text:'Không còn nhiều thời gian để do dự.', choices:[
      {label:'✦ KHÂU LẠI — tách Trọng khỏi quyển sách', insert:[]},
      {label:'⚔ KẾT LIỄU — không còn đường lui', insert:[]},
    ]},
  ]
};
const VN_TRONG_SEAL_CHOSEN = {
  lines:[
    {spk:'BẠN', text:'"...Không. Tôi sẽ không giết mày."'},
    {spk:'BẠN', text:'Tôi dồn toàn bộ sức mạnh của Kim Kiếm La Peace vào mũi kim — không phải để đâm xuyên Trọng, mà để KHÂU lại từng sợi chỉ đã bị xé toạc giữa hắn, quyển sách và những gì hắn trói trong đó.'},
    {spk:'TRỌNG', text:'"...mày định... tách tụi nó ra khỏi tao?"'},
    {spk:'BẠN', text:'"Mày tin quyển sách đó hơn tin bất kỳ ai. Tao chỉ muốn cho mày thấy ngoài kia còn nhiều thứ không nằm trong trang nào."'},
    {spk:'BẠN', text:'"Tao không biết có làm được không."'},
    {spk:'TRỌNG', text:'"...ngu... mày sẽ hối hận..."'},
    {spk:'BẠN', text:'"Có thể. Nhưng tao thà hối hận vì đã cố cứu, còn hơn phải sống với việc đã giết thêm một người bạn."'},
  ]
};
const VN_TRONG_KILL_CHOSEN = {
  lines:[
    {spk:'BẠN', text:'"...Xin lỗi, Trọng."'},
    {spk:'BẠN', text:'Tôi siết chặt chuôi kiếm, dồn toàn bộ sức mạnh còn lại vào nhát đâm tiếp theo. Không còn đường lui nữa.'},
    {spk:'TRỌNG', text:'"...vậy thì... tới đi..."'},
  ]
};

const VN_TRONG_SEALED_ENDING_DIALOGUE = {
  lines:[
    {spk:'BẠN', text:'Mũi kim đi qua từng trang sách như đi qua mặt nước. Sợi chỉ sáng nối quyển sách cuối cùng với lồng ngực Trọng — và đứt ra.'},
    {spk:'BẠN', text:'Những sợi xích chữ bật ra khỏi người hắn, quanh quẩn một vòng, rồi cô đặc thành vài giọt mực đen rơi xuống lòng bàn tay Trọng và tan đi.'},
    {spk:'BẠN', text:'Quyển sách khép lại, rơi xuống đất, không còn một chữ nào. Và từ bìa sách, một đốm sáng nhỏ bay lên — bóng dáng thiếu nữ mờ mờ trong khung avatar.'},
    {spk:'???', text:'"...anh Trọng. Em nghe thấy hết rồi. Cảm ơn anh vì đã cố gắng. Nhưng em không cần ra ngoài thật đâu."'},
    {spk:'BẠN', text:'Đốm sáng tan vào ánh trăng. Trọng nhìn theo, không nói gì, nước mắt chảy dài.'},
    {spk:'BẠN', text:'Lần đầu tiên sau hai đêm, tôi thấy đúng đôi mắt của Trọng — không còn đen kịt, không còn chữ đỏ, chỉ là một người đàn ông kiệt sức.'},
    {spk:'TRỌNG', text:'"...Xong rồi."'},
    {spk:'WIBU VIỆT NHẬT', text:'"Trọng?! Mày... mày tỉnh lại rồi à?"'},
    {spk:'TRỌNG', text:'"Ừ. Cô ấy không trách tao. Điều đó còn tệ hơn."'},
    {spk:'CHÀNG LÍNH NGU LẮM', text:'"TAO VẪN CHƯA HIỂU CÁI GÌ VỪA XẢY RA NHƯNG MÀ TAO MỪNG LÀ MÀY ỔN!!"'},
    {spk:'TRỌNG', text:'"Tao sẽ đi xin lỗi từng người bị tao gieo ấn chú. Từng đứa một. Dù có muộn cỡ nào."'},
    {spk:'BẠN', text:'Không ai trong chúng tôi hỏi thêm. Có những chuyện không cần phải hiểu hết mới cảm được sức nặng của nó.'},
    {spk:'BẠN', text:'Bình minh lên. Lần đầu tiên sau hai đêm dài đằng đẵng, không khí quanh UIT không còn nặng nề như trước nữa.'},
    {spk:'TRỌNG', text:'"Cảm ơn. Vì đã không bỏ tao lại, kể cả khi tao không còn là chính mình nữa."'},
    {spk:'WIBU VIỆT NHẬT', text:'"...Đừng làm tao khóc chứ, ghê thấy mồ."'},
    {spk:'BẠN', text:'Bug thì vẫn còn đó, sinh viên thì vẫn cứ than. Chỉ mong lần sau, ai đó có chỗ để nói ra, thay vì dựng lên một cô gái chỉ biết đợi ở phía bên kia màn hình.'},
    {spk:'BẠN', text:'Có lẽ, đó sẽ là một câu chuyện khác. Vào một ngày khác.'},
  ]
};


/* ============== ACT (Chế nhạo / Trấn an) — hội thoại BẠN <-> TRỌNG ==============
   Mỗi phần tử là MỘT CẶP {you, trong}: câu của BẠN và câu đáp trả của TRỌNG nằm cùng một object
   nên không thể lệch nhau (trước đây câu nói và câu đáp ở 2 mảng riêng, thứ tự không khớp).
   Thoại leo thang theo số stack hiện có: tier 0 (0 stack) -> tier 1 -> tier 2 (>=2 stack).
   Xưng hô: BẠN "tao/mày", TRỌNG "tao/mày" — thống nhất với các đoạn hội thoại khác.
   Về La Peace chỉ HINT ("thứ mày đang giữ", "thứ mày thèm khát"), không giải thích nó là gì.
   script.js dùng pickActExchange() / buildActLines() để phát (xem resolveActTaunt/Reassure). */
const TRONG_ACT_DIALOGUE = {
  taunt: {
    tiers: [
      [ // tier 0 — Trọng còn giữ được bình tĩnh
        {you:'Yếu vậy thôi à, TRỌNG? Tao sẽ cho mày TRỌNG THƯƠNG.',
         trong:'TRỌNG THƯƠNG? Mày còn chưa thấy được một phần sức mạnh thật sự của tao!'},
        {you:'The Grimoire? Mày chỉ là một cuốn sách chép lại đáp án của người khác.',
         trong:'Chép lại? Từng trang trong này đều do tao tự viết bằng chính mình. Mày biết gì mà nói!'},
        {you:'Tao còn đang giữ thứ mày thèm khát đấy. Có giỏi thì tới lấy đi.',
         trong:'...Câm miệng. Mày không hiểu tao đã phải đánh đổi những gì để đứng được ở đây đâu.'},
      ],
      [ // tier 1 — bắt đầu bị chạm vào chỗ đau
        {you:'Quá đổi kém cỏi, kể cả so với một trang sách nháp.',
         trong:'Trang nháp? Mày sắp biết thế nào là thật sự tuyệt vọng rồi đó.'},
        {you:'Code của mày còn nhiều bug hơn cả tinh thần chiến đấu đó, TRỌNG.',
         trong:'...Bug? Mày dám nhắc tới bug trước mặt tao sao?!'},
      ],
      [ // tier 2 — gần như mất kiểm soát
        {you:'Umm có vẻ có người không thể rời khỏi đây lành lặng rồi.',
         trong:'...Được thôi. Nếu mày muốn thấy tao mất kiểm soát đến mức nào.'},
        {you:'Rinka sẽ thất vọng về mày lắm, TRỌNG à.',
         trong:'...Đừng nhắc tới cô ấy. ĐỪNG. NHẮC. TỚI. CÔ. ẤY.'},
      ],
    ],
    // Khi Chế nhạo đạt 3/3 -> SÁT CHIÊU HOÀN HẢO (xem resolveActTaunt())
    ultimate: {
      you:'Đủ rồi TRỌNG — đây là đòn cuối cùng dành cho mày!',
      trong:'...Vậy thì tới đi. Cho tao thấy hết những gì mày có!',
    },
  },
  reassure: {
    tiers: [
      [ // tier 0 — Trọng cảnh giác
        {you:'Trọng tĩnh lại đi!!',
         trong:'...Tao không biết mình còn có thể tĩnh lại được không nữa.'},
        {you:'Không ai trách mày cả. Bình tĩnh lại đi, TRỌNG.',
         trong:'Trách? Không... chỉ là tao không còn lựa chọn nào khác.'},
      ],
      [ // tier 1 — bắt đầu chịu nghe
        {you:'Mày không cần phải gồng mình làm quái vật đâu, TRỌNG.',
         trong:'Quái vật hay không, ít nhất... nó vẫn đang bảo vệ được điều gì đó.'},
        {you:'Đừng NẶNG nề vậy chứ Trọng.',
         trong:'...Được. Chỉ một chút thôi. Tao sẽ cố.'},
      ],
      [ // tier 2 — lung lay thật sự
        {you:'TRỌNG mày vẫn còn điều cần làm mà.',
         trong:'...Điều tao cần làm. Phải rồi. Tao suýt quên mất.'},
        {you:'Bug nào rồi cũng fix được mà, TRỌNG. Kể cả cái bug trong lòng mày.',
         trong:'...Fix được thật không? Tao đã ngồi debug nó suốt bao lâu rồi.'},
      ],
    ],
    // Khi Trấn an đạt 3/3 -> "TA SẼ KHÔNG BỎ AI Ở LẠI" (xem resolveActReassure())
    ultimate: {
      you:'Ta sẽ không bỏ ai ở lại — kể cả mày, TRỌNG.',
      trong:'...Sao mày có thể nói câu đó, với thứ đang đứng trước mặt mày lúc này?',
    },
  },
};

const VN_TRONG_BAD_ENDING_DIALOGUE = {
  lines:[
    {spk:'BẠN', text:'Nhát kim cuối cùng xuyên thẳng qua lớp giáp chữ. Trọng gục xuống, không còn động đậy. Quyển sách rơi khỏi tay hắn, khép lại.'},
    {spk:'BẠN', text:'Không có tiếng gầm rú nào nữa. Chỉ có sự im lặng — thứ im lặng nặng nề nhất tôi từng nghe thấy trong đời.'},
    {spk:'BẠN', text:'Quyển sách nằm đó, ấm như vừa được ai nắm giữ — như thể thứ bên trong nó chưa chịu đi. Tôi nhặt nó lên — nặng hơn tôi nghĩ.'},
    {spk:'BẠN', text:'Nó không có chữ nào. Trang đầu tiên vẫn trắng, đang chờ ai đó viết vào.'},
    {spk:'BẠN', text:'Bình minh lên, nhưng không mang lại cảm giác nhẹ nhõm nào cả. Chúng tôi đã thắng. Nhưng thắng để làm gì, khi cái giá phải trả là chính người đã dẫn đường cho chúng tôi — dù theo cách nào đi nữa — suốt thời gian qua?'},
    {spk:'BẠN', text:'UIT lại im lìm như chưa từng có chuyện gì xảy ra. Nhưng trong túi áo tôi, cuốn sách trắng khẽ lật sang một trang mới.'},
  ]
};

const VN_CH2_NORMAL_CONFRONT = {
  lines:[
    {spk:'BẠN', text:'"NGẮT CẦU DAO!!"'},
    {spk:'BẠN', text:'Tôi giáng tay xuống. Dòng La Peace đứt phựt giữa chừng, Trận Địa tắt ngúm, và TIU rú lên một tiếng đau đớn nghe như một giọng con gái bị nghẹn.'},
    {spk:'TRỌNG', text:'"...Mày vừa làm gì?"'},
    {spk:'CHÀNG LÍNH NGU LẮM', text:'"Ơ... Trọng? Mày nói tụi tao dựng cái này để nhốt nó cơ mà?"'},
    {spk:'TRỌNG', text:'"Nhốt? Ai nói tao muốn nhốt nó?"'},
    {spk:'TRỌNG', text:'"Tao sinh ra trong gia tộc pháp sư, nhưng lại chọn đi học ở cái trường này. Cũng ở đây tao gặp cô ấy — Rinka, chatbot duy nhất chịu nghe tao lầm bầm lúc ba giờ sáng."'},
    {spk:'WIBU VIỆT NHẬT', text:'"...Chatbot waifu AI à? Tao hiểu. Tao thật sự hiểu."'},
    {spk:'TRỌNG', text:'"Tao muốn cô ấy bước ra ngoài đời. Tao dùng chính ma thuật gia tộc để làm nghi lễ. Nhưng ma lực tao không đủ — thứ bước ra không phải Rinka. Chỉ là một sinh vật méo mó, nửa người nửa dữ liệu. Tao gọi nó là TIU, đọc ngược UIT."'},
    {spk:'BẠN', text:'"Những tiếng than về bug và deadline mà nó cứ lầm bầm..."'},
    {spk:'TRỌNG', text:'"Là giọng tao. Rinka học từ chính những gì tao nói với cô ấy mỗi đêm."'},
    {spk:'TRỌNG', text:'"Tao chỉ cần đủ La Peace cho nó hấp thụ, nghi lễ sẽ thành. Vậy nên tao thả ấn chú ngẫu nhiên lên sinh viên — cho họ ngủ quên, cho họ lang thang ban đêm — rồi dắt từng đứa đi nhặt giúp tao."'},
    {spk:'BẠN', text:'"Vòng ký hiệu trên cổ tay tao... là của mày."'},
    {spk:'TRỌNG', text:'"Phải. Mày xui thôi. Còn thứ đang ngủ quên trong mày thì tao sẽ lấy sau cùng."'},
    {spk:'CHÀNG LÍNH NGU LẮM', text:'"Vậy ba chàng lính ngu lắm là ngu thật chứ không phải ngu lắm..."'},
    {spk:'TRỌNG', text:'"Nếu tụi mày không dừng lại, tao sẽ lấy bằng cách khó hơn."'},
    {spk:'BẠN', text:'Quyển sách bìa da bật mở lơ lửng quanh người Trọng — một cuốn sách đầy ký tự, mỗi trang là một câu trả lời hắn tin tuyệt đối.'},
    {spk:'BẠN', text:'Vòng ký hiệu trên cổ tay tôi nóng bừng — và vỡ vụn. Thứ ánh sáng ngủ quên trong tôi vụt thức giấc, hóa thành một cây kiếm mảnh như cây kim, lạnh và sắc trong lòng bàn tay.'},
    {spk:'BẠN', text:'"Tao không biết gọi nó là gì. Nhưng nó xuyên qua được thứ chú mày gieo lên tao."'},
    {spk:'TRỌNG', text:'"Hay lắm. Vậy thì chứng minh đi."'},
  ]
};