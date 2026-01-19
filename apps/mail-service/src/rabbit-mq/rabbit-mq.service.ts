import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as amqp from 'amqplib';

@Injectable()
export class RabbitMqService implements OnModuleInit {
    private connection: amqp.ChannelModel;
    private channel: amqp.Channel;

    constructor(private readonly configService: ConfigService) { }

    async onModuleInit() {
        const url = this.configService.getOrThrow('RABBITMQ_URL');

        this.connection = await amqp.connect(url);

        this.connection.on('error', console.error);
        this.connection.on('close', () => {
            console.error('RabbitMQ connection closed');
        });

        this.channel = await this.connection.createChannel();

        await this.channel.assertExchange('email.exchange', 'topic', { durable: true })

        await this.channel.assertQueue('email.send', { durable: true });
        await this.channel.assertQueue('email.notification', { durable: true });

        await this.channel.bindQueue('email.send', 'email.exchange', 'email.*')
        await this.channel.bindQueue('email.notification', 'email.exchange', 'email.*')

        console.log('Connected to Cloud RabbitMQ');
    }

    async sendToQueue(queue: string, message: any) {
        if (!this.channel) {
            throw new Error('RabbitMQ channel not ready');
        }

        this.channel.sendToQueue(queue, Buffer.from(JSON.stringify(message)), {
            persistent: true,
        });
    }

    async sendToExchange(routingKey: string, message: any) {
        if (!this.channel) {
            throw new Error('RabbitMQ channel not ready');
        }

        this.channel.publish(
            'email.exchange',
            routingKey,
            Buffer.from(JSON.stringify(message)),
            { persistent: true },
        );
    }

    getChannel() {
        return this.channel;
    }
}
