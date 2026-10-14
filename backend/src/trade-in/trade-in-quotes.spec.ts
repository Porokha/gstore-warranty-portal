import { TradeInService } from './trade-in.service';
import { BadRequestException } from '@nestjs/common';

describe('TradeInService quote viewing', () => {
  const manager = {
    findOne: jest.fn(),
    save: jest.fn((quote) => Promise.resolve(quote)),
  };
  const quoteRepository = {
    findOne: jest.fn(),
    save: jest.fn((quote) => Promise.resolve(quote)),
    manager: { transaction: (callback: any) => callback(manager) },
  };
  const service = new TradeInService({} as any, {} as any, {} as any, quoteRepository as any, {} as any);

  beforeEach(() => jest.clearAllMocks());

  it('marks an unread quote once and preserves the timestamp on repeat views', async () => {
    const quote = { id: 7, viewed_at: null };
    quoteRepository.findOne.mockResolvedValue(quote);

    const first = await service.markQuoteViewed(7);
    const second = await service.markQuoteViewed(7);

    expect(first.viewed_at).toBeInstanceOf(Date);
    expect(second.viewed_at).toBe(first.viewed_at);
    expect(quoteRepository.save).toHaveBeenCalledTimes(1);
  });

  it('marks status-only edits viewed without clearing existing details', async () => {
    const quote = { id: 7, status: 'pending', customer_email: 'customer@example.com', notes: 'Call after 5', viewed_at: null };
    quoteRepository.findOne.mockResolvedValue(quote);
    manager.findOne.mockResolvedValueOnce(null).mockResolvedValueOnce(quote);

    await service.updateQuote(7, { status: 'contacted' } as any);

    expect(quote).toMatchObject({
      status: 'contacted',
      customer_email: 'customer@example.com',
      notes: 'Call after 5',
      viewed_at: expect.any(Date),
    });
  });

  it('requires the agreement flow before marking a quote completed', async () => {
    manager.findOne.mockResolvedValueOnce(null).mockResolvedValueOnce({ id: 7, status: 'accepted' });
    await expect(service.updateQuote(7, { status: 'completed' } as any)).rejects.toThrow(BadRequestException);
    expect(manager.save).not.toHaveBeenCalled();
  });
});
