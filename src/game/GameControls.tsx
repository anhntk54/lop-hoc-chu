import { useEffect, useRef, useState } from 'react';
import { emitTest, sendControl } from '../live/page';
import type { StageView } from './useGame';
import { GAME, shownTeacherName, type RoomCfg } from './config';

// Nút riêng của Lớp Học Chữ ở trang điều khiển: điều khiển ván + giả lập phòng đông để thử bot
const HO = ['Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Vũ', 'Đặng', 'Bùi'];
const TEN = ['Lan Anh', 'Minh Tuấn', 'Thu Trang', 'Quốc Bảo', 'Ngọc Hân', 'Gia Huy', 'Khánh Linh', 'Hải Yến', 'Đức Anh', 'Bảo Ngọc', 'Thanh Hà', 'Văn Toàn'];
const CHAT = ['khó quá cô ơi', 'chữ gì vậy trời', 'hay quá', 'vào lớp', 'cô xinh quá', 'ủa là gì', '???', 'hihi'];
const fake = (i: number) => ({ username: `hs${i}`, nickname: `${HO[i % HO.length]} ${TEN[i % TEN.length]}`, avatar: '' });
const shuffleWord = (w: string) => [...w].sort(() => Math.random() - 0.5).join('');

// Cài đặt lớp: tên + giọng cô giáo, chữ bảng đỏ, bật tắt 2 game lớn, ảnh nền. Đổi là trang stage đổi ngay, không cần tải lại
function RoomSettings() {
  const [cfg, setCfg] = useState<RoomCfg>(GAME.defaultRoom);
  const [name, setName] = useState('');
  const [motto, setMotto] = useState('');
  const [mins, setMins] = useState('');
  const [danceText, setDanceText] = useState('');
  const [danceSec, setDanceSec] = useState('');
  const [bdText, setBdText] = useState('');
  const [msg, setMsg] = useState('');
  const file = useRef<HTMLInputElement>(null);
  const load = (r: Partial<RoomCfg>) => setCfg({ ...GAME.defaultRoom, ...r });
  useEffect(() => {
    fetch('/api/room-settings').then((r) => r.json()).then(load).catch(() => {});
  }, []);
  const save = async (patch: Partial<RoomCfg>, done: string) => {
    const r = await fetch('/api/room-settings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(patch) }).then((x) => x.json());
    setMsg(r.success ? done : r.error);
    if (r.success) load(r.room);
    return r.success as boolean;
  };
  const upload = async (f: File | undefined) => {
    if (!f) return;
    setMsg('Đang tải ảnh lên...');
    const r = await fetch('/api/room-bg', { method: 'POST', headers: { 'Content-Type': f.type }, body: f })
      .then((x) => x.json())
      .catch(() => ({ success: false, error: 'Ảnh quá lớn hoặc không đúng loại (PNG, JPG, WEBP, tối đa 12 MB)' }));
    setMsg(r.success ? 'Đã đổi nền lớp' : r.error);
    if (r.success) load(r.room);
    if (file.current) file.current.value = '';
  };
  const resetBg = async () => {
    const r = await fetch('/api/room-bg', { method: 'DELETE' }).then((x) => x.json());
    setMsg('Đã về nền gốc');
    load(r.room);
  };
  const input = 'min-w-0 flex-1 rounded-lg bg-slate-800 px-2 py-1';
  const row = 'flex items-center gap-1.5';
  const label = 'w-24 shrink-0 text-slate-400';
  return (
    <div className="space-y-2 rounded-2xl bg-slate-900 p-3 text-xs ring-1 ring-slate-800">
      <div className="flex justify-between font-semibold text-slate-200">
        <span>🏫 Cài đặt lớp</span>
        <span className="font-normal text-amber-300">{msg}</span>
      </div>
      <div className={row}>
        <span className={label}>Người đứng lớp</span>
        <select
          className={input}
          value={cfg.teacher}
          onChange={(e) => {
            const teacher = e.target.value as RoomCfg['teacher'];
            const patch: Partial<RoomCfg> = { teacher, teacherVoice: teacher === 'thay' ? 'nam' : 'nu' };
            // tên còn theo người cũ thì đổi luôn tên mặc định
            if (teacher === 'thay' && /^cô(\s|$)/i.test(cfg.teacherName)) patch.teacherName = GAME.defaultThayName;
            if (teacher === 'co' && /^thầy(\s|$)/i.test(cfg.teacherName)) patch.teacherName = GAME.defaultRoom.teacherName;
            save(patch, teacher === 'thay' ? 'Đã đổi sang thầy giáo (giọng nam)' : 'Đã đổi sang cô Ngân');
          }}
        >
          <option value="co">👩‍🏫 Cô Ngân (giọng nữ)</option>
          <option value="thay">👨‍🏫 Thầy giáo (giọng nam)</option>
        </select>
      </div>
      <div className={row}>
        <span className={label}>Tên {cfg.teacher === 'thay' ? 'thầy' : 'cô'} giáo</span>
        <input className={input} placeholder={shownTeacherName(cfg)} maxLength={24} value={name} onChange={(e) => setName(e.target.value)} />
        <Btn disabled={!name.trim()} onClick={() => save({ teacherName: name }, 'Đã đổi tên').then((ok) => ok && setName(''))}>
          Lưu
        </Btn>
      </div>
      <div className={row}>
        <span className={label}>Giọng đọc</span>
        <select className={input} disabled={cfg.teacher === 'thay'} value={cfg.teacher === 'thay' ? 'nam' : cfg.teacherVoice} onChange={(e) => save({ teacherVoice: e.target.value as RoomCfg['teacherVoice'] }, 'Đã đổi giọng')}>
          <option value="nu">Nữ (HoaiMy)</option>
          <option value="nam">Nam (NamMinh)</option>
        </select>
      </div>
      <div className={row}>
        <span className={label}>Chữ bảng đỏ</span>
        <input className={input} placeholder={cfg.motto} maxLength={40} value={motto} onChange={(e) => setMotto(e.target.value)} />
        <Btn disabled={!motto.trim()} onClick={() => save({ motto }, 'Đã đổi chữ bảng đỏ').then((ok) => ok && setMotto(''))}>
          Lưu
        </Btn>
      </div>
      <div className={row}>
        <span className={label}>Cuộc thi</span>
        <label className="flex items-center gap-1">
          <input type="checkbox" checked={cfg.everest} onChange={(e) => save({ everest: e.target.checked }, e.target.checked ? 'Đã bật Everest' : 'Đã tắt Everest')} />
          🏔️ Everest
        </label>
        <label className="ml-2 flex items-center gap-1">
          <input type="checkbox" checked={cfg.chuong} onChange={(e) => save({ chuong: e.target.checked }, e.target.checked ? 'Đã bật Rung Chuông Đồng' : 'Đã tắt Rung Chuông Đồng')} />
          🔔 Rung Chuông Đồng
        </label>
      </div>
      <div className={row}>
        <span className={label}>👮 Giám thị</span>
        <label className="flex items-center gap-1">
          <input type="checkbox" checked={cfg.supervisor} onChange={(e) => save({ supervisor: e.target.checked }, e.target.checked ? 'Đã bật thầy giám thị' : 'Đã tắt thầy giám thị')} />
          Đưa bạn ngồi im quá
        </label>
        <input className="w-14 rounded-lg bg-slate-800 px-2 py-1" type="number" min={1} max={60} placeholder={String(cfg.supervisorMin)} value={mins} onChange={(e) => setMins(e.target.value)} />
        <span className="text-slate-400">phút ra ngoài</span>
        <Btn disabled={!mins} onClick={() => save({ supervisorMin: Number(mins) }, 'Đã đổi số phút giám thị').then((ok) => ok && setMins(''))}>
          Lưu
        </Btn>
      </div>
      <div className={row}>
        <span className={label}>💃 Nhảy múa</span>
        <select className={input} value={cfg.dance} onChange={(e) => save({ dance: e.target.value as RoomCfg['dance'] }, 'Đã đổi giờ ra chơi nhảy múa')}>
          <option value="off">Tắt</option>
          <option value="mix">Xen kẽ với trò ra chơi khác</option>
          <option value="always">Mọi giờ ra chơi đều nhảy</option>
        </select>
        <input className="w-14 rounded-lg bg-slate-800 px-2 py-1" type="number" min={10} max={120} placeholder={String(cfg.danceSec)} value={danceSec} onChange={(e) => setDanceSec(e.target.value)} />
        <span className="text-slate-400">giây</span>
        <Btn disabled={!danceSec} onClick={() => save({ danceSec: Number(danceSec) }, 'Đã đổi thời gian nhảy').then((ok) => ok && setDanceSec(''))}>
          Lưu
        </Btn>
      </div>
      <div className={row}>
        <span className={label}>Thông báo nhảy</span>
        <input className={input} placeholder={cfg.danceText} maxLength={80} value={danceText} onChange={(e) => setDanceText(e.target.value)} />
        <Btn disabled={!danceText.trim()} onClick={() => save({ danceText }, 'Đã đổi thông báo nhảy múa').then((ok) => ok && setDanceText(''))}>
          Lưu
        </Btn>
      </div>
      <div className={row}>
        <span className={label}>🎂 Biểu ngữ SN</span>
        <input className={input} placeholder={cfg.birthdayText} maxLength={60} value={bdText} onChange={(e) => setBdText(e.target.value)} />
        <Btn disabled={!bdText.trim()} onClick={() => save({ birthdayText: bdText }, 'Đã đổi chữ biểu ngữ sinh nhật').then((ok) => ok && setBdText(''))}>
          Lưu
        </Btn>
      </div>
      <div className="pl-[102px] text-slate-500">Biểu ngữ sinh nhật: gõ {'{ten}'} để chèn tên bạn đó vào giữa câu, không gõ thì tên hiện ở dòng dưới.</div>
      <div className={row}>
        <span className={label}>Nền lớp học</span>
        <input ref={file} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(e) => upload(e.target.files?.[0])} />
        <Btn onClick={() => file.current?.click()}>Chọn ảnh...</Btn>
        {cfg.bg && <Btn onClick={resetBg}>Về nền gốc</Btn>}
        <span className="text-slate-500">Ảnh dọc 9:16, tối đa 12 MB</span>
      </div>
    </div>
  );
}

type WebhookCfg = {
  enabled: boolean;
  url: string;
  action: 'comment' | 'like';
  sendAnswer: boolean;
  duration: number;
  maxResponses: number;
  count: number;
};

const defaultWebhookCfg: WebhookCfg = {
  enabled: true,
  url: 'http://127.0.0.1:8000/api/webhook',
  action: 'comment',
  sendAnswer: true,
  duration: 15,
  maxResponses: 2,
  count: 20,
};

function WebhookControls() {
  const [cfg, setCfg] = useState<WebhookCfg>(defaultWebhookCfg);
  const [msg, setMsg] = useState('');
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    fetch('/api/webhook-settings')
      .then((r) => r.json())
      .then((data) => setCfg((prev) => ({ ...prev, ...data })))
      .catch(() => {});
  }, []);

  const save = async (patch: Partial<WebhookCfg>, note = 'Đã lưu') => {
    const next = { ...cfg, ...patch };
    setCfg(next);
    setMsg('Đang lưu...');
    try {
      const res = await fetch('/api/webhook-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      });
      const data = await res.json();
      if (data.success) {
        setMsg(note);
        setTimeout(() => setMsg(''), 3000);
        return true;
      }
      setMsg(data.error || 'Lỗi');
      return false;
    } catch {
      setMsg('Lỗi mạng');
      return false;
    }
  };

  const testWebhook = async () => {
    setTesting(true);
    setMsg('Đang gửi thử...');
    try {
      const res = await fetch('/api/webhook/test', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setMsg(`✅ Bot nhận: ${data.data?.message || 'OK'}`);
      } else if (data.status === 400) {
        setMsg(`⚠️ ${data.data?.detail || 'Chưa bấm Bắt đầu seeding trên Dashboard'}`);
      } else {
        setMsg(`❌ Lỗi: ${data.error || 'Không kết nối được Bot'}`);
      }
    } catch (e: any) {
      setMsg(`❌ Lỗi: ${e.message}`);
    } finally {
      setTesting(false);
    }
  };

  const row = 'flex items-center gap-1.5 flex-wrap';
  const label = 'w-24 shrink-0 text-slate-400';
  const input = 'rounded-lg bg-slate-800 px-2 py-1 text-white ring-1 ring-slate-700';

  return (
    <div className="space-y-2 rounded-2xl bg-slate-900 p-3 text-xs ring-1 ring-slate-800">
      <div className="flex justify-between font-semibold text-slate-200">
        <span>🤖 Webhook Seeding Bot (Port 8000)</span>
        <span className="font-normal text-amber-300">{msg}</span>
      </div>
      <div className={row}>
        <span className={label}>Trạng thái</span>
        <label className="flex items-center gap-1.5 font-medium text-white cursor-pointer">
          <input
            type="checkbox"
            checked={cfg.enabled}
            onChange={(e) => save({ enabled: e.target.checked }, e.target.checked ? 'Đã bật Webhook' : 'Đã tắt Webhook')}
          />
          Tự động gửi khi cô đọc xong câu hỏi
        </label>
        <button
          onClick={testWebhook}
          disabled={testing}
          className="ml-auto rounded-lg bg-indigo-600 px-2.5 py-1 text-white hover:bg-indigo-500 disabled:opacity-50"
        >
          {testing ? 'Đang gửi...' : '⚡ Thử gửi Webhook ngay'}
        </button>
      </div>
      {cfg.enabled && (
        <>
          <div className={row}>
            <span className={label}>Chế độ</span>
            <select
              className={input}
              value={cfg.action === 'like' ? 'like' : cfg.sendAnswer ? 'answer' : 'spintax'}
              onChange={(e) => {
                const val = e.target.value;
                if (val === 'like') save({ action: 'like' });
                else if (val === 'answer') save({ action: 'comment', sendAnswer: true });
                else save({ action: 'comment', sendAnswer: false });
              }}
            >
              <option value="answer">💬 Gửi đáp án câu hỏi (Bot trả lời câu đố)</option>
              <option value="spintax">📝 Gửi kịch bản Bot (Spintax trên Dashboard)</option>
              <option value="like">❤️ Thả tim tự động (Like)</option>
            </select>
          </div>
          {cfg.action === 'comment' && (
            <div className={row}>
              <span className={label}>Phân bổ</span>
              <span className="text-slate-400">Thời gian:</span>
              <input
                className="w-14 rounded-lg bg-slate-800 px-2 py-1 text-white"
                type="number"
                min={1}
                max={60}
                value={cfg.duration}
                onChange={(e) => save({ duration: Number(e.target.value) || 15 })}
              />
              <span className="text-slate-400">giây</span>
              <span className="ml-3 text-slate-400">Tối đa:</span>
              <input
                className="w-14 rounded-lg bg-slate-800 px-2 py-1 text-white"
                type="number"
                min={1}
                max={20}
                value={cfg.maxResponses}
                onChange={(e) => save({ maxResponses: Number(e.target.value) || 2 })}
              />
              <span className="text-slate-400">tài khoản</span>
            </div>
          )}
          {cfg.action === 'like' && (
            <div className={row}>
              <span className={label}>Số lượng</span>
              <input
                className="w-16 rounded-lg bg-slate-800 px-2 py-1 text-white"
                type="number"
                min={5}
                max={200}
                value={cfg.count}
                onChange={(e) => save({ count: Number(e.target.value) || 20 })}
              />
              <span className="text-slate-400">tim mỗi tài khoản</span>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export function GameControls({ view, stageCount = 0 }: { view: StageView | null; stageCount?: number }) {
  const [sent, setSent] = useState(0);
  const [running, setRunning] = useState(false);
  const [bdName, setBdName] = useState('');

  /** Giả lập n người xem cùng bình luận trong 20 giây: 15% đúng, 20% đoán sai, còn lại nói chuyện */
  const flood = async (n: number) => {
    if (!view?.answer || running) return;
    setRunning(true);
    setSent(0);
    const answer = view.answer.toLowerCase();
    const start = Date.now();
    let done = 0;
    await Promise.all(
      Array.from({ length: n }, (_, i) => {
        const r = Math.random();
        const comment = r < 0.15 ? answer : r < 0.35 ? shuffleWord(answer) : CHAT[i % CHAT.length];
        const delay = Math.random() * 20_000;
        return new Promise<void>((ok) =>
          setTimeout(async () => {
            // TikTok gắn giờ lúc gửi; tới tay bot có thể trễ tới 1,5 giây và lệch thứ tự
            await emitTest('chat', { ...fake(i), comment, createTime: start + delay - Math.random() * 1500 }).catch(() => {});
            setSent(++done);
            ok();
          }, delay),
        );
      }),
    );
    setRunning(false);
  };

  return (
    <div className="space-y-3">
      {stageCount > 1 && <div className="rounded-lg bg-red-600 p-2 text-white">Đang mở {stageCount} trang stage, sẽ có 2 giọng. Đóng bớt đi.</div>}
      <RoomSettings />
      <WebhookControls />
      {view && (
        <div className="rounded-lg bg-slate-800 p-3 text-sm leading-6">
          <div>
            Ván {view.round} · câu {view.qNo}/{view.total} · {view.phase}
          </div>
          <div>
            Đáp án (chỉ mình thấy): <b className="text-amber-300">{view.answer || '—'}</b>
          </div>
          <div>
            Bot nhận câu này: <b>{view.stats.received}</b> comment · {view.stats.attempts} lượt trả lời · {view.correctCount} đúng
          </div>
          <div>
            Đang chơi: <b>{view.players}</b> bạn
            {view.players < GAME.smallRoomPlayers && <span className="text-amber-300"> · phòng vắng: có người đúng là {GAME.smallRoomEndAfterSec} giây sau chốt câu</span>}
          </div>
          {view.topic && <div>Chủ đề cả lớp chọn: {view.topic}</div>}
          {sent > 0 && <div>Giả lập đã gửi: {sent}</div>}
        </div>
      )}
      {/* Chủ kênh dùng trong lúc live */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => confirm(`Bỏ câu "${view?.answer}"? Câu này sẽ không bao giờ được hỏi lại.`) && sendControl('custom', 'ban')}
          disabled={!view?.answer || !!view.math || !['question', 'bonus', 'reveal'].includes(view.phase)}
          className="rounded-lg bg-red-700 px-3 py-2 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-40"
        >
          🚫 Bỏ câu này
        </button>
        <input
          value={bdName}
          onChange={(e) => setBdName(e.target.value)}
          placeholder="Tên bạn sinh nhật"
          className="w-48 rounded-lg bg-slate-900 px-3 py-2 text-sm text-white"
        />
        <Btn
          onClick={() => {
            if (bdName.trim()) sendControl('custom', `birthday:${bdName.trim()}`);
            setBdName('');
          }}
        >
          🎂 Chúc sinh nhật
        </Btn>
        <a href="/bao-cao" target="_blank" className="rounded-lg bg-emerald-700 px-3 py-2 text-sm text-white hover:bg-emerald-600">
          📊 Báo cáo hôm nay
        </a>
      </div>
      <div className="flex flex-wrap gap-2">
        <Btn onClick={() => sendControl('custom', 'skip')}>⏭ Qua phần tiếp</Btn>
        <Btn onClick={() => sendControl('custom', 'newRound')}>🔄 Ván mới</Btn>
        <Btn onClick={() => sendControl('custom', 'goodbye')}>👋 Chào tạm biệt (xuống live)</Btn>
        <Btn onClick={() => emitTest('chat', { ...fake(Math.floor(Math.random() * 50)), comment: view?.answer.toLowerCase() ?? '' })}>✅ 1 bạn trả lời đúng</Btn>
        <Btn onClick={() => emitTest('chat', { ...fake(Math.floor(Math.random() * 50)), comment: 'vào lớp' })}>🙋 1 bạn vào lớp</Btn>
        <Btn onClick={() => emitTest('gift', { ...fake(3), giftName: 'Hoa hồng', giftId: 1, diamondCount: 1, repeatCount: 1 })}>🌹 Tặng hoa</Btn>
        <Btn onClick={() => emitTest('gift', { ...fake(4), giftName: 'Mũ', giftId: 2, diamondCount: 99, repeatCount: 1 })}>🎁 Quà to</Btn>
        <Btn onClick={() => emitTest('like', { ...fake(5), likeCount: 300 })}>❤️ 300 tim</Btn>
        <Btn onClick={() => emitTest('chat', { ...fake(Math.floor(Math.random() * 50)), comment: 'hôm nay sinh nhật con cô ơi' })}>🎂 Thử: 1 bạn báo sinh nhật</Btn>
        <Btn onClick={() => sendControl('custom', 'recess:rps')}>✊ Ra chơi: oẳn tù tì</Btn>
        <Btn onClick={() => sendControl('custom', 'recess:callup')}>📢 Ra chơi: kiểm tra miệng</Btn>
        <Btn onClick={() => sendControl('custom', 'recess:pick')}>⚖️ Ra chơi: chọn phe</Btn>
        <Btn onClick={() => sendControl('custom', 'recess:roll')}>🙋 Ra chơi: điểm danh</Btn>
        <Btn onClick={() => sendControl('custom', 'recess:heart')}>❤️ Ra chơi: thả tim</Btn>
        <Btn onClick={() => sendControl('custom', 'recess:dance')}>💃 Ra chơi: nhảy múa thả tim</Btn>
        {(() => {
          // thầy giám thị chỉ vào được khi có bạn đang ngồi và không phải giờ chọn tổ / game lớn / nhảy múa
          const why = !view
            ? 'chưa mở trang stage'
            : !view.seats.length
              ? 'lớp chưa có bạn nào ngồi'
              : view.phase === 'show' || view.phase === 'team' || (view.phase === 'recess' && view.recess?.game === 'dance')
                ? 'đang game lớn / chọn tổ / nhảy múa'
                : view.escort
                  ? 'thầy đang đưa 1 bạn ra'
                  : '';
          return (
            <span className="flex items-center gap-1">
              <Btn disabled={!!why} onClick={() => sendControl('custom', 'escort')}>
                👮 Thử: giám thị đưa bạn im lâu nhất ra
              </Btn>
              {why && <span className="text-xs text-amber-300">({why})</span>}
            </span>
          );
        })()}
        <Btn onClick={() => emitTest('like', { ...fake(6), likeCount: 15 })}>❤️ 15 tim</Btn>
        <Btn onClick={() => sendControl('custom', 'show:everest')}>🏔️ Game: Đường lên đỉnh Everest</Btn>
        <Btn onClick={() => sendControl('custom', 'show:chuong')}>🔔 Game: Rung Chuông Đồng</Btn>
        <Btn onClick={() => Array.from({ length: 10 }, (_, i) => emitTest('chat', { ...fake(i), comment: view?.show?.step === 'stake' ? ['10', '20'][i % 2] : 'ABCD'[Math.floor(Math.random() * 4)] }))}>
          🎲 Thử game: 10 bạn gõ A/B/C/D
        </Btn>
        <Btn onClick={() => flood(100)} disabled={running}>👥 100 người cùng đoán</Btn>
        <Btn onClick={() => flood(1000)} disabled={running}>👥 1000 người cùng đoán</Btn>
      </div>
    </div>
  );
}

function Btn({ children, onClick, disabled }: { children: React.ReactNode; onClick: () => void; disabled?: boolean }) {
  return (
    <button onClick={onClick} disabled={disabled} className="rounded-lg bg-slate-700 px-3 py-2 text-sm text-white hover:bg-slate-600 disabled:opacity-40">
      {children}
    </button>
  );
}
