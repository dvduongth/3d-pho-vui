/**
 * Loi khi goi LLM.
 *
 * `code` la ma cua service khi service tra JSON dang { error: '<ma>' } —
 * 'unauthenticated', 'payload_too_large', 'upstream_timeout'... Rieng
 * 'truncated' la ma cua client chu khong phai cua service: upstream tra HTTP
 * 200 nhung cat cau tra loi giua duong.
 */
export class LlmError extends Error {
    status;
    code;
    /** Chi co khi code === 'truncated': phan text da nhan truoc khi bi cat. */
    partialText;
    constructor(message, opts) {
        super(message);
        this.name = 'LlmError';
        this.status = opts.status;
        this.code = opts.code ?? null;
        if (opts.partialText !== undefined)
            this.partialText = opts.partialText;
    }
}
/** Cat bot body dai truoc khi nhet vao message cua Error. */
const MAX_MESSAGE_CHARS = 500;
/**
 * Doc ma loi va thong bao tu body.
 *
 * Ba hinh dang phai chiu, va ca ba deu gap that:
 *   { "error": "payload_too_large" }                  <- service cua ta
 *   { "error": { "message": "...", "code": "..." } }  <- DeepSeek
 *   khong phai JSON gi ca                              <- proxy o giua
 *
 * Giu NGUYEN VAN thong bao cua upstream, khong dich lai: thong bao cua no chinh
 * xac hon bat cu thu gi ta bia ra. Vi du that tu DeepSeek: "The supported API
 * model names are deepseek-v4-pro, deepseek-v4-flash, and
 * deepseek-v4-flash-vision-exp, but you passed khong-co-model-nay."
 */
export function errorFromBody(status, raw) {
    let parsed;
    try {
        parsed = JSON.parse(raw);
    }
    catch {
        const text = raw.trim();
        return new LlmError(text === '' ? `HTTP ${status}` : text.slice(0, MAX_MESSAGE_CHARS), {
            status,
        });
    }
    const err = parsed.error;
    if (typeof err === 'string') {
        // Ma loi la mot dinh danh cho may doc, khong phai mot cau cho nguoi doc.
        // Service duoc phep kem them `message` ben canh de giai thich; co thi dung
        // no, khong co thi danh lay chinh cai ma lam thong bao.
        const detail = parsed.message;
        const text = typeof detail === 'string' && detail !== '' ? detail : err;
        return new LlmError(text.slice(0, MAX_MESSAGE_CHARS), { status, code: err });
    }
    if (err !== null && typeof err === 'object') {
        const message = err.message;
        const code = err.code;
        return new LlmError(typeof message === 'string' ? message : `HTTP ${status}`, {
            status,
            code: typeof code === 'string' ? code : null,
        });
    }
    return new LlmError(`HTTP ${status}`, { status });
}
