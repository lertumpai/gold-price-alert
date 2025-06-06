import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { PriceModule } from './modules/price/price.module';
import { AlertModule } from './modules/alert/alert.module';
import { NotificationModule } from './modules/notification/notification.module';
import { AggregationModule } from './modules/aggregation/aggregation.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MongooseModule.forRoot(process.env.MONGODB_URI || 'mongodb://localhost:27017/gold-price-alert'),
    PriceModule,
    AlertModule,
    NotificationModule,
    AggregationModule,
  ],
})
export class AppModule {} 