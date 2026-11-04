// =====================================================
//  CẤU HÌNH LỚP HỌC CHỮ: số liệu. Câu cô đọc nằm ở loi-thoai.ts, câu hỏi ở cau-hoi/*.txt
// =====================================================

export const GAME = {
  // Tên lớp mặc định (hiện trên bảng hiệu). Chủ kênh đổi ở ô "Tên lớp" trang điều khiển.
  defaultChannelName: 'Lớp Học Chữ',

  // ---------- Một tiết học ----------
  questionsPerRound: 10,
  // độ khó từng câu: 3 dễ, 4 vừa, 3 khó; câu cuối là câu hỏi vàng nhân đôi điểm
  roundPlan: ['easy', 'easy', 'easy', 'medium', 'medium', 'medium', 'medium', 'hard', 'hard', 'hard'] as const,
  introSec: 8, // cô giới thiệu đầu tiết
  questionSec: 20, // thời gian trả lời (chủ kênh chốt 20 giây, 2026-11-04)
  endAfterFirstSec: 0, // 0 = luôn đủ giờ cho cả lớp. Đặt vd 10: có người đúng thì 10 giây sau chốt luôn (hợp lúc phòng vắng)
  bonusSec: 10, // hết giờ chưa ai đúng: mở 1 chữ, thêm chừng này giây
  revealSec: 8,
  resultsSec: 12,
  superFastSec: 4, // đúng trong 4 giây đầu: cô nghi "quay cóp"

  // ---------- Điểm ----------
  rankPoints: [10, 7, 5, 3, 3, 3, 3, 3, 3, 3], // nhất 10, nhì 7, ba 5, hạng 4–10 được 3 (câu hỏi vàng x2)
  latePoints: 1, // đúng sau hạng 10 (thường là chép đáp án trên khung chat)
  streakEvery: 3, // đúng 3 câu liền
  streakBonus: 5, // thưởng thêm
  requireDiacritics: true, // phải gõ đủ dấu mới tính đúng ("phan" không ăn "phấn"); dấu kiểu cũ/mới đều được
  keepHiddenLetters: 2, // gợi ý không bao giờ mở quá (số chữ - 2)
  roastChance: 0.6, // tỉ lệ cô cà khịa 1 bạn trả lời sai lúc hiện đáp án

  // ---------- Giờ ra chơi (sau mỗi tiết) ----------
  recessPlaySec: { rps: 20, callup: 15, pick: 20, roll: 12, heart: 30 },
  recessResultSec: 8,
  recessBoardSec: 10, // bảng "học sinh giỏi hôm nay"
  rpsPoints: 2, // oẳn tù tì thắng cô
  callUpPoints: 5, // kiểm tra miệng trả lời đúng
  rollPoints: 3, // điểm danh nhanh
  rollWinners: 10,
  heartTarget: 300, // thử thách thả tim trong 30 giây

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

  // ---------- Nói chuyện ----------
  greetEveryMs: 8000,
  namesPerGreeting: 3,
  shareReminderEveryMs: 6 * 60_000,
  idleAfterSec: 75, // không ai comment chừng này giây thì cô nhắc
  // câu nói thêm (chào, cà khịa) chờ quá lâu thì bỏ, nhường chỗ cho câu hỏi; cảm ơn quà được chờ lâu hơn
  chatterMaxWaitMs: 7000,
  giftLineMaxWaitMs: 15000,
};
