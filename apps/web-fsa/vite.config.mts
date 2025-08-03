import { defineConfig } from '@vben/vite-config';

export default defineConfig(async () => {
  return {
    application: {},
    vite: {
      server: {
        proxy: {
          '/api': {
            changeOrigin: true,
            rewrite: (path) => path.replace(/^\/api/, ''),
            target: 'http://localhost:3000/api',
            ws: true,
          },
          // 添加Socket.io代理
          '/socket.io': {
            target: 'http://localhost:3000',
            ws: true,
            changeOrigin: true,
          },
        },
      },
    },
  };
});