import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import WarrantyResultView from './WarrantyResultView';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ i18n: { language: 'ka' } }),
}));

test('shows the warranty certificate and policy as separate documents', () => {
  const html = renderToStaticMarkup(
    <WarrantyResultView
      warranty={{ warranty_id: 'WP-TEST', title: 'Test device', is_active: true }}
      onBack={() => {}}
      onDownload={() => {}}
      onPrint={() => {}}
      onOpenCase={() => {}}
    />,
  );

  expect(html).toContain('გარანტიის ტალონი');
  expect(html).toContain('საგარანტიო მომსახურების პირობები');
  expect(html).toContain('href="/Zezva_Warranty_Policy_KA.pdf"');
  expect(html).toContain('download="Zezva_Warranty_Policy_KA.pdf"');
});
