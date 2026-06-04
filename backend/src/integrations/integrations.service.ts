import {
  BadGatewayException,
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleDestroy,
  OnModuleInit,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import axios from 'axios';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { SettingsService } from '../settings/settings.service';
import {
  ShopDeviceCategory,
  ShopInventorySource,
  ShopPartCategory,
  ShopProduct,
  ShopProductSupplier,
} from '../shop/entities/shop-product.entity';
import { SmsService } from '../sms/sms.service';
import { Warranty, CreatedSource } from '../warranties/entities/warranty.entity';
import { WarrantiesService } from '../warranties/warranties.service';
import { PosOrderUpsertDto } from './dto/pos-order-upsert.dto';
import {
  PosWarrantyInboundEvent,
  PosWarrantyInboundEventStatus,
} from './entities/pos-warranty-inbound-event.entity';
import {
  MobileSentrixSyncJob,
  MobileSentrixSyncJobStatus,
} from './entities/mobilesentrix-sync-job.entity';

type PosOrderUpsertAction = 'created' | 'updated' | 'ignored' | 'deferred';
type MobileSentrixCredentials = {
  baseUrl: string;
  consumerName: string;
  consumerKey: string;
  consumerSecret: string;
  accessToken: string;
  accessTokenSecret: string;
};
type MobileSentrixSearchItem = Record<string, any>;
type MobileSentrixMappedProduct = {
  supplier: ShopProductSupplier.MOBILESENTRIX;
  supplier_product_id: string;
  supplier_sku: string | null;
  title: string;
  slug: string;
  brand: string | null;
  device_category: ShopDeviceCategory;
  part_category: ShopPartCategory;
  inventory_source: ShopInventorySource;
  issue_label: string | null;
  device_model: string | null;
  quality_line: string | null;
  quality_badge: string | null;
  warranty_line: string;
  description: string | null;
  image_url: string | null;
  gallery_images: string[];
  compatibility_tags: string[];
  search_tags: string[];
  source_url: string | null;
  stock_quantity: number;
  supplier_price_usd: number;
  supplier_currency: string;
  supplier_exchange_rate: number;
  calculated_price_gel: number;
  calculation: {
    vat_rate: number;
    handling_fee_gel: number;
    margin_rate: number;
    formula: string;
  };
  raw: MobileSentrixSearchItem;
};
type MobileSentrixSyncMode = 'catalog' | 'refresh-existing';
type MobileSentrixSyncProgress = {
  current_page: number;
  total_pages: number;
  total_items: number;
  scanned: number;
  created: number;
  updated: number;
  skipped: number;
  failed: number;
  last_message: string;
};

@Injectable()
export class IntegrationsService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(IntegrationsService.name);
  private readonly eligibleNonPreorderStatuses = new Set(['pos-success', 'completed']);
  private readonly minimumWarrantyPrice = 500;
  private readonly warrantyYears = 2;
  private readonly mobileSentrixCallbackPath = '/api/integrations/mobilesentrix/oauth/callback';
  private readonly mobileSentrixWebhookPath = '/api/integrations/mobilesentrix/webhook';
  private readonly mobileSentrixVatRate = 0.18;
  private readonly mobileSentrixHandlingFeeGel = 5;
  private readonly mobileSentrixMarginRate = 0.5;
  private readonly mobileSentrixAutoSyncIntervalMs = 12 * 60 * 60 * 1000;
  private mobileSentrixAutoSyncTimer?: NodeJS.Timeout;
  private mobileSentrixAutoSyncRunning = false;

  constructor(
    @InjectRepository(PosWarrantyInboundEvent)
    private posInboundEventsRepository: Repository<PosWarrantyInboundEvent>,
    @InjectRepository(Warranty)
    private warrantiesRepository: Repository<Warranty>,
    @InjectRepository(ShopProduct)
    private shopProductsRepository: Repository<ShopProduct>,
    @InjectRepository(MobileSentrixSyncJob)
    private mobileSentrixSyncJobsRepository: Repository<MobileSentrixSyncJob>,
    private settingsService: SettingsService,
    private smsService: SmsService,
    private warrantiesService: WarrantiesService,
    private configService: ConfigService,
  ) {}

  async onModuleInit() {
    await this.mobileSentrixSyncJobsRepository.update(
      {
        status: In([
          MobileSentrixSyncJobStatus.QUEUED,
          MobileSentrixSyncJobStatus.RUNNING,
        ]),
      },
      {
        status: MobileSentrixSyncJobStatus.FAILED,
        error_message: 'Server restarted before this sync job finished.',
        last_message: 'Sync job was interrupted by a server restart.',
        finished_at: new Date(),
      },
    );

    this.mobileSentrixAutoSyncTimer = setInterval(() => {
      this.refreshExistingMobileSentrixProducts().catch((error) => {
        this.logger.error(`MobileSentrix auto-sync failed: ${error.message}`);
      });
    }, this.mobileSentrixAutoSyncIntervalMs);
  }

  onModuleDestroy() {
    if (this.mobileSentrixAutoSyncTimer) {
      clearInterval(this.mobileSentrixAutoSyncTimer);
    }
  }

  async assertPosWebhookAuthorization(authorizationHeader?: string): Promise<void> {
    const secret =
      (await this.settingsService.get('POS_WARRANTY_WEBHOOK_SECRET')) ||
      this.configService.get<string>('POS_WARRANTY_WEBHOOK_SECRET') ||
      '';

    if (!secret) {
      throw new ServiceUnavailableException('POS warranty webhook secret is not configured');
    }

    const bearer = authorizationHeader?.trim() || '';
    if (!bearer.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing bearer token');
    }

    const token = bearer.slice(7).trim();
    if (!token || token !== secret) {
      throw new UnauthorizedException('Invalid bearer token');
    }
  }

  async connectMobileSentrix(): Promise<{
    success: true;
    redirect_required: true;
    authorize_url: string;
    base_url: string;
    callback_url: string;
    webhook_url: string;
  }> {
    const config = await this.getMobileSentrixBaseConfig();

    const authorizeUrl = `${config.baseUrl}/oauth/authorize/identifier`;
    const callbackUrl = this.getMobileSentrixCallbackUrl();
    const params = new URLSearchParams({
      consumer: config.consumerName,
      authtype: '1',
      flowentry: 'SignIn',
      consumer_key: config.consumerKey,
      consumer_secret: config.consumerSecret,
      callback: callbackUrl,
    });

    return {
      success: true,
      redirect_required: true,
      authorize_url: `${authorizeUrl}?${params.toString()}`,
      base_url: config.baseUrl,
      callback_url: callbackUrl,
      webhook_url: this.getMobileSentrixWebhookUrl(),
    };
  }

  async completeMobileSentrixOAuthFromCallback(
    oauthToken?: string,
    oauthVerifier?: string,
  ): Promise<void> {
    if (!oauthToken || !oauthVerifier) {
      throw new BadRequestException('Missing oauth_token or oauth_verifier');
    }

    const config = await this.getMobileSentrixBaseConfig();
    const exchangeResult = await this.exchangeMobileSentrixAccessToken({
      ...config,
      oauthToken,
      oauthVerifier,
    });

    await this.settingsService.setApiKeys({
      mobilesentrix_access_token: exchangeResult.accessToken,
      mobilesentrix_access_token_secret: exchangeResult.accessTokenSecret,
    });
  }

  async testMobileSentrixSearch(query: string): Promise<{
    success: true;
    query: string;
    total_items: number;
    categories_count: number;
    items_count: number;
    first_items: Array<Record<string, any>>;
  }> {
    const normalizedQuery = query.trim();
    if (!normalizedQuery) {
      throw new BadRequestException('Search query is required');
    }

    const config = await this.getMobileSentrixCredentials();
    const response = await axios.get(`${config.baseUrl}/api/rest/searchproduct`, {
      params: {
        q: normalizedQuery,
        max_results: 5,
        start_index: 0,
      },
      headers: {
        Authorization: this.buildMobileSentrixOAuthHeader(config),
        Accept: 'application/json',
      },
      validateStatus: (status) => status >= 200 && status < 500,
    });

    if (response.status >= 400) {
      this.logger.warn(
        `MobileSentrix search failed with status ${response.status}: ${this.formatMobileSentrixProviderResponse(response.data)}`,
      );
      throw new BadGatewayException({
        message: response.data?.message || 'MobileSentrix search request failed',
        provider: 'mobilesentrix',
        provider_status: response.status,
        provider_response: response.data,
      });
    }

    const data = response.data?.data || {};
    const items = Array.isArray(data.items) ? data.items : [];
    const categories = Array.isArray(data.categories) ? data.categories : [];

    return {
      success: true,
      query: normalizedQuery,
      total_items: Number(data.total_items || items.length || 0),
      categories_count: categories.length,
      items_count: items.length,
      first_items: items,
    };
  }

  async previewMobileSentrixProducts(limit = 10, page = 1) {
    const productPage = await this.fetchMobileSentrixProductPage(limit, page);
    const mappedProducts = await this.mapMobileSentrixItems(productPage.items);

    return {
      success: true,
      page: productPage.page,
      limit: productPage.limit,
      total_items: productPage.totalItems,
      total_pages: productPage.totalPages,
      exchange_rate: mappedProducts.exchangeRate,
      exchange_rates: mappedProducts.exchangeRates,
      pricing_formula:
        '((supplier currency price * 1.18 VAT) * official NBG currency/GEL rate + 5 GEL handling) * 1.5 margin',
      items: mappedProducts.items,
    };
  }

  async startMobileSentrixCatalogSync(limit = 100, mode: MobileSentrixSyncMode = 'catalog') {
    const runningJob = await this.mobileSentrixSyncJobsRepository.findOne({
      where: {
        status: In([
          MobileSentrixSyncJobStatus.QUEUED,
          MobileSentrixSyncJobStatus.RUNNING,
        ]),
      },
      order: { created_at: 'DESC' },
    });

    if (runningJob) {
      return {
        success: true,
        already_running: true,
        job: this.formatMobileSentrixSyncJob(runningJob),
      };
    }

    const safeLimit = Math.min(Math.max(Number(limit) || 100, 1), 100);
    const job = this.mobileSentrixSyncJobsRepository.create({
      id: uuidv4(),
      status: MobileSentrixSyncJobStatus.QUEUED,
      mode,
      limit_per_page: safeLimit,
      last_message:
        mode === 'refresh-existing'
          ? 'Queued MobileSentrix stock and price refresh.'
          : 'Queued full MobileSentrix catalog sync.',
    });
    await this.mobileSentrixSyncJobsRepository.save(job);

    setImmediate(() => {
      this.runMobileSentrixCatalogSyncJob(job.id).catch((error) => {
        this.logger.error(`MobileSentrix catalog sync job ${job.id} failed: ${error.message}`);
      });
    });

    return {
      success: true,
      already_running: false,
      job: this.formatMobileSentrixSyncJob(job),
    };
  }

  async startMobileSentrixExistingRefresh(limit = 100) {
    return this.startMobileSentrixCatalogSync(limit, 'refresh-existing');
  }

  async getMobileSentrixSyncJob(jobId: string) {
    const job = await this.mobileSentrixSyncJobsRepository.findOne({ where: { id: jobId } });
    if (!job) {
      throw new NotFoundException('MobileSentrix sync job was not found.');
    }

    return {
      success: true,
      job: this.formatMobileSentrixSyncJob(job),
    };
  }

  async getLatestMobileSentrixSyncJob() {
    const job = await this.mobileSentrixSyncJobsRepository.findOne({
      order: { created_at: 'DESC' },
    });

    return {
      success: true,
      job: job ? this.formatMobileSentrixSyncJob(job) : null,
    };
  }

  private async runMobileSentrixCatalogSyncJob(jobId: string) {
    const job = await this.mobileSentrixSyncJobsRepository.findOne({ where: { id: jobId } });
    if (!job) {
      throw new NotFoundException(`MobileSentrix sync job ${jobId} was not found.`);
    }

    await this.mobileSentrixSyncJobsRepository.update(job.id, {
      status: MobileSentrixSyncJobStatus.RUNNING,
      started_at: new Date(),
      last_message:
        job.mode === 'refresh-existing'
          ? 'Started MobileSentrix stock and price refresh.'
          : 'Started full MobileSentrix catalog sync.',
      error_message: null,
    });

    try {
      const result = await this.syncMobileSentrixProducts(
        job.limit_per_page,
        1,
        undefined,
        {
          importMissing: job.mode !== 'refresh-existing',
          updateExisting: true,
        },
        async (progress) => {
          await this.mobileSentrixSyncJobsRepository.update(job.id, {
            current_page: progress.current_page,
            total_pages: progress.total_pages,
            total_items: progress.total_items,
            scanned: progress.scanned,
            created: progress.created,
            updated: progress.updated,
            skipped: progress.skipped,
            failed: progress.failed,
            last_message: progress.last_message,
          });
        },
      );

      await this.mobileSentrixSyncJobsRepository.update(job.id, {
        status: MobileSentrixSyncJobStatus.COMPLETED,
        current_page: result.current_page || result.total_pages,
        total_pages: result.total_pages,
        total_items: result.total_items,
        scanned: result.scanned,
        created: result.created,
        updated: result.updated,
        skipped: result.skipped,
        failed: result.failed,
        last_message: `Completed. ${result.scanned} scanned, ${result.created} created, ${result.updated} updated, ${result.skipped} skipped, ${result.failed} failed.`,
        finished_at: new Date(),
      });
    } catch (error) {
      await this.mobileSentrixSyncJobsRepository.update(job.id, {
        status: MobileSentrixSyncJobStatus.FAILED,
        error_message: error.message,
        last_message: 'MobileSentrix catalog sync failed.',
        finished_at: new Date(),
      });
      throw error;
    }
  }

  private formatMobileSentrixSyncJob(job: MobileSentrixSyncJob) {
    const totalPages = Number(job.total_pages || 0);
    const currentPage = Number(job.current_page || 0);
    const progress =
      totalPages > 0 ? Math.min(100, Math.round((currentPage / totalPages) * 100)) : 0;

    return {
      id: job.id,
      status: job.status,
      mode: job.mode,
      limit_per_page: job.limit_per_page,
      current_page: job.current_page,
      total_pages: job.total_pages,
      total_items: job.total_items,
      scanned: job.scanned,
      created: job.created,
      updated: job.updated,
      skipped: job.skipped,
      failed: job.failed,
      progress,
      last_message: job.last_message,
      error_message: job.error_message,
      started_at: job.started_at,
      finished_at: job.finished_at,
      created_at: job.created_at,
      updated_at: job.updated_at,
    };
  }

  async syncMobileSentrixProducts(
    limit = 100,
    startPage = 1,
    maxPages?: number,
    options: { importMissing?: boolean; updateExisting?: boolean } = {},
    onProgress?: (progress: MobileSentrixSyncProgress) => Promise<void>,
  ) {
    const importMissing = options.importMissing !== false;
    const updateExisting = options.updateExisting !== false;
    const safeLimit = Math.min(Math.max(Number(limit) || 100, 1), 100);
    let page = Math.max(Number(startPage) || 1, 1);
    let totalPages = 1;
    let scanned = 0;
    let created = 0;
    let updated = 0;
    let skipped = 0;
    let failed = 0;
    let totalItems = 0;
    const synced: Array<{ id: number; title: string; action: 'created' | 'updated' }> = [];

    do {
      let productPage: Awaited<ReturnType<typeof this.fetchMobileSentrixProductPage>>;
      try {
        productPage = await this.fetchMobileSentrixProductPageWithRetry(safeLimit, page);
      } catch (error) {
        failed += safeLimit;
        if (onProgress) {
          await onProgress({
            current_page: page,
            total_pages: totalPages,
            total_items: totalItems,
            scanned,
            created,
            updated,
            skipped,
            failed,
            last_message: `Skipped page ${page} after repeated supplier errors: ${error.message}`,
          });
        }
        page += 1;
        continue;
      }
      totalPages = productPage.totalPages || totalPages;
      totalItems = productPage.totalItems || totalItems;
      scanned += productPage.items.length;
      const supplierIds = productPage.items
        .map((item) => String(item.product_id || item.entity_id || '').trim())
        .filter(Boolean);
      const existingProducts = supplierIds.length
        ? await this.shopProductsRepository.find({
            where: {
              supplier: ShopProductSupplier.MOBILESENTRIX,
              supplier_product_id: In(supplierIds),
            },
          })
        : [];
      const existingBySupplierId = new Map(
        existingProducts.map((product) => [String(product.supplier_product_id), product]),
      );
      const missingItems: MobileSentrixSearchItem[] = [];
      const rateCache = new Map<string, number>();

      for (const item of productPage.items) {
        const supplierProductId = String(item.product_id || item.entity_id || '').trim();
        const existing = existingBySupplierId.get(supplierProductId);
        if (!existing) {
          if (importMissing) {
            missingItems.push(item);
          } else {
            skipped += 1;
          }
          continue;
        }

        if (!updateExisting) {
          skipped += 1;
          continue;
        }

        try {
          const result = await this.updateExistingMobileSentrixProductFromCatalog(
            existing,
            item,
            rateCache,
          );
          if (result.action === 'updated') {
            updated += 1;
          } else {
            skipped += 1;
          }
        } catch (error) {
          failed += 1;
          this.logger.warn(
            `Failed to refresh MobileSentrix product ${supplierProductId}: ${error.message}`,
          );
        }
      }

      if (missingItems.length > 0) {
        const mappedProducts = await this.mapMobileSentrixItems(missingItems);

        for (const mapped of mappedProducts.items) {
          try {
            const result = await this.upsertMobileSentrixProduct(mapped);
            if (result.action === 'created') created += 1;
            if (result.action === 'updated') updated += 1;
            synced.push(result);
          } catch (error) {
            failed += 1;
            this.logger.warn(
              `Failed to sync MobileSentrix product ${mapped.supplier_product_id}: ${error.message}`,
            );
          }
        }
      }

      if (onProgress) {
        await onProgress({
          current_page: page,
          total_pages: totalPages,
          total_items: totalItems,
          scanned,
          created,
          updated,
          skipped,
          failed,
          last_message: `Processed page ${page} of ${totalPages}.`,
        });
      }

      page += 1;
    } while (page <= totalPages && (!maxPages || page < startPage + maxPages));

    return {
      success: true,
      mode: 'catalog',
      current_page: Math.min(page - 1, totalPages),
      scanned,
      created,
      updated,
      skipped,
      failed,
      synced_count: synced.length,
      total_items: totalItems,
      total_pages: totalPages,
      synced: synced.slice(0, 100),
    };
  }

  private async mapMobileSentrixItems(items: MobileSentrixSearchItem[]) {
    const tagMap = await this.fetchMobileSentrixTagsForItems(items);
    const rateCache = new Map<string, number>();

    const mappedProducts: MobileSentrixMappedProduct[] = [];
    for (const sourceItem of items) {
      const item = this.mergeMobileSentrixTags(sourceItem, tagMap);
      const currency = this.getMobileSentrixCurrency(item);
      if (!rateCache.has(currency)) {
        rateCache.set(currency, await this.getGelExchangeRate(currency));
      }
      const mapped = this.mapMobileSentrixProduct(item, rateCache.get(currency)!, currency);
      if (mapped) {
        mappedProducts.push(mapped);
      }
    }

    const exchangeRates = Object.fromEntries(rateCache.entries());

    return {
      exchangeRate: exchangeRates.USD ?? exchangeRates.EUR ?? Object.values(exchangeRates)[0],
      exchange_rates: exchangeRates,
      exchangeRates,
      items: mappedProducts,
    };
  }

  private async upsertMobileSentrixProduct(mapped: MobileSentrixMappedProduct) {
    const existing = await this.shopProductsRepository.findOne({
      where: {
        supplier: ShopProductSupplier.MOBILESENTRIX,
        supplier_product_id: mapped.supplier_product_id,
      },
    });

    const payload = {
      title: mapped.title,
      brand: mapped.brand,
      slug: existing?.slug || (await this.ensureUniqueProductSlug(mapped.slug)),
      device_category: mapped.device_category,
      part_category: mapped.part_category,
      inventory_source: mapped.inventory_source,
      issue_label: mapped.issue_label,
      device_model: mapped.device_model,
      quality_line: mapped.quality_line,
      quality_badge: mapped.quality_badge,
      warranty_line: mapped.warranty_line,
      description: mapped.description,
      image_url: mapped.image_url,
      gallery_images: mapped.gallery_images,
      compatibility_tags: mapped.compatibility_tags,
      search_tags: mapped.search_tags,
      price: mapped.calculated_price_gel.toFixed(2),
      sale_price: null,
      service_price: null,
      stock_quantity: mapped.stock_quantity,
      sort_order: existing?.sort_order ?? (await this.getNextShopProductSortOrder()),
      is_active: mapped.stock_quantity > 0,
      supplier: ShopProductSupplier.MOBILESENTRIX,
      supplier_product_id: mapped.supplier_product_id,
      supplier_sku: mapped.supplier_sku,
      supplier_price_usd: mapped.supplier_price_usd.toFixed(2),
      supplier_currency: mapped.supplier_currency,
      supplier_exchange_rate: mapped.supplier_exchange_rate.toFixed(4),
      supplier_payload: mapped.raw,
      supplier_synced_at: new Date(),
      deleted_at: null,
    };

    if (existing) {
      await this.shopProductsRepository.save({ ...existing, ...payload });
      return { id: existing.id, title: mapped.title, action: 'updated' as const };
    }

    const product = this.shopProductsRepository.create(payload);
    const saved = await this.shopProductsRepository.save(product);
    return { id: saved.id, title: mapped.title, action: 'created' as const };
  }

  private async updateExistingMobileSentrixProductFromCatalog(
    product: ShopProduct,
    item: MobileSentrixSearchItem,
    rateCache: Map<string, number>,
  ) {
    const currency = this.getMobileSentrixCurrency(item);
    if (!rateCache.has(currency)) {
      rateCache.set(currency, await this.getGelExchangeRate(currency));
    }
    const rate = rateCache.get(currency)!;
    const supplierPrice = Number(
      item.customer_price ??
        item.final_price_with_tax ??
        item.final_price_without_tax ??
        item.price ??
        item.list_price ??
        0,
    );
    const stockQuantity = Math.max(
      Number.parseInt(String(item.in_stock_qty ?? item.quantity ?? 0), 10) || 0,
      0,
    );
    const calculatedPrice = Number.isFinite(supplierPrice)
      ? this.calculateMobileSentrixPrice(supplierPrice, rate).toFixed(2)
      : product.price;
    const supplierPriceValue = Number.isFinite(supplierPrice)
      ? supplierPrice.toFixed(2)
      : product.supplier_price_usd;
    const supplierSku = String(item.new_sku || item.sku || item.product_code || '').trim() || null;
    const nextPayload = {
      price: calculatedPrice,
      stock_quantity: stockQuantity,
      is_active: stockQuantity > 0,
      supplier_sku: supplierSku,
      supplier_price_usd: supplierPriceValue,
      supplier_currency: currency,
      supplier_exchange_rate: rate.toFixed(4),
      supplier_payload: item,
      supplier_synced_at: new Date(),
      deleted_at: null,
    };
    const changed =
      product.price !== nextPayload.price ||
      Number(product.stock_quantity || 0) !== nextPayload.stock_quantity ||
      Boolean(product.is_active) !== nextPayload.is_active ||
      product.supplier_sku !== nextPayload.supplier_sku ||
      product.supplier_price_usd !== nextPayload.supplier_price_usd ||
      product.supplier_currency !== nextPayload.supplier_currency ||
      product.supplier_exchange_rate !== nextPayload.supplier_exchange_rate ||
      product.deleted_at !== null;

    if (!changed) {
      return { id: product.id, title: product.title, action: 'skipped' as const };
    }

    await this.shopProductsRepository.update(product.id, nextPayload);
    return { id: product.id, title: product.title, action: 'updated' as const };
  }

  async refreshExistingMobileSentrixProducts() {
    if (this.mobileSentrixAutoSyncRunning) {
      return { success: true, skipped: true, reason: 'already_running' };
    }

    this.mobileSentrixAutoSyncRunning = true;
    try {
      return this.syncMobileSentrixProducts(100, 1, undefined, {
        importMissing: false,
        updateExisting: true,
      });
    } finally {
      this.mobileSentrixAutoSyncRunning = false;
    }
  }

  async refreshSelectedMobileSentrixProducts(productIds: number[]) {
    const ids = Array.from(
      new Set(
        (productIds || [])
          .map((id) => Number(id))
          .filter((id) => Number.isInteger(id) && id > 0),
      ),
    );

    if (ids.length === 0) {
      throw new BadRequestException('At least one product id is required.');
    }

    const products = await this.shopProductsRepository.find({
      where: {
        id: In(ids),
        supplier: ShopProductSupplier.MOBILESENTRIX,
      },
    });

    if (products.length === 0) {
      throw new NotFoundException('No MobileSentrix products were found for refresh.');
    }

    const rateCache = new Map<string, number>();
    const results: Array<{ id: number; title: string; action: 'updated' | 'skipped' | 'failed'; error?: string }> = [];

    for (const product of products) {
      try {
        const supplierProductId = String(product.supplier_product_id || '').trim();
        if (!supplierProductId) {
          results.push({
            id: product.id,
            title: product.title,
            action: 'failed',
            error: 'Missing supplier product id.',
          });
          continue;
        }

        const supplierItem = await this.enrichMobileSentrixSearchItem({
          product_id: supplierProductId,
          entity_id: supplierProductId,
          sku: product.supplier_sku,
          new_sku: product.supplier_sku,
        });
        const result = await this.updateExistingMobileSentrixProductFromCatalog(
          product,
          supplierItem,
          rateCache,
        );
        results.push(result);
      } catch (error) {
        results.push({
          id: product.id,
          title: product.title,
          action: 'failed',
          error: error.message,
        });
      }
    }

    return {
      success: true,
      requested: ids.length,
      matched: products.length,
      updated: results.filter((item) => item.action === 'updated').length,
      skipped: results.filter((item) => item.action === 'skipped').length,
      failed: results.filter((item) => item.action === 'failed').length,
      results,
    };
  }

  async handlePosOrderUpsert(payload: PosOrderUpsertDto) {
    if (payload.event_type !== 'order_upserted') {
      throw new BadRequestException('Unsupported event_type. Only order_upserted is accepted.');
    }

    let eventRecord = await this.posInboundEventsRepository.findOne({
      where: { event_id: payload.event_id },
    });

    if (eventRecord?.processing_status === PosWarrantyInboundEventStatus.PROCESSED) {
      return this.buildResponse(
        eventRecord.action_taken as PosOrderUpsertAction,
        payload.woo_order_id,
        eventRecord.warranty_number || undefined,
      );
    }

    if (!eventRecord) {
      eventRecord = this.posInboundEventsRepository.create({
        event_id: payload.event_id,
        event_type: payload.event_type,
        source: payload.source,
        woo_order_id: payload.woo_order_id,
        analytics_order_id: payload.analytics_order_id ?? null,
        payload: JSON.stringify(payload),
        processing_status: PosWarrantyInboundEventStatus.RECEIVED,
      });
    } else {
      eventRecord.event_type = payload.event_type;
      eventRecord.source = payload.source;
      eventRecord.woo_order_id = payload.woo_order_id;
      eventRecord.analytics_order_id = payload.analytics_order_id ?? null;
      eventRecord.payload = JSON.stringify(payload);
      eventRecord.error_message = null;
      eventRecord.external_response = null;
      eventRecord.action_taken = null;
      eventRecord.warranty_number = null;
      eventRecord.processing_status = PosWarrantyInboundEventStatus.RECEIVED;
      eventRecord.processed_at = null;
    }

    await this.posInboundEventsRepository.save(eventRecord);

    try {
      const result = await this.processPosOrderSnapshot(payload);
      eventRecord.processing_status = PosWarrantyInboundEventStatus.PROCESSED;
      eventRecord.action_taken = result.action;
      eventRecord.warranty_number = result.warrantyNumber || null;
      eventRecord.external_response = JSON.stringify(
        this.buildResponse(result.action, payload.woo_order_id, result.warrantyNumber),
      );
      eventRecord.processed_at = new Date();
      await this.posInboundEventsRepository.save(eventRecord);

      return this.buildResponse(result.action, payload.woo_order_id, result.warrantyNumber);
    } catch (error) {
      eventRecord.processing_status = PosWarrantyInboundEventStatus.FAILED;
      eventRecord.error_message = error.message || 'Unknown processing error';
      eventRecord.processed_at = new Date();
      await this.posInboundEventsRepository.save(eventRecord);
      throw error;
    }
  }

  private async processPosOrderSnapshot(
    payload: PosOrderUpsertDto,
  ): Promise<{ action: PosOrderUpsertAction; warrantyNumber?: string }> {
    const hasPreorder = Boolean(payload.has_preorder);
    const preorderFinished = (payload.preorder_status || '').toLowerCase() === 'finished';
    const eligibleStatus = this.eligibleNonPreorderStatuses.has((payload.order_status || '').toLowerCase());
    const price = this.resolvePrice(payload);

    if (hasPreorder && !preorderFinished) {
      return { action: 'deferred' };
    }

    if (!hasPreorder && !eligibleStatus) {
      return { action: 'ignored' };
    }

    if (price <= this.minimumWarrantyPrice) {
      return { action: 'ignored' };
    }

    const existingWarranty = await this.warrantiesRepository.findOne({
      where: { order_id: payload.woo_order_id },
    });

    const warrantyData = this.mapPayloadToWarranty(payload);

    if (existingWarranty) {
      Object.assign(existingWarranty, warrantyData, {
        purchase_date: new Date(warrantyData.purchase_date),
        warranty_start: new Date(warrantyData.warranty_start),
        warranty_end: new Date(warrantyData.warranty_end),
      });
      const saved = await this.warrantiesRepository.save(existingWarranty);
      this.logger.log(
        `Updated warranty ${saved.warranty_id} from POS order ${payload.woo_order_id}`,
      );
      return { action: 'updated', warrantyNumber: saved.warranty_id };
    }

    const warrantyId = await this.warrantiesService.generateWarrantyId(CreatedSource.AUTO_WOO);
    const warranty = this.warrantiesRepository.create({
      ...warrantyData,
      warranty_id: warrantyId,
      purchase_date: new Date(warrantyData.purchase_date),
      warranty_start: new Date(warrantyData.warranty_start),
      warranty_end: new Date(warrantyData.warranty_end),
    });
    const saved = await this.warrantiesRepository.save(warranty);
    this.logger.log(
      `Created warranty ${saved.warranty_id} from POS order ${payload.woo_order_id}`,
    );
    try {
      await this.smsService.notifyWarrantyCreated(saved);
    } catch (error) {
      this.logger.error(`Failed to send warranty created SMS for ${saved.warranty_id}:`, error.message);
    }
    return { action: 'created', warrantyNumber: saved.warranty_id };
  }

  private async getMobileSentrixBaseConfig(): Promise<{
    baseUrl: string;
    consumerName: string;
    consumerKey: string;
    consumerSecret: string;
  }> {
    const apiKeys = await this.settingsService.getApiKeys();
    const baseUrl = (apiKeys.mobilesentrix_api_url || 'https://preprod.mobilesentrix.eu')
      .trim()
      .replace(/\/+$/, '');
    const consumerName = (apiKeys.mobilesentrix_consumer_name || '').trim();
    const consumerKey = (apiKeys.mobilesentrix_consumer_key || '').trim();
    const consumerSecret = (apiKeys.mobilesentrix_consumer_secret || '').trim();

    if (!consumerName || !consumerKey || !consumerSecret) {
      throw new ServiceUnavailableException(
        'MobileSentrix consumer credentials are not configured.',
      );
    }

    return { baseUrl, consumerName, consumerKey, consumerSecret };
  }

  private async getMobileSentrixCredentials(): Promise<MobileSentrixCredentials> {
    const apiKeys = await this.settingsService.getApiKeys();
    const baseConfig = await this.getMobileSentrixBaseConfig();
    const accessToken = (apiKeys.mobilesentrix_access_token || '').trim();
    const accessTokenSecret = (apiKeys.mobilesentrix_access_token_secret || '').trim();

    if (!accessToken || !accessTokenSecret) {
      throw new NotFoundException(
        'MobileSentrix is not connected yet. Complete OAuth first.',
      );
    }

    return {
      ...baseConfig,
      accessToken,
      accessTokenSecret,
    };
  }

  private async exchangeMobileSentrixAccessToken(input: {
    baseUrl: string;
    consumerName: string;
    consumerKey: string;
    consumerSecret: string;
    oauthToken: string;
    oauthVerifier: string;
  }): Promise<{ accessToken: string; accessTokenSecret: string }> {
    const response = await axios.post(
      `${input.baseUrl}/oauth/authorize/identifiercallback`,
      {
        consumer_key: input.consumerKey,
        consumer_secret: input.consumerSecret,
        oauth_token: input.oauthToken,
        oauth_verifier: input.oauthVerifier,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        validateStatus: (status) => status >= 200 && status < 500,
      },
    );

    if (response.status >= 400 || response.data?.status !== 1) {
      throw new ServiceUnavailableException(
        response.data?.message || 'MobileSentrix access token exchange failed.',
      );
    }

    const accessToken = response.data?.data?.access_token;
    const accessTokenSecret = response.data?.data?.access_token_secret;

    if (!accessToken || !accessTokenSecret) {
      throw new ServiceUnavailableException(
        'MobileSentrix did not return access token credentials.',
      );
    }

    return { accessToken, accessTokenSecret };
  }

  private buildMobileSentrixOAuthHeader(credentials: MobileSentrixCredentials): string {
    const nonce = Math.random().toString(36).slice(2, 14);
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const signature = `${credentials.consumerSecret}&${credentials.accessTokenSecret}`;
    const values = {
      oauth_consumer_key: credentials.consumerKey,
      oauth_token: credentials.accessToken,
      oauth_signature_method: 'PLAINTEXT',
      oauth_signature: signature,
      oauth_timestamp: timestamp,
      oauth_nonce: nonce,
      oauth_version: '1.0',
    };

    return `OAuth ${Object.entries(values)
      .map(([key, value]) => `${key}="${encodeURIComponent(value)}"`)
      .join(', ')}`;
  }

  private formatMobileSentrixProviderResponse(data: unknown): string {
    if (!data) {
      return 'empty response';
    }

    if (typeof data === 'string') {
      return data.slice(0, 500);
    }

    try {
      return JSON.stringify(data).slice(0, 1000);
    } catch {
      return 'unserializable response';
    }
  }

  private async searchMobileSentrixProducts(query: string, maxResults: number, startIndex: number) {
    const config = await this.getMobileSentrixCredentials();
    const safeMaxResults = Math.min(Math.max(Number(maxResults) || 10, 1), 100);
    const safeStartIndex = Math.max(Number(startIndex) || 0, 0);
    const response = await axios.get(`${config.baseUrl}/api/rest/searchproduct`, {
      params: {
        q: query,
        max_results: safeMaxResults,
        start_index: safeStartIndex,
      },
      headers: {
        Authorization: this.buildMobileSentrixOAuthHeader(config),
        Accept: 'application/json',
      },
      validateStatus: (status) => status >= 200 && status < 500,
    });

    if (response.status >= 400) {
      this.logger.warn(
        `MobileSentrix product search failed with status ${response.status}: ${this.formatMobileSentrixProviderResponse(response.data)}`,
      );
      throw new BadGatewayException({
        message: response.data?.message || 'MobileSentrix product search request failed',
        provider: 'mobilesentrix',
        provider_status: response.status,
        provider_response: response.data,
      });
    }

    const data = response.data?.data || {};
    const items = Array.isArray(data.items) ? data.items : [];

    return {
      totalItems: Number(data.total_items || items.length || 0),
      items,
    };
  }

  private async fetchMobileSentrixProductPage(limit: number, page: number) {
    const config = await this.getMobileSentrixCredentials();
    const safeLimit = Math.min(Math.max(Number(limit) || 100, 1), 100);
    const safePage = Math.max(Number(page) || 1, 1);
    const response = await axios.get(`${config.baseUrl}/api/rest/products`, {
      params: {
        limit: safeLimit,
        page: safePage,
        pageinfo: 1,
        load: 'image_gallery,related_product',
      },
      headers: {
        Authorization: this.buildMobileSentrixOAuthHeader(config),
        Accept: 'application/json',
      },
      validateStatus: (status) => status >= 200 && status < 500,
    });

    if (response.status >= 400) {
      this.logger.warn(
        `MobileSentrix catalog page ${safePage} failed with status ${response.status}: ${this.formatMobileSentrixProviderResponse(response.data)}`,
      );
      throw new BadGatewayException({
        message: response.data?.message || 'MobileSentrix products catalog request failed',
        provider: 'mobilesentrix',
        provider_status: response.status,
        provider_response: response.data,
      });
    }

    const data = response.data || {};
    const pageInfo = data.page_info || {};
    const items = Object.entries(data)
      .filter(([key]) => key !== 'page_info')
      .map(([, value]) => value)
      .filter((value) => value && typeof value === 'object') as MobileSentrixSearchItem[];

    return {
      page: Number(pageInfo.current_page_number || safePage),
      limit: Number(pageInfo.current_page_size || safeLimit),
      totalItems: Number(pageInfo.total_records || items.length || 0),
      totalPages: Number(pageInfo.total_pages || 1),
      items,
    };
  }

  private async fetchMobileSentrixProductPageWithRetry(limit: number, page: number, attempts = 3) {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= attempts; attempt += 1) {
      try {
        return await this.fetchMobileSentrixProductPage(limit, page);
      } catch (error) {
        lastError = error;
        if (attempt < attempts) {
          await new Promise((resolve) => setTimeout(resolve, attempt * 1200));
        }
      }
    }

    throw lastError || new Error(`MobileSentrix page ${page} request failed.`);
  }

  private async enrichMobileSentrixSearchItem(item: MobileSentrixSearchItem) {
    const productId = String(item.product_id || item.entity_id || '').trim();
    if (!productId) {
      return item;
    }

    const config = await this.getMobileSentrixCredentials();
    const response = await axios.get(`${config.baseUrl}/api/rest/products/${productId}`, {
      params: {
        load: 'image_gallery,related_product',
      },
      headers: {
        Authorization: this.buildMobileSentrixOAuthHeader(config),
        Accept: 'application/json',
      },
      validateStatus: (status) => status >= 200 && status < 500,
    });

    if (response.status >= 400 || !response.data || Array.isArray(response.data)) {
      this.logger.warn(
        `MobileSentrix product detail failed for ${productId} with status ${response.status}: ${this.formatMobileSentrixProviderResponse(response.data)}`,
      );
      return item;
    }

    return {
      ...item,
      ...response.data,
      product_id: productId,
      search_payload: item,
    };
  }

  private async fetchMobileSentrixTagsForItems(items: MobileSentrixSearchItem[]) {
    const skus = Array.from(
      new Set(
        items
          .map((item) => String(item.new_sku || item.sku || item.product_code || '').trim())
          .filter(Boolean),
      ),
    );

    if (skus.length === 0) {
      return new Map<string, any>();
    }

    const config = await this.getMobileSentrixCredentials();
    const params = new URLSearchParams();
    params.append('filter[1][attribute]', 'sku');
    skus.slice(0, 100).forEach((sku, index) => {
      params.append(`filter[1][in][${index}]`, sku);
    });

    const response = await axios.get(`${config.baseUrl}/api/rest/tags?${params.toString()}`, {
      headers: {
        Authorization: this.buildMobileSentrixOAuthHeader(config),
        Accept: 'application/json',
      },
      validateStatus: (status) => status >= 200 && status < 500,
    });

    if (response.status >= 400 || !response.data) {
      this.logger.warn(
        `MobileSentrix tags request failed with status ${response.status}: ${this.formatMobileSentrixProviderResponse(response.data)}`,
      );
      return new Map<string, any>();
    }

    const map = new Map<string, any>();
    Object.values(response.data).forEach((entry: any) => {
      const sku = String(entry?.new_sku || entry?.sku || '').trim();
      if (sku) {
        map.set(sku, entry);
      }
    });

    return map;
  }

  private mergeMobileSentrixTags(
    item: MobileSentrixSearchItem,
    tagMap: Map<string, any>,
  ): MobileSentrixSearchItem {
    const sku = String(item.new_sku || item.sku || item.product_code || '').trim();
    const tagPayload = sku ? tagMap.get(sku) : null;
    return tagPayload ? { ...item, tags_payload: tagPayload } : item;
  }

  private async getGelExchangeRate(currencyCode: string) {
    const normalizedCurrency = currencyCode.toUpperCase();
    if (normalizedCurrency === 'GEL') {
      return 1;
    }

    const today = this.formatTbilisiDate(new Date());
    const response = await axios.get(
      `https://nbg.gov.ge/gw/api/ct/monetarypolicy/currencies/ka/json/`,
      {
        params: { date: today },
        timeout: 10000,
      },
    );
    const entries = Array.isArray(response.data) ? response.data : [];
    const currencies = Array.isArray(entries[0]?.currencies) ? entries[0].currencies : [];
    const currency = currencies.find((item: any) => item?.code === normalizedCurrency);

    if (!currency?.rate || !currency?.quantity) {
      throw new BadGatewayException(`NBG ${normalizedCurrency} exchange rate is unavailable.`);
    }

    return Number(currency.rate) / Number(currency.quantity);
  }

  private getMobileSentrixCurrency(item: MobileSentrixSearchItem) {
    return String(item.display_currency || item.currency || 'EUR').trim().toUpperCase() || 'EUR';
  }

  private mapMobileSentrixProduct(
    item: MobileSentrixSearchItem,
    currencyGelRate: number,
    currency: string,
  ): MobileSentrixMappedProduct | null {
    const supplierProductId = String(item.product_id || item.entity_id || '').trim();
    const rawTitle = String(item.name || item.title || '').trim();
    const title = rawTitle.slice(0, 255);
    const supplierPrice = Number(
      item.customer_price ??
        item.final_price_with_tax ??
        item.final_price_without_tax ??
        item.price ??
        item.list_price ??
        0,
    );

    if (!supplierProductId || !rawTitle || !Number.isFinite(supplierPrice)) {
      return null;
    }

    const stockQuantity = Math.max(
      Number.parseInt(String(item.in_stock_qty ?? item.quantity ?? 0), 10) || 0,
      0,
    );
    const description =
      this.stripHtml(String(item.description || item.short_description || '')).slice(0, 1000) ||
      null;
    const tags = this.normalizeMobileSentrixTags(item.tags);
    const tagPayload = item.tags_payload || {};
    const searchTags = Array.from(
      new Set([...tags, ...this.normalizeMobileSentrixTags(tagPayload.tag)]),
    );
    const compatibilityTags = this.normalizeMobileSentrixTags(tagPayload.compatibility);
    const manufacturer = this.normalizeTextValue(item.manufacturer_text);
    const model = this.normalizeTextValue(item.model_text || item.device_model_text);
    const productType = this.normalizeTextValue(item.front_position_text);
    const qualityBrand = this.normalizeTextValue(item.brand_text || item.product_badges_text);
    const qualityBadge = this.normalizeTextValue(item.product_badges_text);
    const galleryImages = this.normalizeMobileSentrixGallery(item);
    const searchable = [
      title,
      description,
      searchTags.join(' '),
      manufacturer,
      model,
      productType,
      qualityBrand,
      item.hst_description,
      `attribute_set_${item.attribute_set || ''}`,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    const finalPrice = this.calculateMobileSentrixPrice(supplierPrice, currencyGelRate);

    return {
      supplier: ShopProductSupplier.MOBILESENTRIX,
      supplier_product_id: supplierProductId,
      supplier_sku: String(item.new_sku || item.sku || item.product_code || '').trim() || null,
      title,
      slug: this.slugify(`mobilesentrix-${supplierProductId}-${rawTitle}`),
      brand: manufacturer || this.inferMobileSentrixBrand(searchable),
      device_category: this.inferMobileSentrixDeviceCategory(searchable),
      part_category: this.inferMobileSentrixPartCategory(searchable),
      inventory_source: this.inferMobileSentrixInventorySource(searchable),
      issue_label: this.truncateText([model, productType, qualityBrand].filter(Boolean).join(' • '), 255),
      device_model: this.truncateText(model, 255),
      quality_line: this.truncateText(qualityBrand, 255),
      quality_badge: this.truncateText(qualityBadge, 255),
      warranty_line: '1 year warranty',
      description,
      image_url: String(item.image_url || item.default_image || item.image_link || '').trim().slice(0, 500) || null,
      gallery_images: galleryImages,
      compatibility_tags: compatibilityTags,
      search_tags: searchTags,
      source_url: String(item.url || item.link || '').trim() || null,
      stock_quantity: stockQuantity,
      supplier_price_usd: Number(supplierPrice.toFixed(2)),
      supplier_currency: currency,
      supplier_exchange_rate: Number(currencyGelRate.toFixed(4)),
      calculated_price_gel: finalPrice,
      calculation: {
        vat_rate: this.mobileSentrixVatRate,
        handling_fee_gel: this.mobileSentrixHandlingFeeGel,
        margin_rate: this.mobileSentrixMarginRate,
        formula:
          `((supplier_price_${currency.toLowerCase()} * 1.18 VAT) * ${currency}_GEL + 5 GEL handling) * 1.5 margin`,
      },
      raw: item,
    };
  }

  private calculateMobileSentrixPrice(supplierPrice: number, currencyGelRate: number) {
    const withVat = supplierPrice * (1 + this.mobileSentrixVatRate);
    const landedGel = withVat * currencyGelRate + this.mobileSentrixHandlingFeeGel;
    const withMarginGel = landedGel * (1 + this.mobileSentrixMarginRate);
    return Number(withMarginGel.toFixed(2));
  }

  private truncateText(value: string | null, maxLength: number) {
    const normalized = String(value || '').trim();
    return normalized ? normalized.slice(0, maxLength) : null;
  }

  private inferMobileSentrixDeviceCategory(value: string): ShopDeviceCategory {
    if (/(attribute_set.*12|macbook|laptop|notebook|dell|hp |lenovo|thinkpad|asus|acer|surface)/i.test(value)) {
      return ShopDeviceCategory.LAPTOPS;
    }
    if (/(attribute_set.*17|attribute_set.*20|tool|tools|case|cable|charger|adapter|adhesive|protector)/i.test(value)) {
      return ShopDeviceCategory.ACCESSORIES;
    }
    return ShopDeviceCategory.SMARTPHONES;
  }

  private inferMobileSentrixPartCategory(value: string): ShopPartCategory {
    if (/(battery|cell)/i.test(value)) return ShopPartCategory.BATTERY;
    if (/(screen|display|lcd|oled|glass|digitizer)/i.test(value)) return ShopPartCategory.SCREEN;
    if (/(camera|lens)/i.test(value)) return ShopPartCategory.CAMERA;
    if (/(speaker|earpiece|audio|buzzer)/i.test(value)) return ShopPartCategory.SPEAKER;
    if (/(charging|charge|dock|port|connector)/i.test(value)) return ShopPartCategory.CHARGING;
    if (/(sensor|proximity|fingerprint|face id|faceid)/i.test(value)) return ShopPartCategory.SENSOR;
    if (/(board|logic|motherboard|ic |chip)/i.test(value)) return ShopPartCategory.BOARD;
    return ShopPartCategory.ACCESSORY;
  }

  private inferMobileSentrixInventorySource(value: string): ShopInventorySource {
    if (/(oem|original|genuine|service pack|premium|refurbished)/i.test(value)) {
      return ShopInventorySource.OEM;
    }
    return ShopInventorySource.THIRD_PARTY;
  }

  private inferMobileSentrixBrand(value: string) {
    const brands = [
      'apple',
      'samsung',
      'google',
      'xiaomi',
      'huawei',
      'oneplus',
      'motorola',
      'lg',
      'sony',
      'nokia',
      'dell',
      'hp',
      'lenovo',
      'asus',
      'acer',
    ];
    const brand = brands.find((candidate) => value.includes(candidate));
    return brand ? brand.charAt(0).toUpperCase() + brand.slice(1) : null;
  }

  private normalizeMobileSentrixTags(value: unknown) {
    if (Array.isArray(value)) {
      return value.map((tag) => String(tag).trim()).filter(Boolean);
    }

    return String(value || '')
      .split('[:ATTR:]')
      .map((tag) => tag.trim())
      .filter(Boolean);
  }

  private normalizeTextValue(value: unknown) {
    if (Array.isArray(value)) {
      return value.map((item) => String(item).trim()).filter(Boolean).join(', ');
    }

    if (value === false || value === null || value === undefined) {
      return null;
    }

    return String(value).trim() || null;
  }

  private normalizeMobileSentrixGallery(item: MobileSentrixSearchItem) {
    const values = [
      ...(Array.isArray(item.image_gallery) ? item.image_gallery : []),
      item.image_url,
      item.default_image,
      item.image_link,
    ];

    return Array.from(
      new Set(
        values
          .map((value) => String(value || '').trim())
          .filter((value) => /^https?:\/\//i.test(value))
          .map((value) => value.slice(0, 500)),
      ),
    );
  }

  private async ensureUniqueProductSlug(value: string, excludeId?: number) {
    const normalized = this.slugify(value);
    let candidate = normalized;
    let suffix = 1;

    while (true) {
      const existing = await this.shopProductsRepository.findOne({
        where: { slug: candidate },
      });

      if (!existing || existing.id === excludeId) {
        return candidate;
      }

      suffix += 1;
      candidate = `${normalized}-${suffix}`;
    }
  }

  private async getNextShopProductSortOrder() {
    const result = await this.shopProductsRepository
      .createQueryBuilder('product')
      .select('MAX(product.sort_order)', 'maxSortOrder')
      .getRawOne<{ maxSortOrder: string | null }>();

    const currentMax = Number(result?.maxSortOrder ?? 0);
    return Number.isFinite(currentMax) ? currentMax + 10 : 10;
  }

  private formatTbilisiDate(date: Date) {
    const tbilisiTime = new Date(date.getTime() + 4 * 60 * 60 * 1000);
    return tbilisiTime.toISOString().slice(0, 10);
  }

  private slugify(value: string) {
    return (
      value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 120) || 'product'
    );
  }

  private stripHtml(value: string) {
    return value.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  }

  getMobileSentrixCallbackUrl(): string {
    return `${this.getPortalBaseUrl()}${this.mobileSentrixCallbackPath}`;
  }

  getMobileSentrixWebhookUrl(): string {
    return `${this.getPortalBaseUrl()}${this.mobileSentrixWebhookPath}`;
  }

  private getPortalBaseUrl(): string {
    return (this.configService.get<string>('PORTAL_URL') || 'https://zezva.ge').replace(/\/+$/, '');
  }

  private mapPayloadToWarranty(payload: PosOrderUpsertDto) {
    const purchaseDate = this.resolvePurchaseDate(payload);
    const warrantyEnd = new Date(purchaseDate);
    warrantyEnd.setFullYear(warrantyEnd.getFullYear() + this.warrantyYears);

    const [firstName, ...restNames] = (payload.customer.name || '').trim().split(/\s+/);
    const lastName = restNames.join(' ').trim() || '-';
    const fallbackSku = `POS-${payload.woo_order_id}`;
    const serialNumber =
      payload.item.serial?.trim() ||
      payload.item.imei?.trim() ||
      payload.item.sku?.trim() ||
      `POS-ORDER-${payload.woo_order_id}`;

    return {
      order_id: payload.woo_order_id,
      product_id: payload.analytics_order_id ?? null,
      order_line_index: 0,
      sku: payload.item.sku?.trim() || fallbackSku,
      imei: payload.item.imei?.trim() || null,
      serial_number: serialNumber,
      device_type: this.detectDeviceType(payload.item.product_name, payload.item.category, payload.item.sku),
      title: payload.item.product_name.trim(),
      thumbnail_url: null,
      price: this.resolvePrice(payload),
      brand: payload.item.brand?.trim() || null,
      model: null,
      condition: payload.item.condition?.trim() || null,
      personal_identification_number: payload.customer.personal_number?.trim() || null,
      admin_notes: this.buildAdminNotes(payload),
      customer_name: firstName || payload.customer.name.trim(),
      customer_last_name: lastName,
      customer_phone: payload.customer.phone.trim(),
      customer_email: payload.customer.email?.trim() || null,
      purchase_date: purchaseDate.toISOString(),
      warranty_start: purchaseDate.toISOString(),
      warranty_end: warrantyEnd.toISOString(),
      created_source: CreatedSource.AUTO_WOO,
      extended_days: 0,
    };
  }

  private resolvePurchaseDate(payload: PosOrderUpsertDto): Date {
    const sourceDate = payload.ordered_at || payload.event_time;
    const parsed = new Date(sourceDate);
    if (Number.isNaN(parsed.getTime())) {
      throw new BadRequestException('ordered_at/event_time is invalid');
    }
    return parsed;
  }

  private resolvePrice(payload: PosOrderUpsertDto): number {
    const candidates = [
      payload.item.sold_price,
      payload.totals?.paid_amount,
      payload.totals?.total_paid,
    ];

    for (const value of candidates) {
      if (typeof value === 'number' && Number.isFinite(value)) {
        return value;
      }
    }

    return 0;
  }

  private detectDeviceType(productName?: string, category?: string, sku?: string): string {
    const haystack = `${productName || ''} ${category || ''} ${sku || ''}`.toLowerCase();
    if (haystack.includes('phone') || haystack.includes('iphone') || haystack.includes('smart')) {
      return 'Phone';
    }
    if (haystack.includes('tablet') || haystack.includes('ipad')) {
      return 'Tablet';
    }
    if (haystack.includes('desktop') || haystack.includes('pc')) {
      return 'Desktop';
    }
    if (haystack.includes('watch')) {
      return 'Watch';
    }
    return 'Laptop';
  }

  private buildAdminNotes(payload: PosOrderUpsertDto): string {
    const parts = [
      `Source: ${payload.source}`,
      payload.order_number ? `Order number: ${payload.order_number}` : null,
      payload.analytics_order_id ? `Analytics order ID: ${payload.analytics_order_id}` : null,
      payload.payment_type ? `Payment type: ${payload.payment_type}` : null,
      `Warranty rule: > ${this.minimumWarrantyPrice} GEL, ${this.warrantyYears} years`,
      payload.staff?.cashier ? `Cashier: ${payload.staff.cashier}` : null,
      payload.staff?.salesperson ? `Salesperson: ${payload.staff.salesperson}` : null,
      payload.store?.name ? `Store: ${payload.store.name}` : null,
      payload.preorder_status ? `Preorder status: ${payload.preorder_status}` : null,
      payload.order_status ? `Order status: ${payload.order_status}` : null,
    ].filter(Boolean);

    return parts.join('\n');
  }

  private buildResponse(
    action: PosOrderUpsertAction,
    wooOrderId: number,
    warrantyNumber?: string,
  ) {
    return {
      success: true,
      received: true,
      action,
      external_reference: String(wooOrderId),
      warranty_number: warrantyNumber || null,
    };
  }
}
