import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export enum AlertCondition {
  ABOVE = 'above',
  BELOW = 'below',
  CROSSES = 'crosses'
}

export enum AlertFrequency {
  ONCE = 'once',
  EVERY = 'every',
  COOLDOWN = 'cooldown'
}

@Schema({
  timestamps: true,
  collection: 'alerts'
})
export class Alert extends Document {
  @Prop({ required: true })
  symbol: string;

  @Prop({ required: true, enum: AlertCondition })
  condition: AlertCondition;

  @Prop({ required: true, type: Number })
  target_price: number;

  @Prop({ required: true, enum: AlertFrequency })
  frequency: AlertFrequency;

  @Prop({ type: Number, required: false })
  cooldown_period?: number;

  @Prop({ type: Boolean, default: true })
  is_active: boolean;

  @Prop({ type: Date, required: false })
  triggered_at?: Date;
}

export const AlertSchema = SchemaFactory.createForClass(Alert);

// Index for quick symbol lookup
AlertSchema.index({ symbol: 1 });

// Compound index for active alert matching
AlertSchema.index(
  { is_active: 1, symbol: 1, target_price: 1 }
); 