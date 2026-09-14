import { ValidationPipe, type INestApplication } from '@nestjs/common';
import cookieParser from 'cookie-parser';

export function configureApp(app: INestApplication): void {
  const expressApp = app.getHttpAdapter().getInstance() as {
    set?: (setting: string, value: unknown) => void;
  };
  expressApp.set?.('trust proxy', 1);

  app.setGlobalPrefix('api');
  app.use(cookieParser());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );
  app.enableCors({
    origin: process.env.FRONTEND_ORIGIN ?? 'https://localhost:5173',
    credentials: true,
  });
}
