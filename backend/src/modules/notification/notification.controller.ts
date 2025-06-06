import {
  Body,
  Controller,
  Delete,
  Post,
  ValidationPipe,
} from '@nestjs/common';
import { NotificationService } from './notification.service';
import { IsObject, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class PushSubscriptionKeys {
  @IsString()
  p256dh: string;

  @IsString()
  auth: string;
}

class PushSubscriptionDto {
  @IsString()
  endpoint: string;

  @IsObject()
  @ValidateNested()
  @Type(() => PushSubscriptionKeys)
  keys: PushSubscriptionKeys;

  @IsString()
  user_agent?: string;
}

@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Post('subscribe')
  async subscribe(@Body(ValidationPipe) subscription: PushSubscriptionDto) {
    return this.notificationService.saveSubscription(subscription);
  }

  @Delete('unsubscribe')
  async unsubscribe(@Body('endpoint') endpoint: string) {
    await this.notificationService.deleteSubscription(endpoint);
    return { success: true };
  }
} 