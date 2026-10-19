# POS trade-in voucher integration

The warranty portal owns voucher issuance and redemption. POS only validates a code during checkout and reports redemption after the order succeeds. Vouchers are single-use, for their full GEL face value, and expire 30 days after the signed trade-in agreement is finalized. Cash/bank trade-ins never issue vouchers.

## Setup

1. In Zezva staff admin, open Settings -> API Keys -> POS Trade-in Voucher, generate and save the dedicated secret. Do not reuse the POS warranty webhook secret.
2. Configure the same secret on the POS **server** (not in browser JavaScript). Send it as `Authorization: Bearer <secret>` over HTTPS for both endpoints.
3. POS should persist a stable `order_id` for each completed checkout. Use the same ID on all retries. If one checkout splits into multiple Woo/analytics rows, use the checkout's idempotency key or another parent transaction ID rather than one split row; `order_number` may contain the human-readable order numbers.

## Validate at checkout

`POST https://zezva.ge/api/integrations/pos/trade-in-vouchers/validate`

```json
{"code":"K7M4P9RA"}
```

Active response (`200`):

```json
{"valid":true,"code":"K7M4P9RA","amount_gel":350,"currency":"GEL","expires_at":"2026-11-18T12:00:00.000Z"}
```

Inactive response (`200`): `{ "valid": false, "reason": "not_found" }`, `used`, or `expired`. Codes are case-insensitive on input. Do not store the secret in the POS frontend or expose this endpoint directly to a browser. Validation does not reserve credit: POS must handle a possible conflict at final redemption.

## Redeem after order success

`POST https://zezva.ge/api/integrations/pos/trade-in-vouchers/redeem`

```json
{
  "code":"K7M4P9RA",
  "order_id":"checkout-3a8f987e",
  "order_number":"99612-1, 99612-2",
  "order_status":"pos-success",
  "order_total_gel":500,
  "applied_amount_gel":350
}
```

`order_status` must be `pos-success` or `completed`. `applied_amount_gel` must equal the complete voucher value; `order_total_gel` must be at least that value. Both amounts are decimal GEL with at most two places. The voucher is atomically marked used and linked to the POS order.

Success (`200`):

```json
{"success":true,"code":"K7M4P9RA","amount_gel":350,"currency":"GEL","order_id":"checkout-3a8f987e","redeemed_at":"2026-10-19T12:00:00.000Z","already_redeemed":false}
```

Retrying the same code with the same `order_id` returns `200` and `already_redeemed: true`. A different order, expired voucher, or voucher used manually by an admin returns `409`; invalid amounts return `400`; unknown code returns `404`. Missing/invalid authentication returns `401`, and an unconfigured secret returns `503`.

The existing POS `tradeInCouponCode` field currently only writes `_pos_trade_in_coupon_code` metadata; it does not validate or apply credit. POS must perform validation server-side, apply the full credit to the checkout total/payment accounting, and enqueue redemption in its outbox after the order commits. Retry transient failures with the same `order_id` and surface permanent `4xx` conflicts for staff reconciliation. Do not silently mark a voucher-paid order fully settled until redemption is acknowledged. Because validation is not a reservation, two concurrent checkouts can both validate; only one redemption can succeed. If checkout commits before redemption is rejected, POS needs a compensation/reconciliation path rather than treating the voucher as paid.
