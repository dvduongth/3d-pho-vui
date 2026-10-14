export type SessionCatch = {
  source: 'simulation';
  species: string;
  weight: number;
};

const kilograms = new Intl.NumberFormat('vi-VN', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function tuGreeting(name: string, latest: SessionCatch | null): string {
  if (!latest) return 'Ông Tư: Chào ' + name + '! Câu thử một con với bác nhé.';
  return 'Ông Tư: Chào ' + name + '! Con ' +
    latest.species.toLocaleLowerCase('vi-VN') + ' ' + kilograms.format(latest.weight) +
    ' kg cháu bắt lần trước đẹp lắm. Câu tiếp nhé! (Mô phỏng, chưa xác thực)';
}

export function tuCatchReply(name: string, species: string, weight: number, practice: boolean): string {
  const fish = species.toLocaleLowerCase('vi-VN') + ' ' + kilograms.format(weight) + ' kg';
  return practice
    ? 'Ông Tư: ' + name + ' vừa câu thử ' + fish + '. Luyện tập thôi, không tính thành tích nhé!'
    : 'Ông Tư: ' + name + ' vừa bắt ' + fish + ' trong phiên mô phỏng! Chưa xác thực server.';
}
