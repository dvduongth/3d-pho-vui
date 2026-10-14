export type LlmMessage = {
    role: 'user' | 'assistant';
    content: string;
};
export interface LlmClientOptions {
    /**
     * Dev: '<service>/api/llm'.
     * Prod: 'https://lite-llm-relay.zingplay.dev' — khong co duong dan phia sau.
     *
     * SDK ghep '/v1/messages' vao sau, nen bao nhieu dau / o cuoi cung duoc.
     */
    baseUrl: string;
    /** Dev: 'vkm_...'. Prod: bo trong — OAuth proxy chen auth ho. */
    token?: string;
    /** Mac dinh 'deepseek-v4-flash'. Chi ap cho text, khong ap cho anh. */
    model?: string;
    /** Mac dinh 'gpt-image-2.5-flare'. */
    imageModel?: string;
    /** Mac dinh 10000. Day la TRAN, khong phai muc chi. */
    maxTokens?: number;
    /** Mac dinh false: client gui thinking disabled. */
    thinking?: boolean;
    /** Chi de test. Mac dinh la fetch cua moi truong. */
    fetchImpl?: typeof fetch;
}
export interface ImageOptions {
    /** Mac dinh 'gpt-image-2.5-flare'. */
    model?: string;
    signal?: AbortSignal;
    /**
     * Tham so khac cua upstream — `size`, `quality`, `n`... — gui thang len,
     * khong dien giai, khong kiem. Co y de khong kieu chat: them tham so moi o
     * upstream la dung duoc ngay, khong phai doi SDK ra ban moi.
     *
     * Gateway CHON LOC chu khong nuot tat, nen moi tham so phai do rieng:
     *
     *   - `size`: QUA DUOC. Do 15/09/2026 bang cach cho prompt va tham so cai
     *     nhau — prompt ta canh ngang, xin size '1024x1536', anh ra dung 1024x1536
     *     (doc tu chunk IHDR cua PNG, khong tin con so upstream tu khai).
     *   - `background: 'transparent'`: BI NUOT. Gateway nhan, tra HTTP 200, roi
     *     bo qua lang le. Muon nen trong suot thi dung dung model co alpha (xem
     *     GeneratedImage.mimeType).
     *   - `quality`, `output_format`: chua ai do.
     */
    extra?: Record<string, unknown>;
}
/**
 * Anh dua LEN cho `editImage`. Nhan ca ba dang de khong ai phai tu chuyen:
 * `Blob`/`File` la thu browser san co (input file, canvas.toBlob), con
 * `Uint8Array`/`ArrayBuffer` la thu Node san co (fs.readFile).
 */
export type ImageInput = Blob | Uint8Array | ArrayBuffer;
export interface EditImageOptions extends ImageOptions {
    /**
     * Ten file gui kem trong multipart. Mac dinh 'image.png'.
     *
     * Upstream doc duoi file de biet dinh dang, nen gui JPEG ma de ten .png la
     * tu chuoc lay mot loi kho hieu. Dat dung duoi cua anh ban gui.
     */
    filename?: string;
}
export interface GeneratedImage {
    /** Gan thang vao `<img src>` hoac CSS `url()`. */
    dataUrl: string;
    /** Base64 tran, khong co tien to `data:`. De ghi ra file. */
    b64: string;
    /** Doc tu chinh byte dau cua anh, khong phai doan theo ten model. */
    mimeType: string;
}
export interface AskOptions {
    model?: string;
    maxTokens?: number;
    system?: string;
    thinking?: boolean;
    signal?: AbortSignal;
}
export interface LlmClient {
    ask(prompt: string | LlmMessage[], opts?: AskOptions): Promise<string>;
    askStream(prompt: string | LlmMessage[], opts?: AskOptions): AsyncIterable<string>;
    messages(body: Record<string, unknown>, opts?: {
        signal?: AbortSignal;
    }): Promise<unknown>;
    countTokens(prompt: string | LlmMessage[], opts?: AskOptions): Promise<number>;
    generateImage(prompt: string, opts?: ImageOptions): Promise<GeneratedImage>;
    editImage(image: ImageInput, prompt: string, opts?: EditImageOptions): Promise<GeneratedImage>;
    images(body: Record<string, unknown>, opts?: {
        signal?: AbortSignal;
    }): Promise<unknown>;
}
export declare function createLlmClient(options: LlmClientOptions): LlmClient;
