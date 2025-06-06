import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';
import * as webpush from 'web-push';
import { PushToken } from '../../models/push-token.schema';

@Injectable()
@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class NotificationService {
  @WebSocketServer()
  private server: Server;

  constructor(
    @InjectModel(PushToken.name)
    private pushTokenModel: Model<PushToken>,
  ) {
    // Configure VAPID keys
    webpush.setVapidDetails(
      'mailto:your-email@example.com', // Replace with your email
      process.env.VAPID_PUBLIC_KEY,
      process.env.VAPID_PRIVATE_KEY,
    );
  }

  async saveSubscription(subscription: PushToken): Promise<PushToken> {
    const token = new this.pushTokenModel(subscription);
    return token.save();
  }

  async sendNotification(
    message: string,
    data?: any,
  ): Promise<void> {
    // Send WebSocket notification
    this.server.emit('alert-triggered', { message, data });

    // Send push notifications
    const subscriptions = await this.pushTokenModel.find().exec();

    const notifications = subscriptions.map(async (subscription) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: subscription.endpoint,
            keys: subscription.keys,
          },
          JSON.stringify({
            title: 'Gold Price Alert',
            body: message,
            data,
          }),
        );
      } catch (error) {
        if (error.statusCode === 410 || error.statusCode === 404) {
          // Subscription has expired or is invalid
          await this.pushTokenModel.findByIdAndDelete(subscription._id);
        }
        console.error('Push notification failed:', error);
      }
    });

    await Promise.all(notifications);
  }

  async deleteSubscription(endpoint: string): Promise<void> {
    await this.pushTokenModel.findOneAndDelete({ endpoint }).exec();
  }
} 