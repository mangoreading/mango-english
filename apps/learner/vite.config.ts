import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

// 공유 패키지(packages/play)의 활동 재생 화면을 가져다 쓴다. react 는 이 앱의 node_modules 것을 사용.
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@mango/play': path.resolve(__dirname, '../../packages/play/src'),
      '@mango/mr': path.resolve(__dirname, '../../packages/mr/src'),
      react: path.resolve(__dirname, 'node_modules/react'),
      'react-dom': path.resolve(__dirname, 'node_modules/react-dom'),
    },
  },
  server: { fs: { allow: ['../..'] } },
});
