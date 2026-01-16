import { Injectable, OnModuleInit } from '@nestjs/common';
import { RabbitMqService } from './rabbit-mq/rabbit-mq.service';
import { RadisService } from './radis/radis.service';
import * as nodemailer from 'nodemailer';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EmailWorkerService implements OnModuleInit {
  constructor(
    private readonly rabbitMqService: RabbitMqService,
    private readonly redisService: RadisService,
    private readonly configService: ConfigService
  ) { }

  async onModuleInit() {
    console.log('Email worker initialized');

    const channel = this.rabbitMqService.getChannel();
    await channel.prefetch(1);

    await channel.consume('email.send', async (msg) => {
      try {

        if (!msg) return;

        const email = JSON.parse(msg.content.toString());
        console.log('RECEIVED EMAIL:', email.to);

        const redis = this.redisService.client;
        const dedupeKey = `dedupe:email:${email.to}`;

        const isNew = await redis.setnx(dedupeKey, 'processing');

        if (!isNew) {
          console.log('DUPLICATE DROPPED:', email.to);
          channel.ack(msg);
          return;
        }

        await redis.expire(dedupeKey, 86400); // 24 hours

        await this.sendEmail(email);

        await redis.set(dedupeKey, 'sent');

        channel.ack(msg);
      }
      catch (error) {

        await channel.sendToQueue('email.retry', msg.content, { persistent: true, });
        channel.ack(msg);
      }
    });

    await channel.consume('email.retry', async (msg) => {
      try {
        if (!msg) return;

        const email = JSON.parse(msg.content.toString());

        const retries = email.retries || 0;
        if (retries >= 3) {
          console.log('Moving email to DLQ:', email.to);
          await channel.sendToQueue('email.dlq', msg.content, { persistent: true });
          channel.ack(msg);
          return;
        }

        email.retries = retries + 1; // increment retry counter
        console.log(`Retrying email #${email.retries}:`, email.to);

        await this.sendEmail(email);

        channel.ack(msg); // success
      } catch (error) {
        const email = JSON.parse(msg.content.toString());
        email.retries = (email.retries || 0) + 1;
        await channel.sendToQueue('email.retry', Buffer.from(JSON.stringify(email)), { persistent: true });
        channel.ack(msg);
      }
    });
  }


  private async sendEmail(email: { to: string; subject: string; body: string }) {
    try {
      const transporter = nodemailer.createTransport({
        service: 'gmail', // use built-in Gmail service
        auth: {
          user: this.configService.get<string>('Mail_User'), // your Gmail
          pass: this.configService.get<string>('Mail_Pass'), // app password
        },
      });

      await transporter.sendMail({
        from: this.configService.get<string>('Mail_User'),
        to: email.to,
        subject: email.subject,
        text: email.body,
      });

      console.log(`EMAIL SENT SUCCESSFULLY TO: ${email.to}`);
    } catch (error) {
      console.error(`EMAIL SEND FAILED for ${email.to}`, error);
    }
  }
}

