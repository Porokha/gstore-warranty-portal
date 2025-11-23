import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import axios, { AxiosInstance } from 'axios';
import * as crypto from 'crypto';
import { CasePayment, PaymentStatus } from '../payments/entities/case-payment.entity';
import { PaymentsService } from '../payments/payments.service';

interface BOGPaymentRequest {
  amount: number;
  currency: string;
  order_id: string;
  description: string;
  callback_url: string;
  success_url?: string;
  failure_url?: string;
  customer?: {
    first_name: string;
    last_name: string;
    phone: string;
    email?: string;
  };
}

export interface BOGPaymentResponse {
  order_id: string;
  payment_id: string;
  payment_url: string;
  status: string;
}

interface BOGCallbackData {
  order_id: string;
  payment_id: string;
  status: string;
  amount: string;
  currency: string;
  transaction_id?: string;
  signature?: string;
}

@Injectable()
export class BogService {
  private readonly logger = new Logger(BogService.name);
  private readonly api: AxiosInstance;
  private readonly apiUrl: string;
  private readonly merchantId: string;
  private readonly secretKey: string;
  private readonly callbackUrl: string;

  constructor(
    private configService: ConfigService,
    @InjectRepository(CasePayment)
    private paymentsRepository: Repository<CasePayment>,
    private paymentsService: PaymentsService,
  ) {
    this.apiUrl = this.configService.get<string>('BOG_API_URL') || 'https://api.bog.ge';
    this.merchantId = this.configService.get<string>('BOG_MERCHANT_ID');
    this.secretKey = this.configService.get<string>('BOG_SECRET_KEY');
    this.callbackUrl = this.configService.get<string>('BOG_CALLBACK_URL') || 
                      `${this.configService.get<string>('PORTAL_URL')}/api/bog/callback`;

    if (!this.merchantId || !this.secretKey) {
      this.logger.warn('BOG payment gateway credentials not configured');
      return;
    }

    this.api = axios.create({
      baseURL: this.apiUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'Merchant-Id': this.merchantId,
      },
    });
  }

  private generateSignature(data: Record<string, any>): string {
    // BOG typically uses HMAC-SHA256 for signature generation
    // The exact format may vary based on BOG's API documentation
    const sortedKeys = Object.keys(data).sort();
    const message = sortedKeys
      .map((key) => `${key}=${data[key]}`)
      .join('&');
    
    return crypto
      .createHmac('sha256', this.secretKey)
      .update(message)
      .digest('hex');
  }

  private verifySignature(data: BOGCallbackData): boolean {
    if (!data.signature) {
      return false;
    }

    const { signature, ...dataToVerify } = data;
    const calculatedSignature = this.generateSignature(dataToVerify);
    
    return calculatedSignature === signature;
  }

  async initiatePayment(
    paymentId: number,
    amount: number,
    description: string,
    customerInfo: {
      first_name: string;
      last_name: string;
      phone: string;
      email?: string;
    },
  ): Promise<BOGPaymentResponse> {
    const payment = await this.paymentsRepository.findOne({
      where: { id: paymentId },
      relations: ['case_'],
    });

    if (!payment) {
      throw new BadRequestException(`Payment with ID ${paymentId} not found`);
    }

    if (payment.payment_status !== PaymentStatus.PENDING) {
      throw new BadRequestException('Can only initiate payment for pending payments');
    }

    // Generate order ID for BOG (using payment ID)
    const orderId = `PAY-${paymentId}-${Date.now()}`;

    const paymentRequest: BOGPaymentRequest = {
      amount: amount,
      currency: 'GEL',
      order_id: orderId,
      description: description,
      callback_url: this.callbackUrl,
      success_url: `${this.configService.get<string>('PORTAL_URL')}/payment/success?payment_id=${paymentId}`,
      failure_url: `${this.configService.get<string>('PORTAL_URL')}/payment/failure?payment_id=${paymentId}`,
      customer: {
        first_name: customerInfo.first_name,
        last_name: customerInfo.last_name,
        phone: customerInfo.phone,
        email: customerInfo.email,
      },
    };

    // Generate signature
    const signature = this.generateSignature(paymentRequest);
    paymentRequest['signature'] = signature;

    try {
      // Note: The actual BOG API endpoint and request format may differ
      // This is a generic implementation - adjust based on BOG's actual API documentation
      const response = await this.api.post('/v1/payments', paymentRequest);

      // Update payment with BOG transaction ID
      payment.bog_transaction_id = response.data.payment_id || orderId;
      await this.paymentsRepository.save(payment);

      this.logger.log(`Initiated BOG payment for payment ID ${paymentId}, order ID: ${orderId}`);

      return {
        order_id: orderId,
        payment_id: response.data.payment_id || orderId,
        payment_url: response.data.payment_url,
        status: response.data.status || 'pending',
      };
    } catch (error) {
      this.logger.error(`Failed to initiate BOG payment:`, error.message);
      throw new BadRequestException('Failed to initiate payment with BOG gateway');
    }
  }

  async handleCallback(callbackData: BOGCallbackData): Promise<void> {
    // Verify signature
    if (!this.verifySignature(callbackData)) {
      this.logger.error('Invalid signature in BOG callback');
      throw new BadRequestException('Invalid signature');
    }

    // Extract payment ID from order_id (format: PAY-{paymentId}-{timestamp})
    const orderIdMatch = callbackData.order_id.match(/PAY-(\d+)-/);
    if (!orderIdMatch) {
      throw new BadRequestException('Invalid order ID format');
    }

    const paymentId = parseInt(orderIdMatch[1], 10);
    const payment = await this.paymentsRepository.findOne({
      where: { id: paymentId },
      relations: ['case_'],
    });

    if (!payment) {
      this.logger.error(`Payment ${paymentId} not found for BOG callback`);
      throw new BadRequestException('Payment not found');
    }

    // Update payment status based on BOG callback
    if (callbackData.status === 'success' || callbackData.status === 'completed') {
      await this.paymentsService.markAsPaid(paymentId, callbackData.transaction_id);
      this.logger.log(`Payment ${paymentId} marked as paid via BOG callback`);
    } else if (callbackData.status === 'failed' || callbackData.status === 'error') {
      await this.paymentsService.markAsFailed(paymentId);
      this.logger.log(`Payment ${paymentId} marked as failed via BOG callback`);
    } else {
      this.logger.warn(`Unknown payment status from BOG: ${callbackData.status}`);
    }
  }

  async checkPaymentStatus(paymentId: number): Promise<any> {
    const payment = await this.paymentsRepository.findOne({
      where: { id: paymentId },
    });

    if (!payment || !payment.bog_transaction_id) {
      throw new BadRequestException('Payment or BOG transaction ID not found');
    }

    try {
      // Query BOG API for payment status
      const response = await this.api.get(`/v1/payments/${payment.bog_transaction_id}`, {
        headers: {
          'Merchant-Id': this.merchantId,
        },
      });

      return response.data;
    } catch (error) {
      this.logger.error(`Failed to check BOG payment status:`, error.message);
      throw new BadRequestException('Failed to check payment status');
    }
  }
}

