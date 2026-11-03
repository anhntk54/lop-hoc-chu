// =====================================================
//  LỜI THOẠI CÔ GIÁO. Mỗi tình huống có nhiều câu, game bốc lần lượt kiểu xáo bài
//  (đọc hết cả xấp mới lặp lại) nên live lâu vẫn ít nghe trùng.
//  Muốn thêm câu: chép 1 dòng trong đúng nhóm. Tên người xem luôn là tên đã làm sạch,
//  KHÔNG BAO GIỜ chèn nguyên văn comment vào đây.
//  Kiểm tra: npx tsx src/game/quiz.check.ts (đếm số câu mỗi nhóm, tìm câu trùng)
// =====================================================

type L0 = string[];
type L1 = ((a: string) => string)[];
type L2 = ((a: string, b: string) => string)[];

export const LINES = {
  // ---------- Vào tiết ----------
  intro: [
    'Cả lớp ổn định nào! Tiết mới bắt đầu rồi. Cô xáo chữ, ai gõ đáp án nhanh nhất thì nhiều điểm nhất.',
    'Trống vào lớp rồi nha. Mười câu, câu cuối là câu hỏi vàng nhân đôi điểm. Chuẩn bị bàn phím đi.',
    'Ngồi ngay ngắn lại, cất điện thoại đi... à quên, lớp mình học bằng điện thoại. Vào bài thôi!',
    'Tiết này cô đố mười câu. Gõ đáp án vào bình luận, phải gõ có dấu nha mấy đứa.',
    'Ai ngủ gật thì dậy, ai ăn vặt thì cất. Tiết mới, điểm làm lại từ đầu, ai cũng có cơ hội ngồi bàn đầu.',
    'Chào cả lớp! Hôm nay cô hỏi khó hơn hôm qua một chút. Đứa nào giỏi thì chứng minh đi.',
    'Vào học! Ai trả lời đúng nhanh nhất được mười điểm, chậm hơn thì ít điểm hơn. Chép bài bạn thì được đúng một điểm thôi nha.',
    'Lớp trưởng đâu, hô cả lớp đứng dậy coi. Thôi khỏi, ngồi luôn đi, vào câu một.',
    'Tiết mới tới rồi. Bàn đầu đang trống, ai giỏi thì lên ngồi.',
    'Cả lớp chú ý lên bảng. Chữ cô xáo lung tung, việc của các em là xếp lại cho đúng.',
  ] as L0,

  goldenIntro: [
    'Câu cuối rồi! Câu hỏi vàng, điểm nhân đôi. Đứa nào đang thua thì lật kèo ở câu này.',
    'Câu hỏi vàng tới đây! Đúng câu này điểm gấp đôi, bảng xếp hạng đổi hết đó.',
    'Tập trung nha, câu cuối nhân đôi điểm. Ai ngồi bàn đầu mà sai câu này là mất ghế như chơi.',
    'Câu hỏi vàng! Cô chờ xem ai là người cướp ngôi lớp trưởng.',
    'Câu cuối, nhân đôi điểm. Gõ nhanh mà nhớ gõ đúng dấu nha.',
  ] as L0,

  // ---------- Trong lúc hỏi ----------
  firstCorrect: [
    (n) => `Ôi nhanh ghê! Bạn ${n} đúng đầu tiên rồi.`,
    (n) => `${n} trả lời đúng! Mười điểm về tay.`,
    (n) => `Giỏi quá ${n} ơi! Cả lớp còn đang dò chữ mà em đã xong.`,
    (n) => `Bạn ${n} nhanh như chớp. Mấy bạn còn lại tranh hạng nhì đi.`,
    (n) => `Có người đúng rồi nha! Là ${n}. Còn ai nữa không?`,
    (n) => `${n} đúng rồi! Em học lớp mấy mà giỏi vậy?`,
    (n) => `Chuẩn luôn ${n}! Cô cho em ngồi bàn đầu.`,
    (n) => `${n} lụm mười điểm. Cả lớp nhanh tay lên kẻo hết điểm.`,
    (n) => `Ai cho phép ${n} giỏi vậy? Đúng rồi đó!`,
    (n) => `Trời ơi ${n}! Chưa kịp uống ngụm nước đã có người đúng.`,
    (n) => `Bạn ${n} ghi điểm đầu tiên. Ai về nhì nào?`,
    (n) => `Đúng rồi ${n}! Cô thấy em có tố chất làm lớp trưởng.`,
  ] as L1,

  superFast: [
    (n) => `Gì vậy ${n}? Cô chưa đọc xong đề mà em đã trả lời. Có quay cóp không đó?`,
    (n) => `${n} nhanh hơn cả cô đọc đề. Cô nghi em là thần đồng.`,
    (n) => `Mới mấy giây mà ${n} đã đúng. Em có camera nhìn trộm sổ của cô hả?`,
    (n) => `${n} gõ nhanh dữ vậy. Bàn phím chắc bốc khói rồi.`,
    (n) => `Ủa ${n}, em đoán hay em biết trước? Cô sợ em luôn rồi đó.`,
    (n) => `Nhanh vậy ${n}! Lần sau để phần cho các bạn với chứ.`,
  ] as L1,

  quietHalfway: [
    'Sao im re vậy cả lớp? Khó lắm hả?',
    'Lớp mình đang suy nghĩ hay đang ngủ vậy?',
    'Chưa ai đúng hết. Cô hơi buồn nha.',
    'Nhìn kỹ mấy chữ trên bảng đi, đáp án nằm ngay đó.',
    'Gõ đại một chữ đi, sai cô cũng không trừ điểm đâu.',
    'Lớp mình học giỏi lắm mà, sao câu này ai cũng im?',
    'Mấy em bàn cuối đâu rồi, nói chuyện riêng giỏi lắm mà, trả lời đi!',
    'Còn nửa thời gian. Cô ngồi chờ mà nóng ruột quá.',
  ] as L0,

  bonus: [
    'Khó quá hả cả lớp? Cô mở thêm một chữ, cho thêm mười giây nữa nè.',
    'Thôi được rồi, cô thương, cô mở một chữ. Mười giây nữa thôi đó.',
    'Cả lớp bí rồi. Cô cho gợi ý thêm một chữ, nhanh lên!',
    'Hết giờ mà chưa ai đúng. Cô nhá hàng thêm một chữ, mười giây nữa.',
    'Cô mở thêm một chữ nè. Vậy mà còn không ra thì cô đi về.',
    'Bí thật hả? Cô cho thêm một chữ với mười giây. Ráng lên.',
    'Lớp mình làm cô lo quá. Thêm một chữ, thêm mười giây.',
    'Gợi ý thêm một chữ. Câu này mà sai nữa là về chép phạt hết.',
  ] as L0,

  // ---------- Hiện đáp án ----------
  reveal: [
    (answer, rest) => `Đáp án là ${answer}. ${rest}`,
    (answer, rest) => `Chữ đúng là ${answer} nha cả lớp. ${rest}`,
    (answer, rest) => `${answer}! Đúng vậy đó. ${rest}`,
    (answer, rest) => `Cô công bố, đáp án là ${answer}. ${rest}`,
    (answer, rest) => `Câu này là ${answer}. ${rest}`,
    (answer, rest) => `Xếp lại thì thành ${answer}. ${rest}`,
  ] as L2,
  // phần "rest" của câu trên: tên người nhất câu
  revealTop: [
    (n) => `Nhất câu này là ${n}.`,
    (n) => `Người nhanh nhất là ${n}.`,
    (n) => `Mười điểm thuộc về ${n}.`,
    (n) => `${n} về nhất câu này.`,
  ] as L1,
  revealCount: [
    (c) => `Cả lớp có ${c} bạn đúng.`,
    (c) => `Tổng cộng ${c} bạn trả lời đúng.`,
    (c) => `Có ${c} bạn đúng, giỏi quá trời.`,
  ] as L1,

  revealNobody: [
    (a) => `Không ai đoán ra luôn hả? Đáp án là ${a} đó cả lớp.`,
    (a) => `Là ${a}! Dễ vậy mà cả lớp bó tay. Cô giận rồi đó.`,
    (a) => `Đáp án là ${a}. Lớp mình hôm nay ăn sáng chưa vậy?`,
    (a) => `${a} nha mấy đứa. Về nhà học bài lại hết cho cô.`,
    (a) => `Cả lớp không ai ra. Đáp án là ${a}. Cô xin phép thở dài một cái.`,
    (a) => `Là ${a}. Câu này mà sai thì về nhà mẹ đánh đòn nha.`,
    (a) => `Đáp án ${a}. Cô đố câu này cho em học sinh lớp hai cũng ra.`,
    (a) => `${a}! Cả lớp nợ cô một câu. Câu sau trả nha.`,
    (a) => `Là ${a} đó. Lớp mình đang tiết kiệm chữ hay sao mà không ai gõ?`,
    (a) => `Đáp án ${a}. Thôi không sao, câu sau làm lại.`,
  ] as L1,

  roastWrong: [
    (n) => `Bạn ${n} gõ sai rồi kìa. Về nhà chép phạt mười lần nha.`,
    (n) => `${n} ơi, em đoán bừa phải không? Cô biết hết đó.`,
    (n) => `${n} trả lời tự tin ghê mà sai. Cô thích sự tự tin đó.`,
    (n) => `Cô thấy ${n} gõ sai nha. Đứng lên góc lớp năm phút.`,
    (n) => `${n} ơi, chữ đó không có trong từ điển đâu em.`,
    (n) => `Bạn ${n} sai rồi, nhưng cô thưởng điểm dũng cảm.`,
    (n) => `${n} gõ gì vậy em? Cô đọc mà muốn lên huyết áp.`,
    (n) => `Câu này ${n} làm cô cười quá. Sai rồi nha.`,
    (n) => `${n} sai mà không sao, ít ra em còn dám gõ.`,
    (n) => `Ê ${n}, nhìn lại mấy chữ trên bảng coi, đâu có chữ đó.`,
    (n) => `${n} trả lời nhanh mà sai. Nhanh nhảu đoảng đó em.`,
    (n) => `Cô ghi tên ${n} vào sổ đầu bài nha. Đùa đó, lần sau cố lên.`,
    (n) => `Bạn ${n} ơi, ba mẹ có biết em trả lời vậy không?`,
    (n) => `${n} chắc đang vừa xem live vừa ăn mì nên gõ nhầm.`,
    (n) => `${n} sai rồi. Ngồi xuống, câu sau làm lại.`,
  ] as L1,

  streak: [
    (n) => `${n} đúng ba câu liền! Cô thưởng thêm năm điểm.`,
    (n) => `Ba câu liền rồi ${n}! Thêm năm điểm, cô nể.`,
    (n) => `${n} đang lên phong độ, ba câu không trượt câu nào. Cộng năm điểm.`,
    (n) => `Chuỗi ba câu đúng của ${n}! Năm điểm thưởng nha.`,
    (n) => `${n} học bài kỹ ghê, ba câu liền. Cô cộng thêm năm điểm.`,
    (n) => `Ai cản ${n} được không? Ba câu liền, cộng năm điểm.`,
  ] as L1,

  goldenWinner: [
    (n) => `${n} ăn trọn câu hỏi vàng, hai mươi điểm!`,
    (n) => `Câu hỏi vàng về tay ${n}! Nhân đôi điểm nha.`,
    (n) => `${n} lật kèo ở câu cuối. Hai mươi điểm luôn.`,
    (n) => `Người giữ câu hỏi vàng là ${n}. Xuất sắc!`,
  ] as L1,

  // ---------- Hết tiết ----------
  results: [
    (n, s) => `Hết tiết! Nhất lớp tiết này là ${n}, được ${s} điểm. Cả lớp vỗ tay nào!`,
    (n, s) => `Tổng kết tiết học: ${n} đứng đầu với ${s} điểm. Giỏi quá!`,
    (n, s) => `Trống tan tiết rồi. Hạng nhất thuộc về ${n}, ${s} điểm.`,
    (n, s) => `${n} nhất tiết này, ${s} điểm. Cô treo ảnh em lên bảng vàng.`,
    (n, s) => `Chúc mừng ${n}, ${s} điểm, giấy khen tiết này là của em.`,
    (n, s) => `Ai cũng cố gắng, nhưng ${n} cố gắng nhất. ${s} điểm, nhất lớp!`,
    (n, s) => `Hết giờ! ${n} được ${s} điểm, về nhà khoe ba mẹ đi.`,
    (n, s) => `Nhất tiết này là ${n} với ${s} điểm. Mấy bạn khác tiết sau lấy lại nha.`,
  ] as L2,
  resultsNobody: [
    'Tiết này chưa ai ghi điểm. Tiết sau cả lớp cố lên nha.',
    'Không ai có điểm luôn. Cô đi xin thêm phấn rồi dạy lại từ đầu.',
    'Hết tiết mà bảng điểm trống trơn. Lớp mình ngủ đông rồi hả?',
    'Tiết này buồn quá, chưa ai đúng câu nào. Ra chơi xong làm lại nha.',
    'Không sao, tiết sau lớp mình phục thù.',
  ] as L0,

  newMonitor: [
    (n) => `Lớp mình có lớp trưởng mới rồi, là ${n}!`,
    (n) => `${n} vượt lên dẫn đầu cả buổi, lên làm lớp trưởng luôn.`,
    (n) => `Đổi lớp trưởng! ${n} giờ đứng nhất hôm nay.`,
    (n) => `Chức lớp trưởng về tay ${n}. Lớp trưởng cũ ráng giành lại đi.`,
    (n) => `${n} lên lớp trưởng. Từ giờ em hô cả lớp đứng dậy nha.`,
    (n) => `Bảng xếp hạng đổi rồi, ${n} làm lớp trưởng.`,
  ] as L1,

  sessionBoard: [
    (n, s) => `Học sinh giỏi nhất hôm nay đang là ${n}, ${s} điểm.`,
    (n, s) => `Cả buổi tới giờ, ${n} dẫn đầu với ${s} điểm.`,
    (n, s) => `Lớp trưởng hôm nay là ${n}, tổng ${s} điểm. Ai muốn giành ghế thì vào tiết sau.`,
    (n, s) => `${n} giữ hạng nhất hôm nay, ${s} điểm. Đuổi theo đi các em.`,
  ] as L2,
  weekBoard: [
    (n) => `Bảng vàng tuần này, hạng nhất là ${n}.`,
    (n) => `Đứng đầu cả tuần là ${n}. Mai vào lớp tiếp để giữ hạng nha.`,
    (n) => `Tuần này ${n} đang nhất. Ai muốn vượt thì chăm vào lớp.`,
  ] as L1,

  // ---------- Quà, follow, chào ----------
  thankGift: [
    (n, g) => `Cô cảm ơn ${n} tặng ${g} nha.`,
    (n, g) => `Ôi ${g} của ${n}, cô thương em nhất lớp.`,
    (n, g) => `${n} tặng cô ${g}. Học trò ngoan như vầy cô cưng lắm.`,
    (n, g) => `Cảm ơn ${n}! ${g} đẹp quá, cô cắm lên bàn liền.`,
    (n, g) => `${n} ơi, ${g} này cô giữ làm kỷ niệm.`,
    (n, g) => `Cô nhận ${g} của ${n} rồi nha. Cảm ơn em.`,
    (n, g) => `${n} tặng ${g} cho cô. Cả lớp học theo bạn đi.`,
    (n, g) => `Hoa của ${n} đây. Cô cảm ơn, hôm nay cô vui lắm.`,
    (n, g) => `Ai như ${n}, vừa học giỏi vừa biết thương cô. Cảm ơn em.`,
    (n, g) => `${n} tặng ${g}. Cô không cộng điểm đâu nha, nhưng cô nhớ mặt em.`,
    (n, g) => `Cảm ơn ${n}, ${g} làm lớp mình sáng hẳn lên.`,
    (n, g) => `${n} ơi cảm ơn em. Mai cô cho em lau bảng.`,
  ] as L2,
  bigGift: [
    (n) => `Trời ơi ${n} tặng quà to quá! Cả lớp vỗ tay cho bạn đi.`,
    (n) => `${n} chơi lớn quá. Cô cảm động muốn khóc luôn.`,
    (n) => `Quà to của ${n}! Cô cho em làm lớp phó văn nghệ danh dự.`,
    (n) => `${n} ơi, quà này cô không dám nhận đâu... thôi nhận luôn. Cảm ơn em!`,
    (n) => `Cả lớp nhìn ${n} mà học tập nha. Cảm ơn em nhiều lắm.`,
    (n) => `${n} tặng quà xịn. Cô đặt em lên bàn đầu trong tim cô.`,
  ] as L1,
  giftHint: [
    (n) => `${n} xin cô mở thêm một chữ, cả lớp nhờ bạn đó nha.`,
    (n) => `Nhờ quà của ${n}, cô mở thêm một chữ cho cả lớp.`,
    (n) => `${n} giải cứu cả lớp, mở thêm một chữ nè.`,
    (n) => `${n} tặng quà, cô thưởng cả lớp một chữ gợi ý.`,
    (n) => `Cảm ơn ${n}! Thêm một chữ trên bảng rồi, ai đoán ra nào?`,
    (n) => `${n} bao cả lớp một chữ. Cảm ơn bạn đi mấy đứa.`,
  ] as L1,
  thankFollow: [
    (n) => `Cô cảm ơn ${n} đã theo dõi kênh nha.`,
    (n) => `${n} vừa theo dõi lớp mình. Chào học sinh mới!`,
    (n) => `Cảm ơn ${n} đã bấm theo dõi, mai nhớ vào lớp đúng giờ.`,
    (n) => `${n} vào sổ điểm danh của lớp rồi. Cảm ơn em.`,
    (n) => `Học sinh mới ${n} đã theo dõi. Cả lớp chào bạn đi.`,
    (n) => `${n} theo dõi kênh rồi, cô nhớ mặt em rồi đó.`,
  ] as L1,
  greeting: [
    (names) => `Chào ${names} vào lớp. Gõ đáp án vào bình luận là chơi được liền.`,
    (names) => `${names} vào lớp trễ nha, cô bỏ qua lần này. Ngồi xuống chơi luôn đi.`,
    (names) => `Lớp mình có thêm ${names}. Chào mừng các em.`,
    (names) => `${names} vừa vào. Kiếm chỗ ngồi đi, câu tiếp theo cô hỏi liền.`,
    (names) => `Ồ ${names} tới rồi. Cả lớp đông vui quá.`,
    (names) => `Chào ${names}. Muốn ngồi bàn đầu thì trả lời đúng nhiều vào.`,
    (names) => `${names} điểm danh có mặt. Vào học thôi.`,
    (names) => `Hoan nghênh ${names}! Ai chưa biết luật thì cứ nhìn bảng mà đoán chữ.`,
  ] as L1,
  share: [
    'Thấy vui thì bấm chia sẻ live rủ bạn bè vào thi với lớp mình nha.',
    'Lớp đông mới vui, các em chia sẻ live cho bạn bè vào học chung đi.',
    'Ai rủ được bạn vào lớp, cô ghi nhận công lao. Bấm chia sẻ nha.',
    'Chia sẻ live cho đứa bạn hay khoe học giỏi vào đây thử sức coi.',
    'Bấm theo dõi kênh để mai còn vào lớp đúng giờ nha các em.',
    'Thả tim cho đầy bảng đi cả lớp, đủ tim là cả lớp vỗ tay.',
    'Rủ thêm bạn vào đi, lớp còn nhiều ghế trống lắm.',
    'Ai đứng ngoài cửa lớp thì trả lời đúng nhiều để được vào ghế ngồi nha.',
  ] as L0,
  idle: [
    'Lớp im re vậy, ngủ hết rồi hả?',
    'Có ai còn ở đây không? Cô thấy lớp vắng tanh.',
    'Cả lớp đi ăn vặt hết rồi hay sao vậy?',
    'Im lặng quá, cô nghe được tiếng muỗi bay luôn.',
    'Gõ gì đó đi các em, cô đứng một mình buồn lắm.',
    'Ai còn thức thì gõ "có mặt" cho cô biết với.',
    'Lớp mình đang nghĩ đáp án hay đang lướt TikTok khác vậy?',
    'Cô đếm tới ba, không ai gõ là cô cho bài tập về nhà. Một... hai...',
    'Ủa, mạng rớt hay cả lớp rớt vậy?',
    'Mấy em im quá, cô tưởng mình đang dạy lớp ma.',
  ] as L0,
  clap: [
    'Đủ tim rồi, cả lớp vỗ tay nào!',
    'Tim đầy bảng rồi! Vỗ tay cho lớp mình!',
    'Cảm ơn cả lớp thả tim, cô vui quá. Vỗ tay!',
    'Tim nhiều quá, cô cho cả lớp vỗ tay ăn mừng.',
  ] as L0,

  // ---------- Giờ ra chơi ----------
  recessIntro: [
    'Ra chơi! Mười phút... à không, một phút thôi. Chơi với cô một trò nha.',
    'Tùng tùng tùng, giờ ra chơi! Cô có trò này hay lắm.',
    'Giải lao chút nha cả lớp. Cô chơi với các em một trò.',
    'Ra chơi rồi! Cất sách vở, chơi với cô.',
    'Học mệt rồi, ra chơi một chút. Trò này dễ lắm, ai cũng chơi được.',
  ] as L0,

  rpsIntro: [
    'Oẳn tù tì với cô! Gõ búa, kéo hoặc bao. Thắng cô được cộng hai điểm.',
    'Chơi oẳn tù tì nha. Gõ búa, kéo hay bao vào bình luận. Cô ra sau cùng.',
    'Trò oẳn tù tì! Mỗi người gõ một lần thôi: búa, kéo hoặc bao.',
    'Ai dám đấu oẳn tù tì với cô? Gõ búa, kéo hoặc bao. Thắng được hai điểm.',
  ] as L0,
  rpsReveal: [
    (pick, rest) => `Cô ra ${pick}! ${rest}`,
    (pick, rest) => `Một, hai, ba, cô ra ${pick}. ${rest}`,
    (pick, rest) => `Oẳn tù tì ra cái gì ra cái này: ${pick}! ${rest}`,
    (pick, rest) => `Cô chọn ${pick} nha. ${rest}`,
  ] as L2,
  rpsWin: [
    (c) => `Có ${c} bạn thắng cô, mỗi bạn hai điểm.`,
    (c) => `${c} bạn thắng rồi, cô thua tâm phục khẩu phục.`,
    (c) => `Cô thua ${c} bạn. Hai điểm cho mỗi người.`,
  ] as L1,
  rpsLose: [
    (c) => `${c} bạn thua cô. Về tập oẳn tù tì thêm đi.`,
    (c) => `Cô hạ được ${c} bạn. Cô vẫn còn phong độ lắm.`,
    (c) => `${c} bạn thua cô kìa. Lêu lêu.`,
  ] as L1,
  rpsNobody: [
    'Không ai chơi với cô hết. Cô tự oẳn tù tì với cái bảng vậy.',
    'Lớp mình sợ thua cô nên không ai chơi hả?',
    'Không ai ra cái gì. Cô thắng mặc định nha.',
  ] as L0,

  callUp: [
    (n) => `Kiểm tra miệng! Cô mời ${n} lên bảng. Em có mười lăm giây.`,
    (n) => `${n} đâu rồi? Lên bảng trả bài cho cô. Mười lăm giây nha.`,
    (n) => `Hôm nay cô gọi ${n}. Chỉ mình em được trả lời câu này.`,
    (n) => `${n} ơi, tới lượt em kiểm tra miệng. Cả lớp im lặng nghe bạn trả lời.`,
    (n) => `Cô dò tên trong sổ... ${n}! Lên bảng.`,
    (n) => `${n} ngồi im quá, cô gọi em lên. Mười lăm giây, đúng được năm điểm.`,
    (n) => `Mời ${n} lên bảng! Các bạn khác không được nhắc bài nha.`,
    (n) => `Kiểm tra miệng nha, cô chọn ${n}. Run chưa em?`,
  ] as L1,
  callUpRight: [
    (n) => `${n} trả lời đúng! Năm điểm, về chỗ.`,
    (n) => `Giỏi quá ${n}! Cô cho em năm điểm miệng.`,
    (n) => `${n} học bài kỹ ghê. Đúng rồi, năm điểm nha.`,
    (n) => `Chuẩn rồi ${n}! Cả lớp vỗ tay cho bạn.`,
    (n) => `${n} qua bài kiểm tra miệng. Cô yên tâm rồi.`,
    (n) => `Đúng luôn ${n}. Cô định làm khó mà em không sợ.`,
  ] as L1,
  callUpWrong: [
    (n) => `${n} sai rồi em. Về chỗ, mai trả bài lại.`,
    (n) => `Ôi ${n}, cô gọi đúng lúc em chưa học bài.`,
    (n) => `${n} trả lời sai. Cô không ghi sổ đâu, lần sau cố lên.`,
    (n) => `Sai rồi ${n}. Em có xem bảng không vậy?`,
    (n) => `${n} ơi, đáp án đâu phải vậy. Về chỗ ngồi suy nghĩ nha.`,
    (n) => `Câu dễ vậy mà ${n} sai. Cô mời phụ huynh nha... đùa thôi.`,
    (n) => `${n} gõ tự tin ghê mà sai. Cô cho em điểm tự tin.`,
    (n) => `Chưa đúng ${n}. Cả lớp đừng cười bạn nha, ai cũng có lúc vậy.`,
  ] as L1,
  callUpSilent: [
    (n) => `${n} im lặng luôn. Chắc em ngủ gật rồi.`,
    (n) => `Hết giờ mà ${n} không nói gì. Cô ghi tên vô sổ đầu bài nha.`,
    (n) => `${n} đâu rồi? Cô gọi mà không thấy trả lời.`,
    (n) => `${n} đứng hình luôn. Về chỗ đi em.`,
    (n) => `${n} chắc đang đi lấy nước. Thôi để lần sau.`,
    (n) => `Mười lăm giây trôi qua, ${n} vẫn im. Cô hiểu rồi, chưa học bài.`,
    (n) => `${n} trốn kiểm tra miệng hả? Cô nhớ tên em rồi nha.`,
    (n) => `${n} không trả lời. Cả lớp nhắc bạn học bài đi.`,
  ] as L1,

  pickIntro: [
    (a, b) => `Chọn phe nha! ${a} hay ${b}? Gõ số một nếu chọn ${a}, số hai nếu chọn ${b}.`,
    (a, b) => `Cả lớp chia phe: một là ${a}, hai là ${b}. Gõ số đi.`,
    (a, b) => `Câu hỏi khó nhất hôm nay: ${a} hay ${b}? Gõ một hoặc hai.`,
    (a, b) => `Bỏ phiếu nha. Số một là ${a}, số hai là ${b}.`,
  ] as L2,
  pickResult: [
    (win, pct) => `Phe ${win} thắng với ${pct} phần trăm.`,
    (win, pct) => `${pct} phần trăm cả lớp chọn ${win}. Phe kia ra góc lớp đứng.`,
    (win, pct) => `Kết quả: ${win} thắng, ${pct} phần trăm.`,
    (win, pct) => `Lớp mình chọn ${win}, ${pct} phần trăm luôn.`,
  ] as L2,
  pickRoast: [
    (lose) => `Phe ${lose} ít người quá, ăn nói cẩn thận nha.`,
    (lose) => `Ai chọn ${lose} thì giơ tay lên cho cô coi mặt.`,
    (lose) => `Phe ${lose} thua rồi, về nhà suy nghĩ lại cuộc đời đi.`,
    (lose) => `Cô không bênh ai, nhưng chọn ${lose} là hơi lạ đó.`,
    (lose) => `${lose} cũng ngon mà, sao ít người chọn vậy ta?`,
    (lose) => `Phe ${lose} ơi, đừng buồn, cô cũng từng chọn sai.`,
  ] as L1,
  pickTie: [
    'Hòa luôn! Lớp mình chia đôi rõ ràng quá.',
    'Hai phe bằng nhau. Thôi khỏi cãi, chọn cả hai.',
  ] as L0,
  pickNobody: [
    'Không ai chọn phe nào. Lớp mình trung lập ghê.',
    'Chưa ai bỏ phiếu hết. Thôi cô chọn giùm luôn.',
  ] as L0,

  rollIntro: [
    'Điểm danh siêu tốc! Gõ "có mặt" thật nhanh. Mười bạn đầu tiên được ba điểm.',
    'Ai có mặt thì gõ "có mặt"! Mười bạn nhanh nhất có điểm.',
    'Cô điểm danh nè, gõ "có mặt" đi. Nhanh tay thì có ba điểm.',
    'Điểm danh! Gõ "có mặt". Mười bạn đầu tiên cô cộng ba điểm.',
  ] as L0,
  rollResult: [
    (names) => `Nhanh nhất là ${names}. Mỗi bạn ba điểm.`,
    (names) => `Có mặt sớm nhất: ${names}. Ba điểm nha.`,
    (names) => `${names} điểm danh nhanh nhất. Cộng ba điểm.`,
    (names) => `Cô ghi nhận ${names} có mặt đầu tiên.`,
  ] as L1,
  rollNobody: [
    'Không ai có mặt hả? Vậy cô dạy cho ai nghe?',
    'Điểm danh mà không ai trả lời. Cả lớp trốn học hết rồi.',
  ] as L0,

  heartIntro: [
    (t) => `Thử thách thả tim! Ba mươi giây, cả lớp thả đủ ${t} tim thì ai cũng được một điểm.`,
    (t) => `Cả lớp thả tim đi! Đủ ${t} tim trong ba mươi giây là có quà.`,
    (t) => `Tim nào tim nào! Cần ${t} tim trong ba mươi giây.`,
    (t) => `Thả tim lẹ lên các em, đủ ${t} tim cô cộng điểm cả lớp.`,
  ] as L1,
  heartWin: [
    'Đủ tim rồi! Cả lớp mỗi người một điểm.',
    'Lớp mình đoàn kết quá. Một điểm cho tất cả!',
    'Thành công! Cô cộng mỗi bạn một điểm.',
    'Tim đầy rồi, cả lớp được điểm. Cô vui quá.',
  ] as L0,
  heartFail: [
    (c) => `Mới được ${c} tim thôi, chưa đủ. Lần sau thả mạnh tay hơn nha.`,
    (c) => `${c} tim, thiếu chút xíu. Tiếc quá cả lớp ơi.`,
    (c) => `Chỉ có ${c} tim. Ngón tay lớp mình yếu quá.`,
    (c) => `${c} tim thôi hả? Cô buồn nhẹ.`,
  ] as L1,
};

// Câu hỏi "chọn phe" cho giờ ra chơi
export const PICK_TOPICS: [string, string][] = [
  ['phở', 'bún bò'],
  ['trà sữa', 'cà phê'],
  ['chó', 'mèo'],
  ['đi biển', 'đi núi'],
  ['Tết ở quê', 'Tết ở phố'],
  ['mì tôm trứng', 'mì tôm xúc xích'],
  ['ngủ nướng', 'dậy sớm'],
  ['ăn cay', 'không ăn cay'],
  ['mùa hè', 'mùa đông'],
  ['xem phim', 'chơi game'],
  ['bánh mì', 'xôi'],
  ['nhắn tin', 'gọi điện'],
  ['Liên Quân', 'Free Fire'],
  ['cơm nhà', 'cơm quán'],
  ['tóc dài', 'tóc ngắn'],
  ['đi xe máy', 'đi ô tô'],
  ['học sáng', 'học tối'],
  ['bàn đầu', 'bàn cuối'],
  ['kem', 'chè'],
  ['nhạc ballad', 'nhạc remix'],
  ['gà rán', 'pizza'],
  ['ở nhà', 'đi chơi'],
  ['toán', 'văn'],
  ['bánh chưng', 'bánh tét'],
  ['người yêu', 'tiền'],
  ['sầu riêng', 'mít'],
  ['trà đá', 'trà chanh'],
  ['Hà Nội', 'Sài Gòn'],
  ['iPhone', 'Android'],
  ['xem TikTok', 'xem YouTube'],
];
