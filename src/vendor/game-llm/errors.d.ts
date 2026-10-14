/**
 * Loi khi goi LLM.
 *
 * `code` la ma cua service khi service tra JSON dang { error: '<ma>' } —
 * 'unauthenticated', 'payload_too_large', 'upstream_timeout'... Rieng
 * 'truncated' la ma cua client chu khong phai cua service: upstream tra HTTP
 * 200 nhung cat cau tra loi giua duong.
 */
export declare class LlmError extends Error {
    readonly status: number;
    readonly code: string | null;
    /** Chi co khi code === 'truncated': phan text da nhan truoc khi bi cat. */
    readonly partialText?: string;
    constructor(message: string, opts: {
        status: number;
        code?: string | null;
        partialText?: string;
    });
}
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
export declare function errorFromBody(status: number, raw: string): LlmError;
