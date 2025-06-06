import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({
  timestamps: true,
  collection: 'price_logs',
  // TTL index: automatically delete documents after 24 hours
  expires: 86400
})
export class PriceLog extends Document {
  @Prop({ required: true })
  symbol: string;

  @Prop({ required: true, type: Number })
  price: number;

  @Prop({ required: true, type: Number })
  timestamp: number;
}

export const PriceLogSchema = SchemaFactory.createForClass(PriceLog);

// Create index on symbol for quick querying
PriceLogSchema.index({ symbol: 1 });

// Create index on timestamp for TTL and range queries
PriceLogSchema.index({ timestamp: 1 }); 