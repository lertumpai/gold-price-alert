import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Alert, AlertCondition, AlertFrequency } from '../../models/alert.schema';
import { NotificationService } from '../notification/notification.service';

@Injectable()
export class AlertService {
  constructor(
    @InjectModel(Alert.name)
    private alertModel: Model<Alert>,
    private notificationService: NotificationService,
  ) {}

  async createAlert(alertData: Partial<Alert>): Promise<Alert> {
    const alert = new this.alertModel(alertData);
    return alert.save();
  }

  async updateAlert(id: string, alertData: Partial<Alert>): Promise<Alert> {
    return this.alertModel
      .findByIdAndUpdate(id, alertData, { new: true })
      .exec();
  }

  async deleteAlert(id: string): Promise<Alert> {
    return this.alertModel.findByIdAndDelete(id).exec();
  }

  async getAlerts(symbol?: string): Promise<Alert[]> {
    const query = symbol ? { symbol } : {};
    return this.alertModel.find(query).exec();
  }

  async evaluatePrice(symbol: string, price: number): Promise<void> {
    const activeAlerts = await this.alertModel
      .find({
        symbol,
        is_active: true,
      })
      .exec();

    for (const alert of activeAlerts) {
      const isTriggered = this.checkAlertCondition(alert, price);

      if (isTriggered) {
        await this.handleAlertTrigger(alert, price);
      }
    }
  }

  private checkAlertCondition(alert: Alert, price: number): boolean {
    switch (alert.condition) {
      case AlertCondition.ABOVE:
        return price > alert.target_price;
      case AlertCondition.BELOW:
        return price < alert.target_price;
      case AlertCondition.CROSSES:
        // For crosses, we need previous price, simplified here
        return Math.abs(price - alert.target_price) < 0.0001;
      default:
        return false;
    }
  }

  private async handleAlertTrigger(alert: Alert, price: number): Promise<void> {
    // Update alert status
    alert.triggered_at = new Date();

    // Handle different frequencies
    if (alert.frequency === AlertFrequency.ONCE) {
      alert.is_active = false;
    } else if (alert.frequency === AlertFrequency.COOLDOWN && alert.cooldown_period) {
      alert.is_active = false;
      // Reactivate after cooldown
      setTimeout(async () => {
        await this.updateAlert(alert.id, { is_active: true });
      }, alert.cooldown_period * 1000);
    }

    await alert.save();

    // Send notification
    const message = `${alert.symbol} price ${alert.condition} ${alert.target_price}! Current price: ${price}`;
    await this.notificationService.sendNotification(message, {
      alertId: alert.id,
      symbol: alert.symbol,
      price,
    });
  }
} 