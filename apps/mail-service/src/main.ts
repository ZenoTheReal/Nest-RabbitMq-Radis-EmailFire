import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const port = process.env.PORT1 ?? 3000;
  const host = '127.0.0.1'; // force IPv4 localhost

  const app = await NestFactory.create(AppModule);
  await app.listen(port, host);

  console.log(`Application is running on: http://${host}:${port}/`);
}
bootstrap();
