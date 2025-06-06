import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PriceController } from './price.controller';
import { PriceService } from './price.service';
import { PriceLog, PriceLogSchema } from '../../models/price-log.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PriceLog.name, schema: PriceLogSchema },
    ]),
  ],
  controllers: [PriceController],
  providers: [PriceService],
  exports: [PriceService],
})
export class PriceModule {} 