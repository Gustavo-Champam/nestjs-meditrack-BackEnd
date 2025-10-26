import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { rateLimit } from 'express-rate-limit';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
app.enableCors();
app.use(helmet());
app.use('/auth/login', rateLimit({ windowMs: 15 * 60 * 1000, max: 20 }));
app.use('/auth/request-reset', rateLimit({ windowMs: 15 * 60 * 1000, max: 10 }));
const config = new DocumentBuilder().setTitle('MediTrack API').setVersion('1.0').addBearerAuth().build();
const document = SwaggerModule.createDocument(app, config);
SwaggerModule.setup('docs', app, document);app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.enableCors();
  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`MediTrack API listening on http://localhost:${port}`);
}
bootstrap();








