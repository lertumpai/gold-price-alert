import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Cron } from '@nestjs/schedule';
import { PriceLog } from '../../models/price-log.schema';
import { CandleData } from '../../models/candle-data.schema';

type TimeFrame = '1m' | '5m' | '15m' | '1h' | '4h' | '1d';

@Injectable()
export class AggregationService implements OnModuleInit {
  private readonly timeFrames: { [key in TimeFrame]: number } = {
    '1m': 60000,
    '5m': 300000,
    '15m': 900000,
    '1h': 3600000,
    '4h': 14400000,
    '1d': 86400000,
  };

  constructor(
    @InjectModel(PriceLog.name)
    private priceLogModel: Model<PriceLog>,
    @InjectModel(CandleData.name)
    private candleDataModel: Model<CandleData>,
  ) {}

  async onModuleInit() {
    // Initial aggregation on startup
    await this.aggregateAllTimeframes();
  }

  @Cron('* * * * *') // Run every minute
  async handleCron() {
    await this.aggregateAllTimeframes();
  }

  private async aggregateAllTimeframes() {
    const symbols = await this.priceLogModel.distinct('symbol').exec();
    
    for (const symbol of symbols) {
      for (const [tf, interval] of Object.entries(this.timeFrames)) {
        await this.aggregateCandles(symbol, tf as TimeFrame, interval);
      }
    }
  }

  private async aggregateCandles(
    symbol: string,
    timeframe: TimeFrame,
    interval: number,
  ) {
    const now = Date.now();
    const lastCandle = await this.candleDataModel
      .findOne({ symbol, tf: timeframe })
      .sort({ timestamp: -1 })
      .exec();

    const startTime = lastCandle
      ? lastCandle.timestamp + interval
      : now - interval * 100; // Default to last 100 candles

    const endTime = now;

    // Get all ticks for the period
    const ticks = await this.priceLogModel
      .find({
        symbol,
        timestamp: { $gte: startTime, $lt: endTime },
      })
      .sort({ timestamp: 1 })
      .exec();

    // Group ticks into candles
    const candles = new Map<number, any>();
    
    for (const tick of ticks) {
      const candleTimestamp = Math.floor(tick.timestamp / interval) * interval;
      
      if (!candles.has(candleTimestamp)) {
        candles.set(candleTimestamp, {
          symbol,
          tf: timeframe,
          timestamp: candleTimestamp,
          open: tick.price,
          high: tick.price,
          low: tick.price,
          close: tick.price,
          volume: 1,
        });
      } else {
        const candle = candles.get(candleTimestamp);
        candle.high = Math.max(candle.high, tick.price);
        candle.low = Math.min(candle.low, tick.price);
        candle.close = tick.price;
        candle.volume += 1;
      }
    }

    // Save candles
    for (const candle of candles.values()) {
      await this.candleDataModel.findOneAndUpdate(
        {
          symbol: candle.symbol,
          tf: candle.tf,
          timestamp: candle.timestamp,
        },
        candle,
        { upsert: true },
      );
    }
  }

  async getCandles(
    symbol: string,
    timeframe: TimeFrame,
    limit: number = 100,
  ): Promise<CandleData[]> {
    return this.candleDataModel
      .find({ symbol, tf: timeframe })
      .sort({ timestamp: -1 })
      .limit(limit)
      .exec();
  }
} 