/**
 * Chan buffer, phong mot upstream loi nha mot dong khong bao gio ket thuc.
 * 256K la thua cho moi event that: event lon nhat trong thuc te la message_start.
 */
const MAX_BUFFER_CHARS = 256 * 1024;
/**
 * Cat mot chuoi byte thanh tung dong.
 *
 * Hai thu bat buoc phai co, va ca hai deu la loi da gap that khi viet proxy:
 *
 *  - Buffer giua cac chunk. Chunk TCP khong trung ranh gioi dong: mot event co
 *    the den lam hai manh, va hai event co the den trong cung mot manh.
 *  - TextDecoder voi { stream: true }. Chu tieng Viet dai 2-3 byte moi ky tu;
 *    decode tung chunk doc lap thi ky tu bi cat giua se thanh U+FFFD, va loi do
 *    chi hien ra voi nguoi doc tieng Viet.
 */
export function createLineReader() {
    const decoder = new TextDecoder('utf-8');
    let buffer = '';
    function take(text) {
        buffer += text;
        if (buffer.length > MAX_BUFFER_CHARS) {
            buffer = '';
            throw new Error('SSE: mot dong dai qua muc cho phep');
        }
        const parts = buffer.split('\n');
        buffer = parts.pop() ?? '';
        return parts.map((line) => (line.endsWith('\r') ? line.slice(0, -1) : line));
    }
    return {
        push: (chunk) => take(decoder.decode(chunk, { stream: true })),
        flush: () => {
            const lines = take(decoder.decode());
            if (buffer !== '') {
                lines.push(buffer);
                buffer = '';
            }
            return lines;
        },
    };
}
