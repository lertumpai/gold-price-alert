import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  ValidationPipe,
} from '@nestjs/common';
import { AlertService } from './alert.service';
import { Alert, AlertCondition, AlertFrequency } from '../../models/alert.schema';
import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateAlertDto {
  @IsString()
  symbol: string;

  @IsEnum(AlertCondition)
  condition: AlertCondition;

  @IsNumber()
  target_price: number;

  @IsEnum(AlertFrequency)
  frequency: AlertFrequency;

  @IsNumber()
  @IsOptional()
  cooldown_period?: number;
}

@Controller('alerts')
export class AlertController {
  constructor(private readonly alertService: AlertService) {}

  @Post()
  async createAlert(@Body(ValidationPipe) createAlertDto: CreateAlertDto) {
    return this.alertService.createAlert(createAlertDto);
  }

  @Get()
  async getAlerts(@Query('symbol') symbol?: string) {
    return this.alertService.getAlerts(symbol);
  }

  @Put(':id')
  async updateAlert(
    @Param('id') id: string,
    @Body(ValidationPipe) updateAlertDto: Partial<CreateAlertDto>,
  ) {
    return this.alertService.updateAlert(id, updateAlertDto);
  }

  @Delete(':id')
  async deleteAlert(@Param('id') id: string) {
    return this.alertService.deleteAlert(id);
  }
} 