import { createHmac } from 'crypto';
import { ServiceUnavailableException, UnauthorizedException } from '@nestjs/common';
import { WooCommerceController } from './woocommerce.controller';

describe('WooCommerceController webhook', () => {
  const body = { id: 101, status: 'completed' };
  const rawBody = Buffer.from(JSON.stringify(body));

  it('rejects unsigned webhooks before processing an order', async () => {
    const service = { processOrderWebhook: jest.fn() };
    const controller = new WooCommerceController(service as any, { get: () => 'signing-secret' } as any);
    await expect(controller.handleOrderWebhook(body, { rawBody, header: () => '' } as any))
      .rejects.toThrow(UnauthorizedException);
    expect(service.processOrderWebhook).not.toHaveBeenCalled();
  });

  it('fails closed until a signing secret is configured', async () => {
    const service = { processOrderWebhook: jest.fn() };
    const controller = new WooCommerceController(service as any, { get: () => undefined } as any);
    await expect(controller.handleOrderWebhook(body, { rawBody, header: () => '' } as any))
      .rejects.toThrow(ServiceUnavailableException);
  });

  it('accepts a valid HMAC for the exact raw payload', async () => {
    const service = { processOrderWebhook: jest.fn().mockResolvedValue(undefined) };
    const signature = createHmac('sha256', 'signing-secret').update(rawBody).digest('base64');
    const controller = new WooCommerceController(service as any, { get: () => 'signing-secret' } as any);
    await controller.handleOrderWebhook(body, { rawBody, header: () => signature } as any);
    expect(service.processOrderWebhook).toHaveBeenCalledWith(101, 'completed');
  });
});
