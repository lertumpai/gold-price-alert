import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';
import { PriceLog } from '../../models/price-log.schema';

@Injectable()
@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class PriceService {
  @WebSocketServer()
  private server: Server;

  constructor(
    @InjectModel(PriceLog.name)
    private priceLogModel: Model<PriceLog>,
  ) {}

  async ingestTick(data: { symbol: string; price: number; timestamp: number }) {
    // Validate timestamp is within reasonable bounds (±30 seconds)
    const now = Date.now();
    if (Math.abs(data.timestamp - now) > 30000) {
      throw new Error('Timestamp is too far from current time');
    }

    // Save tick to database
    const priceLog = new this.priceLogModel(data);
    await priceLog.save();

    // Broadcast to WebSocket clients
    this.server.emit('price-update', data);

    return priceLog;
  }

  async getLatestPrice(symbol: string): Promise<PriceLog | null> {
    return this.priceLogModel
      .findOne({ symbol })
      .sort({ timestamp: -1 })
      .exec();
  }

  async getPriceHistory(
    symbol: string,
    startTime: number,
    endTime: number,
  ): Promise<PriceLog[]> {
    return this.priceLogModel
      .find({
        symbol,
        timestamp: { $gte: startTime, $lte: endTime },
      })
      .sort({ timestamp: 1 })
      .exec();
  }
} 