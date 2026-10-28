/* =========================================================================
   dialogue.js — HỘI THOẠI (bản Battle Royale ĐRL, kiểu Genshin). Nạp trước script.js.

   Một dòng thoại:  { spk, text, choices?, when?, unless?, fx? }
     - spk = ""        → lời dẫn truyện (không hiện tên).
     - Token trong text/spk:  {P}/{Bạn} = tên người chơi · {TIU} = "THE TIU"
                              {ALLY} = đồng đội đang phản bội · {FOE} = đối thủ hiện tại.
     - choices: [{ label, fx?, insert?: [dòng...], when? }]  → hiện bong bóng lựa chọn bên phải.
         insert = các dòng được chèn ngay sau dòng lựa chọn (phản hồi của NPC).
     - fx (ở dòng hoặc ở lựa chọn):
         { trust: ±n }        cộng/trừ Tin tưởng với NPC đang nói chuyện (ctx.npcId)
         { flag: 'a' | [..] } bật cờ cốt truyện
         { set: {k: v} }      gán giá trị cờ
     - when / unless: điều kiện cờ, dạng 'k' | 'k=v' | '!k' (hoặc mảng — phải thoả tất cả).
   Cờ chính:  mind = cold | warm | unsure (thái độ của người chơi)
              promised_<ID> / honest_<ID> (lời hứa với đồng đội — dùng ở cảnh phản bội & trận cuối)
   NPC id: WIBU | LINH | TRONG | TOBY.
   ========================================================================= */
(function(){

const LT="LOA TRƯỜNG", W="WIBU VIỆT NHẬT", L="CHÀNG LÍNH NGU LAM", T="TRỌNG", B="TOBY", D="CHÓ CỦA TOBY", ME="{P}", TIU="{TIU}";
const say  = (spk,text,extra)=>Object.assign({spk,text},extra||{});
const nar  = (text,extra)=>say("",text,extra);
const ask  = (spk,text,choices,extra)=>Object.assign({spk,text,choices},extra||{});
const opt  = (label,fx,insert,extra)=>Object.assign({label,fx:fx||null,insert:insert||[]},extra||{});

window.DLG = {

  /* Portrait hội thoại: tên người nói → ảnh PNG (nền trong suốt, nên cao ~800×1200).
     Dòng thoại có thể thêm mood:'sad' để dùng assets/images/icons/wibu_sad.png (thiếu file thì tự dùng ảnh gốc).
     Người chơi / LOA TRƯỜNG / THE TIU không có portrait. Thiếu file ảnh → hội thoại vẫn chạy bình thường. */
  PORTRAITS: {
    "WIBU VIỆT NHẬT":     "assets/images/icons/wibu.png",
    "CHÀNG LÍNH NGU LAM": "assets/images/icons/linh.png",
    "TRỌNG":              "assets/images/icons/trong.png",
    "TOBY":               "assets/images/icons/toby.png",
    "CHÓ CỦA TOBY":       "assets/images/icons/dog.png"
  },

  /* ======================= CHƯƠNG 1 — MỞ ĐẦU ======================= */
  INTRO_CH1: [
    nar("(23:00. Cổng trường UIT đã khóa. Loa phát thanh ngoài sân vang lên, khàn khàn như đã chờ giây phút này từ rất lâu.)"),
    say(LT,"Alo, alo. Thông báo đến toàn thể sinh viên năm cuối: hồ sơ xét tốt nghiệp sẽ bị treo đối với những ai chưa đủ Điểm Rèn Luyện."),
    say(ME,"Thiếu mười mấy điểm. Mình nhớ rõ từng buổi tình nguyện đã lỡ... và những người đang đứng quanh mình cũng vậy."),
    say(LT,"Để giải quyết tận gốc, Ban Giám hiệu quyết định biến việc tích điểm thành một cuộc thi. Học phí tăng thì ngân sách cũng tăng, nên đêm nay sẽ thật hoành tráng. Tên chương trình: The TIU."),
    say(LT,"Năm thí sinh được chọn là năm sinh viên học lâu nhất khóa. Tám năm. Trường gọi các bạn là 'Năm Đại Trụ' — trụ lại lâu đến mức bảo vệ cũng thuộc mặt."),
    say(LT,"Thí sinh thứ nhất: Việt Nhật, mọi người gọi là Wibu. Tám năm, chưa một lần bấm share bài của đoàn khoa."),
    nar("(Ở góc hội trường, một cậu trai ôm chặt balo vào ngực, cúi gằm mặt như muốn biến mất.)"),
    say(LT,"Thí sinh thứ hai: Chang Linh Ngu Lam. Dành cả thanh xuân cho Liên Minh, đến lúc cày điểm rèn luyện thì hết kiên nhẫn."),
    nar("(Hàng ghế sau, một người đang ngủ gục, điện thoại vẫn sáng màn hình tìm trận.)"),
    say(LT,"Thí sinh thứ ba: Trọng. GPA cao nhất nhóm, và cũng là người ăn trưa một mình suốt tám năm."),
    nar("(Một chàng trai sơ mi phẳng phiu ngồi thẳng lưng, cằm hơi hếch lên — nhưng ngón tay cứ gõ lên đầu gối không ngừng.)"),
    say(LT,"Thí sinh thứ tư: Toby, sinh viên ngoại quốc. Số tiết đã cúp không đếm xuể, và ngần ấy năm chưa có ai để tag chung một bài share."),
    nar("(Dưới chân cậu ta là một chú chó lông xù, lén trốn bảo vệ vào tận đây.)"),
    say(D,"Gâu."),
    say(LT,"Và thí sinh thứ năm... chính là bạn. Tên bạn nằm ngay đầu danh sách những người còn thiếu điểm."),
    ask(ME,"(Cả hội trường quay lại nhìn mình. Tay mình đang run... hay đang siết chặt?)",[
      opt("Mình chỉ cần tốt nghiệp. Ai cản đường, mình đánh.",{set:{mind:'cold'}},[
        say(ME,"Tình nghĩa không đóng được học phí. Điểm rèn luyện thì có."),
        nar("(Mình nói thầm, đủ để chỉ mình nghe thấy. Nhưng có lẽ ai đó đã nghe.)")]),
      opt("Họ cũng như mình. Nếu có thể, cả nhóm cùng qua...",{set:{mind:'warm'}},[
        say(ME,"Tám năm cùng một sân trường, vậy mà đây là lần đầu mình thật sự nhìn rõ mặt từng người."),
        nar("(Có lẽ, ở đây, mình không phải là người duy nhất thấy cô đơn.)")]),
      opt("(Im lặng. Nuốt nước bọt.)",{set:{mind:'unsure'}},[
        say(ME,"Mình chưa biết mình sẽ làm gì cả. Chưa biết nữa."),
        nar("(Và có lẽ đó là lý do mình vẫn còn đứng đây.)")])
    ]),
    say(TIU,"Luật rất ngắn gọn. Mỗi người bước vào với 30 ĐRL."),
    say(TIU,"Thắng một trận, bạn lấy một phần tư ĐRL của đối thủ. Thua, bạn mất một nửa ĐRL của chính mình."),
    say(TIU,"Hết mỗi đêm, người có ĐRL thấp nhất bị gạch tên khỏi danh sách tốt nghiệp. Và nhớ tránh mặt The TIU — chúng tôi cũng đang đi tuần."),
    say(TIU,"Còn lại thì tùy các bạn. Hợp tác, đối đầu, hay cả hai."),
    say(W,"...Tôi muốn về nhà. Tôi muốn về nhà thật rồi."),
    say(L,"Đánh nhau hả? Ngươi chờ ta xong ván này đã... à, ta đang AFK."),
    say(T,"Hừ. Vớ vẩn. Tôi sẽ thắng, rồi gọi về báo ba mẹ — như mọi lần."),
    say(B,"Mình... mình có thể mang theo con chó không?"),
    say(D,"Gâu!"),
    say(TIU,"Cuối cùng, chỉ một cái tên được ghi vào danh sách tốt nghiệp loại Giỏi. Chúc các bạn may mắn."),
    say(TIU,"Ca đêm bắt đầu. Ngay bây giờ.")
  ],

  INTRO_CH1_NIGHT: {
    2: [
      say(TIU,"Rạng sáng. Bảng ĐRL vừa cập nhật: còn bốn cái tên. Hãy giữ điểm của bạn cao hơn ít nhất một người."),
      nar("(Bảng ĐRL treo ở sảnh vừa bị gạch đi một cái tên. Tối qua họ còn thở cùng một bầu không khí với mình.)"),
      ask(ME,"Một chiếc ghế trống. Một cái tên bị xóa. Mình nên nghĩ gì về chuyện này?",[
        opt("Tập trung. Mềm lòng là mất suất.",{set:{mind:'cold'}},[
          say(ME,"Mình hít một hơi thật sâu, siết chặt quai balo. Không được nhìn lại.")]),
        opt("Mình muốn nhớ tên họ. Họ cũng là con người.",{set:{mind:'warm'}},[
          say(ME,"Dù trường có gọi đó là 'bị loại', mình vẫn muốn nhớ họ là một người thật.")]),
        opt("Mình sợ. Nhưng phải tiếp tục thôi.",{set:{mind:'unsure'}},[
          say(ME,"Sợ cũng được. Miễn là chân mình còn bước.")])
      ])
    ],
    3: [
      say(TIU,"Đêm thứ ba. Ba cái tên, hai suất đi tiếp. Người thấp điểm nhất... các bạn biết quy trình rồi đấy."),
      say(ME,"Lạnh lùng như một phép tính: ba trừ một bằng hai. Nhưng con số ấy có tên, có mặt, có giọng nói.",{when:'mind=cold'}),
      say(ME,"Ba người, hai suất. Hóa ra tình bạn cũng có thể bị đo bằng con số.",{when:'mind=warm'}),
      say(ME,"Chỉ còn một đêm nữa thôi. Mình vẫn chưa biết mình sẽ trở thành người như thế nào.",{when:'mind=unsure'}),
      say(ME,"Nếu mình đã hứa với ai đó trong đội... thì đêm nay là lúc lời hứa nặng nhất.",{when:['promised_WIBU']}),
      say(ME,"Nếu mình đã hứa với ai đó trong đội... thì đêm nay là lúc lời hứa nặng nhất.",{when:['promised_LINH'],unless:['promised_WIBU']}),
      say(ME,"Nếu mình đã hứa với ai đó trong đội... thì đêm nay là lúc lời hứa nặng nhất.",{when:['promised_TRONG'],unless:['promised_WIBU','promised_LINH']}),
      say(ME,"Nếu mình đã hứa với ai đó trong đội... thì đêm nay là lúc lời hứa nặng nhất.",{when:['promised_TOBY'],unless:['promised_WIBU','promised_LINH','promised_TRONG']})
    ]
  },

  /* ======================= CHƯƠNG 2 ======================= */
  INTRO_CH2: [
    say(LT,"Hai người còn lại. Đêm nay chưa ai bị loại — chúng tôi cho các bạn thời gian chuẩn bị. Đêm mai sẽ là trận chung kết."),
    say(TIU,"The TIU đã quay về phòng bảo vệ. Sân trường thuộc về các bạn. Hãy lục tìm bất cứ thứ gì còn sót lại trong khuôn viên."),
    say(TIU,"Nếu chạm mặt đối thủ trước giờ chung kết, cứ ra tay và lấy đồ của họ. Không ai cấm cả."),
    ask(ME,"Sân trường vắng lặng. Chỉ còn tiếng gió lùa qua các dãy nhà. Mình sẽ chuẩn bị theo cách nào?",[
      opt("Lục soát thật kỹ. Càng nhiều đồ càng tốt.",null,[
        say(ME,"Từng hành lang, từng phòng học. Mình sẽ không bỏ sót thứ gì dùng được.")]),
      opt("Tìm đối thủ. Ra tay trước là lợi thế.",{set:{mind:'cold'}},[
        say(ME,"Trong trò chơi này, người chờ đợi thường là người thua trước.")]),
      opt("Ngồi lại một chút. Mình muốn nhớ lại mình đã đi đến đây bằng cách nào.",null,[
        nar("(Tám năm. Hơn hai nghìn ngày. Đủ để thuộc lòng cả sân trường này... mà vẫn thấy mình lạc lõng.)"),
        say(ME,"Thôi. Đứng dậy. Còn một đêm nữa.")])
    ])
  ],

  /* Cảnh đồng đội phản bội (mỗi đồng đội một cảnh riêng; {ALLY} = tên người đó) */
  BETRAY: [
    say(TIU,"Chỉ có một suất tốt nghiệp loại Giỏi. Dù chúng ta từng sát cánh... thì đến đây là hết.")
  ],

  BETRAY_BY: {
    WIBU: [
      say(TIU,"Danh sách chỉ còn một chỗ cho 'tốt nghiệp loại Giỏi'. Không có chỗ cho đồng đội. Tình nghĩa, xin dừng tại đây."),
      nar("(Wibu đứng ở cuối hành lang, balo ôm chặt trước ngực. Cậu ta không dám nhìn thẳng mình.)"),
      say(W,"Cậu hứa là sẽ không bỏ tôi mà.",{when:'promised_WIBU'}),
      say(W,"Cậu đã nói thật với tôi. Là người duy nhất làm vậy. Nên... tôi cũng sẽ nói thật.",{when:'honest_WIBU'}),
      say(W,"Tôi biết ngày này sẽ đến. Chỉ là tôi hy vọng... tôi sai.",{unless:['promised_WIBU','honest_WIBU']}),
      ask(W,"Tôi không muốn đánh cậu. Nhưng tôi cũng muốn tốt nghiệp, muốn có một thứ gì đó của riêng mình, một lần thôi.",[
        opt("Xin lỗi. Mình cũng cần suất này.",null,[
          say(W,"Ừ... đừng xin lỗi. Cậu là người đầu tiên khiến tôi thấy mình có ích."),
          say(W,"Giờ thì, đấu đi. Tôi sẽ không chạy nữa.")]),
        opt("Mình không muốn đánh cậu. Có cách nào khác không?",null,[
          say(W,"Không đâu. Cậu biết mà. Cái trường này chỉ có một lối ra."),
          say(W,"Nhưng cảm ơn vì đã hỏi.")]),
        opt("(Im lặng, rút vũ khí.)",null,[
          nar("(Cậu ta nhắm mắt, hít một hơi thật sâu, rồi mở mắt ra. Lần đầu tiên, cậu ta nhìn thẳng vào mình.)")])
      ])
    ],
    LINH: [
      say(TIU,"Danh sách chỉ còn một chỗ cho 'tốt nghiệp loại Giỏi'. Không có chỗ cho đồng đội. Tình nghĩa, xin dừng tại đây."),
      nar("(Linh đứng đó, không còn ngáp, không còn uể oải. Lần đầu tiên, ánh mắt cậu ta tỉnh táo hoàn toàn.)"),
      say(L,"Ngươi hứa là không bỏ lại ta. Ta nhớ đấy.",{when:'promised_LINH'}),
      say(L,"Ngươi không hứa suông. Ta quý điều đó, dù nó chẳng làm đoạn này dễ hơn.",{when:'honest_LINH'}),
      ask(L,"Ta cũng sợ, ngươi biết không. Sợ rằng sau trận này ta lại quay về cái ghế đá cũ, không có gì cả. Nhưng nếu thắng... ta sẽ có một thứ để kể.",[
        opt("Vậy thì đừng nương tay. Mình cũng sẽ không nương tay.",null,[
          say(L,"Tốt. Đây mới là đối thủ mà Quỷ Vương muốn đánh."),
          say(L,"Ván này, ta không AFK đâu.")]),
        opt("Dù ai thắng, cậu cũng không phải kẻ thất bại.",null,[
          say(L,"...Ngươi nói chuyện như người sắp tiễn ta đi vậy."),
          say(L,"Thôi. Bắt đầu thôi.")]),
        opt("Mình xin lỗi.",null,[
          say(L,"Đừng. Xin lỗi xong ta không thấy đỡ hơn đâu.")])
      ])
    ],
    TRONG: [
      say(TIU,"Danh sách chỉ còn một chỗ cho 'tốt nghiệp loại Giỏi'. Không có chỗ cho đồng đội. Tình nghĩa, xin dừng tại đây."),
      nar("(Trọng đứng thẳng, nhưng đôi vai hơi run. Chiếc áo sơ mi phẳng phiu giờ đã lấm bụi.)"),
      say(T,"Cậu hứa với tôi. Tôi nhớ rõ từng chữ.",{when:'promised_TRONG'}),
      say(T,"Cậu không hứa. Nhưng cậu đã nghe tôi nói hết. Đó là điều tôi chưa từng có.",{when:'honest_TRONG'}),
      ask(T,"Tôi phải thắng. Ba mẹ tôi đang chờ ở nhà. Nếu tôi thua... tôi không biết mình còn là ai nữa.",[
        opt("Cậu không cần phải là ai cả. Chỉ cần là cậu.",null,[
          say(T,"...Dễ nói thật đấy."),
          say(T,"Nhưng nếu cậu thắng, nhớ gọi tôi là bạn một lần. Tôi muốn nghe thử.")]),
        opt("Vậy thì thắng mình đi. Thắng thật phong cách như cậu muốn.",null,[
          say(T,"Hà. Cậu hiểu tôi hơn tôi tưởng."),
          say(T,"Đến đây. Tôi sẽ thắng thật phong cách.")]),
        opt("Mình xin lỗi. Mình cũng không còn đường nào khác.",null,[
          say(T,"Đừng xin lỗi. Làm đi. Đừng làm tôi mất mặt.")])
      ])
    ],
    TOBY: [
      say(TIU,"Danh sách chỉ còn một chỗ cho 'tốt nghiệp loại Giỏi'. Không có chỗ cho đồng đội. Tình nghĩa, xin dừng tại đây."),
      nar("(Toby ôm chú chó vào lòng, như đang tạm biệt nó trước. Chú chó rên khe khẽ.)"),
      say(B,"Cậu đã hứa. Mình tin cậu. Mình chưa từng tin ai nhanh như vậy.",{when:'promised_TOBY'}),
      say(B,"Cậu nói thật với mình. Cảm ơn nhé, điều đó rất quý.",{when:'honest_TOBY'}),
      ask(B,"Mình không hiểu sao tụi mình phải đấu với nhau. Ở quê mình, bạn bè không làm vậy.",[
        opt("Mình cũng không hiểu. Nhưng mình không còn lựa chọn.",null,[
          say(B,"Mình biết. Nhưng mình vẫn muốn nói: cậu là người bạn đầu tiên của mình ở đây."),
          say(D,"Gâu...")]),
        opt("Nếu có ngày tốt nghiệp, mình sẽ đến thăm cậu ở quê.",null,[
          say(B,"Thật không? Vậy thì... đấu thôi, rồi mình sẽ đợi cậu.")]),
        opt("(Quay đi, không trả lời.)",null,[
          say(D,"Gâu.")])
      ])
    ]
  },

  INTRO_CH2_FINAL: [
    say(LT,"Đêm quyết định. Hai người, một suất. Mời vào sân đấu.")
  ],

  /* Đối thủ cuối cùng — mỗi người một cảnh. {FOE} = tên đối thủ */
  FINAL_BY: {
    WIBU: [
      say(LT,"Đêm chung kết. Hai cái tên, một suất duy nhất. Xin mời hai bạn vào sân."),
      say(W,"Cuối cùng cũng là cậu. Ở thế giới kia, tôi luôn thắng trận cuối. Hôm nay thử xem ở thế giới này có được không."),
      ask(W,"Tôi không chạy nữa đâu. Cậu thì sao?",[
        opt("Mình cũng vậy. Đến đi, Wibu.",null,[say(W,"Việt Nhật. Gọi tên tôi một lần thôi, trước khi bắt đầu.")]),
        opt("Cảm ơn cậu vì đã không chạy.",null,[say(W,"...Vậy là cậu hiểu rồi.")])
      ])
    ],
    LINH: [
      say(LT,"Đêm chung kết. Hai cái tên, một suất duy nhất. Xin mời hai bạn vào sân."),
      say(L,"Đây là trận chung kết. Ta chưa bao giờ vào được chung kết thật sự, kể cả trong game."),
      ask(L,"Ngươi biết ta nghĩ gì không? Thắng hay thua, ta cũng muốn đánh thật hết sức.",[
        opt("Đánh thật hết sức nhé, Linh.",null,[say(L,"Ê... ngươi gọi tên thật của ta. Được. Ván này tính!")]),
        opt("Mình sẽ thắng.",null,[say(L,"Cứ thử xem. Quỷ Vương không dễ bị hạ đâu.")])
      ])
    ],
    TRONG: [
      say(LT,"Đêm chung kết. Hai cái tên, một suất duy nhất. Xin mời hai bạn vào sân."),
      say(T,"Tôi biết sớm muộn cũng là cậu. Cả trường này chỉ có cậu dám nhìn thẳng vào mặt tôi."),
      ask(T,"Đừng nương tay. Nếu thua mà còn bị thương hại thì tôi chịu không nổi.",[
        opt("Mình sẽ không nương tay. Cậu xứng đáng được đối xử như một đối thủ thật sự.",null,[say(T,"Hà. Tốt. Đây mới là điều tôi muốn nghe.")]),
        opt("Cậu giỏi lắm, Trọng. Trận này mình sẽ cố hết sức.",null,[say(T,"...Đừng làm tôi cảm động. Tôi sắp phải đánh cậu đấy.")])
      ])
    ],
    TOBY: [
      say(LT,"Đêm chung kết. Hai cái tên, một suất duy nhất. Xin mời hai bạn vào sân."),
      say(B,"Là cậu à. Mình đoán đúng rồi. Con chó nhà mình cũng đoán đúng."),
      say(D,"Gâu."),
      ask(B,"Dù ai thắng, mình vẫn muốn nhớ trận này. Đây là lần đầu tiên mình thấy mình thuộc về một nơi nào đó.",[
        opt("Mình cũng vậy. Bắt đầu thôi.",null,[say(B,"Ready... gâu!")]),
        opt("Cảm ơn vì đã là bạn của mình, Toby.",null,[say(B,"Cảm ơn cậu nữa. Giờ thì... đấu thôi!")])
      ])
    ]
  },

  WIN_FINAL: [
    say(LT,"Kết quả cuối cùng: {P} giữ lại nhiều ĐRL nhất. Chúc mừng bạn đã đủ điều kiện tốt nghiệp loại Giỏi!"),
    nar("(Tiếng vỗ tay vang lên đều đều từ khán đài trống. Ngoài kia, trời đã sáng hẳn.)"),
    say(ME,"Mình đã thắng. Và mình đã hiểu rằng, thắng cũng có giá của nó.",{when:'mind=cold'}),
    say(ME,"Mình thắng, nhưng chẳng có ai để chia sẻ niềm vui. Có lẽ đây là lý do họ gọi chúng mình là 'Đại Trụ' — vì trụ lại một mình.",{when:'mind=cold'}),
    say(ME,"Mình đã thắng. Nhưng thứ mình nhớ không phải là điểm số, mà là những cuộc trò chuyện dang dở.",{when:'mind=warm'}),
    say(ME,"Mình tưởng tượng một ngày nào đó cả nhóm cùng ngồi ở căn tin UIT, không còn ĐRL, không còn The TIU.",{when:'mind=warm'}),
    say(ME,"Mình đã thắng, theo cách nào đó. Chỉ là chưa biết mình sẽ trở thành ai sau ngày hôm nay.",{when:'mind=unsure'}),
    nar("(Có thể UIT sẽ ghi lại cái tên này thật long trọng. Nhưng cũng có thể, chỉ vài người nhớ rằng có những sinh viên từng đứng ở đó, cùng nhau.)"),
    say(TIU,"Chương trình The TIU kết thúc. Mời bạn qua phòng Công tác sinh viên nhận giấy xác nhận.")
  ],


  /* ======================= NÓI CHUYỆN (mỗi lần nói chuyện = một cảnh, tăng dần theo cốt truyện) ======================= */
  TALK: {

    WIBU: [
      /* Lần 1 — gặp gỡ */
      [
        say(W,"Ư... ai đó? Tôi không có gì đáng giá đâu — chỉ có mấy mô hình thôi, đừng lấy!"),
        nar("(Cậu ta ôm chặt balo vào ngực, mắt nhìn xuống sàn như thể đang chờ ai đó cười mình.)"),
        ask(W,"Cậu... cậu cũng là thí sinh à? Tôi không muốn gây sự đâu.",[
          opt("Mình không có ý xấu. Chỉ muốn chào một tiếng thôi.",{trust:1,set:{w_first:'kind'}},[
            say(W,"...Chào? Có người chào tôi à? Từ hồi... ờ, tôi cũng không nhớ nữa."),
            say(W,"Tôi là Việt Nhật. Ai cũng gọi tôi là Wibu. Chỉ là họ gọi bằng giọng khác.")]),
          opt("Trong balo cậu là figure nhân vật nào thế?",{trust:1,set:{w_first:'curious'}},[
            say(W,"Cậu... cậu hỏi thật à? Không phải để chê?"),
            say(W,"Là bản giới hạn của nữ kiếm sĩ tôi thích nhất! Tôi dành ba tháng tiền ăn sáng để mua. À... xin lỗi, tôi nói nhiều quá."),
            nar("(Lần đầu tiên cậu ta ngẩng lên nhìn mình. Mắt sáng hơn hẳn.)")]),
          opt("Cậu có biết ai trong đây yếu nhất không?",{trust:-1,set:{w_first:'cold'}},[
            say(W,"...À. Hiểu rồi. Cậu cũng như họ thôi."),
            say(W,"Tôi tưởng ít ra ở đây sẽ khác. Thôi, đừng để ý tôi."),
            nar("(Cậu ta lùi vào góc tường, nhỏ lại như muốn tan vào bức tường.)")])
        ])
      ],
      /* Lần 2 — quá khứ bị bắt nạt */
      [
        say(W,"Lại là cậu à. Hôm nay tôi... không bị ai nhìn mấy, nên cũng đỡ."),
        say(W,"Hồi cấp ba, có đứa nhét cặp tôi vào thùng rác. Chỉ vì tôi vẽ nhân vật anime vào vở."),
        say(W,"Từ đó tôi nghĩ: không nói chuyện, không ai chọc. Lên đại học, tôi không share bài đoàn khoa nào, sợ ai nhìn vào trang cá nhân rồi lôi ra làm trò cười."),
        ask(W,"Tám năm rồi mà tôi vẫn chưa quen nói chuyện với người thật. Kỳ quặc nhỉ?",[
          opt("Không kỳ quặc. Họ sai, không phải cậu.",{trust:1,flag:'w_validated'},[
            say(W,"...Cậu nói như thể điều đó đơn giản lắm vậy. Nhưng nghe vẫn thấy nhẹ nhõm.")]),
          opt("Mình cũng từng bị bỏ rơi. Mình hiểu cảm giác đó.",{trust:1,flag:'w_shared'},[
            say(W,"Thật không? Nhìn cậu bình thường mà... Hóa ra ai cũng mang theo cái gì đó."),
            say(W,"Cảm ơn vì đã kể. Tôi sẽ nhớ.")]),
          opt("Chuyện cũ rồi. Giờ quan trọng là qua đêm nay.",{set:{w_deflect:true}},[
            say(W,"Ừ... cậu nói đúng. Chuyện cũ rồi."),
            nar("(Nhưng tay cậu ta vẫn siết quai balo đến trắng bệch.)")])
        ])
      ],
      /* Lần 3 — thế giới khác */
      [
        nar("(Hôm nay Wibu ngồi đó, mắt nhìn vào khoảng không phía sau đầu mình.)"),
        say(W,"Cậu thấy không? Ánh sáng ở cuối hành lang kia... mở ra rồi."),
        say(W,"Ở bên đó, tôi là Kiếm Sĩ Nguyệt Ảnh. Có cả một bang hội. Ai cũng gọi tên tôi, và họ chờ tôi đi cùng."),
        ask(W,"Cậu... cũng thấy cánh cửa đó chứ? Nói là có đi!",[
          opt("Ừ, mình thấy. Cánh cửa đẹp thật.",{trust:1,set:{w_dream:'play'}},[
            say(W,"Thấy không! Tôi biết mà! Tôi không điên!"),
            nar("(Cậu ta cười, nhưng nụ cười ấy vụt tắt nhanh như sợ bị bắt gặp.)"),
            say(W,"...Mà thật ra tôi biết đó là ảo ảnh. Chỉ là mỗi lần nó mất đi, tôi lại thấy trống rỗng hơn lần trước.")]),
          opt("Mình không thấy gì cả. Nhưng mình đang ở đây với cậu.",{trust:1,set:{w_dream:'ground'}},[
            say(W,"Ở đây... với tôi?"),
            say(W,"Cậu là người đầu tiên nói câu đó mà tôi tin được. Ở bên kia, ai nói gì cũng dễ. Còn ở đây thì... khó hơn."),
            nar("(Ánh mắt cậu ta dần trở lại, tỉnh táo hơn.)")]),
          opt("Cậu nên nghỉ ngơi đi. Cậu trông mệt lắm.",null,[
            say(W,"Ừ... có lẽ vậy."),
            nar("(Cậu ta gật đầu, nhưng mắt vẫn dõi về phía cuối hành lang thêm một lúc lâu.)")])
        ])
      ],
      /* Lần 4 — lời hứa */
      [
        say(W,"Tôi có chuyện muốn nói. Tôi đã nghĩ cả đêm."),
        say(W,"Hôm qua tôi lên trang đoàn khoa. Lần đầu tiên, tôi bấm share một bài. Chỉ một bài thôi, nhưng tay tôi run cả buổi."),
        say(W,"Chẳng ai cười cả. Có đứa còn thả tim. Tôi không biết đối phó thế nào với chuyện đó, nên tôi... khóc trong nhà vệ sinh. Cậu thấy tôi hèn không?"),
        ask(W,"Nhưng cuối cùng chỉ có một suất. Cậu... có phản bội tôi không?",[
          opt("Mình hứa. Mình sẽ không bỏ cậu.",{trust:1,set:{promised_WIBU:true}},[
            say(W,"..."),
            say(W,"Tôi tin cậu. Lần này tôi chọn tin."),
            nar("(Cậu ta cười, lần này nụ cười không tắt.)")]),
          opt("Mình không muốn nói dối cậu. Có thể có ngày mình phải làm vậy.",{set:{honest_WIBU:true}},[
            say(W,"...Cảm ơn vì không nói dối. Thật đấy. Người ta toàn nói dối tôi cho 'dễ nghe'."),
            say(W,"Vậy thì... mình hãy thật tốt với nhau cho đến ngày đó nhé.")]),
          opt("Chuyện đó để sau. Giờ cứ qua đêm đã.",null,[
            say(W,"Ừ... ừ. Tôi hiểu."),
            nar("(Cậu ta mỉm cười, nhưng đôi mắt nhìn đi chỗ khác.)")])
        ])
      ]
    ],

    LINH: [
      /* Lần 1 — gặp gỡ */
      [
        nar("(Cậu ta nằm dài trên ghế đá, mũ che mặt, điện thoại sáng rực trong tay: đang xếp hàng tìm trận.)"),
        say(L,"Còn tám phút nữa là vào trận... cho ta chợp mắt đã. Ta là Quỷ Vương Bất Tử, đừng đánh thức."),
        ask(L,"Ngươi là ai? Nếu không phải tướng địch thì đừng làm phiền, ta đang chờ hàng đợi.",[
          opt("Mình là thí sinh, giống cậu. Cậu chơi game đến mấy giờ rồi?",{trust:1},[
            say(L,"Mấy giờ à? Hừm... bốn giờ sáng. Hôm qua. Và hôm kia nữa. Ngày ta không nhớ nổi."),
            say(L,"Nhưng chỉ cần thắng ván này là lên hạng rồi. Thật đấy, lần này thật.")]),
          opt("Đứng dậy đi, cậu sắp bị loại rồi đấy.",null,[
            say(L,"Ôi, đừng nhắc. Cứ mỗi lần ai bảo ta 'sắp thế này thế kia' là ta thấy mệt."),
            say(L,"Ta biết hết. Chỉ là... không muốn nghĩ đến.")]),
          opt("Cho mình ngồi cạnh nhé. Mình cũng mệt.",{trust:1},[
            say(L,"Ngồi đi. Quỷ Vương hào phóng, chia cho ngươi nửa cái ghế."),
            say(L,"Ê, ngươi cũng thức cả đêm à? Vậy là chúng ta cùng hội cùng thuyền.")])
        ])
      ],
      /* Lần 2 — nỗi sợ tương lai */
      [
        say(L,"Ngươi biết điều đáng sợ nhất không? Không phải The TIU."),
        say(L,"Là cái ngày sau khi tốt nghiệp. Ai cũng đăng bài 'đã nhận offer'. Còn ta mở email, trống không. Mà ta cũng chẳng gửi gì đi cả."),
        say(L,"Chơi game thì ít nhất có thứ để tiến bộ. Có rank, có điểm, có người nói 'good game'. Ngoài đời thì..."),
        ask(L,"Ta có nên bỏ game để đi tìm việc không? Hay cứ thế này cũng được?",[
          opt("Không phải bỏ hẳn. Nhưng nên dành một ít thời gian cho tương lai.",{trust:1,set:{l_advice:'plan'}},[
            say(L,"Một ít thời gian... nghe không đáng sợ như 'bỏ hết'."),
            say(L,"Hmm. Ngày mai ta thử mở lại cái CV xem. Chỉ mở thôi, chưa sửa đâu.")]),
          opt("Cậu giỏi game vậy, biết đâu làm được gì đó từ nó.",{trust:1,set:{l_advice:'skill'}},[
            say(L,"Ê... ngươi là người đầu tiên bảo đó là 'kỹ năng' chứ không phải 'thói hư tật xấu'."),
            say(L,"Teamwork, phản xạ, đọc tình huống... ừ, nghe cũng ra dáng nghề nghiệp phết.")]),
          opt("Thì cứ tận hưởng đi, lo làm gì.",{set:{l_advice:'dodge'}},[
            say(L,"Ha, đúng. Lo làm gì."),
            nar("(Cậu ta cười, nhưng ngón tay vô thức vuốt màn hình tắt phụt rồi bật lại, như tránh nhìn vào thứ gì đó.)")])
        ])
      ],
      /* Lần 3 — email bỏ lỡ */
      [
        say(L,"Ê! Nhìn này. Ta mở email rồi nè. Mở thật."),
        nar("(Trên màn hình là một thư tuyển dụng thực tập sinh. Ngày nhận: ba tháng trước. Hạn nộp: đã qua.)"),
        ask(L,"Hết hạn rồi. Ta bỏ lỡ mất. Ta là kẻ vô dụng, đúng không?",[
          opt("Cơ hội đó hết hạn, nhưng cậu đã dám mở thư. Đó là bước đầu.",{trust:1,flag:'l_cheer'},[
            say(L,"...Ngươi nói nghe cứ như ta vừa đánh thắng boss ấy."),
            say(L,"Ừ. Chắc vậy. Lần sau ta sẽ mở sớm hơn.")]),
          opt("Chưa chắc. Cậu thử gửi mail hỏi xem họ còn tuyển không?",{trust:1,flag:'l_cheer'},[
            say(L,"Hả? Gửi... gửi thật à? Ta... ta thử soạn nháp trước."),
            nar("(Cậu ta bắt đầu gõ, xóa, gõ lại. Chỉ ba dòng mà mất cả năm phút.)")]),
          opt("Thôi, đừng buồn nữa. Bật game đi.",{flag:'l_dodge'},[
            say(L,"Ừ... bật game."),
            nar("(Cậu ta mở lại trận đấu. Nụ cười trên mặt cứng đờ.)")])
        ])
      ],
      /* Lần 4 — Quỷ Vương cởi mặt nạ */
      [
        say(L,"Ta... à thôi, tôi. Tên thật tôi là Linh. Gọi Linh được rồi."),
        say(L,"Tôi chơi game không phải vì nó vui. Vì ở trong đó, tôi là người có ích. Có người cần tôi, có đồng đội chờ tôi."),
        say(L,"Ở ngoài này, tôi là người thừa. Một sinh viên bình thường, không nổi bật, ai cũng quên."),
        ask(L,"Nếu cuối cùng chỉ còn hai người đứng... cậu sẽ đánh tôi chứ?",[
          opt("Mình hứa sẽ không bỏ cậu một mình.",{trust:1,set:{promised_LINH:true}},[
            say(L,"Nghe giống lời thề trong game quá."),
            say(L,"Nhưng ừ. Tôi tin. Lời thề ở ngoài đời... hiếm lắm.")]),
          opt("Mình sẽ không nói trước. Nhưng mình sẽ tôn trọng cậu đến phút cuối.",{set:{honest_LINH:true}},[
            say(L,"...Được. Thế còn thật hơn lời hứa."),
            say(L,"Đồng đội, nhỉ. Tôi thích từ đó.")]),
          opt("Chưa nghĩ tới. Cậu lo xa quá.",null,[
            say(L,"Ừ. Tôi lo xa thật."),
            nar("(Cậu ta ngáp một cái dài, nhưng mắt không buồn ngủ chút nào.)")])
        ])
      ]
    ],

    TRONG: [
      /* Lần 1 — gặp gỡ */
      [
        say(T,"Trọng. Nhớ cho kỹ — phong cách là thứ duy nhất không ai lấy được của tôi."),
        nar("(Áo sơ mi ủi phẳng không một nếp nhăn, đồng hồ sáng loáng. Nhưng tay cậu ta không biết để đâu cho yên.)"),
        ask(T,"GPA 3.7, thành viên CLB, học bổng hai kỳ liền. Cậu thì sao? Chắc không so được đâu nhỉ?",[
          opt("Ấn tượng đấy. Cậu hẳn đã rất cố gắng.",{trust:1,set:{t_first:'praise'}},[
            say(T,"Hừ. Đương nhiên... mà thôi, cũng nên thế."),
            nar("(Khóe miệng cậu ta khẽ giật, như đang cố nén một nụ cười.)"),
            say(T,"Đừng có hiểu lầm. Tôi không cần lời khen của ai cả.")]),
          opt("Cậu nói nhiều quá đấy. Cậu đang giấu gì à?",null,[
            say(T,"Giấu? Tôi thì giấu cái gì!? Cậu nghĩ mình hiểu tôi sao?"),
            nar("(Mặt cậu ta đỏ lên. Có vẻ mình vừa chạm đúng chỗ.)")]),
          opt("Cậu đứng một mình ở đây à? Không đi cùng ai sao?",null,[
            say(T,"Tôi... không cần ai đi cùng. Những người như tôi đi một mình mới đúng."),
            say(T,"Mà... thôi, hỏi gì lạ vậy.")])
        ])
      ],
      /* Lần 2 — áp lực gia đình */
      [
        nar("(Điện thoại Trọng rung. Màn hình hiện chữ 'Ba'. Cậu ta do dự rồi bấm tắt, nhưng nó lại rung tiếp.)"),
        say(T,"...Vâng ba. Con đang ở trường. Không, con vẫn đứng nhất... Vâng, con sẽ cố."),
        nar("(Cúp máy. Cậu ta đứng im, mắt nhìn vô định.)"),
        ask(T,"Cậu nghe hết rồi à. Cứ cười đi. 'Trọng ngạo mạn' hóa ra chỉ là thằng nhóc sợ ba gọi điện.",[
          opt("Mình không cười. Áp lực như vậy ai chịu nổi.",{trust:1,flag:'t_heard'},[
            say(T,"...Cậu là người đầu tiên không cười."),
            say(T,"Ba tôi chỉ hỏi hạng mấy, chưa bao giờ hỏi tôi có ăn cơm chưa.")]),
          opt("Cậu có thể nói với ba rằng cậu mệt.",{trust:1},[
            say(T,"Nói à? Cậu nghĩ ba tôi nghe sao? 'Mệt là do chưa đủ cố gắng.'"),
            say(T,"Nhưng... cảm ơn vì nói câu đó. Tôi chưa nghe ai nói vậy bao giờ.")]),
          opt("Vậy cậu cố tỏ ra kiêu căng để làm gì?",null,[
            say(T,"Để không ai nhìn thấy tôi sợ. Cậu hỏi thẳng thật đấy."),
            say(T,"Đừng nói với ai nhé.")])
        ])
      ],
      /* Lần 3 — muốn có bạn */
      [
        say(T,"Hôm qua ở căn tin, tôi thấy mấy đứa ngồi cười với nhau. Tôi định bước lại."),
        say(T,"Nhưng tôi nghĩ: họ sẽ nhìn đôi giày của tôi, cái áo của tôi, cách tôi nói. Rồi tôi quay đi."),
        say(T,"Tám năm rồi tôi vẫn quay đi."),
        ask(T,"Tôi muốn hỏi một điều, nhưng đừng cười. Làm sao để... có bạn?",[
          opt("Bắt đầu bằng việc không cần hoàn hảo trước mặt họ.",{trust:1,flag:'t_advice'},[
            say(T,"Không cần hoàn hảo? Cả đời tôi được dạy phải hoàn hảo."),
            say(T,"Nhưng... hôm nay trước mặt cậu tôi cũng đâu hoàn hảo, mà cậu vẫn đứng đây.")]),
          opt("Cậu đã có một người rồi. Là mình.",{trust:1,flag:'t_friend'},[
            say(T,"...Cậu nói cái gì vậy."),
            nar("(Cậu ta quay mặt đi nhanh, nhưng mình vẫn thấy tai cậu ta đỏ lên.)"),
            say(T,"Đừng có tự tiện. Nhưng... ừ. Cũng không tệ.")]),
          opt("Cứ bước lại. Thua thì thôi, mất gì đâu.",null,[
            say(T,"Mất mặt. Mất tất cả."),
            say(T,"...Nhưng có lẽ cậu nói đúng. Lần sau tôi sẽ thử.")])
        ])
      ],
      /* Lần 4 — thừa nhận */
      [
        say(T,"Tôi đã gọi điện về nhà. Tôi nói với mẹ: 'Con mệt'."),
        say(T,"Mẹ im lặng một lúc lâu. Rồi mẹ nói: 'Vậy nghỉ đi con.'"),
        say(T,"Tôi chưa từng nghĩ mình được phép nghe câu đó."),
        ask(T,"Tôi nợ cậu. Nhưng cuối cùng chỉ có một suất. Cậu có thể hứa với tôi điều gì không?",[
          opt("Mình hứa sẽ không bỏ cậu.",{trust:1,set:{promised_TRONG:true}},[
            say(T,"Hừ. Hứa ngọt như thế... tôi sẽ nhớ để đòi."),
            nar("(Nhưng cậu ta cười. Một nụ cười ngây ngô, hoàn toàn không có chút kiêu ngạo nào.)")]),
          opt("Mình không muốn hứa điều mình không chắc giữ được.",{set:{honest_TRONG:true}},[
            say(T,"...Ít nhất cậu không nói dối. Điều đó còn quý hơn lời hứa."),
            say(T,"Vậy thì đến ngày đó, hãy là đối thủ xứng đáng.")]),
          opt("Cậu cứ tập trung vào chính mình trước đã.",null,[
            say(T,"Ừ. Cậu nói đúng."),
            nar("(Cậu ta chỉnh lại cổ áo, nhưng lần này động tác chậm và nhẹ, như đang tự trấn an.)")])
        ])
      ]
    ],

    TOBY: [
      /* Lần 1 — gặp gỡ */
      [
        say(B,"Hi... mình là Toby, từ xa đến đây học. Xin lỗi nhé, con chó này đi đâu cũng bám theo mình."),
        say(D,"Gâu!"),
        nar("(Mấy sinh viên đi ngang tự động tránh sang bên kia hành lang. Toby vờ như không nhìn thấy.)"),
        ask(B,"Cậu... không ngại nói chuyện với mình à? Mọi người thường hay đi chỗ khác.",[
          opt("Ngại gì chứ. Con chó trông dễ thương mà.",{trust:1,flag:'b_dog'},[
            say(D,"Gâu gâu!"),
            say(B,"Hah, nó thích cậu rồi! Con chó này khó tính lắm, vậy mà chịu chạy lại ngửi tay cậu.")]),
          opt("Nếu cậu muốn, mình có thể nói chậm lại.",{trust:1,flag:'b_slow'},[
            say(B,"Oh, no no, mình nói tiếng Việt được mà! Chỉ là nhiều người nghĩ mình không hiểu nên không nói chuyện."),
            say(B,"Cảm ơn vì đã hỏi. Nghe lạ, nhưng mình vui.")]),
          opt("Cậu có thấy ai đang đi quanh đây không?",null,[
            say(B,"Mình... không biết. Mình ở đây một mình thôi."),
            say(D,"Gâu...")])
        ])
      ],
      /* Lần 2 — cúp tiết */
      [
        say(B,"Hôm nay cậu có thấy lớp học không? Mình ngồi ở dãy cuối. Hôm qua có người đổi chỗ khi mình ngồi cạnh."),
        say(B,"Mình hay cúp tiết vì... ngồi đó cả buổi mà không ai nói với mình câu nào, nó mệt hơn là không đến."),
        ask(B,"Mình có nên vẫn cố đi học không? Hay cứ ở với con chó cũng ổn?",[
          opt("Cậu nên đi. Biết đâu sẽ có người mở lời trước.",{trust:1,flag:'b_encourage'},[
            say(B,"Nếu có người mở lời trước thì tốt quá."),
            say(B,"Hmm... mình thử xem. Một tiết thôi.")]),
          opt("Mình sẽ ngồi cạnh cậu, nếu cậu muốn.",{trust:1,flag:'b_sit'},[
            say(B,"Thật không?! Dãy cuối cùng, ghế cạnh cửa sổ. Chỗ đó yên tĩnh lắm."),
            say(D,"Gâu!"),
            say(B,"Con chó nói nó cũng muốn ngồi.")]),
          opt("Ở với con chó cũng được. Ít nhất nó không phán xét.",null,[
            say(B,"Ừ... ít nhất nó không phán xét."),
            nar("(Cậu ta mỉm cười, nhưng ánh mắt vẫn lạc đi đâu đó rất xa.)")])
        ])
      ],
      /* Lần 3 — xa quê, rào cản ngôn ngữ */
      [
        say(B,"Mọi người nói rất nhanh, dùng nhiều tiếng lóng. Mình cười theo, nhưng thật ra không hiểu."),
        say(B,"Mình đã quen việc gật đầu rồi. Nghe giống một con búp bê biết gật."),
        ask(B,"Cậu có thể dạy mình một từ tiếng lóng không? Một từ thôi. Để lần sau mình cười đúng chỗ.",[
          opt("'Chill' nghĩa là thư giãn, thoải mái.",{trust:1,flag:'b_slang'},[
            say(B,"Chill! Hay quá. Chill chill chill..."),
            say(D,"Gâu!"),
            say(B,"Con chó cũng chill này. Cảm ơn nhé!")]),
          opt("'Cúp tiết' — cái cậu đang làm đó.",{trust:1,flag:'b_slang'},[
            say(B,"Hahaha! Cái này mình biết rồi! Mình là chuyên gia cúp tiết!"),
            nar("(Lần đầu tiên mình thấy cậu ta cười lớn như vậy.)")]),
          opt("'Đỉnh của chóp' — khen ai đó rất giỏi.",{trust:1,flag:'b_slang'},[
            say(B,"Đỉnh... của... chóp? Cái chóp nào vậy?"),
            say(B,"Thôi, mình hiểu rồi. Cậu là đỉnh của chóp!")])
        ])
      ],
      /* Lần 4 — chú chó & lời hứa */
      [
        say(B,"Mình kể cậu nghe chuyện này nhé. Con chó này không phải của mình."),
        say(B,"Nó là chú chó hoang ở ngõ trước ký túc xá. Ngày đầu mình đến đây, nó là sinh vật đầu tiên chịu chạy lại với mình."),
        say(B,"Mình đặt tên nó là 'Friend'. Nhưng mọi người gọi nó là 'cái con chó của thằng Tây'."),
        say(D,"Gâu."),
        ask(B,"Cậu là người bạn thứ hai của mình ở đây. Cuối cùng chỉ có một suất tốt nghiệp... cậu có bỏ mình lại không?",[
          opt("Mình hứa. Dù thế nào, mình cũng sẽ nhớ cậu.",{trust:1,set:{promised_TOBY:true}},[
            say(B,"Mình tin. Ở quê mình, một lời hứa cũng là một cái bắt tay."),
            nar("(Cậu ta đưa tay ra. Mình bắt lấy. Chú chó lập tức đặt bàn chân lên trên.)")]),
          opt("Mình không thể hứa. Nhưng mình sẽ luôn tôn trọng cậu.",{set:{honest_TOBY:true}},[
            say(B,"Okay. Mình thích người nói thật."),
            say(B,"Vậy thì... mình sẽ chiến đấu hết mình, và cậu cũng vậy nhé.")]),
          opt("Cậu lo xa quá, Toby.",null,[
            say(B,"Có lẽ mình lo thật."),
            say(D,"Gâu...")])
        ])
      ]
    ]
  },

  /* Khi đã nghe hết 4 cảnh chính, các lần nói chuyện sau lấy lần lượt theo vòng ở đây */
  TALK_REPEAT: {
    WIBU: [
      [
        say(W,"Này, tôi vừa nghĩ ra một chuyện. Cậu có muốn nghe tôi kể về bộ anime hay nhất mà tôi từng xem không?"),
        ask(W,"Chỉ cần mười phút thôi! ...Hai mươi nếu cậu hỏi thêm.",[
          opt("Kể đi, mình nghe.",{trust:1},[
            say(W,"Có một kiếm sĩ cô độc, bị cả làng ruồng bỏ. Nhưng anh ta cứ đi, cứ chiến đấu, cho đến khi có người chịu đi cùng."),
            say(W,"Mỗi lần xem đến đoạn đó tôi đều khóc. Cậu cười đi, tôi biết là buồn cười mà."),
            say(W,"...Cảm ơn vì không cười.")]),
          opt("Để lúc khác nhé, mình đang bận.",null,[
            say(W,"Ừ, ừ. Lúc khác."),
            nar("(Cậu ta gật đầu rất nhanh, giống như đã quen bị từ chối.)")])
        ])
      ],
      [
        say(W,"Tôi share bài thứ hai rồi. Được ba tim, một bình luận."),
        say(W,"Bình luận đó viết: 'Hay quá, cho mình xin link nhé!' Tôi đọc đi đọc lại cả chục lần."),
        ask(W,"Cậu thấy sao? Tôi có nên share tiếp không?",[
          opt("Share tiếp đi. Cậu làm tốt lắm.",{trust:1},[
            say(W,"Ừ! Ừ, tôi sẽ share! Hôm nay luôn!")]),
          opt("Tùy cậu thôi. Nhưng mình sẽ là người thả tim đầu tiên.",{trust:1},[
            say(W,"Cậu... cậu thật sự định thả tim hả? Okay! Tôi sẽ đăng một bài thật hay!")])
        ])
      ],
      [
        say(W,"Hôm nay... cánh cửa ở cuối hành lang không hiện ra nữa."),
        say(W,"Cậu nghĩ nó đi đâu rồi?",{when:'w_dream=play'}),
        say(W,"Có lẽ là vì cậu nói rằng cậu đang ở đây với tôi. Nên tôi không cần chạy sang bên kia nữa.",{when:'w_dream=ground'}),
        say(W,"Có lẽ nó chỉ xuất hiện khi tôi quá mệt.",{unless:['w_dream=play','w_dream=ground']}),
        ask(W,"Tôi vẫn nhớ bang hội đó. Nhưng bây giờ tôi có cậu rồi. Như vậy... có được tính là bang hội không?",[
          opt("Tính chứ. Bang hội hai người.",{trust:1},[
            say(W,"Hai người. Hai người cũng đủ rồi.")]),
          opt("Cậu xứng đáng có một bang hội thật sự.",{trust:1},[
            say(W,"Một ngày nào đó... Tôi sẽ cố.")])
        ])
      ]
    ],
    LINH: [
      [
        say(L,"Ê, ta vừa lên hạng!"),
        say(L,"Hạng sắt... lên hạng đồng. Nhưng mà lên rồi!"),
        ask(L,"Ngươi thấy sao? Có đáng ăn mừng không?",[
          opt("Đáng chứ! Mừng thôi.",{trust:1},[
            say(L,"Hahaha! Đến đây, Quỷ Vương mời ngươi một ly trà đá không đường!")]),
          opt("Cậu thử dùng thời gian đó học thêm một kỹ năng đi.",null,[
            say(L,"Ê, đừng phá mood chứ."),
            say(L,"...Nhưng ta sẽ nghĩ.")])
        ])
      ],
      [
        say(L,"Hôm nay ta thấy tờ rơi ở bảng tin: 'Tuyển cộng tác viên kiểm thử game'."),
        say(L,"Kiểm thử game, ngươi biết không? Họ trả tiền cho người chơi game!",{when:'l_advice=skill'}),
        say(L,"Ta không biết có nên thử không. Nhưng ngươi từng bảo game cũng là kỹ năng mà.",{when:'l_advice=skill'}),
        say(L,"Chắc không hợp với ta. Ta chỉ giỏi chơi, đâu giỏi... kiểm thử.",{unless:'l_advice=skill'}),
        ask(L,"Ngươi nghĩ ta có nên nộp đơn không?",[
          opt("Nộp đi. Lỡ may được.",{trust:1,flag:'l_applied'},[
            say(L,"Okay. Ta nộp. Nếu rớt thì ít nhất ta cũng đã thử.")]),
          opt("Cậu tự quyết định nhé, mình không giúp được đâu.",null,[
            say(L,"Ừ. Ta hiểu."),
            nar("(Cậu ta cất tờ rơi vào túi áo, nhưng mình biết lát nữa cậu sẽ lấy ra đọc lại.)")])
        ])
      ],
      [
        say(L,"Ngươi biết không, đêm qua ta mơ thấy mình nhận được offer."),
        say(L,"Trong giấc mơ, ta vui lắm. Nhưng tỉnh dậy, ta lại thấy... trống rỗng."),
        ask(L,"Có lẽ ta sợ cái cảm giác 'muốn' đó. Vì muốn nghĩa là có thể thất vọng.",[
          opt("Thất vọng cũng là một phần của việc cố gắng. Mình sẽ ở đây.",{trust:1},[
            say(L,"...Ngươi nói chuyện nghe như một đồng đội thật sự.")]),
          opt("Vậy thì cứ muốn đi. Thất vọng thì mình cùng chịu.",{trust:1},[
            say(L,"Cùng chịu à. Nghe có vẻ không tệ.")])
        ])
      ]
    ],
    TRONG: [
      [
        say(T,"Này, hôm nay tôi thử đổi kiểu tóc. Cậu thấy sao?"),
        ask(T,"Nói thật nhé. Đừng nói dối để làm tôi vui.",[
          opt("Đẹp đấy. Hợp với cậu.",{trust:1},[
            say(T,"Hừ. Tôi biết rồi."),
            nar("(Nhưng cậu ta cứ đưa tay lên sờ tóc mãi, như không tin vào lời khen.)")]),
          opt("Thật ra cậu hợp kiểu cũ hơn.",null,[
            say(T,"Hả? ...Thật à? Vậy mai tôi chỉnh lại."),
            say(T,"À mà cảm ơn. Chưa ai dám nói thật với tôi bao giờ.")])
        ])
      ],
      [
        say(T,"Tối qua tôi nhắn cho mẹ: 'Con ổn'. Nhưng thật ra tôi không ổn."),
        say(T,"Mẹ trả lời: 'Ba mẹ biết con đang cố rất nhiều.' Chỉ một câu thôi. Tôi đọc đi đọc lại."),
        ask(T,"Tôi nên làm gì với câu nói đó?",[
          opt("Cứ giữ nó. Đôi khi một câu là đủ.",{trust:1},[
            say(T,"Ừ. Một câu là đủ.")]),
          opt("Nói chuyện thật với mẹ cậu đi.",{trust:1},[
            say(T,"Nói thật... tôi sẽ cố. Có lẽ khi ra khỏi cái trường này.")])
        ])
      ],
      [
        say(T,"Tôi đã đến căn tin hôm nay. Ngồi một mình. Nhưng có một bạn nữ hỏi mượn cái ghế cạnh tôi."),
        say(T,"Tôi nói 'được'. Chỉ một chữ thôi, nhưng cậu biết không... đó là lần đầu tiên tôi nói chuyện với một người lạ mà không thấy tim đập loạn."),
        ask(T,"Cậu có nghĩ... tôi đang tiến bộ không?",[
          opt("Có. Rất nhiều.",{trust:1},[
            say(T,"Hừ. Không cần nịnh. Nhưng... cảm ơn.")]),
          opt("Cậu luôn tiến bộ, chỉ là cậu không để ý thôi.",{trust:1},[
            say(T,"Có lẽ vậy. Cậu để ý hộ tôi nhé.")])
        ])
      ]
    ],
    TOBY: [
      [
        say(B,"Hôm nay mình đi học đủ cả ngày!"),
        say(B,"Có một bạn hỏi mình bài tập. Bạn ấy hỏi bằng tiếng Việt, mình trả lời bằng tiếng Việt. Không ai nhìn mình lạ cả."),
        ask(B,"Mình không biết nên vui hay nên... ừ, mình vui.",[
          opt("Vui đi! Cậu xứng đáng.",{trust:1},[
            say(D,"Gâu gâu!"),
            say(B,"Con chó cũng vui!")]),
          opt("Cậu giỏi lắm, cứ tiếp tục nhé.",{trust:1},[
            say(B,"Okay! Mình sẽ cố.")])
        ])
      ],
      [
        say(B,"Mình nhớ nhà. Nhớ món canh mẹ nấu."),
        say(B,"Ở đây món nào cũng ngon, nhưng... ăn một mình thì không giống."),
        ask(B,"Cậu có muốn ăn tối với mình không? Mình biết một quán gần cổng sau.",[
          opt("Được chứ. Mình mời.",{trust:1},[
            say(B,"Thật không? Vậy mình dắt con chó theo được không?"),
            say(D,"Gâu!")]),
          opt("Để sau khi qua đêm nay nhé.",{trust:1},[
            say(B,"Okay! Nhớ đấy nhé. Mình sẽ đợi.")])
        ])
      ],
      [
        say(B,"Cậu có nghĩ... sau khi tốt nghiệp, mình sẽ ở lại Việt Nam không?"),
        say(B,"Mình chưa biết. Ở đây có con chó. Có cậu. Có... những điều mình bắt đầu thấy quen."),
        ask(B,"Nếu mình ở lại, cậu có giới thiệu mình với bạn cậu không?",[
          opt("Tất nhiên. Mình sẽ giới thiệu cậu là bạn thân nhất.",{trust:1},[
            say(B,"Bạn thân... mình nghe mà thấy nóng nóng ở mắt.")]),
          opt("Mình sẽ giới thiệu cả con chó nữa.",{trust:1},[
            say(D,"Gâu!"),
            say(B,"Nó đồng ý rồi!")])
        ])
      ]
    ]
  },

  /* Câu thoại trước trận khi Khiêu chiến */
  /* ======================= THỂ LỰC: KIỆT SỨC & BỊ ÚP SỌT =======================
     EXHAUSTED: mỗi lần cạn thể lực chọn ngẫu nhiên 1 đoạn.
     AMBUSH[ID]: lời của đối thủ vừa úp sọt (sau đó vào trận, người chơi mất lượt đầu).
     EXHAUSTED_BLOCKED: câu than hiện trong nhật ký khi cố đi tiếp lúc đã hết thể lực. */
  EXHAUSTED: [
    [
      nar("Chân bạn nặng như đeo chì. Mỗi bước sang tòa nhà khác đều như kéo theo cả khuôn viên."),
      say(ME,"Hộc... hộc... Không nhấc nổi chân nữa rồi. Cho tôi thở một chút thôi..."),
      say(ME,"Mà đứng giữa trời thế này, lỡ có ai rình thì chết...")
    ],
    [
      nar("Mắt bạn hoa lên, tim đập thình thịch trong lồng ngực."),
      say(ME,"Sao UIT lại rộng thế này nhỉ... Mới đi có mấy tòa mà đã rã rời."),
      say(ME,"Tôi cần ngồi xuống. Chỉ một phút thôi. ...Nhưng có gì đó không ổn, xung quanh yên ắng quá.")
    ],
    [
      nar("Đầu gối bạn run bần bật. Bạn vịn tay vào tường để khỏi ngã."),
      say(ME,"Điểm rèn luyện đâu không thấy, thấy mỗi cái chân muốn đình công."),
      say(ME,"Đi tiếp là ngất thật. Phải nghỉ đã... cảm giác như đang bị theo dõi.")
    ]
  ],
  EXHAUSTED_BLOCKED: [
    "Chân tôi như đeo chì, không đi nổi nữa. Phải nghỉ thôi.",
    "Hết hơi rồi... đợi lấy lại sức đã.",
    "Bước thêm một bước nữa là ngã quỵ mất. Nghỉ đã.",
    "Phổi đang đòi nghỉ việc. Chưa đi đâu được."
  ],
  AMBUSH: {
    WIBU: [
      nar("Một bóng người lao ra từ góc khuất, tay còn ôm chồng manga."),
      say(W,"Ê-ê, {P}? Trông cậu thảm quá. ...Xin lỗi nhé, hôm nay tôi cần điểm hơn là cần lịch sự!"),
      nar("Bạn đang kiệt sức nên không kịp phản ứng!")
    ],
    LINH: [
      nar("Tiếng giày quân đội dậm xuống nền, dứt khoát và gần hơn bạn tưởng."),
      say(L,"Ta đứng đây nãy giờ rồi, {P}. Quỷ Vương không bao giờ bỏ lỡ con mồi đang thở dốc."),
      nar("Bạn loạng choạng lùi lại, tay chân không còn nghe lời!")
    ],
    TRONG: [
      nar("Có tiếng vỗ tay chậm rãi vang lên sau lưng bạn."),
      say(T,"Chà, đúng lúc quá nhỉ. Tôi không định chơi đẹp, nhưng thắng thì tôi vẫn sẽ thắng thật phong cách."),
      nar("Bạn quay lại thì đã quá muộn, đối thủ đã áp sát!")
    ],
    TOBY: [
      say(D,"Gâu! Gâu gâu!"),
      say(B,"Sorry nha {P}! Nó đánh hơi thấy cậu đang mệt nên dẫn mình tới đây. Mình cũng cần điểm lắm, ready? ...Gâu!"),
      nar("Con chó lao tới làm bạn vấp ngã, mất thế ngay từ đầu!")
    ]
  },

  CHALLENGE: {
    WIBU:  [
      say(W,"Cậu hứa là sẽ không bỏ tôi mà...",{when:'promised_WIBU'}),
      say(W,"Cậu thật sự muốn đấu? ...Được. Lần này tôi sẽ không chạy.")
    ],
    LINH:  [
      say(L,"Ngươi đã hứa... Thôi, ta không trách. Quỷ Vương không trách.",{when:'promised_LINH'}),
      say(L,"Hàng đợi tìm xong rồi. Ván này, Quỷ Vương chiến thật.")
    ],
    TRONG: [
      say(T,"Cậu hứa với tôi, nhớ không? ...Không sao. Tôi sẽ thắng thật phong cách.",{when:'promised_TRONG'}),
      say(T,"Cậu chọn đúng đối thủ rồi đấy. Tôi sẽ thắng, và thắng thật đẹp.")
    ],
    TOBY:  [
      say(B,"Cậu đã hứa mà... Nhưng mình hiểu. Mình cũng cần điểm.",{when:'promised_TOBY'}),
      say(B,"Sorry trước nhé. Mình cũng cần điểm lắm. Ready? ...Gâu!")
    ]
  },

  /* Lời nhận lời vào đội */
  RECRUIT: {
    WIBU:  [
      say(W,"Vào đội của cậu? ...Cậu chắc không? Tôi nói chuyện không giỏi đâu. Nhưng ừ. Tôi vào."),
      nar("(Cậu ta cười, một nụ cười hiếm hoi mà mình biết mình sẽ nhớ.)"),
      say(W,"Cảm ơn vì mời tôi. Lần đầu tiên có ai mời tôi vào nhóm.")
    ],
    LINH:  [
      say(L,"Được. Quỷ Vương gia nhập đội. Cần đánh thì gọi, cần ngủ thì... cũng đừng gọi."),
      say(L,"...Và nếu ngươi cần ai đó trò chuyện lúc ba giờ sáng, ta rảnh.")
    ],
    TRONG: [
      say(T,"Được. Tôi nhận lời. Nhưng đồng đội của tôi phải biết ăn mặc cho tử tế."),
      nar("(Cậu ta chỉnh lại cổ áo, nhưng lần này mình thấy rõ cậu ta đang vui.)"),
      say(T,"Đừng nói với ai là tôi đã gật đầu nhanh như vậy.")
    ],
    TOBY:  [
      say(B,"Okay, mình join! Còn chó thì... mình sẽ cố để nó ở ngoài. Chắc vậy."),
      say(D,"Gâu!"),
      say(B,"Nó nói nó cũng muốn gia nhập.")
    ]
  },

  /* Không chịu vào đội khi chưa đủ tin tưởng */
  RECRUIT_REFUSE: {
    WIBU:  [
      say(W,"Xin lỗi... tôi chưa sẵn sàng. Tôi còn chưa biết cậu là người thế nào."),
      nar("(Cậu ta ôm chặt balo hơn. Không phải từ chối, mà là chưa sẵn sàng.)")
    ],
    LINH:  [
      say(L,"Xin vào đội mà ta còn chưa biết tên ngươi? Nói chuyện thêm đã."),
      say(L,"Ghé lại thường xuyên đi. Biết đâu ta đổi ý.")
    ],
    TRONG: [
      say(T,"Vẫn còn sớm. Tôi không gia nhập đội của người tôi chưa hiểu."),
      nar("(Cậu ta quay mặt đi, nhưng khóe mắt thì lén nhìn xem mình có bỏ đi không.)")
    ],
    TOBY:  [
      say(B,"Mình... chưa quen thân với cậu lắm. Mình muốn hiểu cậu thêm một chút, được không?"),
      say(D,"Gâu.")
    ]
  },

  /* Cảm nghĩ sau trận (người chơi THẮNG — NPC thua) */
  AFTER_WIN: {
    WIBU:  [
      say(W,"Hức... tôi thua rồi. Nhưng ít ra lần này, có người ở lại đến cuối trận."),
      ask(W,"Cậu thắng rồi. Tôi... tôi không sao. Thật đấy.",[
        opt("Xin lỗi, mình cần điểm. Cậu đánh rất hay.",{trust:1},[
          say(W,"...Cảm ơn. Cậu là người duy nhất từng nói tôi đánh hay.")]),
        opt("Cậu nên mạnh dạn hơn.",null,[
          say(W,"Ừ. Mạnh dạn... tôi sẽ cố.")])
      ])
    ],
    LINH:  [
      say(L,"Thua rồi à... ván này không có nút chơi lại. Ta ngả lưng một chút đây."),
      ask(L,"Ngươi thắng. Nhưng... ngươi cũng mệt đúng không? Nhìn mặt ngươi là biết.",[
        opt("Ừ, mệt thật. Cảm ơn trận đấu.",{trust:1},[
          say(L,"Nghỉ chút đi. Ta nhường ghế đá cho.")]),
        opt("Mình ổn. Cậu nghỉ đi.",null,[
          say(L,"Ừ... ngủ tiếp.")])
      ])
    ],
    TRONG: [
      say(T,"Tôi thua. Cứ nhìn đi — ngay cả lúc thua, tôi vẫn đứng thẳng."),
      ask(T,"Cậu đánh tốt. Đừng nghĩ là tôi sẽ nói câu này lần hai.",[
        opt("Cậu cũng vậy. Mình thật sự ấn tượng.",{trust:1},[
          say(T,"...Hừ. Cảm ơn.")]),
        opt("Lần sau mình sẽ đánh khó hơn nữa.",null,[
          say(T,"Cứ thử đi. Tôi sẽ không thua lần hai.")])
      ])
    ],
    TOBY:  [
      say(B,"Mình thua rồi... Không sao, con chó vẫn ở bên mình."),
      say(D,"Gâu!"),
      ask(B,"Nhưng mình không giận đâu. Trận đấu hay mà.",[
        opt("Cảm ơn Toby. Mình cũng thấy vui khi đấu với cậu.",{trust:1},[
          say(B,"Mình cũng vậy!")]),
        opt("Xin lỗi, mình thật sự cần điểm.",null,[
          say(B,"Không sao. Ai cũng cần điểm mà.")])
      ])
    ]
  },

  /* Sau trận (người chơi THUA — NPC thắng) */
  AFTER_LOSE: {
    WIBU:  [
      say(W,"Tôi... thắng rồi sao? Điểm của cậu giờ là của tôi."),
      nar("(Cậu ta cười lớn, nhưng tiếng cười run run, như vừa làm điều gì chính cậu cũng không tin nổi.)"),
      say(W,"À... xin lỗi. Tôi không cố ý đắc ý đâu. Tôi chỉ... lần đầu thắng ai đó.")
    ],
    LINH:  [
      say(L,"Ván này ta thắng. Điểm của ngươi, ta nhận."),
      say(L,"...Ê, ngươi ổn không? Ta nhẹ tay mà. Xin lỗi.")
    ],
    TRONG: [
      say(T,"Tôi thắng. Đúng như dự tính — và đúng như phong cách."),
      say(T,"...Cậu không sao chứ? Đứng dậy được không?")
    ],
    TOBY:  [
      say(B,"Sorry... mình cần số điểm này hơn cậu."),
      say(D,"Gâu gâu!"),
      say(B,"Con chó bảo cậu đứng dậy đi. Nó tin cậu sẽ thắng lần sau.")
    ]
  }
};

})();