import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({
  timestamps: true,
  collection: 'push_tokens'
})
export class PushToken extends Document {
  @Prop({ required: true })
  endpoint: string;

  @Prop({ type: Date, required: false })
  expirationTime?: Date;

  @Prop({
    type: {
      p256dh: String,
      auth: String
    },
    required: true
  })
  keys: {
    p256dh: string;
    auth: string;
  };

  @Prop({ required: false })
  user_agent?: string;
}

export const PushTokenSchema = SchemaFactory.createForClass(PushToken);

// Create unique index on endpoint
PushTokenSchema.index(
  { endpoint: 1 },
  { unique: true }
);

// Create TTL index on createdAt (auto-expire after 30 days if not updated)
PushTokenSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 2592000 }
); 