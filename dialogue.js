/* =========================================================================
   dialogue.js — HỘI THOẠI (bản Battle Royale ĐRL). Nạp trước script.js.
   Quy ước dòng thoại: { spk, text }.  Trong text/spk, "{P}" = tên người chơi.
   NPC id: WIBU | LINH | TRONG | TOBY.
   ========================================================================= */
window.DLG = {

  INTRO_CH1: [
    { spk: "LOA TRƯỜNG", text: "Thông báo: sinh viên năm cuối chưa đủ Điểm Rèn Luyện (ĐRL) sẽ KHÔNG được xét tốt nghiệp." },
    { spk: "{P}", text: "Mình thiếu cả chục điểm... và cả nhóm năm đứa này cũng thế. Chỉ còn đúng một cách." },
    { spk: "LOA TRƯỜNG", text: "Một giải đấu Battle Royale. Năm người, ai trụ lại cuối cùng sẽ tốt nghiệp loại Giỏi." },
    { spk: "{P}", text: "Mỗi người bắt đầu với 40 ĐRL. Thắng một trận thì cướp một nửa ĐRL của đối thủ, thua thì mất một nửa." },
    { spk: "{P}", text: "Hết mỗi đêm, người có ĐRL thấp nhất sẽ bị loại. Và nhớ tránh The TIU — bị bắt gặp lang thang là bị trừ điểm." }
  ],

  INTRO_CH1_NIGHT: {
    2: [{ spk: "{P}", text: "Đêm thứ hai. Còn lại bốn người. Phải giữ ĐRL cao hơn ít nhất một đối thủ." }],
    3: [{ spk: "{P}", text: "Đêm cuối của chương này. Ba người còn lại — mà chỉ hai người được đi tiếp." }]
  },

  INTRO_CH2: [
    { spk: "LOA TRƯỜNG", text: "Chỉ còn hai người đứng vững. Đêm nay, các bạn được chuẩn bị. Đêm mai, một trận quyết định." },
    { spk: "{P}", text: "The TIU đã đi ngủ. Giờ là lúc đi quanh trường, thu gom mọi thứ có thể dùng được." },
    { spk: "{P}", text: "Nếu tìm thấy đối thủ trước... mình có thể ra tay trước, cướp luôn đồ của họ." }
  ],

  BETRAY: [
    { spk: "{P}", text: "Chỉ có một suất tốt nghiệp loại Giỏi. Dù chúng ta từng sát cánh... thì đến đây là hết." }
  ],

  INTRO_CH2_FINAL: [
    { spk: "LOA TRƯỜNG", text: "Đêm quyết định. Hai người, một suất. Mời vào sân đấu." }
  ],

  WIN_FINAL: [
    { spk: "LOA TRƯỜNG", text: "Người cuối cùng trụ lại: {P}. Chúc mừng bạn đã đủ ĐRL để tốt nghiệp loại Giỏi!" }
  ],

  /* Nói chuyện theo mức Tin tưởng khi gặp (0, 1, 2, 3+) */
  TALK: {
    WIBU: [
      [{ spk: "WIBU VIỆT NHẬT", text: "Hả? Ai đó? Đừng có động vào bộ figure trong balo của tôi nhé!" }],
      [{ spk: "WIBU VIỆT NHẬT", text: "À... cậu cũng biết bộ anime đó à? Thế thì cậu là người có gu đấy." }],
      [{ spk: "WIBU VIỆT NHẬT", text: "Cậu khá hợp cạ đấy. Cần thì cứ rủ, tôi sẽ đứng cùng đội." }],
      [{ spk: "WIBU VIỆT NHẬT", text: "Bạn bè rồi mà. Nhớ đừng quên suất chiếu tuần sau nhé!" }]
    ],
    LINH: [
      [{ spk: "CHÀNG LÍNH NGU LAM", text: "Ta là Quỷ Vương Bất Tử... à khoan, cho ta ngủ thêm năm phút." }],
      [{ spk: "CHÀNG LÍNH NGU LAM", text: "Ngươi không tệ. Đáng để Quỷ Vương này nhớ tên." }],
      [{ spk: "CHÀNG LÍNH NGU LAM", text: "Được. Quỷ Vương sẽ cho ngươi mượn sức mạnh... sau khi ta tỉnh hẳn." }],
      [{ spk: "CHÀNG LÍNH NGU LAM", text: "Đồng đội. Từ nay ngai vàng của ta cũng là của ngươi." }]
    ],
    TRONG: [
      [{ spk: "TRỌNG", text: "Chào, tôi là Trọng — Người Hoa Hòe. Nhìn đây, phong cách là tất cả!" }],
      [{ spk: "TRỌNG", text: "Cậu có con mắt thẩm mỹ đấy. Tôi bắt đầu thấy cậu dễ chịu rồi." }],
      [{ spk: "TRỌNG", text: "Hợp tác chứ? Nhớ là tôi diện đẹp hơn cậu nhé." }],
      [{ spk: "TRỌNG", text: "Chúng ta là một đội rồi. Cậu cứ để phần hào nhoáng cho tôi." }]
    ],
    TOBY: [
      [{ spk: "TOBY", text: "Hi! Mình là Toby, sinh viên trao đổi. Xin lỗi, con chó này không chịu rời mình nửa bước." },
       { spk: "CHÓ CỦA TOBY", text: "Gâu!" }],
      [{ spk: "TOBY", text: "Mình hay cúp tiết lắm, nhưng cậu thì có vẻ không phán xét. Cảm ơn nhé." }],
      [{ spk: "TOBY", text: "Okay, mình sẽ đi cùng cậu. Con chó cũng đồng ý rồi đấy." },
       { spk: "CHÓ CỦA TOBY", text: "Gâu gâu!" }],
      [{ spk: "TOBY", text: "Team mình hợp thật. Mà này, có ai thấy con chó ăn mất bánh mì của mình chưa?" }]
    ]
  },

  /* Câu thoại trước trận khi Khiêu chiến */
  CHALLENGE: {
    WIBU:  [{ spk: "WIBU VIỆT NHẬT", text: "Muốn đấu hả? Được thôi, nhưng đừng khóc khi thua nhé!" }],
    LINH:  [{ spk: "CHÀNG LÍNH NGU LAM", text: "Ngươi dám đánh thức Quỷ Vương? Chuẩn bị đi!" }],
    TRONG: [{ spk: "TRỌNG", text: "Được thôi. Nhưng tôi sẽ thắng thật phong cách." }],
    TOBY:  [{ spk: "TOBY", text: "Sorry, nhưng mình cần điểm! Ready... gâu!" }]
  },

  /* Lời nhận lời vào đội */
  RECRUIT: {
    WIBU:  [{ spk: "WIBU VIỆT NHẬT", text: "Vào đội à? Được, nhưng mọi quyết định chiến thuật phải nghe tôi... đùa thôi." }],
    LINH:  [{ spk: "CHÀNG LÍNH NGU LAM", text: "Quỷ Vương gia nhập. Nhớ báo ta khi cần đánh nhau." }],
    TRONG: [{ spk: "TRỌNG", text: "Okay, đội mình sẽ là đội phong cách nhất trường!" }],
    TOBY:  [{ spk: "TOBY", text: "Join! Mình sẽ cố không dắt chó vào trận... chắc vậy." }]
  },

  /* Không chịu vào đội khi chưa đủ tin tưởng */
  RECRUIT_REFUSE: {
    WIBU:  [{ spk: "WIBU VIỆT NHẬT", text: "Chưa đâu. Mình còn chưa hiểu nhau." }],
    LINH:  [{ spk: "CHÀNG LÍNH NGU LAM", text: "Quỷ Vương không theo kẻ lạ." }],
    TRONG: [{ spk: "TRỌNG", text: "Hơi sớm. Nói chuyện thêm đã nào." }],
    TOBY:  [{ spk: "TOBY", text: "Mình chưa quen cậu lắm... nói chuyện thêm nhé?" }]
  },

  /* Cảm nghĩ sau trận */
  AFTER_WIN: {
    WIBU:  [{ spk: "WIBU VIỆT NHẬT", text: "Hức... lần sau tôi sẽ mang nhân vật mạnh hơn!" }],
    LINH:  [{ spk: "CHÀNG LÍNH NGU LAM", text: "Quỷ Vương... thua? Thôi, ta ngủ tiếp." }],
    TRONG: [{ spk: "TRỌNG", text: "Thua một trận không làm mất phong cách của tôi." }],
    TOBY:  [{ spk: "TOBY", text: "Mình thua rồi. Con chó thì vẫn đáng yêu hơn cậu." }]
  },
  AFTER_LOSE: {
    WIBU:  [{ spk: "WIBU VIỆT NHẬT", text: "Hahaha! Điểm của cậu là của tôi!" }],
    LINH:  [{ spk: "CHÀNG LÍNH NGU LAM", text: "Đây là sức mạnh của Quỷ Vương Bất Tử." }],
    TRONG: [{ spk: "TRỌNG", text: "Thắng một cách đẹp mắt, đúng chất của tôi." }],
    TOBY:  [{ spk: "TOBY", text: "Sorry nhé, mình cần điểm này hơn." }]
  }
};