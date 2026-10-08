/** إعداد Vite: يشغل React ويعرض خادم التطوير على جميع الواجهات في بيئة العمل. */
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    // رابط المضيف العام يتغير بين جلسات البيئة، لذلك لا نربطه باسم جلسة قديم.
    allowedHosts: true,
  },
});
