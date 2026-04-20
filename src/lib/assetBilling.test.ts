import { describe, expect, it } from 'vitest';
import { buildBillableAssetLines } from './assetBilling';
import { normalizeInvoiceItemType } from './invoiceItems';

describe('buildBillableAssetLines', () => {
  it('builds a full-month asset charge', () => {
    const items = buildBillableAssetLines({
      monthYear: '2026-04',
      contractStartDate: '2026-01-01',
      contractEndDate: '2026-12-31',
      assets: [
        {
          id: 1,
          assetName: 'Dieu hoa',
          isBillable: true,
          billingStatus: 'active',
          monthlyCharge: 300000,
          quantity: 1,
          billingStartDate: '2026-04-01',
        },
      ],
    });

    expect(items).toHaveLength(1);
    expect(items[0].lineTotal).toBe(300000);
    expect(items[0].itemType).toBe('asset');
  });

  it('prorates asset charge by active days in the billing period', () => {
    const items = buildBillableAssetLines({
      monthYear: '2026-04',
      contractStartDate: '2026-04-01',
      contractEndDate: '2026-12-31',
      assets: [
        {
          id: 2,
          assetName: 'May giat',
          isBillable: true,
          billingStatus: 'active',
          monthlyCharge: 310000,
          quantity: 1,
          billingStartDate: '2026-04-16',
        },
      ],
    });

    expect(items).toHaveLength(1);
    expect(items[0].activeDays).toBe(15);
    expect(items[0].lineTotal).toBe(155000);
  });

  it('skips suspended assets', () => {
    const items = buildBillableAssetLines({
      monthYear: '2026-04',
      contractStartDate: '2026-04-01',
      contractEndDate: '2026-12-31',
      assets: [
        {
          id: 3,
          assetName: 'Tu lanh',
          isBillable: true,
          billingStatus: 'suspended',
          monthlyCharge: 120000,
        },
      ],
    });

    expect(items).toHaveLength(0);
  });
});

describe('normalizeInvoiceItemType', () => {
  it('prefers explicit item_type from database', () => {
    expect(normalizeInvoiceItemType('asset', 'Tien thue')).toBe('asset');
  });

  it('falls back to normalized description when item_type is missing', () => {
    expect(normalizeInvoiceItemType(null, 'Phu phi thiet bi: dieu hoa')).toBe('asset');
    expect(normalizeInvoiceItemType(null, 'Tien dien thang 2026-04')).toBe('utility_electric');
  });
});
