export interface LineReader {
    /** Nap mot chunk byte, tra ve nhung dong DA HOAN CHINH trong do. */
    push(chunk: Uint8Array): string[];
    /** Goi khi stream het: tra ve dong cuoi neu no khong ket thuc bang newline. */
    flush(): string[];
}
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
export declare function createLineReader(): LineReader;
