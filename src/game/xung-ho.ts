// Đổi người đứng lớp sang thầy giáo (2026-11-07): lời thoại và chữ trên màn hình viết sẵn cho cô Ngân,
// đổi "cô" đứng riêng thành "thầy" (không đụng "cô đơn"... vì chỉ đổi chữ "cô" đứng một mình là đại từ / danh xưng).
// Vài câu riêng của cô được sửa cho hợp: cô thầm crush "thầy thể dục" thì thầy crush "cô thể dục", "cô hôm nay xinh" thành "đẹp trai".

const NAME_UP = '\u0001';
const NAME_LOW = '\u0002';
const PE = '\u0003';

/** "cô" -> "thầy" (giữ hoa thường). Không đổi "cô Ngân" (tên do chủ kênh đặt, thay riêng) */
export function thayHoa(s: string): string {
  return s
    .replace(/thầy thể dục/g, PE)
    .replace(/(?<!\p{L})cô hôm nay xinh(?!\p{L})/gu, 'cô hôm nay đẹp trai')
    .replace(/(?<!\p{L})CÔ(?!\p{L})/gu, 'THẦY')
    .replace(/(?<!\p{L})Cô(?!\p{L})/gu, 'Thầy')
    .replace(/(?<!\p{L})cô(?!\p{L})/gu, 'thầy')
    .split(PE)
    .join('cô thể dục');
}

/** Câu cô nói: thay tên "cô Ngân" bằng tên chủ kênh đặt, đứng lớp là thầy thì đổi xưng hô */
export function teacherText(text: string, name: string, thay: boolean): string {
  const low = name.charAt(0).toLowerCase() + name.slice(1);
  let t = text.split('Cô Ngân').join(NAME_UP).split('cô Ngân').join(NAME_LOW);
  if (thay) t = thayHoa(t);
  return t.split(NAME_UP).join(name).split(NAME_LOW).join(low);
}
