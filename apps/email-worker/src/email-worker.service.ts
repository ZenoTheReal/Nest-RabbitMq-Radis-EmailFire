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
    });
  }


  private async sendEmail(email: { to: string; subject: string; body: string }) {
    try {
      // Replace this with your real email sending logic
      // e.g., nodemailer, SendGrid, or any SMTP library
      console.log(`SENDING EMAIL TO: ${email.to}`);
      console.log(`SUBJECT: ${email.subject}`);
      console.log(`BODY: ${email.body}`);

      // Example with nodemailer (uncomment if using):
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

