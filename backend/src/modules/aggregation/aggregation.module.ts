import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleModule } from '@nestjs/schedule';
import { AggregationController } from './aggregation.controller';
import { AggregationService } from './aggregation.service';
import { PriceLog, PriceLogSchema } from '../../models/price-log.schema';
import { CandleData, CandleDataSchema } from '../../models/candle-data.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PriceLog.name, schema: PriceLogSchema },
      { name: CandleData.name, schema: CandleDataSchema },
    ]),
    ScheduleModule.forRoot(),
  ],
  controllers: [AggregationController],
  providers: [AggregationService],
  exports: [AggregationService],
})
export class AggregationModule {} 