import { Injectable, OnModuleInit } from '@nestjs/common';
import Redis from 'ioredis';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class RadisService implements OnModuleInit {
  public client: Redis;

  constructor(private readonly configService: ConfigService) { }

  private initClient() {
    if (!this.client) {
      const redisUrl = this.configService.get<string>('REDIS_URL') || 'redis://localhost:6379';
      this.client = new Redis(redisUrl, { tls: {} });
    }
  }

  onModuleInit() {
    this.initClient();
    this.testConnection();
  }

  async testConnection(): Promise<string | null> {
    await this.client.set('lord:zeno', 'hello from producer');
    const value = await this.client.get('lord:zeno');
    this.client.expire('lord:zeno', 200);
    console.log('Redis test value:', value);
    return value;
  }
}
