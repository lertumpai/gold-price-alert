import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AlertController } from './alert.controller';
import { AlertService } from './alert.service';
import { Alert, AlertSchema } from '../../models/alert.schema';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Alert.name, schema: AlertSchema },
    ]),
    NotificationModule,
  ],
  controllers: [AlertController],
  providers: [AlertService],
  exports: [AlertService],
})
export class AlertModule {} 