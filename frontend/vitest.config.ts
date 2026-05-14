import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/setupTests.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: [
        'src/components/Button.tsx',
        'src/components/Modal.tsx',
        'src/router/ProtectedRoute.tsx',
        'src/features/todo/components/TodoStatusSelect.tsx',
        'src/shared/constants/todoStatus.ts',
        'src/shared/utils/errorUtils.ts',
        'src/features/auth/stores/authStore.ts',
      ],
      thresholds: {
        statements: 85,
        branches: 85,
        functions: 85,
        lines: 85,
      },
    },
  },
});
