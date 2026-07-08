import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateTradeInQuoteDto } from './dto/create-trade-in-quote.dto';
import { UpdateTradeInCategoryDto } from './dto/update-trade-in-category.dto';
import { UpdateTradeInProductDto } from './dto/update-trade-in-product.dto';
import { UpdateTradeInQuoteDto } from './dto/update-trade-in-quote.dto';
import { TradeInCategory } from './entities/trade-in-category.entity';
import { TradeInPricingTree } from './entities/trade-in-pricing-tree.entity';
import { TradeInProduct } from './entities/trade-in-product.entity';
import { TradeInQuote, TradeInQuoteStatus } from './entities/trade-in-quote.entity';
import { TradeInSetting } from './entities/trade-in-setting.entity';

@Injectable()
export class TradeInService {
  constructor(
    @InjectRepository(TradeInCategory)
    private readonly categoryRepository: Repository<TradeInCategory>,
    @InjectRepository(TradeInProduct)
    private readonly productRepository: Repository<TradeInProduct>,
    @InjectRepository(TradeInPricingTree)
    private readonly pricingRepository: Repository<TradeInPricingTree>,
    @InjectRepository(TradeInQuote)
    private readonly quoteRepository: Repository<TradeInQuote>,
    @InjectRepository(TradeInSetting)
    private readonly settingRepository: Repository<TradeInSetting>,
  ) {}

  listPublicCategories() {
    return this.categoryRepository.find({
      where: { enabled: true },
      order: { sort_order: 'ASC', label: 'ASC' },
      select: ['slug', 'label', 'icon_svg', 'coming_soon'],
    });
  }

  async listBrands(category: string) {
    const rows = await this.productRepository
      .createQueryBuilder('product')
      .select('product.brand', 'brand')
      .addSelect('COUNT(product.id)', 'product_count')
      .where('product.enabled = :enabled', { enabled: true })
      .andWhere('LOWER(product.category) = LOWER(:category)', { category })
      .andWhere("product.brand IS NOT NULL AND product.brand <> ''")
      .groupBy('product.brand')
      .orderBy('product_count', 'DESC')
      .addOrderBy('product.brand', 'ASC')
      .getRawMany();

    return rows.map((row) => ({
      brand: row.brand,
      product_count: Number(row.product_count),
    }));
  }

  async listSeries(category: string, brand: string) {
    const products = await this.productRepository.find({
      where: { enabled: true },
      select: ['name', 'brand', 'category', 'category2'],
    });
    const matching = products.filter(
      (product) =>
        this.equals(product.category, category) &&
        (this.equals(product.brand, brand) || this.productMatchesBrand(product.name, brand)),
    );
    const counts = new Map<string, number>();

    matching.forEach((product) => {
      const series = product.category2?.trim() || this.inferSeries(product.name, brand);
      if (series) {
        counts.set(series, (counts.get(series) || 0) + 1);
      }
    });

    return Array.from(counts.entries())
      .map(([series, product_count]) => ({ series, product_count }))
      .sort((a, b) => b.product_count - a.product_count || a.series.localeCompare(b.series));
  }

  async listProducts(params: {
    category?: string;
    brand?: string;
    series?: string;
    q?: string;
    page?: number;
    limit?: number;
  }) {
    const page = Math.max(1, Number(params.page || 1));
    const limit = Math.min(100, Math.max(1, Number(params.limit || 30)));
    const query = this.productRepository
      .createQueryBuilder('product')
      .leftJoin('product.pricing_tree', 'pricing')
      .addSelect('pricing.max_price', 'pricing_max_price')
      .where('product.enabled = :enabled', { enabled: true });

    if (params.category) {
      query.andWhere('LOWER(product.category) = LOWER(:category)', {
        category: params.category,
      });
    }
    if (params.brand) {
      query.andWhere('LOWER(product.brand) = LOWER(:brand)', { brand: params.brand });
    }
    if (params.series) {
      query.andWhere('(LOWER(product.category2) = LOWER(:series) OR product.name LIKE :seriesLike)', {
        series: params.series,
        seriesLike: `%${params.series}%`,
      });
    }
    if (params.q?.trim()) {
      const terms = params.q.trim().split(/\s+/).filter(Boolean);
      terms.forEach((term, index) => {
        query.andWhere(
          `(product.name LIKE :term${index} OR product.brand LIKE :term${index} OR product.search_tags LIKE :term${index})`,
          { [`term${index}`]: `%${term}%` },
        );
      });
    }

    const total = await query.getCount();
    query.orderBy('product.brand', 'ASC').addOrderBy('product.name', 'ASC');
    const result = await query.skip((page - 1) * limit).take(limit).getRawAndEntities();

    return {
      items: result.entities.map((product, index) =>
        this.toPublicProduct(product, result.raw[index]?.pricing_max_price),
      ),
      total,
      page,
      limit,
      total_pages: Math.ceil(total / limit),
    };
  }

  async getProduct(slug: string) {
    const product = await this.productRepository.findOne({
      where: { slug, enabled: true },
      relations: ['pricing_tree'],
    });
    if (!product) {
      throw new NotFoundException('Trade-in product not found.');
    }

    const conditionSetting = await this.settingRepository.findOne({
      where: { key: 'condition_descriptions' },
    });
    const descriptions = this.parseJsonObject(conditionSetting?.value);
    const answerMessages = Object.entries(descriptions).map(([value, message]) => ({
      attribute_key: 'condition',
      attribute_value: value,
      message,
    }));

    return {
      ...this.toPublicProduct(product),
      category2: product.category2,
      extraData: Buffer.from('{}').toString('base64'),
      answerMessages: Buffer.from(JSON.stringify(answerMessages)).toString('base64'),
      questionLabels: {},
      tree: product.pricing_tree?.tree_json || [],
    };
  }

  async createQuote(dto: CreateTradeInQuoteDto) {
    const product = await this.productRepository.findOne({
      where: { slug: dto.product_slug, enabled: true },
    });
    if (!product) {
      throw new NotFoundException('Trade-in product not found.');
    }

    const quote = this.quoteRepository.create({
      quote_number: await this.nextQuoteNumber(),
      product_id: product.id,
      product_name: product.name,
      pricing_path: dto.pricing_path || null,
      final_price: dto.final_price.toFixed(2),
      customer_name: dto.customer_name.trim(),
      customer_email: dto.customer_email?.trim() || null,
      customer_phone: dto.customer_phone.trim(),
      status: TradeInQuoteStatus.PENDING,
    });

    const saved = await this.quoteRepository.save(quote);
    return {
      id: saved.id,
      quote_number: saved.quote_number,
      status: saved.status,
    };
  }

  listAdminCategories() {
    return this.categoryRepository.find({ order: { sort_order: 'ASC', label: 'ASC' } });
  }

  async updateCategory(id: number, dto: UpdateTradeInCategoryDto) {
    const category = await this.categoryRepository.findOne({ where: { id } });
    if (!category) {
      throw new NotFoundException('Trade-in category not found.');
    }
    Object.assign(category, dto);
    return this.categoryRepository.save(category);
  }

  async listAdminProducts(params: {
    q?: string;
    category?: string;
    subcategory?: string;
    enabled?: string;
    page?: number;
    limit?: number;
  }) {
    const page = Math.max(1, Number(params.page || 1));
    const limit = Math.min(100, Math.max(1, Number(params.limit || 50)));
    const query = this.productRepository
      .createQueryBuilder('product')
      .leftJoin('product.pricing_tree', 'pricing')
      .addSelect('pricing.max_price', 'pricing_max_price');

    if (params.q?.trim()) {
      query.andWhere('(product.name LIKE :q OR product.brand LIKE :q OR product.slug LIKE :q)', {
        q: `%${params.q.trim()}%`,
      });
    }
    if (params.category) {
      query.andWhere('LOWER(product.category) = LOWER(:category)', {
        category: params.category,
      });
    }
    if (params.subcategory) {
      query.andWhere('LOWER(product.category2) = LOWER(:subcategory)', {
        subcategory: params.subcategory,
      });
    }
    if (params.enabled === 'true' || params.enabled === 'false') {
      query.andWhere('product.enabled = :enabled', { enabled: params.enabled === 'true' });
    }

    const total = await query.getCount();
    const result = await query
      .orderBy('product.updated_at', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getRawAndEntities();

    return {
      items: result.entities.map((product, index) => ({
        ...product,
        max_price: Number(result.raw[index]?.pricing_max_price || 0),
      })),
      total,
      page,
      limit,
      total_pages: Math.ceil(total / limit),
    };
  }

  async listAdminProductSubcategories(category?: string) {
    const query = this.productRepository
      .createQueryBuilder('product')
      .select('DISTINCT product.category2', 'subcategory')
      .where('product.category2 IS NOT NULL')
      .andWhere("TRIM(product.category2) <> ''");

    if (category) {
      query.andWhere('LOWER(product.category) = LOWER(:category)', { category });
    }

    const rows = await query
      .orderBy('product.category2', 'ASC')
      .getRawMany();

    return rows.map((row) => row.subcategory).filter(Boolean);
  }

  async updateProduct(id: number, dto: UpdateTradeInProductDto) {
    const product = await this.productRepository.findOne({ where: { id } });
    if (!product) {
      throw new NotFoundException('Trade-in product not found.');
    }
    Object.assign(product, dto);
    return this.productRepository.save(product);
  }

  async listQuotes(status?: TradeInQuoteStatus, page = 1, limit = 50) {
    const resolvedPage = Math.max(1, Number(page || 1));
    const resolvedLimit = Math.min(100, Math.max(1, Number(limit || 50)));
    const query = this.quoteRepository
      .createQueryBuilder('quote')
      .leftJoinAndSelect('quote.product', 'product');
    if (status && Object.values(TradeInQuoteStatus).includes(status)) {
      query.where('quote.status = :status', { status });
    }
    const [items, total] = await query
      .orderBy('quote.created_at', 'DESC')
      .skip((resolvedPage - 1) * resolvedLimit)
      .take(resolvedLimit)
      .getManyAndCount();
    return {
      items,
      total,
      page: resolvedPage,
      limit: resolvedLimit,
      total_pages: Math.ceil(total / resolvedLimit),
    };
  }

  async updateQuote(id: number, dto: UpdateTradeInQuoteDto) {
    const quote = await this.quoteRepository.findOne({ where: { id } });
    if (!quote) {
      throw new NotFoundException('Trade-in quote not found.');
    }
    const next = {
      ...dto,
      customer_name: dto.customer_name?.trim(),
      customer_email: dto.customer_email?.trim() || null,
      customer_phone: dto.customer_phone?.trim(),
      product_name: dto.product_name?.trim(),
      final_price: dto.final_price !== undefined ? Number(dto.final_price).toFixed(2) : undefined,
      notes: dto.notes?.trim() || null,
    };
    Object.entries(next).forEach(([key, value]) => {
      if (value !== undefined) {
        (quote as any)[key] = value;
      }
    });
    return this.quoteRepository.save(quote);
  }

  async deleteQuote(id: number) {
    const quote = await this.quoteRepository.findOne({ where: { id } });
    if (!quote) {
      throw new NotFoundException('Trade-in quote not found.');
    }
    await this.quoteRepository.delete(id);
  }

  async getQuoteCounts() {
    const rows = await this.quoteRepository
      .createQueryBuilder('quote')
      .select('quote.status', 'status')
      .addSelect('COUNT(quote.id)', 'count')
      .groupBy('quote.status')
      .getRawMany();

    const byStatus = rows.reduce((acc, row) => {
      acc[row.status] = Number(row.count || 0);
      return acc;
    }, {} as Record<string, number>);

    const counts = Object.values(byStatus) as number[];

    return {
      pending: byStatus[TradeInQuoteStatus.PENDING] || 0,
      total: counts.reduce((sum, count) => sum + count, 0),
      by_status: byStatus,
    };
  }

  private toPublicProduct(product: TradeInProduct, selectedMaxPrice?: string | number) {
    return {
      id: product.id,
      slug: product.slug,
      name: product.name,
      brand: product.brand,
      category: product.category,
      series: product.category2,
      image_src: product.image_src,
      max_price: Number(selectedMaxPrice ?? product.pricing_tree?.max_price ?? 0),
    };
  }

  private async nextQuoteNumber() {
    const date = new Date();
    const day = [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, '0'),
      String(date.getDate()).padStart(2, '0'),
    ].join('');
    const prefix = `TR-${day}-`;
    const latest = await this.quoteRepository
      .createQueryBuilder('quote')
      .where('quote.quote_number LIKE :prefix', { prefix: `${prefix}%` })
      .orderBy('quote.id', 'DESC')
      .getOne();
    const sequence = latest ? Number(latest.quote_number.split('-').pop() || 0) + 1 : 1;
    return `${prefix}${String(sequence).padStart(4, '0')}`;
  }

  private equals(left?: string | null, right?: string | null) {
    return String(left || '').trim().toLowerCase() === String(right || '').trim().toLowerCase();
  }

  private productMatchesBrand(name: string, brand: string) {
    return name.toLowerCase().includes(brand.toLowerCase());
  }

  private inferSeries(name: string, brand: string) {
    const clean = name.replace(new RegExp(brand, 'i'), '').trim();
    const match = clean.match(/^(iPhone\s+\d+|Galaxy\s+[A-Z]?\d+|Pixel\s+\d+|iPad(?:\s+\w+)?|MacBook(?:\s+\w+)?)/i);
    return match?.[1] || '';
  }

  private parseJsonObject(value?: string | null): Record<string, string> {
    if (!value) return {};
    try {
      const parsed = JSON.parse(value);
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
    } catch {
      return {};
    }
  }
}
