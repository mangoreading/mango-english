import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

// 공유 스키마(packages/schema)를 그대로 가져다 쓴다. zod 는 이 앱의 node_modules 것을 사용.
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@mango/schema': path.resolve(__dirname, '../../packages/schema/src/index.ts'),
      '@mango/play': path.resolve(__dirname, '../../packages/play/src'),
      '@mango/mr': path.resolve(__dirname, '../../packages/mr/src'),
      react: path.resolve(__dirname, 'node_modules/react'),
      'react-dom': path.resolve(__dirname, 'node_modules/react-dom'),
      zod: path.resolve(__dirname, 'node_modules/zod'),
    },
  },
  server: { fs: { allow: ['../..'] } },
});
