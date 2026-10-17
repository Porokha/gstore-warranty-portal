import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import StatusChangeForm from './StatusChangeForm';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key) => key }),
}));
jest.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({ user: { role: 'manager' } }),
}));

describe('StatusChangeForm drafts', () => {
  let container;
  let root;

  beforeEach(() => {
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    globalThis.IS_REACT_ACT_ENVIRONMENT = false;
  });

  it('keeps a selected stage and pickup-PIN choice through an unrelated case refetch', () => {
    const case_ = { id: 4, status_level: 3, result_type: 'covered', payments: [] };
    act(() => root.render(<StatusChangeForm case_={case_} onStatusChange={jest.fn()} />));

    act(() => container.querySelector('[aria-label="case.chooseNextStage: status.completed"]').click());
    const checkbox = container.querySelector('input[type="checkbox"]');
    act(() => checkbox.click());
    expect(checkbox.checked).toBe(true);

    act(() => root.render(<StatusChangeForm case_={{ ...case_, customer_name: 'Updated' }} onStatusChange={jest.fn()} />));

    expect(container.querySelector('[aria-label="case.chooseNextStage: status.completed"]').getAttribute('aria-pressed')).toBe('true');
    expect(container.querySelector('input[type="checkbox"]').checked).toBe(true);
  });

  it('submits the payable offer with the stage change in one request', async () => {
    const onStatusChange = jest.fn().mockResolvedValue({ status_level: 3 });
    act(() => root.render(<StatusChangeForm
      case_={{ id: 5, status_level: 2, result_type: null, payments: [] }}
      onStatusChange={onStatusChange}
    />));

    act(() => container.querySelector('[aria-label="case.chooseNextStage: status.pending"]').click());
    act(() => [...container.querySelectorAll('.zzv-case-flow__result')]
      .find((button) => button.textContent.includes('result.payable')).click());
    const amount = container.querySelector('input[name="offer_amount"]');
    act(() => {
      Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set.call(amount, '250');
      amount.dispatchEvent(new Event('input', { bubbles: true }));
    });
    act(() => container.querySelector('.zzv-case-flow__method-options button').click());
    await act(async () => {
      container.querySelector('form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    });

    expect(onStatusChange).toHaveBeenCalledTimes(1);
    expect(onStatusChange).toHaveBeenCalledWith(expect.objectContaining({
      new_status_level: 3,
      result_type: 'payable',
      offer: expect.objectContaining({ offer_type: 'payable', offer_amount: 250, payment_method: 'online' }),
    }));
  });
});
