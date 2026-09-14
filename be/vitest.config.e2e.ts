import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    globals: true,
    root: './',
    include: ['**/*.e2e-spec.ts'],
    env: {
      NODE_ENV: 'test',
      DATABASE_URL:
        process.env.DATABASE_URL ??
        'postgresql://password_manager:password_manager@localhost:5432/password_manager',
      JWT_ACCESS_SECRET: 'test-access-secret-min-32-characters!',
      JWT_REFRESH_SECRET: 'test-refresh-secret-min-32-characters',
    },
  },
});
