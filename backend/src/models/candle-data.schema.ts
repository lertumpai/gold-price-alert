import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({
  timestamps: true,
  collection: 'candle_data'
})
export class CandleData extends Document {
  @Prop({ required: true })
  symbol: string;

  @Prop({ required: true })
  tf: string; // timeframe (1m, 5m, etc.)

  @Prop({ required: true, type: Number })
  timestamp: number;

  @Prop({ required: true, type: Number })
  open: number;

  @Prop({ required: true, type: Number })
  high: number;

  @Prop({ required: true, type: Number })
  low: number;

  @Prop({ required: true, type: Number })
  close: number;

  @Prop({ type: Number, default: 0 })
  volume: number;
}

export const CandleDataSchema = SchemaFactory.createForClass(CandleData);

// Create compound index for unique candles and efficient querying
CandleDataSchema.index(
  { symbol: 1, tf: 1, timestamp: 1 },
  { unique: true }
); 