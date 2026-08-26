/* ==============================================================
   DỮ LIỆU HỘI THOẠI — ĐỪNG NGỦ QUÊN Ở UIT
   File này chỉ chứa nội dung lời thoại (Visual Novel), tách riêng
   khỏi logic game trong script.js cho dễ chỉnh sửa / bổ sung.
   Phải được nạp (<script>) TRƯỚC script.js trong index.html.
   ============================================================== */
"use strict";

/* ---- Hội thoại rẽ nhánh ----
   Một dòng thoại bình thường vẫn chỉ cần {spk, text}. Để thêm rẽ nhánh:
   - Thêm `next: <index>` vào 1 dòng để buộc dòng kế tiếp nhảy tới index chỉ
     định trong cùng mảng `lines` thay vì i+1 (dùng để bỏ qua 1 đoạn nhánh
     không được chọn, hoặc để nhiều nhánh hội tụ về lại cùng 1 điểm).
   - Thêm `choices: [{label, next, reward, effect}]` vào 1 dòng để biến nó
     thành điểm rẽ nhánh: người chơi sẽ thấy các nút lựa chọn theo `label`
     thay vì nút "TIẾP TỤC". `reward` (không bắt buộc) áp dụng ngay qua
     applyVNReward(). `next` (không bắt buộc, mặc định i+1) là index của
     dòng tiếp theo sau khi chọn. Xem ví dụ NPC_DIALOGUES.E[1] và .B[1] bên
     dưới — được engine playVN() trong script.js xử lý tự động. ---- */

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
        {spk:'WIBU VIỆT NHẬT', text:'"Oi!!"'},                                                              //0
        {spk:'WIBU VIỆT NHẬT', text:'"Theo phân tích của tao thì chúng ta đang ở đây vào buổi đêm."'},        //1
        {spk:'Bạn', text:'"Yeh tao khá chắc là tao có thấy trời tối."'},                                      //2
        {spk:'Bạn', text:'"(Mấy thằng Việt Nhật dị vl)"'},                                                    //3
        {spk:'Bạn', text:'"(Mà mình cũng là Việt Nhật mà nhỉ!!)"'},                                           //4
        {spk:'WIBU VIỆT NHẬT', text:'"Tao đoán chúng ta đã bị isekai!!."',                                    //5 — điểm rẽ nhánh
          choices:[
            {label:'"À không không, không có chúng ta nào ở đây hết."', next:6},
            {label:'"Ơ mà... biết đâu thật vậy thì sao?"', next:9,
              reward:{type:'points', amount:5, msg:'Wibu Việt Nhật khoái chí vì bạn hưởng ứng thuyết isekai (+5 điểm).'}}
          ]
        },
        {spk:'Bạn', text:'"À không không"'},                                                                 //6
        {spk:'Bạn', text:'"Không có chúng ta nào ở đây hết."'},                                               //7
        {spk:'WIBU VIỆT NHẬT', text:'"Ồ tiếc vậy, một lolicon trong thế giới pháp quyên này như tao..."', next:12}, //8 — hội tụ, bỏ qua nhánh isekai
        {spk:'Bạn', text:'"Ơ mà... biết đâu là thật thì sao ta?"'},                                           //9 — nhánh isekai
        {spk:'WIBU VIỆT NHẬT', text:'"Hả?? Mày cũng nghĩ vậy à?? Yeah số phận đã an bài rồi!!"'},              //10
        {spk:'Bạn', text:'"(Thôi thì đùa cho vui thôi... nhưng nhìn mặt nó nghiêm túc dễ sợ)"'},              //11 — hội tụ (mặc định next=12)
        {spk:'Bạn', text:'"(Ai đó xin hãy gọi cảnh sát)"'},                                                   //12
        {spk:'WIBU VIỆT NHẬT', text:'"Dù sao thì,"'},                                                        //13
        {spk:'WIBU VIỆT NHẬT', text:'"Cầm lấy chai nước này đi, nó sẽ có ích cho mày đó"'},                   //14
        {spk:'Bạn', text:'"À ờ cảm ơn nha!"'},                                                                //15
        {spk:'Bạn', text:'"(Lolicon có lẽ cũng không tệ đến vậy!)"'}                                          //16
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
        {spk:'CHÀNG LÍNH NGU LẮM', text:'*ngáp* "Ơ... mấy giờ rồi ta? Tại tao xếp TKB ngu quá nên học tới giờ này luôn..."', //0 — điểm rẽ nhánh
          choices:[
            {label:'"À ờ cảm ơn nha!"', next:1},
            {label:'"Mày hoàn toàn có thể lựa chọn cúp mà :))."', next:11,
              reward:{type:'points', amount:5, msg:'Chàng Lính Ngu Lắm bật cười vì câu đùa của bạn (+5 điểm).'}}
          ]
        },
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
        {spk:'CHÀNG LÍNH NGU LẮM', text:'"Ê được đó, nhưng đừng méc phòng đào tạo tao đấy nha!"'}, 
        {spk:'Bạn', text:'"(Ông này chắc cũng đang tự an ủi bản thân thôi...)"', next:2}      
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
    {spk:'TRỌNG', text:'"...Đứng lại. Tao thấy mày đã suy kiệt lắm rồi."'},
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