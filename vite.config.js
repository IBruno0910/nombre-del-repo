import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { createInquiryHandler } from './server/inquiries.js';

export default defineConfig(({ mode }) => {
  const env = { ...process.env, ...loadEnv(mode, process.cwd(), '') };
  const attach = server => {
    const handler = createInquiryHandler({ env });
    server.middlewares.use((req,res,next) => req.url?.split('?')[0] === '/api/inquiries' ? handler(req,res) : next());
  };
  return { plugins: [react(), { name: 'inquiry-api', configureServer: attach, configurePreviewServer: attach }] };
});
