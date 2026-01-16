import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as amqp from 'amqplib';

@Injectable()
export class RabbitMqService implements OnModuleInit {
    private connection;
    private channel;

    constructor(private readonly configService: ConfigService) {}

    async onModuleInit() {
        const url = this.configService.getOrThrow('RABBITMQ_URL');

        this.connection = await amqp.connect(url);
        this.channel = await this.connection.createChannel();

        await this.channel.assertQueue('email.send', { durable: true });

        console.log('Connected to Cloud RabbitMQ');
    }

    async sendToQueue(queue: string, message: any) {
        this.channel.sendToQueue(queue, Buffer.from(JSON.stringify(message)), {
            persistent: true,
        });
    }

    getChannel() {
        return this.channel;
    }
}
