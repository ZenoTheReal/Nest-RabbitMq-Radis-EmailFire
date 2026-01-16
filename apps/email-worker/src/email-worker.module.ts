import { Module } from '@nestjs/common';
import { EmailWorkerController } from './email-worker.controller';
import { EmailWorkerService } from './email-worker.service';
import { RabbitMqModule } from './rabbit-mq/rabbit-mq.module';
import { RadisModule } from './radis/radis.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), RabbitMqModule, RadisModule],
  controllers: [EmailWorkerController],
  providers: [EmailWorkerService],
})
export class EmailWorkerModule { }
