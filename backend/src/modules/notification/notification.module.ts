import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { NotificationController } from './notification.controller';
import { NotificationService } from './notification.service';
import { PushToken, PushTokenSchema } from '../../models/push-token.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PushToken.name, schema: PushTokenSchema },
    ]),
  ],
  controllers: [NotificationController],
  providers: [NotificationService],
  exports: [NotificationService],
})
export class NotificationModule {} 