import { Body, Controller, Get, Post, Query, ValidationPipe } from '@nestjs/common';
import { PriceService } from './price.service';
import { IsNumber, IsString, Min } from 'class-validator';

export class TickDto {
  @IsString()
  symbol: string;

  @IsNumber()
  @Min(0)
  price: number;

  @IsNumber()
  timestamp: number;
}

@Controller('prices')
export class PriceController {
  constructor(private readonly priceService: PriceService) {}

  @Post('tick')
  async ingestTick(@Body(ValidationPipe) tickData: TickDto) {
    return this.priceService.ingestTick(tickData);
  }

  @Get('latest')
  async getLatestPrice(@Query('symbol') symbol: string) {
    return this.priceService.getLatestPrice(symbol);
  }

  @Get('history')
  async getPriceHistory(
    @Query('symbol') symbol: string,
    @Query('startTime') startTime: number,
    @Query('endTime') endTime: number,
  ) {
    return this.priceService.getPriceHistory(symbol, startTime, endTime);
  }
} 