import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import type { GameState, StageView } from './useGame';
import { GAME, shownTeacherName } from './config';
import { thayHoa } from './xung-ho';
import { Hair } from './Hair';
import { giftOf } from './quiz';
import './stage.css';

/**
 * Màn hình lớp học 1080x1920. Nền là ảnh public/assets/bg/lop.webp (941x1672 phóng lên 1080 ngang),
 * nên mọi toạ độ dưới đây = toạ độ trên ảnh gốc x K.
 */
const K = 1080 / 941;

// Bàn dài + ghế băng vẽ đè lên dãy bàn lẻ trong ảnh nền (đo trên ảnh gốc): mép trên mặt bàn y, mép dưới b, 2 đầu bàn x1..x2.
// n = số bạn ngồi mỗi dãy (chủ kênh chốt 2026-11-04: 7–8 bạn một dãy, các bạn nhỏ lại một chút). Dãy cuối nằm dưới giao diện TikTok nên để trống.
const ROWS = [
  { y: 812, b: 922, x1: 100, x2: 838, n: GAME.rowSeats[0], s: 0.92 },
  { y: 942, b: 1069, x1: 72, x2: 870, n: GAME.rowSeats[1], s: 0.98 },
  { y: 1093, b: 1232, x1: 45, x2: 902, n: GAME.rowSeats[2], s: 1.04 },
  { y: 1253, b: 1414, x1: 28, x2: 922, n: GAME.rowSeats[3], s: 1.1 },
  { y: 1458, b: 1646, x1: 5, x2: 938, n: 0, s: 1.16 },
];
const KID = 0.82; // các bạn nhỏ hơn bản ghế lẻ để ngồi vừa bàn dài (2026-11-07 thử 45 ghế KID 0.7 rồi quay lại)
const SEAT_ROW: number[] = ROWS.flatMap((r, ri) => Array.from({ length: r.n }, () => ri));
const SPRITE_H = 250; // chiều cao cả người
const SHOW = 0.5; // ngồi ghế: chỉ hiện phần trên (đầu tới hông)
// khung đầu đã xoá khỏi ảnh thân sau lưng, tính theo tỉ lệ ảnh (tools/tach-nen.py ghi ra public/assets/nv/*/head.json)
const HEAD = { nam: { x: 0.136, y: 0, w: 0.682, h: 0.284 }, nu: { x: 0.174, y: 0, w: 0.668, h: 0.248 } };
// màu 4 tổ (bản riêng cô Ngân): tổ 1 đỏ, tổ 2 xanh dương, tổ 3 xanh lá, tổ 4 vàng
const TEAM_COLOR = ['#ef4444', '#3b82f6', '#16a34a', '#f59e0b'];
const TEAM_ICON = ['🔴', '🔵', '🟢', '🟡'];

const POSE = {
  nam: { dung: '01-dung', tay: '02-giong-tay', nghi: '03-suy-nghi', vui: '05-vui-mung', buon: '06-buon', ngac: '07-ngac-nhien', chao: '08-vay-chao' },
  nu: { dung: '01-dung', tay: '02-giong-tay', nghi: '03-suy-nghi', vui: '05-vui-mung', buon: '06-buon', ngac: '07-ngac-nhien', chao: '08-vay-chao' },
};
type PoseKey = keyof typeof POSE.nam;

// Trang phục cô Ngân (bản riêng): bộ trắng dùng tên tư thế gốc; sơ mi và áo dài xanh ngọc có bộ 16 tư thế khác tên,
// đổi sang tư thế gần nghĩa nhất. 2 game lớn có bộ đồ + tư thế riêng (showPose).
const OUTFIT_POSE: Record<string, string> = {
  '01-dung': '01-dung',
  '02-gioi-thieu': '02-giang-bai',
  '03-chi-bang': '04-chi-phai', // bảng đen ở bên phải cô
  '04-vay-chao': '13-vay-chao',
  '05-dang-tay': '15-chao-don',
  '06-cuoi': '06-cuoi-che-mieng',
  '07-tay-nguc': '05-cuoi-tuoi',
  '08-ngon-cai': '08-like',
  '09-mung': '14-co-vu',
  '10-vo-tay': '07-vo-tay',
  '11-nhun-vai': '12-nhun-vai',
  '12-gai-dau': '11-suy-nghi',
  '13-ngac-nhien': '10-bat-ngo',
  '14-ngon-tro': '09-nghiem-nhe',
  '15-chong-hong': '16-tu-tin',
  '16-chi-trai': '03-chi-trai',
};
const EVEREST_POSES = [
  '01-dung-san-sang', '02-chi-len-dinh', '03-chi-lo-trinh', '04-chao-doan-leo', '05-doc-ban-do', '06-suy-nghi', '07-like', '08-co-vu',
  '09-bat-ngo', '10-cuoi-vui', '11-nhac-nho-an-toan', '12-vay-chao', '13-cam-co-dinh', '14-dong-vien', '15-vo-tay', '16-tu-tin',
];
const CHUONG_POSES = [
  '01-cam-chuong-san-sang', '02-rung-chuong-ben', '03-rung-chuong-cao', '04-rung-chuong-hai-tay', '05-rung-chuong-nghieng-nguoi',
  '06-rung-chuong-cuoi-tuoi', '07-rung-chuong-hao-hung', '08-rung-chuong-nghiem-tuc', '09-bao-hieu-bat-dau', '10-mung-chien-thang',
  '11-bat-ngo-nghe-chuong', '12-moi-thi-sinh', '13-vay-chao-cam-chuong', '14-tu-hao-gio-chuong', '15-chuan-bi-rung', '16-nghi-thang-tran',
];

// tải trước mọi tư thế để đổi tư thế không bị nháy trắng
const ALL_IMGS = [
  ...Object.values(POSE.nam).map((p) => `/assets/nv/nam/${p}.webp`),
  ...Object.values(POSE.nu).map((p) => `/assets/nv/nu/${p}.webp`),
  ...[
    '01-dung', '02-gioi-thieu', '03-chi-bang', '04-vay-chao', '05-dang-tay', '06-cuoi', '07-tay-nguc', '08-ngon-cai',
    '09-mung', '10-vo-tay', '11-nhun-vai', '12-gai-dau', '13-ngac-nhien', '14-ngon-tro', '15-chong-hong', '16-chi-trai',
  ].map((p) => `/assets/nv/co-ngan/${p}.webp`),
  ...['so-mi', 'ao-dai-xanh-ngoc'].flatMap((o) => Object.values(OUTFIT_POSE).map((p) => `/assets/nv/co-ngan/${o}/${p}.webp`)),
  ...EVEREST_POSES.map((p) => `/assets/nv/co-ngan/everest/${p}.webp`),
  ...CHUONG_POSES.map((p) => `/assets/nv/co-ngan/chuong/${p}.webp`),
];

// Đứng lớp là thầy giáo (cài đặt lớp): chữ trên màn hình đổi "cô" thành "thầy". GameStage đặt cờ này mỗi lần vẽ, trước các khung con
let THAY = false;
const X = (s: string) => (THAY ? thayHoa(s) : s);

// Thầy giáo (2026-11-07): 8 tư thế, ảnh gốc nhan-vat/thay-giao, tách nền ra public/assets/nv/thay (tools/tach-nen.mjs).
// Tư thế cô Ngân (16 kiểu) đổi sang tư thế thầy gần nghĩa nhất. Bảng đen ở bên phải nên chỉ bảng = chỉ phải.
const THAY_POSE: Record<string, string> = {
  '01-dung': '01-dung',
  '02-gioi-thieu': '02-giang-bai',
  '03-chi-bang': '04-chi-phai',
  '04-vay-chao': '08-vay-chao',
  '05-dang-tay': '02-giang-bai',
  '06-cuoi': '05-vui-mung',
  '07-tay-nguc': '05-vui-mung',
  '08-ngon-cai': '05-vui-mung',
  '09-mung': '05-vui-mung',
  '10-vo-tay': '05-vui-mung',
  '11-nhun-vai': '06-buon',
  '12-gai-dau': '07-suy-nghi',
  '13-ngac-nhien': '07-suy-nghi',
  '14-ngon-tro': '02-giang-bai',
  '15-chong-hong': '01-dung',
  '16-chi-trai': '03-chi-trai',
};
const THAY_IMGS = [...new Set(Object.values(THAY_POSE))].map((p) => `/assets/nv/thay/${p}.webp`);
/** 2 game lớn khi thầy đứng lớp: thầy chỉ có 1 bộ đồ, chọn tư thế theo bước */
function thayShowPose(v: StageView, now: number): string {
  const sh = v.show!;
  const alt = now % 6000 < 3000;
  if (now - v.lastFlowerAt < 3000 || v.walk || v.clapping) return '05-vui-mung';
  if (sh.step === 'gather') return '08-vay-chao';
  if (sh.step === 'honor') return '05-vui-mung';
  if (sh.stage === 'reveal' || sh.step === 'codeReveal') return sh.lastRight > 0 || sh.code?.solved ? '05-vui-mung' : '06-buon';
  if (!(sh.stage === 'ask' && v.boardShown)) return '02-giang-bai';
  return alt ? '04-chi-phai' : '07-suy-nghi';
}

function useNow(ms = 250) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), ms);
    return () => clearInterval(t);
  }, [ms]);
  return now;
}

export function GameStage({ game }: { game: GameState }) {
  const now = useNow();
  const v = game.view;
  THAY = v?.cfg.teacher === 'thay';
  useEffect(() => {
    for (const src of [...(THAY ? THAY_IMGS : ALL_IMGS), ...GIAM_THI_IMGS]) new Image().src = src;
  }, [THAY]);
  if (!v) {
    return (
      <div className="flex h-full items-center justify-center bg-black/60 p-20 text-center text-[48px] text-white">
        Chưa mở trang stage (lvh.me:3000/?view=stage) nên chưa có gì để xem trước
      </div>
    );
  }
  return (
    <div className={`relative h-full w-full overflow-hidden ${v.clapping ? 'class-clap' : ''}`}>
      {/* nền riêng tải lên ở trang điều khiển phủ lên nền gốc; ảnh riêng không có bảng đen nên game tự vẽ 1 tấm ở đúng chỗ */}
      {v.cfg.bg && <img src={`/room-bg/${v.cfg.bg}`} className="absolute inset-0 h-full w-full object-cover" />}
      {v.cfg.bg && <div className="absolute left-[332px] top-[244px] h-[384px] w-[592px] rounded-[10px] border-[12px] border-[#7a4a1d] bg-[#1d4a38] shadow-[0_8px_14px_rgba(0,0,0,0.4)]" />}
      {/* tặng hoa: chỉ có bạn nhỏ đi lên bục đưa cô (FlowerWalk), không zoom, không khung cận cảnh (chủ kênh bỏ 2026-11-04).
          Giữ motion.div như cũ (scale luôn 1): đổi sang div thường thì hình trên live khác đi */}
      <motion.div className="absolute inset-0" style={{ transformOrigin: '330px 700px' }} animate={{ scale: 1 }}>
        {/* sàn lớp trong ảnh nền hơi chói: phủ 1 lớp tối nhẹ từ chân bảng trở xuống (chủ kênh chỉnh 2026-11-04) */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 top-[600px] bg-gradient-to-b from-[#3b1d07]/0 via-[#3b1d07]/20 to-[#3b1d07]/28 mix-blend-multiply" />
        <Header v={v} name={game.channelName} />
        <EventBadge v={v} />
        <Motto text={v.cfg.motto} />
        <Board v={v} now={now} />
        <DayTop v={v} />
        <TeamBoard v={v} />
        <TalkTop v={v} />
        <GiftPile v={v} />
        <ClassFund v={v} />
        <GiftMenu />
        <Vase v={v} />
        <Teacher v={v} now={now} />
        <Punished v={v} />
        <Podium v={v} />
        {v.phase !== 'show' && <SeatHint now={now} asking={v.phase === 'question' || v.phase === 'bonus'} />}
        <Students v={v} now={now} />
        <FlowerWalk v={v} />
        <Dancers v={v} />
        <Escort v={v} />
      </motion.div>
      <DanceBanner v={v} />
      <GiftBanner gift={game.lastGift} now={now} />
      <BirthdayBanner v={v} />
      <GoodbyeBanner v={v} />
      <FundParty v={v} />
      <LoveHearts n={v.loveFans} />
      <PollCard v={v} />
      {(v.clapping || v.fund.party > 0) && <Claps />}
    </div>
  );
}

// Quà cô nhận trong buổi: xếp thẳng ra chỗ cửa lớp bên trái (sau lưng cô), bó càng to icon càng to, chồng dần lên
const PILE_PER_ROW = 5;
function GiftPile({ v }: { v: StageView }) {
  const pile = v.gifts;
  return (
    <div className="pointer-events-none absolute left-[2px] top-[640px] z-[1] h-[230px] w-[150px]">
      {pile.map(({ tier, icon }, i) => {
        const t = GAME.giftTiers[tier];
        const size = 26 * t.size;
        const row = Math.floor(i / PILE_PER_ROW);
        const col = i % PILE_PER_ROW;
        return (
          <motion.div
            key={i}
            initial={i === pile.length - 1 ? { scale: 0, x: 220, y: -40 } : false}
            animate={{ scale: 1, x: 0, y: 0 }}
            transition={{ delay: i === pile.length - 1 ? (GAME.walkMs * 0.65) / 1000 : 0, type: 'spring', stiffness: 140, damping: 14 }}
            className="absolute leading-none drop-shadow-[0_3px_2px_rgba(0,0,0,0.35)]"
            style={{ fontSize: size, left: 6 + col * 26 + (row % 2) * 12 - size / 4, top: 210 - size - row * 24 }}
          >
            {icon}
          </motion.div>
        );
      })}
    </div>
  );
}

// Bảng "Gửi tặng cô Ngân" giữa Quỹ lớp và Top tương tác (chủ kênh 2026-11-05): viết kiểu gửi tặng, không giục,
// không hứa điểm hay lợi thế (TikTok cấm khuyến khích tặng quà). Món và câu mô tả ở GAME.giftMenu
function GiftMenu() {
  return (
    // cột hẹp bên phải bảng đen (như Quỹ lớp), mỗi món 1 dòng: không đè lên câu hỏi
    <div className="absolute right-[8px] top-[484px] z-[8] w-[168px] rotate-1 rounded-[14px] border-[3px] border-[#c9a45c] bg-[#fff8e1]/95 px-2 pb-1 pt-[2px] text-[#4a2c0e] shadow-[0_6px_10px_rgba(0,0,0,0.3)]">
      <div className="whitespace-nowrap text-center text-[16px] font-extrabold leading-tight text-[#be185d]">{X('🎁 Gửi tặng cô 💕')}</div>
      {GAME.giftMenu.map((g) => (
        <div key={g.label} className="flex items-center gap-[2px] whitespace-nowrap text-[15px] font-semibold leading-[24px]">
          <span className="w-6 text-center text-[19px]">{g.icon}</span>
          {X(g.caption)}
        </div>
      ))}
    </div>
  );
}

// Quỹ lớp: cột phải, giữa bảng Thi đua tổ và Top tương tác. Mỗi xu quà = 1 bông hoa vào quỹ, có mốc trong ngày
function ClassFund({ v }: { v: StageView }) {
  const f = v.fund;
  return (
    // chỉ ghi "Quỹ lớp" + số bông (chủ kênh bỏ mục tiêu 2026-11-05), nằm trong cột hẹp bên phải bảng đen, không đè câu hỏi
    <div className="absolute right-[8px] top-[428px] z-20 flex w-[168px] -rotate-1 items-baseline justify-between rounded-[14px] border-[3px] border-[#c9a45c] bg-[#fff8e1]/95 px-2 pb-1 pt-2 text-[#be185d] shadow-[0_6px_10px_rgba(0,0,0,0.3)]">
      <div className="absolute -top-[18px] left-1/2 -translate-x-1/2 text-[28px]">📌</div>
      <span className="whitespace-nowrap text-[19px] font-extrabold leading-tight">💝 Quỹ lớp</span>
      <span className="text-[28px] font-extrabold leading-tight">{f.today}</span>
    </div>
  );
}

// Quỹ hoa đạt mốc: biểu ngữ + pháo hoa (vỗ tay) 8 giây
function FundParty({ v }: { v: StageView }) {
  return (
    <AnimatePresence>
      {v.fund.party > 0 && (
        <motion.div
          key={v.fund.party}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          className="absolute left-1/2 top-[650px] z-[70] w-[880px] -translate-x-1/2 rounded-[30px] border-4 border-white bg-gradient-to-r from-rose-500 via-pink-500 to-amber-400 px-6 py-4 text-center font-extrabold text-white shadow-2xl"
        >
          <div className="text-[44px] leading-tight">🎆 Quỹ lớp đủ {v.fund.party} bông hoa! 🎆</div>
          <div className="text-[30px]">{X('Cô cảm ơn cả lớp nhiều lắm 💕')}</div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Header({ v, name }: { v: StageView; name: string }) {
  const sub =
    v.phase === 'team'
      ? `Chọn tổ · Tiết ${v.round}`
      : v.phase === 'show' && v.show
      ? v.show.kind === 'everest' ? '🏔️ Đường lên đỉnh Everest' : '🔔 Rung Chuông Đồng'
      : v.phase === 'recess'
      ? 'Giờ ra chơi'
      : v.phase === 'vote'
        ? 'Chọn chủ đề tiết sau'
        : v.qNo > 0 && v.phase !== 'results'
          ? `${v.review ? 'Ôn bài' : `Tiết ${v.round}`} · Câu ${v.qNo}/${v.total}`
          : `Tiết ${v.round}`;
  return (
    <div className="absolute left-1/2 top-[14px] flex w-[470px] -translate-x-1/2 flex-col items-center rounded-[28px] border-[5px] border-[#7a4a1d] bg-[#f6e3b4] px-6 py-3 shadow-[0_8px_0_#5b3512]">
      <div className="max-w-full truncate font-extrabold leading-none tracking-wide text-[#7a2e0e]" style={{ fontSize: name.length > 14 ? 34 : 46 }}>
        {name.toUpperCase()}
      </div>
      {/* sĩ số trong lớp / số bạn đang chờ vào (chỗ bảng sĩ số cũ ở cửa trái giờ là bàn quà của cô) */}
      <div className="mt-1 whitespace-nowrap text-[24px] font-semibold text-[#6b4a22]">
        {sub} · 👥 {v.roster.seated}/{v.roster.seats}
        {v.roster.waiting > 0 && ` · ⏳ chờ ${v.roster.waiting}`}
      </div>
    </div>
  );
}

// ---------- Bảng đen ----------
function Board({ v, now }: { v: StageView; now: number }) {
  const left = Math.max(0, Math.ceil((v.endsAt - now) / 1000));
  return (
    <div className={`chalk absolute left-[350px] top-[262px] h-[348px] w-[555px] text-[#f4f1e6] ${v.golden && v.phase !== 'recess' ? 'golden-board' : ''}`}>
      {v.phase === 'intro' && v.round % 2 === 0 && v.weekTop.length > 0 && <WeekBoard v={v} left={left} />}
      {v.phase === 'intro' && !(v.round % 2 === 0 && v.weekTop.length > 0) && (
        <div className="flex h-full flex-col items-center justify-center text-center">
          <div className="text-[64px] leading-none">Sắp vào học!</div>
          <div className="mt-6 text-[36px] leading-snug">
            {X('Cô xáo chữ, cả lớp đoán từ.')}
            <br />
            Gõ đáp án vào <b className="text-[#ffe680]">bình luận</b>
            <br />
            Nhanh nhất <b className="text-[#ffe680]">+10 điểm</b>
          </div>
          {v.topic && <div className="mt-3 text-[32px] text-[#ffe680]">🗳️ Cả lớp chọn: {v.topic}</div>}
          {v.review && <div className="mt-3 text-[32px] text-[#ffe680]">📖 Giờ ôn bài · gõ "vào lớp" để học bài mới</div>}
          <div className="mt-4 text-[30px] opacity-80">Bắt đầu sau {left} giây</div>
        </div>
      )}

      {(v.phase === 'question' || v.phase === 'bonus' || v.phase === 'reveal') && (
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between">
            {v.golden ? (
              <span className="rounded-full bg-[#ffd84a] px-4 text-[28px] font-bold text-[#7a2e0e]">⭐ CÂU HỎI VÀNG x2</span>
            ) : !v.slot && !v.boardShown ? (
              // câu chữ thường đang đọc đề: ẩn nhãn chủ đề (cũng là gợi ý), chỉ hiện "Câu N"
              <span />
            ) : (
              <span className={`rounded-full border-2 px-4 text-[26px] ${v.slot ? 'border-[#ffe680] text-[#ffe680]' : 'border-[#f4f1e6]/60'}`}>
                {v.slot === 'meo'
                  ? `🤪 Đố mẹo ${v.riddleNo}/2`
                  : v.slot === 'su'
                    ? '📜 Lịch sử'
                    : v.slot === 'anh'
                      ? '🔤 Tiếng Anh'
                      : v.slot === 'dh'
                        ? '🖼️ Đuổi hình bắt chữ'
                        : v.category}
              </span>
            )}
            {v.phase !== 'reveal' ? <Timer left={left} /> : <span className="text-[34px] text-[#9df29d]">Đáp án</span>}
          </div>
          {!v.boardShown ? (
            v.riddleNo === 1 ? (
              // mở màn phần đố mẹo: cô đang dẫn, bảng báo trước để cả lớp chuẩn bị
              <motion.div
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 160, damping: 13 }}
                className="flex flex-1 flex-col items-center justify-center text-center"
              >
                <motion.div animate={{ rotate: [-8, 8, -8] }} transition={{ duration: 1.2, repeat: Infinity }} className="text-[90px] leading-none">
                  🤪
                </motion.div>
                <div className="mt-2 text-[58px] font-bold leading-none text-[#ffe680]">PHẦN ĐỐ MẸO</div>
                <div className="mt-3 text-[36px]">2 câu liền · vẫn tính điểm</div>
                <div className="mt-2 text-[32px] opacity-90">Chuẩn bị tinh thần, nghĩ xéo mới thắng!</div>
              </motion.div>
            ) : (
            // cô đang đọc đề: chưa hiện chữ xáo / phép tính, hô bắt đầu mới hiện
            <div className="flex flex-1 flex-col items-center justify-center text-center">
              {/* cô đang đọc: chỉ hiện "Câu N", KHÔNG hiện gợi ý (chủ kênh 2026-11-05: hiện gợi ý thì người đọc nhanh đoán trước, không công bằng).
                  Đọc xong mới hiện gợi ý + chữ xáo + ô đáp án cùng lúc */}
              <div className="text-[72px] font-bold leading-none text-[#ffe680]">Câu {v.qNo}</div>
              <motion.div
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.4, repeat: Infinity }}
                className="mt-6 text-[40px] text-[#ffe680]"
              >
                {X('👂 Nghe cô đọc đề nè…')}
              </motion.div>
            </div>
            )
          ) : v.slot === 'dh' ? (
            // đuổi hình bắt chữ: hình ghép bằng emoji thật to, bên dưới là ô đáp án
            <motion.div
              key={v.clue}
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 160, damping: 14 }}
              className={`mt-3 shrink-0 whitespace-nowrap text-center text-[84px] leading-[110px] ${v.phase === 'reveal' ? 'opacity-60' : ''}`}
            >
              {v.clue}
            </motion.div>
          ) : v.math ? (
            // câu toán: phép tính viết to bằng phấn, người xem gõ số
            <motion.div
              key={v.math}
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className={`mt-4 shrink-0 text-center text-[76px] font-extrabold leading-[96px] text-[#ffe680] ${v.phase === 'reveal' ? 'opacity-50' : ''}`}
            >
              {v.math}
            </motion.div>
          ) : (
            <>
              <div className="mt-2 line-clamp-2 min-h-[96px] shrink-0 text-center text-[38px] leading-[48px]">{v.clue}</div>
              <Tiles letters={v.tiles} dim={v.phase === 'reveal'} />
            </>
          )}
          {v.boardShown && <Slots slots={v.slots} reveal={v.phase === 'reveal'} />}
          {v.boardShown && v.math && v.phase !== 'reveal' && <div className="mt-2 text-center text-[28px] opacity-80">Gõ số vào bình luận</div>}
          {v.phase === 'bonus' && (
            <div className="mt-auto text-center text-[28px] text-[#ffe680]">{v.math ? 'Thêm 10 giây, nhẩm lẹ lên!' : X('Cô mở thêm 1 chữ, thêm 10 giây!')}</div>
          )}
        </div>
      )}

      {v.phase === 'team' && <TeamPick v={v} left={left} />}
      {v.phase === 'show' && v.show && <ShowBoard v={v} left={left} />}
      {v.phase === 'praise' && <Praise v={v} />}
      {v.phase === 'vote' && v.vote && <Vote v={v} left={left} />}
      {v.phase === 'results' && <Results v={v} />}
      {v.phase === 'recess' && v.recess && <Recess v={v} left={left} />}
    </div>
  );
}

function Timer({ left }: { left: number }) {
  const urgent = left <= 5;
  return (
    <motion.div
      key={urgent ? left : 'calm'}
      initial={urgent ? { scale: 1.35 } : false}
      animate={{ scale: 1 }}
      className={`flex h-[78px] min-w-[78px] items-center justify-center rounded-full border-[5px] px-2 text-[50px] font-bold leading-none ${urgent ? 'border-[#ff8a7a] bg-[#ff8a7a]/20 text-[#ff8a7a]' : 'border-[#f4f1e6]'}`}
    >
      {left}
    </motion.div>
  );
}

function Tiles({ letters, dim }: { letters: string[]; dim: boolean }) {
  const n = letters.length || 1;
  const size = Math.min(76, Math.floor((555 - 8 * (n - 1)) / n));
  return (
    <div className={`mt-3 flex justify-center gap-2 ${dim ? 'opacity-40' : ''}`}>
      {letters.map((ch, i) => (
        <motion.div
          key={`${i}${ch}`}
          initial={{ y: -30, opacity: 0, rotate: -8 }}
          animate={{ y: 0, opacity: 1, rotate: ((i * 37) % 9) - 4 }}
          transition={{ delay: i * 0.05, type: 'spring', stiffness: 300, damping: 18 }}
          className="tile flex items-center justify-center font-extrabold"
          style={{ width: size, height: size * 1.1, fontSize: size * 0.62 }}
        >
          {ch}
        </motion.div>
      ))}
    </div>
  );
}

function Slots({ slots, reveal }: { slots: (string | null)[]; reveal: boolean }) {
  const n = slots.length || 1;
  const size = Math.min(56, Math.floor((555 - 6 * (n - 1)) / n));
  return (
    <div className="mt-4 flex justify-center gap-[6px]">
      {slots.map((ch, i) =>
        ch === ' ' ? (
          <div key={i} style={{ width: size * 0.5 }} />
        ) : (
          <div
            key={i}
            className={`flex items-end justify-center border-b-4 ${reveal ? 'border-[#9df29d] text-[#9df29d]' : 'border-[#f4f1e6]'}`}
            style={{ width: size, height: size, fontSize: size * 0.8, lineHeight: 1 }}
          >
            {ch ?? ''}
          </div>
        ),
      )}
    </div>
  );
}

// Cả lớp chọn chủ đề tiết sau: gõ 1 hoặc 2
function Vote({ v, left }: { v: StageView; left: number }) {
  const r = v.vote!;
  const total = r.counts[0] + r.counts[1] || 1;
  return (
    <div className="flex h-full flex-col items-center text-center">
      <div className="flex w-full items-center justify-between">
        <span className="rounded-full bg-[#ffd84a] px-4 text-[26px] font-bold text-[#7a2e0e]">🗳️ Cả lớp quyết định</span>
        <Timer left={left} />
      </div>
      <div className="mt-1 text-[44px] leading-tight text-[#ffe680]">Tiết sau học gì?</div>
      <div className="mt-3 w-full space-y-4 px-4">
        {r.topics.map((label, i) => {
          const pct = Math.round((r.counts[i] / total) * 100);
          return (
            <div key={label} className="relative h-[76px] overflow-hidden rounded-2xl border-2 border-white/40 text-left">
              <div className="absolute inset-y-0 left-0 bg-[#ffd84a]/35 transition-all duration-500" style={{ width: `${pct}%` }} />
              <div className="relative flex h-full items-center justify-between gap-3 px-4 text-[32px]">
                <span className="truncate">
                  Gõ <b className="text-[#ffe680]">{i + 1}</b>: {label}
                </span>
                <span>{r.counts[i]}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Dừng giữa tiết: bạn nhỏ giỏi nhất từ đầu tiết, kèm quà cô vừa tặng
function Praise({ v }: { v: StageView }) {
  return (
    <div className="flex h-full flex-col items-center">
      <div className="text-[50px] leading-none text-[#ffe680]">{X('🎁 Cô phát quà nè!')}</div>
      <div className="mt-1 text-[28px] opacity-80">Bạn nhỏ giỏi nhất sau {v.qNo} câu</div>
      <div className="mt-4 w-full space-y-2">
        {v.praiseTop.map((s, i) => (
          <motion.div
            key={s.username}
            initial={{ x: -40, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: i * 0.4 }}
            className="flex items-center gap-3 px-6 text-[40px]"
          >
            <span className="w-12">{['🥇', '🥈', '🥉'][i]}</span>
            <span className="flex-1 truncate">{s.nickname}</span>
            <span className="text-[34px]">{s.desk[s.desk.length - 1]?.icon}</span>
            <span>{s.score}đ</span>
          </motion.div>
        ))}
      </div>
      <div className="mt-auto text-[30px] text-[#ffe680]">{X('Chào cô, thả tim để được quà nha! 💕')}</div>
    </div>
  );
}

function Results({ v }: { v: StageView }) {
  const top = v.seats.filter((s) => s.score > 0).slice(0, 5);
  return (
    <div className="flex h-full flex-col items-center">
      <div className="text-[56px] leading-none text-[#ffe680]">Bảng vàng tiết {v.round}</div>
      {top.length === 0 && <div className="mt-16 text-[38px]">Chưa ai ghi điểm</div>}
      <div className="mt-4 w-full space-y-1">
        {top.map((s, i) => (
          <motion.div
            key={s.username}
            initial={{ x: -40, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: i * 0.25 }}
            className="flex items-center gap-3 px-6 text-[40px]"
          >
            <span className="w-12 text-[#ffe680]">{['🥇', '🥈', '🥉', '4', '5'][i]}</span>
            <span className="flex-1 truncate">{s.nickname}</span>
            <span>{s.score}đ</span>
          </motion.div>
        ))}
      </div>
      {v.teamWin.length > 0 && (
        <div className="mt-auto text-[36px] text-[#ffe680]">
          🚩 {v.teamWin.map((n) => `Tổ ${n}`).join(' & ')} thắng tiết này!
        </div>
      )}
    </div>
  );
}

// ---------- Chia tổ (bản riêng cô Ngân) ----------
// 45 giây đầu tiết: 4 ô tổ trên bảng đen, số bạn mỗi tổ nhảy lên khi có người chọn
function TeamPick({ v, left }: { v: StageView; left: number }) {
  return (
    <div className="flex h-full flex-col items-center">
      <div className="flex w-full items-center justify-between">
        <span className="rounded-full bg-[#ffd84a] px-4 text-[26px] font-bold text-[#7a2e0e]">🚩 Chọn tổ thi đua</span>
        <Timer left={left} />
      </div>
      <div className="mt-1 text-[32px] leading-tight">
        Gõ <b className="text-[#ffe680]">tổ 1</b>, <b className="text-[#ffe680]">tổ 2</b>, <b className="text-[#ffe680]">tổ 3</b> hoặc <b className="text-[#ffe680]">tổ 4</b>
      </div>
      <div className="mt-2 grid w-full grid-cols-2 gap-2 px-2">
        {v.teams.map((t, i) => (
          <div key={t.no} className="rounded-2xl border-[3px] bg-white/10 text-center leading-[38px]" style={{ borderColor: TEAM_COLOR[i] }}>
            <div className="text-[32px] font-bold" style={{ color: TEAM_COLOR[i] }}>
              {TEAM_ICON[i]} Tổ {t.no}
            </div>
            <motion.div key={t.members} initial={{ scale: 1.4 }} animate={{ scale: 1 }} className="text-[28px] leading-[32px]">
              {t.members} bạn{t.wins > 0 && <span className="ml-2 text-[24px] text-[#ffe680]">🚩{t.wins}</span>}
            </motion.div>
          </div>
        ))}
      </div>
      <div className="mt-auto text-[24px] leading-tight opacity-85">
        {X(v.noTeam > 0 ? `${v.noTeam} bạn chưa chọn, hết giờ cô xếp giùm` : 'Chưa chọn thì cô tự xếp vào tổ ít người')}
      </div>
    </div>
  );
}

// Bảng thi đua tổ: ghim bên phải bảng đen, điểm tiết này của cả tổ, tổ dẫn đầu nổi lên trên, 🚩 = số tiết đã thắng
function TeamBoard({ v }: { v: StageView }) {
  if (!v.teams.length) return null;
  const rows = [...v.teams].sort((a, b) => b.score - a.score || b.wins - a.wins || a.no - b.no);
  const lead = rows[0].score > 0 ? rows[0].no : 0;
  return (
    <div className="absolute right-[8px] top-[150px] z-20 w-[168px] rotate-2 rounded-[14px] border-[3px] border-[#c9a45c] bg-[#fff8e1]/95 px-2 pb-2 pt-3 text-[#4a2c0e] shadow-[0_6px_10px_rgba(0,0,0,0.3)]">
      <div className="absolute -top-[18px] left-1/2 -translate-x-1/2 text-[28px]">📌</div>
      <div className="text-center text-[19px] font-extrabold leading-tight text-[#b45309]">🚩 Thi đua tổ</div>
      <div className="mt-1 space-y-[4px]">
        {rows.map((t) => (
          <motion.div
            key={t.no}
            layout
            className="rounded-lg px-2 py-[2px] text-white shadow"
            style={{ background: TEAM_COLOR[t.no - 1], outline: t.no === lead ? '3px solid #ffd84a' : undefined }}
          >
            <div className="flex items-center justify-between text-[20px] font-extrabold leading-tight">
              <span>
                {t.no === lead ? '👑 ' : ''}Tổ {t.no}
              </span>
              <span>{t.score}đ</span>
            </div>
            <div className="flex justify-between text-[15px] font-semibold leading-tight opacity-95">
              <span>{t.members} bạn</span>
              <span>{t.wins > 0 ? `🚩x${t.wins}` : ''}</span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// Bảng sự kiện bên phải tên kênh: cho khán giả biết lớp có 2 game lớn và phiên tới là game nào, sau tiết mấy
function EventBadge({ v }: { v: StageView }) {
  const n = v.nextShow;
  if (!n) return null;
  // chỉ liệt kê game đang bật ở trang điều khiển
  const games = [
    { kind: 'everest', label: '🏔️ Đường lên đỉnh Everest', on: v.cfg.everest },
    { kind: 'chuong', label: '🔔 Rung Chuông Đồng', on: v.cfg.chuong },
  ].filter((g) => g.on || g.kind === n.kind);
  return (
    <div className="absolute left-[784px] top-[12px] z-20 w-[288px] overflow-hidden rounded-[18px] border-[3px] border-[#7c3aed] bg-gradient-to-b from-[#2e1065] to-[#4c1d95] text-white shadow-[0_6px_0_#3b0764]">
      <div className="bg-[#7c3aed] py-[1px] text-center text-[18px] font-extrabold tracking-wide text-[#fde68a]">🎪 SỰ KIỆN TRONG LỚP</div>
      <div className="px-2 pt-1">
        {games.map((g) => (
          <div key={g.kind} className={`truncate text-[19px] font-bold leading-[26px] ${g.kind === n.kind ? 'text-[#fde68a]' : 'opacity-70'}`}>
            {g.label}
          </div>
        ))}
      </div>
      <motion.div
        key={`${n.kind}${n.now}${n.soon}`}
        animate={n.now || n.soon ? { scale: [1, 1.06, 1] } : {}}
        transition={{ duration: 1, repeat: Infinity }}
        className={`mx-2 mb-2 mt-1 rounded-lg px-2 text-center text-[18px] font-extrabold leading-[26px] ${n.now ? 'bg-[#dc2626]' : n.soon ? 'bg-[#f59e0b] text-[#3b0764]' : 'bg-white/15'}`}
      >
        {n.now ? `🔴 ĐANG DIỄN RA` : n.soon ? '⏰ Hết tiết này là tới!' : `⏭ Phiên tới: sau tiết ${n.afterRound}`}
      </motion.div>
    </div>
  );
}

// ---------- 2 game lớn (bản riêng): Đường lên đỉnh Everest / Rung Chuông Đồng ----------
// Bảng đen: cô đọc câu thì hiện câu + 4 đáp án để đọc theo; cô hô bắt đầu (boardShown) mới chạy đồng hồ và nhận đáp án
type ShowView = NonNullable<StageView['show']>;
const SHOW_ACCENT = { everest: '#7dd3fc', chuong: '#fbbf24' };
function ShowBoard({ v, left }: { v: StageView; left: number }) {
  const s = v.show!;
  const accent = SHOW_ACCENT[s.kind];
  const answering = s.stage === 'ask' && v.boardShown;
  const badge =
    s.tag === 'tie' ? '⚖️ Câu phụ' : s.tag === 'bell' ? '🔔 Câu Chuông Đồng' : s.tag === 'rescue' ? '🤝 Cứu trợ cả phòng' : s.step === 'code' ? '🔐 Mật mã trạm' : s.step === 'stake' ? '🏔️ Chọn mức điểm' : `Câu ${s.qNo}`;
  return (
    <div className="flex h-full flex-col">
      {s.step !== 'gather' && s.step !== 'section' && s.step !== 'honor' && (
        <div className="flex shrink-0 items-center justify-between">
          <span className="rounded-full px-4 text-[26px] font-bold text-[#1e1b4b]" style={{ background: accent }}>
            {badge}
          </span>
          {answering ? <Timer left={left} /> : s.stage === 'reveal' ? <span className="text-[30px] text-[#9df29d]">Đáp án</span> : <span className="text-[26px] opacity-80">👂 Nghe cô đọc…</span>}
        </div>
      )}
      {s.step === 'gather' && <ShowGather s={s} left={left} />}
      {s.step === 'section' && (
        <motion.div key={s.section} initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex h-full flex-col items-center justify-center text-center">
          <div className="text-[30px] opacity-80">{s.name}</div>
          <div className="mt-2 text-[58px] font-extrabold leading-tight" style={{ color: accent }}>
            {s.section}
          </div>
        </motion.div>
      )}
      {s.step === 'mc' && <ShowQuestion s={s} answering={answering} />}
      {s.step === 'stake' && (
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <div className="text-[36px]">Câu tiếp theo cược bao nhiêu?</div>
          <div className="mt-3 flex gap-6">
            {[10, 20].map((x, i) => (
              <div key={x} className="w-[190px] rounded-2xl border-4 py-2" style={{ borderColor: accent }}>
                <div className="text-[54px] font-extrabold leading-none" style={{ color: accent }}>
                  {x}
                </div>
                <div className="text-[24px]">Gõ "{x}" · {s.stakes[i]} bạn</div>
              </div>
            ))}
          </div>
          <div className="mt-3 text-[24px] opacity-80">Không chọn thì tính 10 · sai không bị trừ</div>
        </div>
      )}
      {(s.step === 'code' || s.step === 'codeReveal') && s.code && <ShowCode s={s} answering={answering} />}
      {s.step === 'honor' && <ShowHonor s={s} />}
      {answering && (s.step === 'mc' || s.step === 'stake') && (
        <div className="mt-auto shrink-0 text-center text-[24px] opacity-85">
          {s.step === 'stake' ? 'Gõ 10 hoặc 20' : 'Gõ A, B, C hoặc D'} · {s.answered} bạn đã chọn
          {s.tag === 'final' && s.tickets > 0 && !s.ticketUser && <span className="text-[#ffe680]"> · 🎟️ có phiếu: gõ "gợi ý"</span>}
        </div>
      )}
    </div>
  );
}

function ShowGather({ s, left }: { s: ShowView; left: number }) {
  const rules =
    s.kind === 'everest'
      ? ['👣 Bước chân đầu tiên · 🔐 Mật mã trạm', '🌪️ Bão tốc độ · 🏔️ Chạm đỉnh', 'Gõ A B C D · ai đúng cũng có điểm']
      : ['🔥 Làm nóng · 💪 Trụ vững · 🤝 Cứu trợ', '⚡ Thử thách cuối · 🔔 Câu Chuông Đồng', 'Gõ A B C D · sai không bị loại'];
  return (
    <div className="flex h-full flex-col items-center justify-center text-center">
      <motion.div animate={{ scale: [1, 1.06, 1] }} transition={{ duration: 0.47, repeat: Infinity }} className="text-[64px] leading-none">
        {s.kind === 'everest' ? '🏔️' : '🔔'}
      </motion.div>
      <div className="mt-1 text-[48px] font-extrabold leading-tight" style={{ color: SHOW_ACCENT[s.kind] }}>
        {s.name}
      </div>
      <div className="mt-2 space-y-1 text-[27px] leading-snug">
        {rules.map((r) => (
          <div key={r}>{r}</div>
        ))}
      </div>
      <div className="mt-3 text-[26px] opacity-80">Bắt đầu sau {left} giây</div>
    </div>
  );
}

function ShowQuestion({ s, answering }: { s: ShowView; answering: boolean }) {
  const reveal = s.stage === 'reveal';
  return (
    <>
      <div className="mt-2 line-clamp-3 shrink-0 text-center text-[31px] leading-[38px]">{s.question}</div>
      <div className="mt-2 grid flex-1 grid-cols-2 content-center gap-2">
        {s.opts.map((o, i) => {
          const right = reveal && i === s.ans;
          const gone = s.removed.includes(i);
          return (
            <motion.div
              key={i}
              initial={{ x: i % 2 ? 30 : -30, opacity: 0 }}
              animate={{ x: 0, opacity: gone || (reveal && !right) ? 0.35 : 1, scale: right ? [1, 1.08, 1] : 1 }}
              transition={{ delay: reveal ? 0 : i * 0.08 }}
              className={`flex min-h-[54px] items-center gap-2 rounded-xl border-[3px] px-2 text-[25px] leading-tight ${
                right ? 'border-[#4ade80] bg-[#16a34a]/50' : answering ? 'border-white/60 bg-white/10' : 'border-white/30 bg-white/5'
              }`}
            >
              <b className="w-7 shrink-0 text-center text-[28px]" style={{ color: SHOW_ACCENT[s.kind] }}>
                {'ABCD'[i]}
              </b>
              <span className={`min-w-0 flex-1 ${gone ? 'line-through' : ''}`}>{o}</span>
              {reveal && <span className="shrink-0 text-[20px] opacity-80">{s.counts[i]}</span>}
            </motion.div>
          );
        })}
      </div>
      {s.tag === 'tie' && s.stage === 'ask' && <div className="shrink-0 truncate text-center text-[22px] text-[#ffe680]">Chỉ tính: {s.tied.join(', ')}</div>}
      {s.ticketUser && s.stage === 'ask' && <div className="shrink-0 truncate text-center text-[22px] text-[#ffe680]">🎟️ {s.ticketUser} tiếp sức: bỏ 2 đáp án sai</div>}
      {reveal && <div className="shrink-0 text-center text-[24px] text-[#9df29d]">{s.lastRight} bạn trả lời đúng</div>}
    </>
  );
}

function ShowCode({ s, answering }: { s: ShowView; answering: boolean }) {
  const c = s.code!;
  const letters = c.answer ? [...c.answer.replace(/\s+/g, '')] : [];
  return (
    <div className="flex flex-1 flex-col">
      <div className="mt-2 flex shrink-0 justify-center gap-1">
        {Array.from({ length: c.len }, (_, i) => (
          <div key={i} className="flex h-[48px] w-[38px] items-end justify-center border-b-4 border-[#ffe680] text-[34px] font-bold leading-none text-[#ffe680]">
            {letters[i] ?? (i === 0 ? c.first : '')}
          </div>
        ))}
      </div>
      <div className="mt-2 flex-1 space-y-1 overflow-hidden">
        {c.hints.map((h, i) => (
          <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex gap-2 text-[24px] leading-[30px]">
            <b className="shrink-0 text-[#7dd3fc]">{[30, 20, 10][i]}đ</b>
            <span className="line-clamp-2">{h}</span>
          </motion.div>
        ))}
        {c.rescue && !c.answer && <div className="text-[24px] text-[#ffe680]">🆘 Cứu trợ 10 giây · chữ đầu là {c.first}</div>}
      </div>
      <div className="shrink-0 text-center text-[23px] opacity-90">
        {c.answer
          ? c.solvers.length
            ? `🔓 ${c.solved} bạn giải được: ${c.solvers.map((x) => x.nickname).slice(0, 3).join(', ')}`
            : '🔒 Không ai giải được'
          : answering
            ? `Gõ từ khoá có dấu · đúng được ${c.pts} điểm · ${c.solved} bạn đã giải`
            : `${c.solved} bạn đã giải`}
      </div>
    </div>
  );
}

function ShowHonor({ s }: { s: ShowView }) {
  return (
    <div className="flex h-full flex-col items-center">
      <div className="text-[44px] font-extrabold leading-none" style={{ color: SHOW_ACCENT[s.kind] }}>
        {s.kind === 'everest' ? '🚩 Vinh danh đỉnh Everest' : '🔔 Vinh danh Chuông Đồng'}
      </div>
      {s.honors.length === 0 && <div className="mt-16 text-[34px]">Chưa ai ghi điểm</div>}
      <div className="mt-2 grid w-full grid-cols-2 gap-x-4 px-2 text-[22px] leading-[30px]">
        {s.honors.map((h, i) => (
          <motion.div key={h.username} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.12 }} className={`flex min-w-0 gap-1 ${i === 0 ? 'col-span-2 justify-center text-[30px] text-[#ffe680]' : ''}`}>
            <span className="shrink-0">{i === 0 ? h.title.split(' ')[0] : `${i + 1}.`}</span>
            <span className="min-w-0 truncate">{h.nickname}</span>
            <b className="shrink-0">{h.score}đ</b>
          </motion.div>
        ))}
      </div>
      {s.honors[0] && <div className="mt-auto text-[24px] opacity-85">{s.honors[0].title.slice(s.honors[0].title.indexOf(' ') + 1)} · top 10 nhận huy hiệu</div>}
    </div>
  );
}

// Dưới bảng đen: núi Everest, top 10 leo cao theo điểm (điểm tối đa = đỉnh), người đầu cầm cờ
function Mountain({ v }: { v: StageView }) {
  const s = v.show!;
  const W = 400; // nhỏ lại cho khỏi che bảng Top tương tác bên phải
  const H = 168;
  const top = s.top.slice(0, 10);
  const pos = (i: number, score: number) => {
    const p = Math.min(1, score / Math.max(1, s.maxScore));
    const side = i % 2 === 0 ? -1 : 1; // so le 2 sườn núi cho đỡ chồng tên
    const y = H - 18 - p * (H - 40);
    const halfWidth = ((y - 20) / (H - 20)) * (W / 2 - 10);
    return { x: W / 2 + side * Math.max(8, halfWidth * (0.35 + ((i * 37) % 50) / 100)), y };
  };
  return (
    <div className="absolute left-[392px] top-[622px] z-30 overflow-hidden rounded-[16px] border-[3px] border-[#0c4a6e] bg-gradient-to-b from-[#bae6fd] to-[#e0f2fe] shadow-xl" style={{ width: W, height: H }}>
      <svg width={W} height={H} className="absolute inset-0">
        <polygon points={`10,${H} ${W / 2},20 ${W - 10},${H}`} fill="#64748b" />
        <polygon points={`${W / 2 - 46},62 ${W / 2},20 ${W / 2 + 46},62 ${W / 2 + 20},54 ${W / 2},66 ${W / 2 - 22},54`} fill="#f8fafc" />
        <line x1={W / 2} y1={20} x2={W / 2} y2={2} stroke="#7c2d12" strokeWidth={3} />
        <polygon points={`${W / 2},2 ${W / 2 + 22},8 ${W / 2},14`} fill="#ef4444" />
      </svg>
      <div className="absolute left-2 top-1 text-[18px] font-extrabold text-[#0c4a6e]">⛰️ Top 10 leo núi · {s.players} bạn chơi</div>
      {top.length === 0 && <div className="absolute inset-x-0 bottom-3 text-center text-[20px] font-bold text-white">Trả lời đúng để leo lên nha!</div>}
      {top.map((r, i) => {
        const p = pos(i, r.score);
        return (
          <motion.div
            key={r.username}
            animate={{ left: p.x, top: p.y }}
            transition={{ type: 'spring', stiffness: 80, damping: 14 }}
            className="absolute flex -translate-x-1/2 -translate-y-full items-center gap-[2px] whitespace-nowrap rounded-full bg-white/90 px-[6px] text-[14px] font-bold text-[#0c4a6e] shadow"
          >
            {i === 0 ? '🚩' : '🧗'}
            <span className="max-w-[90px] truncate">{r.nickname}</span>
            <span className="text-[#c2410c]">{r.score}</span>
          </motion.div>
        );
      })}
    </div>
  );
}

// Dưới bảng đen: Rung Chuông Đồng, top 5 thanh điểm + người đủ điều kiện rung chuông
function BellBoard({ v }: { v: StageView }) {
  const s = v.show!;
  const top = s.top.slice(0, 5);
  return (
    <div className="absolute left-[392px] top-[622px] z-30 w-[400px] overflow-hidden rounded-[16px] border-[3px] border-[#78350f] bg-[#fffbeb]/97 shadow-xl">
      <div className="flex items-center justify-between bg-gradient-to-r from-[#b45309] to-[#d97706] px-3 py-[2px] text-[19px] font-bold text-[#fff7d6]">
        <span>🔔 Bảng điểm Chuông Đồng</span>
        <span>
          {s.players} bạn chơi{s.tickets > 0 ? ` · 🎟️ ${s.tickets}` : ''}
        </span>
      </div>
      <div className="space-y-[3px] px-2 py-1">
        {top.length === 0 && <div className="py-3 text-center text-[20px] text-[#92400e]">Trả lời đúng để lên bảng nha!</div>}
        {top.map((r, i) => (
          <motion.div key={r.username} layout className="relative h-[26px] overflow-hidden rounded-md bg-[#fde68a]/50">
            <motion.div className="absolute inset-y-0 left-0 bg-[#f59e0b]/70" animate={{ width: `${Math.min(100, (r.score / Math.max(1, s.maxScore)) * 100)}%` }} />
            <div className="relative flex h-full items-center gap-2 px-2 text-[18px] font-bold text-[#78350f]">
              <span>{['🥇', '🥈', '🥉', '4', '5'][i]}</span>
              <span className="min-w-0 flex-1 truncate">{r.nickname}</span>
              <span>{r.score}đ</span>
            </div>
          </motion.div>
        ))}
        {s.bellRingers.length > 0 && <div className="truncate text-[17px] font-semibold text-[#b45309]">🔔 Rung chuông: {s.bellRingers.join(', ')}</div>}
      </div>
    </div>
  );
}

// ---------- Giờ ra chơi ----------
const RECESS_TITLE = { rps: 'Oẳn tù tì với cô', callup: 'Kiểm tra miệng', pick: 'Chọn phe', roll: 'Điểm danh siêu tốc', heart: 'Thả tim cả lớp', dance: '💃 Nhảy múa thả tim' };

function Recess({ v, left }: { v: StageView; left: number }) {
  const r = v.recess!;
  if (r.stage === 'board') return <SessionBoard v={v} />;
  const playing = r.stage === 'play';
  return (
    <div className="flex h-full flex-col items-center text-center">
      <div className="flex w-full items-center justify-between">
        <span className="rounded-full bg-[#ffd84a] px-4 text-[26px] font-bold text-[#7a2e0e]">
          🔔 Giờ ra chơi{r.game === 'callup' ? ` · ${RECESS_TITLE.callup}` : ''}
        </span>
        {playing && <Timer left={left} />}
      </div>
      {r.game !== 'callup' && <div className="mt-1 shrink-0 text-[48px] leading-tight text-[#ffe680]">{X(RECESS_TITLE[r.game])}</div>}
      {r.game === 'rps' && (
        <>
          <div className="mt-3 flex w-full justify-center gap-6 text-[34px]">
            {[
              ['✊', 'búa'],
              ['✌️', 'kéo'],
              ['✋', 'bao'],
            ].map(([icon, word], i) => (
              <div key={word} className={`w-[150px] rounded-2xl border-2 py-2 ${r.teacher === word ? 'border-[#ffd84a] bg-white/15' : 'border-white/30'}`}>
                <div className="text-[56px] leading-none">{icon}</div>
                <div>{word}</div>
                <div className="text-[30px] text-[#9df29d]">{r.rpsCounts[i]}</div>
              </div>
            ))}
          </div>
          <div className="mt-3 text-[32px]">{playing ? 'Gõ: búa, kéo hoặc bao' : r.teacher ? X(`Cô ra: ${r.teacher}`) : 'Không ai chơi'}</div>
        </>
      )}
      {r.game === 'callup' && (
        <>
          <div className="mt-1 max-w-full shrink-0 truncate text-[36px] text-[#ffe680]">📢 {r.callName} lên bảng!</div>
          <div className="line-clamp-2 shrink-0 text-[30px] leading-[36px]">{r.callClue}</div>
          <Tiles letters={r.callTiles} dim={!playing} />
          <Slots slots={r.callSlots} reveal={!playing} />
          {!playing && (
            <div className="mt-1 text-[34px]">{r.callResult === 'right' ? '✅ Đúng! +5 điểm' : r.callResult === 'wrong' ? '❌ Sai mất rồi' : '💤 Không trả lời'}</div>
          )}
        </>
      )}
      {r.game === 'pick' && (
        <div className="mt-4 w-full space-y-4 px-4">
          {r.pick.map((label, i) => {
            const total = r.votes[0] + r.votes[1] || 1;
            const pct = Math.round((r.votes[i] / total) * 100);
            return (
              <div key={label} className="relative h-[70px] overflow-hidden rounded-2xl border-2 border-white/40 text-left">
                <div className="absolute inset-y-0 left-0 bg-[#ffd84a]/35 transition-all duration-500" style={{ width: `${pct}%` }} />
                <div className="relative flex h-full items-center justify-between px-4 text-[36px]">
                  <span>
                    Gõ <b className="text-[#ffe680]">{i + 1}</b>: {label}
                  </span>
                  <span>{r.votes[i]}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
      {r.game === 'roll' && (
        <>
          <div className="text-[34px]">
            Gõ <b className="text-[#ffe680]">CÓ MẶT</b> thật nhanh, 10 bạn đầu +3
          </div>
          <div className="mt-2 grid w-full grid-cols-2 gap-x-6 px-6 text-left text-[28px]">
            {r.roll.map((n, i) => (
              <div key={i} className="truncate">
                {i + 1}. {n}
              </div>
            ))}
          </div>
        </>
      )}
      {r.game === 'dance' && (
        <>
          <div className="mt-1 text-[32px]">Thả tim tiếp sức cho cả lớp nào!</div>
          <HeartCounter n={r.hearts} />
          {r.topLiker && r.topLiker.nickname && (
            <div className="mt-1 max-w-full truncate px-4 text-[28px] text-[#ffb3c8]">
              👑 Thả tim nhiều nhất: {r.topLiker.nickname} · {r.topLiker.n}
            </div>
          )}
          {!playing && <div className="mt-1 text-[32px] text-[#9df29d]">Cảm ơn cả lớp! 💕</div>}
        </>
      )}
      {/* thả tim cả lớp (chủ kênh 2026-11-07): không còn mốc 0/300, máy chỉ đếm số tim thật */}
      {r.game === 'heart' && (
        <>
          <div className="mt-2 text-[32px]">Chạm màn hình thả tim nào!</div>
          <HeartCounter n={r.hearts} />
          {r.topLiker && r.topLiker.nickname && (
            <div className="mt-1 max-w-full truncate px-4 text-[28px] text-[#ffb3c8]">
              👑 Thả tim nhiều nhất: {r.topLiker.nickname} · {r.topLiker.n}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// Cuối giờ ra chơi: lớp trưởng các tiết trước (mới nhất trên cùng), ai làm nhiều lần thì có số lần
function SessionBoard({ v }: { v: StageView }) {
  return (
    <div className="flex h-full flex-col items-center">
      <div className="text-[48px] leading-none text-[#ffe680]">👑 Lớp trưởng các tiết</div>
      {v.champions.length === 0 && <div className="mt-16 text-[36px]">Chưa có lớp trưởng</div>}
      <div className="mt-3 w-full space-y-1">
        {v.champions.map((c, i) => (
          <motion.div
            key={c.round}
            initial={{ x: -40, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: i * 0.2 }}
            className="flex items-center gap-3 px-6 text-[36px]"
          >
            <span className="w-[110px] text-[26px] text-[#ffe680]">Tiết {c.round}</span>
            <span className="flex-1 truncate">{c.nickname}</span>
            {c.times > 1 && <span className="text-[26px] text-[#ffe680]">👑x{c.times}</span>}
            <span>{c.score}đ</span>
          </motion.div>
        ))}
      </div>
      <div className="mt-auto text-[28px] opacity-80">Tiết mới điểm làm lại, ai cũng có thể làm lớp trưởng!</div>
    </div>
  );
}

function WeekBoard({ v, left }: { v: StageView; left: number }) {
  return (
    <div className="flex h-full flex-col items-center">
      <div className="text-[48px] leading-none text-[#ffe680]">Bảng vàng tuần này</div>
      <div className="mt-3 w-full space-y-1">
        {v.weekTop.slice(0, 5).map((s, i) => (
          <div key={s.username} className="flex items-center gap-3 px-6 text-[36px]">
            <span className="w-12 text-[#ffe680]">{['🥇', '🥈', '🥉', '4', '5'][i]}</span>
            <span className="flex-1 truncate">{s.nickname}</span>
            <span>{s.points}đ</span>
          </div>
        ))}
      </div>
      <div className="mt-auto text-[28px] opacity-80">Vào tiết sau {left} giây</div>
    </div>
  );
}

// Góc trái trên đầu cô: tờ giấy ghim "Học sinh xuất sắc trong tiết", chỉ tính điểm tiết đang học, sang tiết mới làm lại
// (chủ kênh đổi 2026-11-04, trước tính cả ngày). Ghế đã xếp theo điểm tiết nên lấy luôn 4 bạn đầu
function DayTop({ v }: { v: StageView }) {
  const rows = v.seats.filter((s) => s.score > 0).slice(0, 4).map((s) => ({ username: s.username, nickname: s.nickname, points: s.score })); // top 4 thôi để không che đầu cô
  return (
    <div className="absolute left-[10px] top-[230px] z-20 w-[326px] -rotate-2 rounded-[14px] border-[3px] border-[#c9a45c] bg-[#fff8e1]/95 px-3 pb-2 pt-3 text-[#4a2c0e] shadow-[0_6px_10px_rgba(0,0,0,0.3)]">
      <div className="absolute -top-[18px] left-1/2 -translate-x-1/2 text-[30px]">📌</div>
      <div className="whitespace-nowrap text-center text-[21px] font-extrabold leading-tight text-[#b45309]">🏆 Học sinh xuất sắc trong tiết</div>
      {rows.length === 0 && <div className="py-3 text-center text-[20px] text-[#8a6a3a]">Chưa có ai, trả lời đúng là lên bảng!</div>}
      <div className="mt-1 space-y-[2px]">
        {rows.map((r, i) => (
          <motion.div key={r.username} layout className="flex items-center gap-2 text-[23px] leading-[28px]">
            <span className="w-7 text-center">{['🥇', '🥈', '🥉', '4', '5'][i]}</span>
            <span className="min-w-0 flex-1 truncate font-semibold">{r.nickname}</span>
            <b className="text-[#c2410c]">{r.points}</b>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ---------- Cô giáo (cô Ngân, bản riêng: 16 tư thế, ảnh gốc trong nhan-vat/co-giao-ngan, tách nền ra public/assets/nv/co-ngan) ----------
function teacherPose(v: StageView, now: number): string {
  // có bạn cầm hoa đi lên: ngạc nhiên, tới bục đưa hoa thì cười che miệng
  if (v.walk) return now - v.walk.at < GAME.walkMs * 0.35 ? '13-ngac-nhien' : '06-cuoi';
  if (now - v.lastFlowerAt < 3000) return '06-cuoi'; // được tặng hoa
  if (v.birthday) return '09-mung';
  if (v.clapping) return '10-vo-tay';
  if (v.loveFans > 0) return '07-tay-nguc'; // các bạn gõ "yêu cô"
  switch (v.phase) {
    case 'team':
    case 'intro':
      return '04-vay-chao';
    case 'question':
      if (!v.boardShown) return '02-gioi-thieu'; // đang đọc đề
      if (v.correctCount > 0) return '08-ngon-cai'; // có bạn đúng rồi
      return now % 8000 < 4000 ? '03-chi-bang' : '01-dung'; // chờ trả lời: lúc chỉ bảng, lúc đứng
    case 'bonus':
      return '12-gai-dau'; // chưa ai ra, thêm giờ
    case 'reveal':
      return v.correctCount === 0 ? '11-nhun-vai' : v.golden ? '09-mung' : '08-ngon-cai';
    case 'praise':
      return '09-mung';
    case 'results':
    case 'vote':
      return '14-ngon-tro';
    case 'recess':
      if (v.recess?.stage === 'play') return v.recess.game === 'callup' ? '16-chi-trai' : '05-dang-tay';
      return v.recess?.stage === 'result' ? '15-chong-hong' : '07-tay-nguc';
  }
  return '01-dung';
}

/** 2 game lớn: tư thế theo từng bước (ảnh nhan-vat/co-giao-ngan/duong-len-dinh-everest và Rung-Chuong-Dong) */
function showPose(v: StageView, now: number): string {
  const sh = v.show!;
  const flower = now - v.lastFlowerAt < 3000 || !!v.walk;
  const alt = now % 6000 < 3000;
  const answering = sh.stage === 'ask' && v.boardShown;
  if (sh.kind === 'everest') {
    if (flower) return '10-cuoi-vui';
    if (v.clapping) return '15-vo-tay';
    switch (sh.step) {
      case 'gather':
        return alt ? '04-chao-doan-leo' : '12-vay-chao';
      case 'section':
        return sh.section.includes('Chạm đỉnh') ? '02-chi-len-dinh' : '03-chi-lo-trinh';
      case 'stake':
        return '16-tu-tin';
      case 'code':
        return !answering ? '05-doc-ban-do' : sh.code?.rescue ? '14-dong-vien' : alt ? '06-suy-nghi' : '01-dung-san-sang';
      case 'codeReveal':
        return sh.code?.solved ? '10-cuoi-vui' : '09-bat-ngo';
      case 'honor':
        return '13-cam-co-dinh';
      default:
        if (sh.stage === 'reveal') return sh.lastRight > 0 ? '07-like' : '09-bat-ngo';
        if (!answering) return '05-doc-ban-do';
        if (Math.max(0, v.endsAt - now) <= 3000) return '11-nhac-nho-an-toan';
        return alt ? '08-co-vu' : '01-dung-san-sang';
    }
  }
  if (flower) return '06-rung-chuong-cuoi-tuoi';
  if (v.clapping) return '07-rung-chuong-hao-hung';
  switch (sh.step) {
    case 'gather':
      return alt ? '12-moi-thi-sinh' : '13-vay-chao-cam-chuong';
    case 'section':
      return sh.section.includes('Chuông') ? '15-chuan-bi-rung' : '09-bao-hieu-bat-dau';
    case 'honor':
      return alt ? '10-mung-chien-thang' : '03-rung-chuong-cao';
    default:
      if (sh.stage === 'reveal') {
        if (sh.lastRight === 0) return '11-bat-ngo-nghe-chuong';
        return sh.tag === 'bell' ? '04-rung-chuong-hai-tay' : alt ? '02-rung-chuong-ben' : '05-rung-chuong-nghieng-nguoi';
      }
      if (!answering) return sh.tag === 'tie' ? '16-nghi-thang-tran' : '08-rung-chuong-nghiem-tuc';
      return alt ? '01-cam-chuong-san-sang' : '14-tu-hao-gio-chuong';
  }
}

function Teacher({ v, now }: { v: StageView; now: number }) {
  const gotFlower = now - v.lastFlowerAt < 3000;
  if (THAY) return <TeacherThay v={v} now={now} gotFlower={gotFlower} />;
  // trang phục: bộ trắng ở thư mục gốc, bộ khác ở thư mục con; 2 game lớn mặc bộ của game
  const src = v.show
    ? `/assets/nv/co-ngan/${v.show.kind}/${showPose(v, now)}.webp`
    : v.outfit === 'trang' || !v.outfit
      ? `/assets/nv/co-ngan/${teacherPose(v, now)}.webp`
      : `/assets/nv/co-ngan/${v.outfit}/${OUTFIT_POSE[teacherPose(v, now)] ?? '01-dung'}.webp`;
  return (
    <div className="absolute left-[86px] top-[410px] h-[490px] w-[320px]">
      <img src={src} className="h-full w-full object-contain object-bottom drop-shadow-[0_10px_8px_rgba(0,0,0,0.25)]" />
      {/* bảng tên cài ngực áo (trên đầu cô là bảng Học sinh xuất sắc nên không đặt ở đó) */}
      <div className="absolute left-1/2 top-[128px] z-10 -translate-x-1/2 -rotate-3 whitespace-nowrap rounded-full border-[3px] border-[#fff6dd] bg-gradient-to-b from-[#ff6b9a] to-[#d63384] px-3 py-[1px] text-[22px] font-extrabold text-white shadow-[0_3px_0_#9d174d]">
        🌸 {v.cfg.teacherName}
      </div>
      <AnimatePresence>
        {gotFlower && (
          <motion.div
            key={v.lastFlowerAt}
            initial={{ scale: 0, y: 80 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="absolute left-[130px] top-[150px] text-[80px]"
          >
            💐
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/** Thầy giáo đứng lớp: cùng chỗ đứng với cô, bảng tên xanh */
function TeacherThay({ v, now, gotFlower }: { v: StageView; now: number; gotFlower: boolean }) {
  const pose = v.show ? thayShowPose(v, now) : (THAY_POSE[teacherPose(v, now)] ?? '01-dung');
  return (
    <div className="absolute left-[86px] top-[410px] h-[490px] w-[320px]">
      <img src={`/assets/nv/thay/${pose}.webp`} className="h-full w-full object-contain object-bottom drop-shadow-[0_10px_8px_rgba(0,0,0,0.25)]" />
      <div className="absolute left-1/2 top-[118px] z-10 -translate-x-1/2 -rotate-3 whitespace-nowrap rounded-full border-[3px] border-[#fff6dd] bg-gradient-to-b from-[#3b82f6] to-[#1d4ed8] px-3 py-[1px] text-[22px] font-extrabold text-white shadow-[0_3px_0_#1e3a8a]">
        📘 {shownTeacherName(v.cfg)}
      </div>
      <AnimatePresence>
        {gotFlower && (
          <motion.div key={v.lastFlowerAt} initial={{ scale: 0, y: 80 }} animate={{ scale: 1, y: 0 }} exit={{ opacity: 0 }} className="absolute left-[130px] top-[150px] text-[80px]">
            💐
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ---------- Thầy giám thị (2026-11-07) ----------
// Ảnh riêng bỏ vào nhan-vat/thay-giam-thi rồi chạy: node tools/tach-nen.mjs thay-giam-thi giam-thi (cần có 01-dung.png).
// Chưa có ảnh thì mượn ảnh thầy giáo, đổi màu áo + băng đỏ "GIÁM THỊ" cho khác người đứng lớp.
const GIAM_THI_IMGS = ['/assets/nv/giam-thi/01-dung.webp', '/assets/nv/thay/01-dung.webp'];
const DOOR: [number, number] = [1000, 690]; // cửa lớp bên phải (toạ độ góc trên trái nhân vật)
function GiamThi({ h }: { h: number }) {
  const [own, setOwn] = useState(true);
  return (
    <div className="relative" style={{ width: h * 0.62, height: h }}>
      <img
        src={own ? GIAM_THI_IMGS[0] : GIAM_THI_IMGS[1]}
        onError={() => setOwn(false)}
        className="h-full w-full object-contain object-bottom drop-shadow-[0_6px_5px_rgba(0,0,0,0.35)]"
        style={own ? undefined : { filter: 'hue-rotate(185deg) saturate(1.6) brightness(0.92)' }}
      />
      <div className="absolute left-1/2 top-[26%] -translate-x-1/2 -rotate-6 whitespace-nowrap rounded-md border-2 border-white bg-[#dc2626] px-2 text-[17px] font-extrabold text-white shadow">
        👮 GIÁM THỊ
      </div>
    </div>
  );
}

/** Thầy giám thị đi từ cửa tới ghế bạn ngồi im lâu, dắt bạn ra cửa; bạn đang chờ đi từ cửa vào ghế trống */
function Escort({ v }: { v: StageView }) {
  const e = v.escort;
  if (!e) return null;
  const T = GAME.escortMs / 1000;
  const H = 300;
  const seat = seatBox(Math.max(0, e.seat));
  // đứng trên sàn cạnh ghế (bên phải ghế cho khỏi khuất sau người đứng lớp ở góc trái)
  const at: [number, number] = [seat.x + seat.w * 0.6, seat.y + seat.show + 30 - H];
  const kidH = 150;
  const g = e.out.girl ? 'nu' : 'nam';
  const target = e.inSeat >= 0 ? seatBox(e.inSeat) : null;
  const gi = e.in?.girl ? 'nu' : 'nam';
  return (
    <>
      <motion.div
        key={`gt${e.at}`}
        initial={{ left: DOOR[0], top: DOOR[1], opacity: 0 }}
        animate={{ left: [DOOR[0], at[0], at[0], DOOR[0]], top: [DOOR[1], at[1], at[1], DOOR[1]], opacity: [1, 1, 1, 0] }}
        transition={{ duration: T * 0.85, times: [0, 0.4, 0.55, 1], ease: 'easeInOut' }}
        className="pointer-events-none absolute z-30"
      >
        <GiamThi h={H} />
      </motion.div>
      {/* bạn bị đưa ra: đứng dậy ở ghế, đi theo thầy ra cửa */}
      <motion.div
        key={`out${e.at}`}
        initial={{ left: seat.x, top: seat.y - 30, opacity: 0 }}
        animate={{ left: [seat.x, seat.x, DOOR[0] + 20, DOOR[0] + 20], top: [seat.y - 30, seat.y - 30, DOOR[1] + 70, DOOR[1] + 70], opacity: [0, 1, 1, 0] }}
        transition={{ duration: T * 0.85, times: [0, 0.45, 0.95, 1], ease: 'easeInOut' }}
        className="pointer-events-none absolute z-30"
        style={{ width: kidH * 0.47, height: kidH }}
      >
        <img src={`/assets/nv/${g}/${POSE[g].buon}.webp`} className="h-full w-full drop-shadow-[0_4px_3px_rgba(0,0,0,0.3)]" />
        <div className="nametag" style={{ fontSize: 15, maxWidth: 120 }}>
          <span className="truncate">💤 {e.out.nickname}</span>
        </div>
      </motion.div>
      {/* bạn mới vào lớp: từ cửa đi vào ghế */}
      {e.in && target && (
        <motion.div
          key={`in${e.at}`}
          initial={{ left: DOOR[0], top: DOOR[1] + 70, opacity: 0 }}
          animate={{ left: [DOOR[0], DOOR[0], target.x, target.x], top: [DOOR[1] + 70, DOOR[1] + 70, target.y - 30, target.y - 30], opacity: [0, 1, 1, 0] }}
          transition={{ duration: T, times: [0, 0.6, 0.95, 1], ease: 'easeInOut' }}
          className="pointer-events-none absolute z-30"
          style={{ width: kidH * 0.47, height: kidH }}
        >
          <img src={`/assets/nv/${gi}/${POSE[gi].chao}.webp`} className="h-full w-full drop-shadow-[0_4px_3px_rgba(0,0,0,0.3)]" />
          <div className="nametag" style={{ fontSize: 15, maxWidth: 120 }}>
            <span className="truncate">🙋 {e.in.nickname}</span>
          </div>
        </motion.div>
      )}
    </>
  );
}

// ---------- Giờ ra chơi nhảy múa thả tim (2026-11-07) ----------
/** bạn đang ngồi lên bảng nhảy: tối đa GAME.dancers bạn còn tương tác, theo thứ tự ghế (điểm cao trước) */
function dancersOf(v: StageView) {
  if (v.phase !== 'recess' || v.recess?.game !== 'dance') return [];
  return v.seats.filter((s) => !s.sleeping).slice(0, GAME.dancers);
}
// khoảng sàn trước bảng đen (giữa cô và dãy bàn đầu), 2 hàng so le: [giữa người, chân]
const DANCE_SPOTS: [number, number][] = [
  [445, 915], [550, 915], [655, 915], [760, 915], [865, 915],
  [497, 845], [602, 845], [707, 845], [812, 845], [917, 845],
];
function Dancers({ v }: { v: StageView }) {
  const list = dancersOf(v);
  return (
    <>
      {list.map((s, i) => {
        const H = i < 5 ? 190 : 170;
        const [cx, feet] = DANCE_SPOTS[i];
        const g = s.girl ? 'nu' : 'nam';
        const pose = (['vui', 'tay', 'chao'] as const)[i % 3];
        return (
          <motion.div
            key={s.username}
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            className="pointer-events-none absolute"
            style={{ left: cx - (H * 0.47) / 2, top: feet - H, width: H * 0.47, height: H, zIndex: i < 5 ? 31 : 30 }}
          >
            <motion.img
              src={`/assets/nv/${g}/${POSE[g][pose]}.webp`}
              animate={{ y: [0, -22, 0, -10, 0], rotate: [-8, 8, -8], scaleX: [1, 1, -1, -1, 1] }}
              transition={{ duration: 1.3 + (i % 3) * 0.15, repeat: Infinity, ease: 'easeInOut', delay: i * 0.12 }}
              style={{ transformOrigin: 'bottom center' }}
              className="h-full w-full drop-shadow-[0_4px_3px_rgba(0,0,0,0.3)]"
            />
            <motion.div
              animate={{ y: [0, -30], opacity: [0, 1, 0] }}
              transition={{ duration: 1.6, repeat: Infinity, delay: i * 0.3 }}
              className="absolute -top-6 left-1/2 text-[28px]"
            >
              {['🎵', '🎶', '✨'][i % 3]}
            </motion.div>
            <div className="nametag" style={{ fontSize: 14, maxWidth: 110 }}>
              <span className="truncate">{s.nickname}</span>
            </div>
          </motion.div>
        );
      })}
    </>
  );
}

/** máy đếm tim: số to, mỗi lần tăng thì nảy lên */
function HeartCounter({ n }: { n: number }) {
  return (
    <div className="mt-2 flex items-center gap-3 rounded-[24px] border-4 border-[#ff8fb1] bg-[#3b0a1e]/70 px-6 py-1 shadow-[0_0_24px_rgba(255,93,143,0.6)]">
      <motion.span animate={{ scale: [1, 1.25, 1] }} transition={{ duration: 0.8, repeat: Infinity }} className="text-[70px] leading-none">
        ❤️
      </motion.span>
      <motion.span key={n} initial={{ scale: 1.4 }} animate={{ scale: 1 }} className="font-mono text-[84px] font-extrabold leading-none text-[#ffd1de] tabular-nums">
        {n.toLocaleString('vi-VN')}
      </motion.span>
      <span className="text-[34px] text-[#ffd1de]">tim</span>
    </div>
  );
}

/** băng thông báo giờ nhảy múa trên đầu màn hình + tim bay từ dưới lên */
function DanceBanner({ v }: { v: StageView }) {
  const on = v.phase === 'recess' && v.recess?.game === 'dance' && v.recess.stage === 'play';
  return (
    <AnimatePresence>
      {on && (
        <motion.div key="dance" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="pointer-events-none absolute inset-0 z-40">
          <motion.div
            initial={{ y: -60 }}
            animate={{ y: 0, scale: [1, 1.04, 1] }}
            transition={{ scale: { duration: 0.9, repeat: Infinity } }}
            className="absolute left-[110px] top-[140px] w-[860px] rounded-[30px] border-4 border-white bg-gradient-to-r from-fuchsia-500 via-pink-500 to-amber-400 px-6 py-2 text-center font-extrabold text-white shadow-2xl"
          >
            <div className="text-[40px] leading-tight">💃 GIỜ RA CHƠI · CẢ LỚP LÊN NHẢY 🕺</div>
            <div className="line-clamp-2 text-[28px] leading-tight">{v.cfg.danceText}</div>
          </motion.div>
          {Array.from({ length: 12 }, (_, i) => (
            <motion.div
              key={i}
              initial={{ y: 1500, opacity: 0 }}
              animate={{ y: 600, opacity: [0, 1, 0] }}
              transition={{ duration: 2.6, delay: (i % 6) * 0.35, repeat: Infinity }}
              className="absolute text-[60px]"
              style={{ left: 30 + i * 88 }}
            >
              {i % 3 === 0 ? '💖' : '❤️'}
            </motion.div>
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ---------- Ai nhanh nhất câu này ----------
// Hết câu (hiện đáp án): bảng Top 5 nhanh nhất, thời gian tới mili giây + điểm được cộng; ai đúng chậm hơn +1
const secText = (ms: number) => `${(ms / 1000).toFixed(3).replace('.', ',')} giây`;
function FastestBoard({ v }: { v: StageView }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="absolute left-[378px] top-[618px] z-30 w-[460px] overflow-hidden rounded-[16px] border-[3px] border-[#7a2e0e] bg-[#fff6dd]/97 shadow-xl"
    >
      <div className="flex items-center justify-between bg-[#7a2e0e] px-3 py-[2px] text-[25px] font-bold text-[#ffe9b8]">
        <span>⚡ Top {GAME.fastestShown} nhanh nhất</span>
        <span>{v.correctCount} bạn đúng</span>
      </div>
      {v.fastest.length === 0 && <div className="py-3 text-center text-[22px] text-[#8a6a3a]">Chưa ai đúng câu này</div>}
      {v.fastest.map((a, i) => (
        <motion.div
          key={a.username}
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.15 * i }}
          className={`flex items-center gap-2 px-3 text-[29px] leading-[42px] text-[#4a2c0e] ${i % 2 ? 'bg-[#f6e3b4]/60' : ''}`}
        >
          <span className="w-9 shrink-0 text-center text-[28px]">{['🥇', '🥈', '🥉', '4', '5'][i]}</span>
          <span className="min-w-0 flex-1 truncate font-semibold">{a.nickname}</span>
          <span className="shrink-0 whitespace-nowrap text-right text-[24px] font-bold tabular-nums text-[#6b4a22]">{secText(a.ms)}</span>
          <b className="w-[58px] shrink-0 text-right text-[30px] text-[#c2410c]">+{a.points}</b>
        </motion.div>
      ))}
      {v.laterCount > 0 && (
        <div className="border-t border-[#e9d8a6] px-3 text-center text-[22px] font-semibold leading-[34px] text-[#6b4a22]">
          {v.laterCount} bạn khác đúng chậm hơn: mỗi bạn +{v.laterPoints}
        </div>
      )}
    </motion.div>
  );
}

function Podium({ v }: { v: StageView }) {
  if (v.phase === 'show' && v.show) return v.show.kind === 'everest' ? <Mountain v={v} /> : <BellBoard v={v} />;
  if (v.phase === 'reveal') return <FastestBoard v={v} />;
  if (v.phase !== 'question' && v.phase !== 'bonus') return null;
  return (
    <div className="absolute left-[417px] top-[634px] w-[420px]">
      <div className="flex items-center justify-between rounded-t-[14px] bg-[#7a2e0e] px-3 py-[1px] text-[19px] font-bold text-[#ffe9b8]">
        <span>⚡ Nhanh nhất</span>
        <span>{v.correctCount} bạn đã đúng</span>
      </div>
      <div className="flex h-[48px] items-center gap-1 rounded-b-[14px] bg-[#fff6dd]/95 px-2 shadow-lg">
        {v.correctTop.length === 0 && <div className="w-full text-center text-[20px] text-[#8a6a3a]">Chưa ai đoán ra…</div>}
        <AnimatePresence initial={false}>
          {v.correctTop.map((a, i) => (
            <motion.div
              key={a.username}
              layout
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex w-1/3 min-w-0 items-center gap-1 text-[17px] text-[#4a2c0e]"
            >
              <span className="text-[20px]">{['🥇', '🥈', '🥉'][i]}</span>
              <div className="min-w-0 flex-1 leading-tight">
                <div className="truncate font-semibold">{a.nickname}</div>
                <div className="font-extrabold text-[#c2410c]">+{a.points}</div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

// Dòng nhắc dưới khung "Nhanh nhất", trên hàng ghế đầu: cách được vào lớp ngồi (đổi câu mỗi 8 giây, viết ngắn)
const SEAT_HINTS = ['⭐ Đoán nhanh, điểm cao được vào lớp ngồi!', '💬 Tương tác nhiều để giữ chỗ trong lớp nha!'];
// đang hỏi: luôn hiện hướng dẫn cố định để người mới lướt vào hiểu ngay (chế độ nhanh 2026-11-04)
const ASK_HINT = '💬 Gõ đáp án vào bình luận · nhanh nhất +10 điểm';
function SeatHint({ now, asking }: { now: number; asking: boolean }) {
  const i = asking ? -1 : Math.floor(now / 8000) % SEAT_HINTS.length;
  return (
    <div className="pointer-events-none absolute left-[397px] top-[718px] z-[9] flex w-[460px] justify-center">
      <AnimatePresence mode="wait">
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          className="whitespace-nowrap rounded-full bg-[#7a2e0e]/80 px-3 py-[1px] text-[18px] font-bold text-[#ffe9b8] shadow-md"
        >
          {i < 0 ? ASK_HINT : SEAT_HINTS[i]}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// ---------- Học sinh ----------
function studentPose(s: StageView['seats'][number], v: StageView, rank: number, now: number): PoseKey {
  if (v.clapping) return 'vui';
  if (now - s.joinedAt < 3000) return 'chao';
  const asking = v.phase === 'question' || v.phase === 'bonus';
  if (s.answered === 'right') return 'vui';
  if (s.answered === 'wrong') return asking ? 'buon' : 'ngac';
  if (asking) return now - s.lastActive < 2500 ? 'tay' : 'nghi';
  if ((v.phase === 'results' || v.phase === 'praise') && rank < 3 && s.score > 0) return 'vui';
  if (now - (s.desk[s.desk.length - 1]?.at ?? 0) < 3000) return 'vui'; // vừa được cô tặng quà
  return now - s.lastActive < 2500 ? 'tay' : 'dung';
}

/** bạn ngồi đầu / cuối dãy: bảng tên neo vào phía trong cho khỏi tràn ra ngoài mép màn hình */
function edgeTag(k: number, n: number): React.CSSProperties {
  if (k === 0) return { left: 0, transform: 'none' };
  if (k === n - 1) return { left: 'auto', right: 0, transform: 'none' };
  return {};
}

/** Vị trí ghế thứ i (khung nửa trên người ngồi, toạ độ stage) */
function seatBox(i: number) {
  const ri = SEAT_ROW[i] ?? ROWS.length - 1;
  const row = ROWS[ri];
  const k = i - SEAT_ROW.indexOf(ri); // thứ tự trong dãy
  const scale = row.s * KID;
  const w = SPRITE_H * 0.47 * scale;
  const h = SPRITE_H * scale;
  const show = h * SHOW;
  const cx = row.x1 + ((k + 0.5) * (row.x2 - row.x1)) / Math.max(1, row.n);
  const x = cx * K - w / 2;
  const y = (row.y + 0.64 * (row.b - row.y)) * K - show; // ngồi trên ghế băng, lưng quay ra khán giả
  return { scale, w, h, show, x, y, ri, k, gap: ((row.x2 - row.x1) * K) / Math.max(1, row.n) };
}

/** Bàn dài + ghế băng của 1 dãy (che hẳn dãy bàn lẻ vẽ sẵn trong ảnh nền) */
function LongDesk({ ri }: { ri: number }) {
  const r = ROWS[ri];
  const h = r.b - r.y;
  const [x1, x2] = [r.x1 - 6, r.x2 + 6];
  const Y = (f: number) => r.y + f * h;
  const nLegs = Math.max(2, Math.floor((r.n || 8) / 2) + 1);
  const legs = Array.from({ length: nLegs }, (_, j) => x1 + 22 + (j * (x2 - x1 - 44)) / (nLegs - 1));
  // màu gỗ hạ vài tông so với bản đầu (chủ kênh chỉnh 2026-11-04: bàn sáng quá, tên và quà trên bàn khó nhìn)
  const line = { stroke: '#57320f', strokeWidth: 3, strokeLinejoin: 'round' as const };
  return (
    <svg className="pointer-events-none absolute left-0 top-0" width={1080} height={1920} viewBox="0 0 941 1672" style={{ zIndex: 9 + ri }}>
      {/* bóng dưới bàn ghế: che chân bàn lẻ trong ảnh nền */}
      <rect x={x1 - 2} y={Y(0.5)} width={x2 - x1 + 4} height={h * 0.52} rx={10} fill="#9c5a2c" />
      {/* chân bàn 2 đầu */}
      <rect x={x1 + 6} y={Y(0.34)} width={14} height={h * 0.62} fill="#70411b" {...line} />
      <rect x={x2 - 20} y={Y(0.34)} width={14} height={h * 0.62} fill="#70411b" {...line} />
      {/* mặt bàn + cạnh trước + tấm chắn trước bàn */}
      <rect x={x1 + 14} y={Y(0.36)} width={x2 - x1 - 28} height={h * 0.26} fill="#965c22" {...line} />
      <polygon points={`${x1 + 8},${r.y} ${x2 - 8},${r.y} ${x2},${Y(0.28)} ${x1},${Y(0.28)}`} fill="#cf9a4c" {...line} />
      <rect x={x1} y={Y(0.28)} width={x2 - x1} height={h * 0.08} fill="#b5772f" {...line} />
      {/* ghế băng */}
      {legs.map((lx) => (
        <rect key={lx} x={lx - 5} y={Y(0.74)} width={10} height={h * 0.24} fill="#5f3816" />
      ))}
      <rect x={x1 + 16} y={Y(0.6)} width={x2 - x1 - 32} height={h * 0.1} rx={4} fill="#c68a3c" {...line} />
      <rect x={x1 + 16} y={Y(0.7)} width={x2 - x1 - 32} height={h * 0.06} fill="#a5692b" {...line} />
    </svg>
  );
}

function Students({ v, now }: { v: StageView; now: number }) {
  const asking = v.phase === 'question' || v.phase === 'bonus';
  const first = asking ? v.correctTop[0]?.username : undefined;
  const dancing = new Set(dancersOf(v).map((s) => s.username));
  return (
    <>
      {ROWS.map((_, ri) => (
        <LongDesk key={ri} ri={ri} />
      ))}
      {v.seats.map((s, i) => {
        const { scale, w, h, show, x, y, ri, k, gap } = seatBox(i);
        // bảng tên so le: bạn thứ 2, 4, 6... trong dãy tên thấp xuống 1 tầng, nên 2 tên cùng tầng cách nhau 2 ghế, hiện đủ tên dài hơn
        const low = k % 2 === 1;
        const pose = studentPose(s, v, i, now);
        const g = s.girl ? 'nu' : 'nam';
        const hd = HEAD[g];
        const called = v.recess?.game === 'callup' && v.recess.callUser === s.username;
        // đang lên bục (tặng hoa / bị phạt): ghế trống, nhân vật vẽ ở chỗ khác
        // đang nhảy múa trước bảng, hoặc đang được thầy giám thị cho vào lớp (chưa đi tới ghế): ghế trống
        const entering = v.escort?.in?.username === s.username && now - v.escort.at < GAME.escortMs * 0.95;
        const away = s.standing || v.walk?.username === s.username || dancing.has(s.username) || entering;
        return (
          <motion.div
            key={s.username}
            initial={{ opacity: 0, left: x, top: y + 40 }}
            // bạn đúng đầu tiên: nhảy lên vui mừng
            animate={{ opacity: away ? 0 : 1, left: x, top: s.username === first ? [y, y - 34, y, y - 18, y] : y }}
            transition={s.username === first ? { top: { duration: 0.9 } } : { type: 'spring', stiffness: 120, damping: 18 }}
            className={`absolute ${called ? 'called-up' : ''}`}
            style={{ width: w, height: show, zIndex: 10 + ri }}
          >
            <div className="absolute inset-0 overflow-hidden">
              <img src={`/assets/nv/${g}/sau-${POSE[g][pose]}.webp`} style={{ width: w, height: h }} className="max-w-none" />
              <div className="absolute" style={{ left: hd.x * w, top: hd.y * h, width: hd.w * w, height: hd.h * h }}>
                <Hair username={s.username} girl={s.girl} />
              </div>
            </div>
            {s.answered === 'right' && <div className="badge bg-[#16a34a]">✓</div>}
            {s.answered === 'right' && s.gain > 0 && (
              <motion.div
                key={`gain${v.qNo}`}
                initial={{ y: 0, opacity: 1, scale: 0.6 }}
                animate={{ y: -90, opacity: [1, 1, 0], scale: 1.2 }}
                transition={{ duration: 1.8, ease: 'easeOut' }}
                className="pointer-events-none absolute left-1/2 top-0 z-40 -translate-x-1/2 whitespace-nowrap font-extrabold text-[#fde047] [text-shadow:0_2px_0_#7a2e0e,0_0_6px_#000]"
                style={{ fontSize: 34 * scale }}
              >
                +{s.gain}
              </motion.div>
            )}
            {s.answered === 'wrong' && <div className="badge bg-[#dc2626]">✗</div>}
            <DeskGifts desk={s.desk} x={x} y={y} w={w} show={show} scale={scale} />
            {s.sleeping && !s.bubble && (
              <motion.div
                animate={{ y: [0, -14, 0], opacity: [0.6, 1, 0.6] }}
                transition={{ duration: 2.4, repeat: Infinity }}
                className="pointer-events-none absolute -top-[46px] right-0 text-[34px]"
                style={{ fontSize: 34 * scale }}
              >
                💤
              </motion.div>
            )}
            {s.bubble && <ChatBubble text={s.bubble} scale={scale} />}
            <div className="nametag" style={{ ...edgeTag(k, ROWS[ri].n), fontSize: 19 * scale, maxWidth: 2 * gap - 8, bottom: low ? `calc(100% - ${4 + 27 * scale}px)` : undefined, zIndex: low ? 2 : 1 }}>
              {s.team > 0 && (
                <span className="mr-1 shrink-0 rounded-full px-[5px] font-extrabold text-white" style={{ background: TEAM_COLOR[s.team - 1] }}>
                  {s.team}
                </span>
              )}
              {i < 5 && s.score > 0 && <span className="rank">{i + 1}</span>}
              {s.title && <span className="mr-1">{s.title === 'lop-truong' ? '👑' : '⭐'}</span>}
              {s.showIcons && <span className="mr-1 whitespace-nowrap">{s.showIcons}</span>}
              {called && <span className="mr-1">📢</span>}
              {s.days >= 2 && <span className="mr-1 whitespace-nowrap">🎒{s.days}</span>}
              {/* học bạ: lớp mấy (lớp 1 thì khỏi hiện cho gọn), tốt nghiệp đội mũ */}
              {s.grade >= 2 && (
                <span className="mr-1 shrink-0 rounded-full bg-[#2563eb] px-[5px] font-extrabold text-white">{s.grade > 12 ? '🎓' : `L${s.grade}`}</span>
              )}
              <span className="truncate">{s.nickname}</span>
              {s.score > 0 && <b className="ml-1 text-[#c2410c]">{s.score}</b>}
            </div>
          </motion.div>
        );
      })}
    </>
  );
}

// Bong bóng chat trên đầu (đã lọc: không có câu trả lời, không có từ cấm)
function ChatBubble({ text, scale }: { text: string; scale: number }) {
  return (
    <motion.div
      key={text}
      initial={{ opacity: 0, y: 10, scale: 0.7 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className="pointer-events-none absolute bottom-[calc(100%+30px)] left-1/2 z-30 max-w-[200px] -translate-x-1/2 truncate rounded-[16px] bg-white px-3 py-1 font-semibold text-[#3b2a14] shadow-md"
      style={{ fontSize: 18 * scale }}
    >
      {text}
      <div className="absolute -bottom-[7px] left-1/2 h-[14px] w-[14px] -translate-x-1/2 rotate-45 bg-white" />
    </motion.div>
  );
}

// Tặng hoa: bạn nhỏ đứng dậy đi lên bục đưa hoa cho cô, rồi đi về chỗ (bạn không có ghế thì đi từ cửa lớp)
const PODIUM: [number, number] = [372, 690]; // chỗ đứng đưa hoa, cạnh tay cô (toạ độ góc trên trái nhân vật)
function FlowerWalk({ v }: { v: StageView }) {
  const w = v.walk;
  if (!w) return null;
  const i = v.seats.findIndex((s) => s.username === w.username);
  const H = 210;
  const from: [number, number] = i >= 0 ? [seatBox(i).x, seatBox(i).y - 40] : [990, 760];
  const g = w.girl ? 'nu' : 'nam';
  return (
    <motion.div
      key={w.at}
      initial={{ left: from[0], top: from[1], opacity: 0 }}
      animate={{ left: [from[0], PODIUM[0], PODIUM[0], from[0]], top: [from[1], PODIUM[1], PODIUM[1], from[1]], opacity: [1, 1, 1, 0] }}
      transition={{ duration: GAME.walkMs / 1000, times: [0, 0.35, 0.65, 1], ease: 'easeInOut' }}
      className="pointer-events-none absolute z-30"
      style={{ width: H * 0.47, height: H }}
    >
      <img src={`/assets/nv/${g}/${POSE[g].vui}.webp`} className="h-full w-full drop-shadow-[0_4px_3px_rgba(0,0,0,0.3)]" />
      {/* bó hoa to nhỏ theo bậc quà */}
      <div className="absolute -right-4 top-[70px] leading-none" style={{ fontSize: 40 * GAME.giftTiers[w.tier].size }}>
        {w.icon}
      </div>
      <div className="nametag" style={{ fontSize: 16, bottom: 'calc(100% - 4px)' }}>
        <span className="truncate">{w.nickname}</span>
      </div>
    </motion.div>
  );
}

// Học sinh cá biệt: bị cô phạt đứng cạnh bảng (bên phải), đeo bảng tên đỏ
// gõ sai: đứng phạt 3 câu ở khoảng sàn trống giữa cô giáo và dãy bàn đầu (chủ kênh khoanh chỗ, 2026-11-05),
// xếp 1 hàng từ cạnh cô sang phải. Hình phạt (chủ kênh chốt): giơ tay đứng phạt, nhún lên xuống
const STAND_SPOTS = [420, 492, 564, 636, 708, 780];
const STAND_FEET = 880;
function Punished({ v }: { v: StageView }) {
  return (
    <>
      {v.punished.slice(0, STAND_SPOTS.length).map((s, i) => {
        const H = 120;
        const g = s.girl ? 'nu' : 'nam';
        return (
          <motion.div
            key={s.username}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="pointer-events-none absolute z-30"
            style={{ left: STAND_SPOTS[i] - (H * 0.47) / 2, top: STAND_FEET - H, width: H * 0.47, height: H }}
          >
            <motion.img
              src={`/assets/nv/${g}/${POSE[g].tay}.webp`}
              animate={{ y: [0, 10, 0], scaleY: [1, 0.94, 1] }}
              transition={{ duration: 1.1, repeat: Infinity, ease: 'easeInOut', delay: i * 0.15 }}
              style={{ transformOrigin: 'bottom center' }}
              className="h-full w-full drop-shadow-[0_4px_3px_rgba(0,0,0,0.3)]"
            />
            {/* chỉ hiện tên bạn đang đứng (chủ kênh bỏ chữ "Gõ sai · còn N câu", 2026-11-05) */}
            <div className="nametag" style={{ fontSize: 15, maxWidth: 76 }}>
              <span className="truncate">{s.nickname}</span>
            </div>
          </motion.div>
        );
      })}
    </>
  );
}

// Bình hoa trên bàn cô: hoa các bạn tặng cắm vào, càng nhiều hoa càng đầy bình
const VASE_SPOTS: [number, number][] = [
  [0, 0], [-22, 8], [22, 8], [-12, -18], [12, -18], [0, -30], [-30, -10], [30, -10], [-20, -36], [20, -36], [-36, 14], [36, 14],
];
function Vase({ v }: { v: StageView }) {
  const n = Math.min(v.flowers, VASE_SPOTS.length);
  return (
    <div className="pointer-events-none absolute left-[150px] top-[585px] z-[9]">
      {VASE_SPOTS.slice(0, n).map(([dx, dy], i) => (
        <motion.div
          key={i}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: i === n - 1 ? GAME.walkMs / 2000 : 0, type: 'spring' }}
          className="absolute text-[30px]"
          style={{ left: dx, top: dy }}
        >
          {['🌸', '🌷', '🌹', '🌼'][i % 4]}
        </motion.div>
      ))}
    </div>
  );
}

// Quà cô thưởng: bay từ tay cô giáo xuống, đặt lên mặt bàn 2 bên người bạn nhỏ
const TEACHER_HAND: [number, number] = [300, 640]; // px stage
function DeskGifts({ desk, x, y, w, show, scale }: { desk: StageView['seats'][number]['desk']; x: number; y: number; w: number; show: number; scale: number }) {
  const size = 34 * scale;
  const deskTop = show - 72 * K + 44 * scale; // mặt bàn: mép trên bàn (ROWS.y) lùi xuống, tính trong khung học sinh
  // chỗ trống trên mặt bàn 2 bên đầu bạn nhỏ (lệch so với tâm bàn): trái, phải, trái ngoài, phải ngoài
  const SPOTS = [-40, 40, -58, 58];
  return (
    <>
      {desk.map((g, i) => {
        const left = w / 2 + SPOTS[i % SPOTS.length] * scale - size / 2;
        const top = deskTop - size + (i >= 2 ? 3 : 0) * scale;
        return (
          <motion.div
            key={g.at + g.icon}
            // quà cũ (mở lại trang, đổi chỗ ngồi) thì nằm sẵn trên bàn, không bay lại
            initial={Date.now() - g.at < 2000 ? { x: TEACHER_HAND[0] - (x + left), y: TEACHER_HAND[1] - (y + top), scale: 2.2, rotate: -30, opacity: 0 } : false}
            animate={{ x: 0, y: 0, scale: 1, rotate: 0, opacity: 1 }}
            transition={{ duration: 1.1, ease: [0.3, 1.4, 0.5, 1], opacity: { duration: 0.2 } }}
            className="pointer-events-none absolute drop-shadow-[0_4px_2px_rgba(0,0,0,0.35)]"
            style={{ left, top, fontSize: size, lineHeight: 1, zIndex: 5 }}
          >
            {g.icon}
          </motion.div>
        );
      })}
    </>
  );
}

// Bên phải, trên hàng ghế đầu: top tương tác hôm nay (cách tính không hiện ra màn hình)
function TalkTop({ v }: { v: StageView }) {
  const rows = (v.talkTop ?? []).slice(0, 5);
  return (
    <div className="absolute left-[842px] top-[616px] z-[8] w-[232px] rotate-1 rounded-[14px] border-[3px] border-[#c9a45c] bg-[#fff8e1]/95 px-2 pb-2 pt-3 text-[#4a2c0e] shadow-[0_6px_10px_rgba(0,0,0,0.3)]">
      <div className="absolute -top-[18px] left-1/2 -translate-x-1/2 text-[28px]">📌</div>
      <div className="whitespace-nowrap text-center text-[22px] font-extrabold leading-tight text-[#b45309]">💬 Top tương tác</div>
      {rows.length === 0 && <div className="py-2 text-center text-[17px] text-[#8a6a3a]">Bình luận để lên bảng nha!</div>}
      <div className="mt-1 space-y-[1px]">
        {rows.map((r, i) => (
          <motion.div key={r.username} layout className="flex items-center gap-1 text-[22px] leading-[28px]">
            <span className="w-6 text-center">{['🥇', '🥈', '🥉', '4', '5'][i]}</span>
            <span className="min-w-0 flex-1 truncate font-semibold">{r.nickname}</span>
            {/* hiện điểm tương tác, không ghi cách tính (chủ kênh đổi 2026-11-04) */}
            <b className="text-[#c2410c]">{r.points}</b>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// Bảng khẩu hiệu đỏ trên bảng đen
function Motto({ text }: { text: string }) {
  // chữ đổi được ở trang điều khiển: dài thì nhỏ lại cho vừa bảng
  const size = text.length > 34 ? 28 : text.length > 28 ? 33 : 38;
  return (
    <div className="motto absolute left-1/2 top-[168px] -translate-x-1/2 whitespace-nowrap px-10 py-[6px] font-extrabold tracking-wider" style={{ fontSize: size }}>
      {text}
    </div>
  );
}

function GiftBanner({ gift, now }: { gift: GameState['lastGift']; now: number }) {
  const show = gift && now - gift.at < 4000;
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key={gift.at}
          initial={{ opacity: 0, y: -30, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0 }}
          className="absolute left-[24px] top-[470px] z-50 max-w-[560px] rounded-[26px] bg-gradient-to-r from-pink-500 to-rose-400 px-6 py-3 text-[30px] font-bold text-white shadow-xl"
        >
          {giftOf(gift.giftName)?.icon ?? '💐'} <span className="inline-block max-w-[300px] truncate align-bottom">{gift.nickname}</span> {X('tặng cô')} {gift.repeatCount > 1 ? `${gift.repeatCount} × ` : ''}
          {giftOf(gift.giftName)?.say ?? gift.giftName}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// "Ai yêu cô thì gõ số 1": mỗi bạn gõ là một trái tim bay lên cạnh cô, kèm số đếm
function LoveHearts({ n }: { n: number }) {
  if (n <= 0) return null;
  return (
    <div className="pointer-events-none absolute left-[60px] top-[330px] z-40 h-[520px] w-[340px]">
      {Array.from({ length: Math.min(n, 30) }, (_, i) => (
        <motion.div
          key={i}
          initial={{ y: 480, opacity: 0, scale: 0.6 }}
          animate={{ y: -20, opacity: [0, 1, 0], scale: 1.2 }}
          transition={{ duration: 2.4, delay: (i % 6) * 0.15, repeat: Infinity, repeatDelay: 0.4 }}
          className="absolute text-[54px]"
          style={{ left: ((i * 67) % 280) + 10 }}
        >
          {i % 3 === 0 ? '💕' : '❤️'}
        </motion.div>
      ))}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-pink-500 px-5 py-1 text-[30px] font-bold text-white shadow-lg">
        💕 {n} {X('bạn yêu cô')}
      </div>
    </div>
  );
}

// Bình chọn vui ("miền Bắc gõ B..."): thẻ đếm phiếu cạnh cô trong 15 giây
function PollCard({ v }: { v: StageView }) {
  return (
    <AnimatePresence>
      {v.poll && (
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -40 }}
          className="absolute left-[16px] top-[640px] z-40 w-[330px] rounded-[20px] border-[3px] border-white bg-gradient-to-br from-sky-500 to-indigo-500 px-4 py-2 text-white shadow-xl"
        >
          <div className="text-center text-[24px] font-extrabold">🗳️ Gõ chữ để chọn nha!</div>
          {v.poll.map((o) => (
            <div key={o.key} className="flex items-center gap-2 text-[24px] leading-[34px]">
              <b className="flex h-[30px] w-[30px] items-center justify-center rounded-full bg-white text-indigo-600">{o.key.toUpperCase()}</b>
              <span className="min-w-0 flex-1 truncate">{o.label}</span>
              <b>{o.n}</b>
            </div>
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Chúc mừng sinh nhật: biểu ngữ trên đầu lớp, bánh kem đã đặt lên bàn bạn nhỏ
function BirthdayBanner({ v }: { v: StageView }) {
  return (
    <AnimatePresence>
      {v.birthday && (
        <motion.div
          key={v.birthday.at}
          initial={{ opacity: 0, y: -40, scale: 0.7 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -40 }}
          transition={{ type: 'spring', stiffness: 200, damping: 14 }}
          className="absolute left-1/2 top-[620px] z-50 w-[900px] -translate-x-1/2 rounded-[30px] border-4 border-white bg-gradient-to-r from-pink-500 via-fuchsia-500 to-amber-400 px-6 py-4 text-center font-extrabold text-white shadow-2xl"
        >
          {/* chữ biểu ngữ đổi ở trang điều khiển; có {ten} thì chèn tên vào câu */}
          {v.cfg.birthdayText.includes('{ten}') ? (
            <div className="line-clamp-2 text-[50px] leading-tight drop-shadow">{v.cfg.birthdayText.split('{ten}').join(v.birthday.nickname)}</div>
          ) : (
            <>
              <div className="text-[46px] leading-tight">{v.cfg.birthdayText}</div>
              <div className="mt-1 truncate text-[54px] leading-tight drop-shadow">{v.birthday.nickname}</div>
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Nút "Chào tạm biệt" ở trang điều khiển (chủ kênh bấm trước khi xuống live): biểu ngữ tan lớp
function GoodbyeBanner({ v }: { v: StageView }) {
  return (
    <AnimatePresence>
      {v.goodbye && (
        <motion.div
          key={v.goodbye.at}
          initial={{ opacity: 0, y: -40, scale: 0.7 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -40 }}
          transition={{ type: 'spring', stiffness: 200, damping: 14 }}
          className="absolute left-1/2 top-[620px] z-50 w-[900px] -translate-x-1/2 rounded-[30px] border-4 border-white bg-gradient-to-r from-sky-500 via-indigo-500 to-pink-500 px-6 py-4 text-center font-extrabold text-white shadow-2xl"
        >
          <motion.div animate={{ rotate: [-12, 12, -12] }} transition={{ duration: 1, repeat: Infinity }} className="inline-block text-[64px] leading-none">
            👋
          </motion.div>
          <div className="mt-1 whitespace-nowrap text-[44px] leading-tight drop-shadow">Tan lớp rồi! Hẹn gặp lại cả lớp nha 💕</div>
          <div className="mt-2 text-[30px] font-bold leading-tight">Nhớ theo dõi kênh để không lỡ buổi học sau</div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Claps() {
  return (
    <div className="pointer-events-none absolute inset-0 z-40">
      {Array.from({ length: 14 }, (_, i) => (
        <motion.div
          key={i}
          initial={{ y: 1500, opacity: 0 }}
          animate={{ y: 700, opacity: [0, 1, 0] }}
          transition={{ duration: 2.2, delay: (i % 7) * 0.25, repeat: Infinity }}
          className="absolute text-[70px]"
          style={{ left: 60 + i * 70 }}
        >
          👏
        </motion.div>
      ))}
    </div>
  );
}
