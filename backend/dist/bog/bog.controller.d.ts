import { BogService, BOGPaymentResponse } from './bog.service';
import { InitiatePaymentDto } from './dto/initiate-payment.dto';
import { PaymentsService } from '../payments/payments.service';
export declare class BogController {
    private bogService;
    private paymentsService;
    constructor(bogService: BogService, paymentsService: PaymentsService);
    initiatePayment(paymentId: number, initiateDto: InitiatePaymentDto): Promise<BOGPaymentResponse>;
    handleCallback(callbackData: any): Promise<{
        success: boolean;
    }>;
    checkPaymentStatus(paymentId: number): Promise<any>;
}
