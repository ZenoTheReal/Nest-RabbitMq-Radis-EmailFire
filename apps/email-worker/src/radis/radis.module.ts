import { Module } from '@nestjs/common';
import { RadisService } from './radis.service';

@Module({
  providers: [RadisService],
  exports: [RadisService],
})
export class RadisModule {}
