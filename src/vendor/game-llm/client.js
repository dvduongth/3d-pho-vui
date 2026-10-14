import { LlmError, errorFromBody } from './errors.js';
import { createLineReader } from './sse.js';
/**
 * Ten model phai KHOP CHINH XAC voi danh sach cua gateway LiteLLM.
 *
 * Truoc day mac dinh la 'claude-sonnet-4-5', va no chay duoc vi DeepSeek nhan
 * moi ten Claude roi tu map sang model cua no. Gateway thi khong: no tra
 * 400 "no healthy deployments for this model", va khong co ban -4-5 cua sonnet
 * tren do.
 *
 * Chon 'deepseek-v4-flash' vi day dung la model ma 'claude-sonnet-4-5' van
 * duoc map toi tu truoc den gio — nen hanh vi that khong doi mot chut nao,
 * chi co cai ten la tro thanh su that.
 */
const DEFAULT_MODEL = 'deepseek-v4-flash';
/**
 * 10000 la TRAN, khong phai muc chi: chi tra tien cho token that sinh ra. Da do
 * tren upstream that, cung mot prompt, chi doi tran:
 *   10000 -> 86 token   32000 -> 101   65536 -> 127   200000 -> 137
 * Nang tran 20 lan khong lam model noi dai hon. Nen sai so cua tham so nay lech
 * han ve mot phia: dat thap thi hong am tham, dat cao thi gan nhu khong ton gi.
 */
const DEFAULT_MAX_TOKENS = 10_000;
/**
 * Gateway co nhieu model sinh anh, nhung chi hai cai dung duoc cho asset game:
 * 'gpt-image-2.5-flare' va 'gpt-image-2.5-sunburst'. Ca hai deu ~0,0070 USD
 * mot anh, ~15 giay, va ra PNG CO ALPHA — nen cat duoc sprite ra dung.
 *
 * 'gpt-image-2' cung gia cung toc do nhung KHONG bao gio ra alpha: da thu ba
 * lan, ke ca khi gui tham so `background: 'transparent'` (gateway nhan, tra
 * 200, roi bo qua) va khi viet thang "transparent background" vao prompt. No
 * chi hop cho anh von co nen: background, banner, tranh minh hoa.
 *
 * Nhung model dat hon deu KHONG ra anh dep hon cho viec nay:
 * 'openai/gpt-image-1' ton gap 24 lan ($0,1665) ma ra nen vang va net kem hon.
 */
const DEFAULT_IMAGE_MODEL = 'gpt-image-2.5-flare';
/**
 * Dua anh ve `Blob` de nhet vao FormData.
 *
 * `Blob` di thang. `Uint8Array`/`ArrayBuffer` duoc boc lai — khong doan kieu
 * anh o day, vi duoi ten file moi la thu upstream doc, va no do
 * `EditImageOptions.filename` quyet dinh.
 */
function toBlob(image) {
    if (image instanceof Blob)
        return image;
    // Boc qua Uint8Array chu khong nhet thang: mot Uint8Array co the dang tro vao
    // SharedArrayBuffer, ma Blob khong nhan kieu buffer do. Dung constructor nay
    // thi ket qua luon nam tren ArrayBuffer thuong.
    return new Blob([new Uint8Array(image instanceof ArrayBuffer ? image : image)]);
}
/**
 * Doan dinh dang anh tu chinh du lieu, khong doan theo ten model.
 *
 * Doc thang tren chuoi base64 chu khong giai ma: byte dau cua moi dinh dang
 * luon roi vao cung mot tien to base64 co dinh. Nho vay khong can atob, khong
 * can Buffer — SDK chay nguyen ven o ca browser lan Node.
 *
 * Can that chu khong phai cho vui: gateway tra JPEG cho 'gemini-3-pro-image'
 * va PNG cho ho gpt-image. Khai nham 'image/png' cho mot tam JPEG thi
 * `<img>` nao chat che se tu choi ve.
 */
function sniffMime(b64) {
    if (b64.startsWith('iVBORw0KGgo'))
        return 'image/png';
    if (b64.startsWith('/9j/'))
        return 'image/jpeg';
    if (b64.startsWith('UklGR'))
        return 'image/webp';
    if (b64.startsWith('R0lGOD'))
        return 'image/gif';
    // Khong nhan ra thi van tra anh chu khong throw: mot dinh dang moi van xem
    // duoc, con throw thi khong.
    return 'application/octet-stream';
}
const TRUNCATED_MESSAGE = 'Cau tra loi bi cat vi dat tran max_tokens. Nang maxTokens len, hoac rut ngan prompt.';
function toMessages(prompt) {
    return typeof prompt === 'string' ? [{ role: 'user', content: prompt }] : prompt;
}
function textFrom(content) {
    return (content ?? [])
        .filter((block) => block.type === 'text')
        .map((block) => block.text ?? '')
        .join('');
}
export function createLlmClient(options) {
    const base = options.baseUrl.replace(/\/+$/, '');
    const doFetch = options.fetchImpl ?? globalThis.fetch;
    /**
     * `null` nghia la che do production.
     *
     * Nhan ra bang viec VANG token chu khong bang mot co rieng: tai lieu chi bao
     * game da deploy thi bo token di, nen giu dung mot dieu kien de cau hinh prod
     * chi co mot thu de sai. Hai che do khac nhau o ba cho ben duoi, va ca ba deu
     * phai doi cung luc.
     */
    const token = options.token !== undefined && options.token !== '' ? options.token : null;
    /**
     * True khi phai gui `thinking: {type:'disabled'}`.
     *
     * Nam rieng mot cho vi CA HAI endpoint deu phai theo cung mot quyet dinh.
     * Da tung khong nhu the: countTokens dung body tu dung lay khong co thinking,
     * con ask thi co, nen count_tokens dem them phan mo dau cua thinking ma lan
     * goi that khong he tra.
     *
     * Phan thua do la mot HANG SO, nhung la hang so cua tung model chu khong
     * phai cua moi noi: do tren DeepSeek truc tiep la 79 (85 so voi 6), con tren
     * gateway LiteLLM la 26 voi flash va 76 voi pro. So khac nhau, bug thi mot.
     */
    function thinkingOff(opts) {
        return !(opts?.thinking ?? options.thinking ?? false);
    }
    function buildBody(prompt, opts, extra = {}) {
        const body = {
            model: opts?.model ?? options.model ?? DEFAULT_MODEL,
            max_tokens: opts?.maxTokens ?? options.maxTokens ?? DEFAULT_MAX_TOKENS,
            messages: toMessages(prompt),
            ...extra,
        };
        if (opts?.system !== undefined)
            body.system = opts.system;
        // Tat thinking mac dinh. KHONG bao gio gui budget_tokens: DeepSeek nhan
        // tham so do nhung khong ton trong no, va ket qua la thinking dot het tran
        // roi text ve rong kem HTTP 200.
        if (thinkingOff(opts)) {
            body.thinking = { type: 'disabled' };
        }
        return body;
    }
    async function post(path, body, signal) {
        const headers = {
            // Che do production gui nhan `text/plain`, khong phai JSON, de loi goi la
            // "simple request" cua CORS — tuc browser KHONG ban preflight OPTIONS.
            // Bat buoc phai the: OAuth proxy dung truoc service doi dang nhap, ma
            // preflight theo dung dac ta thi khong bao gio mang cookie, nen no bi tu
            // choi truoc khi request that kip di.
            //
            // Chi cai NHAN noi doi, body van la JSON. Relay doi lai thanh
            // application/json truoc khi toi service.
            'content-type': token !== null ? 'application/json' : 'text/plain;charset=UTF-8',
        };
        // Khong co token thi KHONG gui header auth: do la che do production, OAuth
        // proxy chen auth ho. Gui mot header rong se thanh 401. Ngoai ra `x-api-key`
        // khong nam trong danh sach header an toan cua CORS, nen chi rieng no cung
        // du keo preflight quay lai — hai quyet dinh nay phai di cung nhau.
        if (token !== null)
            headers['x-api-key'] = token;
        const init = {
            method: 'POST',
            headers,
            body: JSON.stringify(body),
        };
        // Cookie dang nhap phai di kem thi OAuth proxy moi biet ai dang goi. CHI o
        // che do production: service cua ta co y khong bao gio tra
        // Access-Control-Allow-Credentials, nen bat o che do dev se khien browser
        // chan chinh response hop le cua no.
        if (token === null)
            init.credentials = 'include';
        if (signal !== undefined)
            init.signal = signal;
        const res = await doFetch(`${base}${path}`, init);
        if (!res.ok)
            throw errorFromBody(res.status, await res.text());
        return res;
    }
    /**
     * Ban multipart cua `post()`. Chi `/v1/images/edits` dung.
     *
     * KHAC BIET DUY NHAT ma cung la ly do no phai ton tai rieng: o day TUYET DOI
     * khong dat `content-type`. Nhan cua multipart mang kem `boundary` do runtime
     * sinh ra; dat tay la mat boundary, va upstream chi tra lai mot loi chung
     * chung khong chi vao day. De trong thi fetch tu dien dung.
     */
    async function postForm(path, form, signal) {
        const headers = {};
        // Cung mot luat voi `post()`: co token la che do dev, khong token la che do
        // production va OAuth proxy chen auth ho.
        if (token !== null)
            headers['x-api-key'] = token;
        const init = { method: 'POST', headers, body: form };
        if (token === null)
            init.credentials = 'include';
        if (signal !== undefined)
            init.signal = signal;
        const res = await doFetch(`${base}${path}`, init);
        if (!res.ok)
            throw errorFromBody(res.status, await res.text());
        return res;
    }
    async function ask(prompt, opts) {
        const res = await post('/v1/messages', buildBody(prompt, opts), opts?.signal);
        const data = (await res.json());
        const text = textFrom(data.content);
        // Throw chu khong im lang tra chuoi bi cat: upstream tra HTTP 200 va khong
        // co error nao, nen day la loi vo hinh. Throw thi no hien ra ngay luc dev,
        // dung luc con sua duoc maxTokens. partialText giu lai phan da nhan.
        if (data.stop_reason === 'max_tokens') {
            throw new LlmError(TRUNCATED_MESSAGE, {
                status: 200,
                code: 'truncated',
                partialText: text,
            });
        }
        return text;
    }
    async function* askStream(prompt, opts) {
        const res = await post('/v1/messages', buildBody(prompt, opts, { stream: true }), opts?.signal);
        if (res.body === null) {
            throw new LlmError('upstream khong tra ve stream', { status: 200 });
        }
        const reader = res.body.getReader();
        const lines = createLineReader();
        let seen = '';
        let truncated = false;
        /** Tra ve doan text neu dong nay la mot text_delta, con lai tra null. */
        function handle(line) {
            if (!line.startsWith('data:'))
                return null;
            const payload = line.slice(5).trim();
            if (payload === '' || payload === '[DONE]')
                return null;
            let event;
            try {
                event = JSON.parse(payload);
            }
            catch {
                return null;
            }
            const ev = event;
            // Chi nha text_delta, KHONG nha thinking_delta: neu khong thi dong suy
            // luan cua model hien trong khung hoi thoai truoc mat nguoi choi.
            if (ev.type === 'content_block_delta' && ev.delta?.type === 'text_delta') {
                return ev.delta.text ?? '';
            }
            if (ev.type === 'message_delta' && ev.delta?.stop_reason === 'max_tokens') {
                truncated = true;
            }
            return null;
        }
        try {
            for (;;) {
                const { done, value } = await reader.read();
                if (done)
                    break;
                for (const line of lines.push(value)) {
                    const piece = handle(line);
                    if (piece !== null && piece !== '') {
                        seen += piece;
                        yield piece;
                    }
                }
            }
            for (const line of lines.flush()) {
                const piece = handle(line);
                if (piece !== null && piece !== '') {
                    seen += piece;
                    yield piece;
                }
            }
        }
        finally {
            reader.releaseLock();
        }
        // Throw SAU khi da nha het cac doan: game hien duoc phan da co roi moi thay
        // loi. Im lang ket thuc thi cau thoai dut giua ma khong ai biet.
        if (truncated) {
            throw new LlmError(TRUNCATED_MESSAGE, {
                status: 200,
                code: 'truncated',
                partialText: seen,
            });
        }
    }
    async function messages(body, opts) {
        const res = await post('/v1/messages', body, opts?.signal);
        return res.json();
    }
    /**
     * Mot prompt, mot tam anh.
     *
     * Tra ve `dataUrl` san de gan vao `<img>`: day la viec ma gan nhu moi nguoi
     * goi ham nay se lam ngay sau do, va tu ghep lay thi de quen mat
     * content-type. `b64` giu nguyen ben canh cho ai muon ghi ra file.
     */
    /**
     * Doc mot tam anh tu phan hoi. Dung chung cho `generateImage` va `editImage`
     * — hai duong goi khac nhau nhung phan hoi cua upstream thi cung mot dang,
     * va hai ban copy se lech nhau.
     */
    async function readSingleImage(res, caller) {
        const data = (await res.json());
        const items = data.data ?? [];
        const first = items[0];
        if (first === undefined) {
            throw new LlmError('upstream tra ve 0 anh', { status: 200, code: 'no_image' });
        }
        // Nhieu anh ma chi tra mot la tra tien cho phan bi vut di ma khong ai thay.
        // Muon n > 1 thi co `images()`, o do ban nhan nguyen ca danh sach.
        if (items.length > 1) {
            throw new LlmError(`Da xin ${items.length} anh nhung ${caller} chi tra ve mot. Dung images() de nhan ca danh sach.`, { status: 200, code: 'too_many_images' });
        }
        // Mot so model tra link thay vi base64. Link ay co han dung ngan va nam
        // ngoai tam kiem soat cua ta, nen noi thang thay vi tra ve mot dataUrl hong.
        if (typeof first.b64_json !== 'string') {
            const kind = typeof first.url === 'string' ? 'mot URL' : 'khong co du lieu anh';
            throw new LlmError(`Model nay tra ve ${kind} chu khong phai base64. Dung images() de doc nguyen phan hoi.`, { status: 200, code: 'no_b64_json' });
        }
        const b64 = first.b64_json;
        const mimeType = sniffMime(b64);
        return { dataUrl: `data:${mimeType};base64,${b64}`, b64, mimeType };
    }
    async function generateImage(prompt, opts) {
        const body = {
            model: opts?.model ?? options.imageModel ?? DEFAULT_IMAGE_MODEL,
            prompt,
            ...opts?.extra,
        };
        const res = await post('/v1/images/generations', body, opts?.signal);
        return readSingleImage(res, 'generateImage');
    }
    /**
     * Sua mot tam anh co san, hoac dung no lam THAM CHIEU cho tam moi.
     *
     * Khac moi method con lai: gui `multipart/form-data` chu khong phai JSON, vi
     * upstream chi nhan dang do. Mot he qua tot: multipart nam trong nhom
     * content-type "simple" cua CORS, nen che do production van khong sinh
     * preflight — dung mot ly do voi meo `text/plain` o `post()`.
     *
     * HAI DIEU DA DO tren upstream that (15/09/2026, ca flare lan sunburst):
     *
     *   - Sua CHAT tay: xin doi dung mot chi tiet thi ra dung anh cu, gan nhu
     *     tung pixel, chi cho do doi. Kich thuoc ra BAM THEO anh vao, khong theo
     *     tham so `size`.
     *   - Lam THAM CHIEU (tu the moi, canh moi): giu duoc nhan vat, nhung phong
     *     cach va do chi tiet TROI — anh ra la mot buc ve co chieu sau chu khong
     *     con la sprite, va mat luon nen trong suot. Dung duoc de dung concept,
     *     chua du de dung sprite sheet nhieu tu the.
     *
     * GIA: dat hon sinh anh thuong nhieu. Do duoc ~$0,0398 cho anh vao
     * 1254x1254, tuc ~5,7 lan mot lan `generateImage` ($0,0070). Tien co theo so
     * PIXEL cua anh GUI LEN (1521 trong 1563 token dau vao la anh), nen anh to
     * gap doi la tien to theo — dung nhan con so tren len de uoc luong.
     */
    async function editImage(image, prompt, opts) {
        const form = new FormData();
        form.set('model', opts?.model ?? options.imageModel ?? DEFAULT_IMAGE_MODEL);
        form.set('prompt', prompt);
        form.set('image', toBlob(image), opts?.filename ?? 'image.png');
        // FormData chi chua chuoi: so va boolean phai doi tay, khong thi chung bien
        // thanh "[object Object]" hoac bi bo qua lang le.
        for (const [key, value] of Object.entries(opts?.extra ?? {})) {
            form.set(key, typeof value === 'string' ? value : String(value));
        }
        const res = await postForm('/v1/images/edits', form, opts?.signal);
        return readSingleImage(res, 'editImage');
    }
    /** Loi thoat cho phan hoi tho cua endpoint anh. Doi xung voi `messages()`. */
    async function images(body, opts) {
        const res = await post('/v1/images/generations', body, opts?.signal);
        return res.json();
    }
    async function countTokens(prompt, opts) {
        // count_tokens khong nhan max_tokens, va tra so o TOP LEVEL chu khong trong
        // object usage. Da kiem tren service that: {"input_tokens":93}
        const body = {
            model: opts?.model ?? options.model ?? DEFAULT_MODEL,
            messages: toMessages(prompt),
        };
        if (opts?.system !== undefined)
            body.system = opts.system;
        // Phai khop voi ask, neu khong con so bao ve la cua mot lan goi khac.
        if (thinkingOff(opts))
            body.thinking = { type: 'disabled' };
        const res = await post('/v1/messages/count_tokens', body, opts?.signal);
        const data = (await res.json());
        if (typeof data.input_tokens !== 'number') {
            throw new LlmError('count_tokens khong tra ve input_tokens', { status: 200 });
        }
        return data.input_tokens;
    }
    return { ask, askStream, messages, countTokens, generateImage, editImage, images };
}
