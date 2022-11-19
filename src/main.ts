import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as path from 'path';
import { AppService } from './app.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const appService = await app.get(AppService);
  appService.loadData(path.join(__dirname, '../export-2021-12-31.txt'));
  await app.listen(3000);
}
bootstrap();
