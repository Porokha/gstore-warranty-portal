import { TradeInProduct } from './entities/trade-in-product.entity';

export const isMacBook = (product: Pick<TradeInProduct, 'brand' | 'slug'>) =>
  product.brand?.toLowerCase() === 'apple' && product.slug.toLowerCase().startsWith('macbook-');

export const macBookFamily = (slug: string) => {
  const value = slug.toLowerCase();
  if (value.startsWith('macbook-air-')) return 'MacBook Air';
  if (value.startsWith('macbook-pro-')) return 'MacBook Pro';
  if (value.startsWith('macbook-neo')) return 'MacBook Neo';
  return 'MacBook';
};

const firstAnswers = (tree: unknown): any[] => {
  try {
    const sections = typeof tree === 'string' ? JSON.parse(tree) : tree;
    const answers = sections?.[0]?.questions?.[0]?.answers;
    return Array.isArray(answers) ? answers : [];
  } catch {
    return [];
  }
};

const sharedAttribute = (answers: any[], key: string) => {
  if (!Array.isArray(answers) || !answers.length) return null;
  const values = answers.map((answer: any) =>
    String(answer.attributes?.find((attribute: any) => attribute.key === key)?.value || '').replace(/^\[|\]$/g, ''),
  );
  return values[0] && values.every((value: string) => value === values[0]) ? values[0] : null;
};

export const macBookDisplay = (product: Pick<TradeInProduct, 'name' | 'slug'>, tree?: unknown) => {
  const name = product.name.trim().replace(/\\+$/, '').trim();
  const leaf = product.slug.split('/').pop() || '';
  const parent = product.slug.split('/')[0];
  const answers = firstAnswers(tree);
  const answerYears = answers.map((answer) =>
    String(answer.attributes?.find((attribute: any) => attribute.key === 'model_year')?.value || '').match(/20\d{2}/)?.[0],
  ).filter(Boolean).sort();
  const answerRange = answerYears.length > 1 && answerYears[0] !== answerYears[answerYears.length - 1]
    ? `${answerYears[0]}-${answerYears[answerYears.length - 1]}` : answerYears[0];
  const year = leaf.match(/(?:^|-)(20\d{2})(?:$|-)/)?.[1] ||
    parent.match(/(20\d{2})-(20\d{2})/)?.slice(1).join('-') || answerRange || null;
  const chipFromSlug = leaf.match(/(?:^|-)(m\d+|a\d+)(?:$|-)/i)?.[1];
  const chipFromTree = sharedAttribute(answers, 'processor_type')?.match(/^(m\d+|a\d+(?:-pro)?)/i)?.[1];
  const chip = chipFromTree?.startsWith(chipFromSlug || 'no-match') ? chipFromTree :
    chipFromSlug || chipFromTree || (parent === 'macbook-12' || parent.includes('retina') || parent.match(/20(?:1\d|20)/) ? 'Intel' : null);
  const chipLabel = chip?.toLowerCase() === 'intel' ? 'Intel' : chip?.toUpperCase().replace('-PRO', ' Pro') || null;
  const formattedName = name.replace(/(\d{2})(?=$)/, '$1"');
  const details = [year, chipLabel].filter(Boolean);
  return { name: details.length ? `${formattedName} (${details.join(', ')})` : formattedName, release_year: year, chip: chipLabel };
};
