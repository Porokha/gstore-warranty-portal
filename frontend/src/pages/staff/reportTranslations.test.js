import fs from 'fs';
import path from 'path';
import en from '../../locales/en/translations.json';
import ka from '../../locales/ka/translations.json';

const reportPages = ['FinancePage.js', 'StatisticsPage.js'];
const dynamicFinanceKeys = [
  ...['Phone', 'Tablet', 'Laptop', 'Desktop', 'Other'].map((type) => `financeReport.deviceTypes.${type}`),
  ...['pending', 'paid', 'failed', 'cancelled', 'onsite', 'online'].map((value) => `payment.${value}`),
  ...['covered', 'payable', 'returned', 'replaceable'].map((type) => `result.${type}`),
];

const translationValue = (translations, key) => key.split('.').reduce((value, part) => value?.[part], translations);

describe('staff report translations', () => {
  for (const page of reportPages) {
    const source = fs.readFileSync(path.join(__dirname, page), 'utf8');
    const literalKeys = [...source.matchAll(/\bt\(\s*['"]([^'"]+)['"]/g)].map((match) => match[1]);

    test(`${page} has readable English and Georgian labels`, () => {
      for (const translations of [en, ka]) {
        for (const key of [...literalKeys, ...(page === 'FinancePage.js' ? dynamicFinanceKeys : [])]) {
          const value = translationValue(translations, key);
          expect(typeof value).toBe('string');
          expect(value.trim()).not.toBe('');
          expect(value).not.toBe(key);
        }
      }
    });
  }
});
