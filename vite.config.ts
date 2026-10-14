import { defineConfig } from 'vite';

const base = process.env.GF_BASE;
const port = process.env.GF_PORT;

if (!base || !base.endsWith('/')) {
  throw new Error(
    "GF_BASE thiếu hoặc không kết thúc bằng '/' — template này luôn được Dev Server Manager spawn kèm ENV, thiếu biến là lỗi wiring, không phải lỗi Vite.",
  );
}
if (!port) {
  throw new Error(
    'GF_PORT thiếu — template này luôn được Dev Server Manager spawn kèm ENV, thiếu biến là lỗi wiring, không phải lỗi Vite.',
  );
}

export default defineConfig({
  base,
  server: {
    host: process.env.GF_HOST ?? '127.0.0.1',
    port: Number(port),
    // R5: mặc định false của Vite biến port bị chiếm thành cú nhảy port im lặng,
    // proxy sẽ route nhầm sang project khác. Không đọc từ ENV.
    strictPort: true,
    allowedHosts: process.env.GF_ALLOWED_HOSTS ? process.env.GF_ALLOWED_HOSTS.split(',') : [],
    // An agent turn writes several files, and each write is a separate HMR push,
    // so live HMR shows the player the game mid-edit — repeatedly, and usually
    // broken. The preview pane offers a Reload button instead, which applies
    // every change at a point the player chose. M1.2 proved HMR works through
    // the proxy; this switch keeps that capability one env var away.
    hmr:
      process.env.GF_HMR === 'off'
        ? false
        : {
            ...(process.env.GF_HMR_CLIENT_PORT && {
              clientPort: Number(process.env.GF_HMR_CLIENT_PORT),
            }),
            ...(process.env.GF_HMR_PROTOCOL && { protocol: process.env.GF_HMR_PROTOCOL }),
            // M1.2 measured this against a real browser: Vite derives the path
            // from `base` on its own, so it stays unset unless someone pins it.
            ...(process.env.GF_HMR_PATH && { path: process.env.GF_HMR_PATH }),
          },
  },
});
