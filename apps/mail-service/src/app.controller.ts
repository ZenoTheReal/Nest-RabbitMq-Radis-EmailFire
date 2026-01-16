import { Controller, Get, Post } from '@nestjs/common';
import { AppService } from './app.service';

import { RabbitMqService } from './rabbit-mq/rabbit-mq.service';

import * as fs from 'fs';
import * as path from 'path';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly rabbitMqService: RabbitMqService
  ) {
    this.generateEmailsFileIfNotExists();
  }

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Post('publish-emails')
  publishEmailsEndpoint(): string {
    this.publishEmails();
    return 'Emails published to RabbitMQ';
  }

  private generateEmailsFileIfNotExists(): void {
    const dataStorePath = path.join(process.cwd(), 'datastore');
    const filePath = path.join(dataStorePath, 'emails_batch_500.json');

    if (!fs.existsSync(dataStorePath)) {
      fs.mkdirSync(dataStorePath, { recursive: true });
      console.log('Created directory:', dataStorePath);
    }

    if (fs.existsSync(filePath)) {
      console.log('Email batch file already exists, skipping creation.');
      return;
    }

    const emails = Array.from({ length: 500 }, (_, i) => ({
      email_id: `email_${String(i + 1).padStart(4, '0')}`,
      to: `user_${Math.floor(Math.random() * 10)}@yopmail.com`,
      subject: 'Welcome',
      body: 'Hello from our service!',
    }));

    fs.writeFileSync(filePath, JSON.stringify(emails, null, 2));
    console.log('Email batch file created:', filePath);
  }

  private publishEmails(): void {
    const filePath = path.join(process.cwd(), 'datastore', 'emails_batch_500.json');
    const emails = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    emails.forEach(email => {
      this.rabbitMqService.sendToQueue('email.send', email);
    });

    console.log(`Published ${emails.length} emails to RabbitMQ`);
  }
}
