import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { RabbitMqModule } from './rabbit-mq/rabbit-mq.module';
import { RadisModule } from './radis/radis.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    RabbitMqModule,
    RadisModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})

export class AppModule { }
