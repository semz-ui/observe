import 'dotenv/config';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // whitelist strips properties that have no decorator on the DTO
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
  // without this, SIGTERM/SIGINT skip onModuleDestroy — Prisma would never disconnect cleanly
  app.enableShutdownHooks();
  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
