import { useEffect, useRef, useState } from 'react';
import { useLiveEvents } from '../live/useLiveEvents';
import type { GiftEvent, LiveStatus } from '../live/types';
import { voice, speakableName } from '../live/voice';
import { containsBanned } from '../live/bannedWords';
import { NameBatcher } from '../live/scoreboard';
import { GiftThanker, OncePerPerson } from '../live/chatter';
import { IS_STAGE } from '../live/page';
import { GAME } from './config';
import { QUESTIONS } from './questions';
import { Classroom, plain, type ClassView, type Say } from './quiz';

// ?view=stage&mute=1: xem thử trang stage không phát tiếng
const MUTED = new URLSearchParams(window.location.search).get('mute') === '1';

/**
 * Trang stage chạy game thật (lõi ở quiz.ts) và gửi ảnh chụp trạng thái lên server.
 * Trang điều khiển không tự chạy game, chỉ vẽ lại ảnh chụp đó, nên xem trước luôn khớp với live.
 */
export function useGame() {
  const [status, setStatus] = useState<LiveStatus | null>(null);
  const [view, setView] = useState<ClassView | null>(null);
  const [lastGift, setLastGift] = useState<(GiftEvent & { at: number }) | null>(null);
  const [stageCount, setStageCount] = useState(0);
  const [channelName, setChannelName] = useState(GAME.defaultChannelName);

  const [room] = useState(() => (IS_STAGE ? new Classroom(QUESTIONS, Date.now()) : null));
  const likeBase = useRef<number | null>(null);
  const dirty = useRef(true);

  const [talk] = useState(() => ({
    greeter: new NameBatcher(
      GAME.greetEveryMs,
      GAME.namesPerGreeting,
      (names) => voice.say(GAME.lines.greeting(joinNames(names))),
      () => voice.waiting >= 1 || room?.phase === 'question', // đang hỏi thì không chào, để cô đọc đề
    ),
    gifts: new GiftThanker(GAME.giftThanksCooldownMs, GAME.bigGiftCoins),
    follows: new OncePerPerson(),
  }));

  const say = (lines: Say[]) => {
    for (const l of lines) voice.say(l.text, l.priority);
    dirty.current = true;
  };

  // Tên an toàn để hiện/đọc: tên có từ cấm thì dùng username
  const person = (e: { nickname: string; username: string; avatar: string }) => {
    const nickname = containsBanned(e.nickname) ? e.username : e.nickname;
    return { username: e.username, nickname, spoken: speakableName(nickname), avatar: e.avatar };
  };

  useLiveEvents({
    onStatus: setStatus,
    onSpeaker: (d) => setStageCount(d.count),
    onGameState: (s) => {
      if (!IS_STAGE) setView(s as ClassView);
    },

    onChat: (e) => {
      if (!room) return;
      const p = person(e);
      const isNew = !room.students.has(e.username);
      say(room.chat({ ...p, comment: e.comment, createTime: e.createTime ?? e.timestamp }, Date.now()));
      if (isNew && p.spoken !== 'bạn' && GAME.joinKeywords.includes(plain(e.comment))) talk.greeter.add(e.username, p.spoken);
    },

    onGift: (e) => {
      if (!room) return;
      const p = person(e);
      const coins = e.diamondCount * e.repeatCount;
      setLastGift({ ...e, nickname: p.nickname, at: Date.now() });
      const hint = room.gift(p, coins, Date.now());
      say(hint);
      // combo / tặng liên tục chỉ cảm ơn 1 lần mỗi 30 giây; quà to luôn cảm ơn
      if (!hint.length && talk.gifts.shouldThank(e.username, coins, voice.waitingPriority)) {
        voice.say(GAME.lines.thankGift(p.spoken, e.giftName), true);
      }
    },

    onFollow: (e) => {
      const p = person(e);
      if (room && talk.follows.first(e.username)) voice.say(GAME.lines.thankFollow(p.spoken));
    },

    onLike: (e) => {
      if (!room) return;
      if (likeBase.current === null) likeBase.current = e.totalLikes - e.likeCount;
      if (e.totalLikes - likeBase.current >= GAME.likesPerClap) {
        likeBase.current = e.totalLikes;
        say(room.clap(Date.now()));
      }
    },

    onControl: (c) => {
      if (c.action === 'setName' && c.text) setChannelName(c.text);
      if (!room) return;
      if (c.action === 'speak' && c.text) voice.say(c.text, true);
      if (c.action === 'setRate' && c.text) voice.rate = Number(c.text) || 1;
      if (c.action === 'reset' || (c.action === 'custom' && c.text === 'newRound')) {
        voice.stop();
        say(room.newRound(Date.now()));
      }
      if (c.action === 'custom' && c.text === 'skip') say(room.skip(Date.now()));
    },
  });

  // Nhịp game: 5 lần/giây đẩy đồng hồ, có đổi thì vẽ lại và gửi ảnh chụp cho trang điều khiển
  useEffect(() => {
    if (!room) return;
    if (MUTED) voice.volume = 0;
    voice.say(GAME.lines.intro);
    let lastSent = 0;
    const timer = setInterval(() => {
      const now = Date.now();
      say(room.tick(now));
      if (!dirty.current && now - lastSent < 1000) return;
      dirty.current = false;
      const v = room.view(now);
      setView(v);
      if (now - lastSent >= 400) {
        lastSent = now;
        fetch('/api/game/state', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(v) }).catch(() => {});
      }
    }, 200);
    const share = setInterval(() => voice.say(GAME.lines.share), GAME.shareReminderEveryMs);
    return () => {
      clearInterval(timer);
      clearInterval(share);
    };
  }, []);

  return { status, view, lastGift, stageCount, channelName };
}

export type GameState = ReturnType<typeof useGame>;

// ['An', 'Bình', 'Chi'] -> 'bạn An, bạn Bình và bạn Chi'
function joinNames(names: string[]) {
  const spoken = names.map((n) => `bạn ${n}`);
  return spoken.length > 1 ? `${spoken.slice(0, -1).join(', ')} và ${spoken[spoken.length - 1]}` : spoken[0] ?? '';
}
