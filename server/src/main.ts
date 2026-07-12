import 'dotenv/config';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import cors from 'cors';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // any website must be able to POST to /v1/events, but only there — the
  // /api/* endpoints have no auth until Phase 7, so a missing preflight is
  // the one thing keeping other sites' JS off them until then
  app.use('/v1/events', cors());
  // whitelist strips properties that have no decorator on the DTO
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
  // without this, SIGTERM/SIGINT skip onModuleDestroy — Prisma would never disconnect cleanly
  app.enableShutdownHooks();
  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
