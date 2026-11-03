// =====================================================
//  CẤU HÌNH LỚP HỌC CHỮ: số liệu + mọi câu cô giáo đọc
//  "F:" ở đầu câu = giọng nữ (cô giáo). `name` = tên người xem đã làm sạch.
// =====================================================

const F = (s: string) => `F: ${s}`;

export const GAME = {
  title: 'LỚP HỌC CHỮ',
  defaultChannelName: 'lớp mình',

  // ---------- Nhịp một ván ----------
  questionsPerRound: 10,
  introSec: 8, // cô giới thiệu đầu ván
  questionSec: 25, // thời gian trả lời (chủ kênh chốt 25 giây)
  endAfterFirstSec: 0, // 0 = luôn đủ 25 giây cho cả lớp. Đặt vd 10: có người đúng thì 10 giây sau chốt luôn (hợp lúc phòng vắng)
  bonusSec: 10, // hết giờ chưa ai đúng: mở 1 chữ, thêm chừng này giây
  revealSec: 7,
  resultsSec: 15,

  // ---------- Điểm ----------
  rankPoints: [10, 7, 5, 3, 3, 3, 3, 3, 3, 3], // nhất 10, nhì 7, ba 5, hạng 4–10 được 3
  latePoints: 1, // đúng sau hạng 10 (thường là chép đáp án trên khung chat)
  streakEvery: 3, // đúng 3 câu liền
  streakBonus: 5, // thưởng thêm
  requireDiacritics: true, // phải gõ đủ dấu mới tính đúng ("phan" không ăn "phấn")
  keepHiddenLetters: 2, // gợi ý không bao giờ mở quá (số chữ - 2)

  // ---------- Lớp ----------
  seats: 20, // 4 dãy bàn trên cùng; dãy cuối nằm dưới giao diện TikTok nên để trống
  standing: 60, // hết ghế: chen chúc đứng 2 bên ngoài cửa lớp hóng (30 mỗi bên), vẫn tính điểm
  joinKeywords: ['vaolop'],

  // ---------- Quà / tim ----------
  hintGiftCoins: 30, // quà từ 30 xu: cô mở thêm 1 chữ cho cả lớp (khi chưa ai đúng)
  likesPerClap: 300, // đủ 300 tim: cả lớp vỗ tay
  clapSec: 5,
  giftThanksCooldownMs: 30_000,
  bigGiftCoins: 99,

  // ---------- Chào người vào ----------
  greetEveryMs: 8000,
  namesPerGreeting: 3,

  shareReminderEveryMs: 6 * 60_000,

  lines: {
    intro: F('Cả lớp ổn định nào! Cô đố mười câu, chữ cô xáo lộn hết rồi. Ai gõ đáp án nhanh nhất thì được nhiều điểm nhất nha.'),
    question: (n: number, clue: string) => F(`Câu ${n}. ${clue}`),
    firstCorrect: (name: string) => F(`Ôi nhanh ghê! Bạn ${name} đúng đầu tiên rồi.`),
    bonus: F('Khó quá hả cả lớp? Cô mở thêm một chữ, cho thêm mười giây nữa nè.'),
    reveal: (answer: string, top: string[], count: number) => {
      const others = count > top.length ? ` Cả lớp có ${count} bạn đúng.` : '';
      const rest = top.length > 1 ? `, rồi tới ${top.slice(1).join(' với ')}` : '';
      return F(`Đáp án là ${answer}. Nhất câu này là ${top[0]}${rest}.${others}`);
    },
    revealNobody: (answer: string) => F(`Không ai đoán ra luôn hả? Đáp án là ${answer} đó cả lớp.`),
    streak: (name: string) => F(`Bạn ${name} đúng ba câu liền, cô thưởng thêm năm điểm.`),
    results: (name: string, score: number) => F(`Hết giờ rồi! Nhất lớp ván này là bạn ${name}, được ${score} điểm. Cả lớp vỗ tay nào!`),
    resultsNobody: F('Ván này chưa ai ghi điểm. Ván sau cả lớp cố lên nha.'),
    outOfQuestions: F('Hết câu hỏi rồi, cô tổng kết luôn nha.'),
    giftHint: (name: string) => F(`Bạn ${name} xin cô mở thêm một chữ, cả lớp nhờ bạn đó nha.`),
    thankGift: (name: string, gift: string) => F(`Cô cảm ơn bạn ${name} tặng ${gift} cho cô nha.`),
    thankFollow: (name: string) => F(`Cô cảm ơn bạn ${name} đã theo dõi kênh nha.`),
    greeting: (names: string) => F(`Chào ${names} vào lớp. Gõ đáp án vào bình luận là chơi được liền.`),
    clap: F('Đủ tim rồi, cả lớp vỗ tay nào!'),
    share: F('Thấy vui thì bấm chia sẻ live rủ bạn bè vào thi với lớp mình nha.'),
  },
};
