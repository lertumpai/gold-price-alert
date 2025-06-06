import { Controller, Get, Query } from '@nestjs/common';
import { AggregationService } from './aggregation.service';

@Controller('candles')
export class AggregationController {
  constructor(private readonly aggregationService: AggregationService) {}

  @Get()
  async getCandles(
    @Query('symbol') symbol: string,
    @Query('timeframe') timeframe: string,
    @Query('limit') limit?: number,
  ) {
    return this.aggregationService.getCandles(symbol, timeframe, limit);
  }
} 