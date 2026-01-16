import { NestFactory } from '@nestjs/core';
import { EmailWorkerModule } from './email-worker.module';

async function bootstrap() {
  const port = process.env.PORT2 ?? 3001;
  const host = '127.0.0.1'; // force IPv4 localhost

  const app = await NestFactory.create(EmailWorkerModule);
  await app.listen(port, host);

  console.log(`Application is running on: http://${host}:${port}/`);
}
bootstrap();
