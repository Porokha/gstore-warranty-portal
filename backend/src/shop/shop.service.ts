import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import axios from 'axios';
import * as csvParser from 'csv-parser';
import * as fs from 'fs';
import { mkdir, readFile, unlink, writeFile } from 'fs/promises';
import * as path from 'path';
import { LessThan, Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { CreateShopProductDto } from './dto/create-shop-product.dto';
import { PublicShopProductsDto } from './dto/public-shop-products.dto';
import { UpdateShopOrderDto } from './dto/update-shop-order.dto';
import { UpdateShopProductDto } from './dto/update-shop-product.dto';
import {
  ShopDeviceCategory,
  ShopInventorySource,
  ShopPartCategory,
  ShopProduct,
} from './entities/shop-product.entity';
import { ShopOrder } from './entities/shop-order.entity';

type ShopScope = 'active' | 'trash';

@Injectable()
export class ShopService {
  private readonly uploadsDir = path.join(process.cwd(), 'uploads', 'shop', 'products');
  private readonly trashRetentionDays = 30;

  constructor(
    @InjectRepository(ShopProduct)
    private readonly shopProductsRepository: Repository<ShopProduct>,
    @InjectRepository(ShopOrder)
    private readonly shopOrdersRepository: Repository<ShopOrder>,
  ) {}

  async listPublicProducts(filters: PublicShopProductsDto) {
    await this.purgeExpiredTrash();

    const qb = this.shopProductsRepository.createQueryBuilder('product');

    qb.where('product.is_active = true');
    qb.andWhere('product.deleted_at IS NULL');

    if (filters.device) {
      qb.andWhere('product.device_category = :device', { device: filters.device });
    }

    if (filters.brand) {
      qb.andWhere('LOWER(COALESCE(product.brand, "")) = :brand', {
        brand: filters.brand.toLowerCase(),
      });
    }

    if (filters.part) {
      qb.andWhere('product.part_category = :part', { part: filters.part });
    }

    if (filters.source) {
      qb.andWhere('product.inventory_source = :source', { source: filters.source });
    }

    if (filters.search) {
      qb.andWhere(
        '(LOWER(product.title) LIKE :search OR LOWER(COALESCE(product.brand, "")) LIKE :search OR LOWER(COALESCE(product.issue_label, "")) LIKE :search OR LOWER(COALESCE(product.description, "")) LIKE :search)',
        { search: `%${filters.search.toLowerCase()}%` },
      );
    }

    qb.orderBy('product.sort_order', 'ASC').addOrderBy('product.id', 'ASC');

    const products = await qb.getMany();

    return products.map((product) => this.serializeProduct(product));
  }

  async listAdminProducts(scope: ShopScope = 'active') {
    await this.purgeExpiredTrash();

    const qb = this.shopProductsRepository.createQueryBuilder('product');
    this.applyScope(qb, 'product', scope);
    qb.orderBy('product.sort_order', 'ASC').addOrderBy('product.id', 'ASC');

    const products = await qb.getMany();
    return products.map((product) => this.serializeProduct(product, true));
  }

  async createProduct(createDto: CreateShopProductDto) {
    const imageUrl = await this.prepareImageUrl(createDto.image_url);
    const product = this.shopProductsRepository.create({
      ...createDto,
      image_url: imageUrl,
      brand: createDto.brand?.trim() || null,
      slug: await this.ensureUniqueSlug(createDto.slug || createDto.title),
      price: this.toNullableMoney(createDto.price),
      sale_price: this.toNullableMoney(createDto.sale_price),
      service_price: this.toNullableMoney(createDto.service_price),
      stock_quantity: createDto.stock_quantity ?? 0,
      sort_order: createDto.sort_order ?? 0,
      is_active: createDto.is_active ?? true,
      deleted_at: null,
    });

    const created = await this.shopProductsRepository.save(product);
    return this.serializeProduct(created, true);
  }

  async updateProduct(id: number, updateDto: UpdateShopProductDto) {
    const product = await this.shopProductsRepository.findOne({ where: { id } });
    if (!product) {
      throw new NotFoundException(`Shop product with ID ${id} not found`);
    }

    if (updateDto.slug !== undefined || updateDto.title !== undefined) {
      const candidateSlug = updateDto.slug || updateDto.title || product.slug;
      product.slug = await this.ensureUniqueSlug(candidateSlug, id);
    }

    if (updateDto.title !== undefined) product.title = updateDto.title;
    if (updateDto.brand !== undefined) product.brand = updateDto.brand?.trim() || null;
    if (updateDto.device_category !== undefined) product.device_category = updateDto.device_category;
    if (updateDto.part_category !== undefined) product.part_category = updateDto.part_category;
    if (updateDto.inventory_source !== undefined) {
      product.inventory_source = updateDto.inventory_source;
    }
    if (updateDto.issue_label !== undefined) product.issue_label = updateDto.issue_label;
    if (updateDto.description !== undefined) product.description = updateDto.description;
    if (updateDto.image_url !== undefined) {
      product.image_url = await this.prepareImageUrl(updateDto.image_url);
    }
    if (updateDto.price !== undefined) product.price = this.toNullableMoney(updateDto.price);
    if (updateDto.sale_price !== undefined) product.sale_price = this.toNullableMoney(updateDto.sale_price);
    if (updateDto.service_price !== undefined) {
      product.service_price = this.toNullableMoney(updateDto.service_price);
    }
    if (updateDto.stock_quantity !== undefined) product.stock_quantity = updateDto.stock_quantity;
    if (updateDto.sort_order !== undefined) product.sort_order = updateDto.sort_order;
    if (updateDto.is_active !== undefined) product.is_active = updateDto.is_active;

    const updated = await this.shopProductsRepository.save(product);
    return this.serializeProduct(updated, true);
  }

  async softDeleteProduct(id: number) {
    const product = await this.shopProductsRepository.findOne({ where: { id } });
    if (!product) {
      throw new NotFoundException(`Shop product with ID ${id} not found`);
    }

    if (!product.deleted_at) {
      product.deleted_at = new Date();
      await this.shopProductsRepository.save(product);
    }

    return this.serializeProduct(product, true);
  }

  async restoreProduct(id: number) {
    const product = await this.shopProductsRepository.findOne({ where: { id } });
    if (!product) {
      throw new NotFoundException(`Shop product with ID ${id} not found`);
    }

    product.deleted_at = null;
    const restored = await this.shopProductsRepository.save(product);
    return this.serializeProduct(restored, true);
  }

  async permanentlyDeleteProduct(id: number) {
    const product = await this.shopProductsRepository.findOne({ where: { id } });
    if (!product) {
      throw new NotFoundException(`Shop product with ID ${id} not found`);
    }

    await this.shopProductsRepository.remove(product);
    return { success: true };
  }

  async importProductsFromCsv(filePath: string) {
    await this.ensureUploadsDir();

    const rows = await this.readCsvRows(filePath);
    const errors: Array<{ row: number; message: string }> = [];
    let created = 0;
    let updated = 0;
    let nextAutoSortOrder = await this.getNextSortOrder();

    for (let index = 0; index < rows.length; index += 1) {
      const row = rows[index];
      const rowNumber = index + 2;

      try {
        const parsed = this.parseProductCsvRow(row);
        const canonicalSlug = this.slugify(parsed.slug || parsed.title);
        const existing = await this.shopProductsRepository.findOne({
          where: { slug: canonicalSlug },
        });
        const imageUrl = await this.prepareImageUrl(parsed.image_url);

        if (existing) {
          existing.title = parsed.title;
          existing.brand = parsed.brand?.trim() || null;
          existing.slug = canonicalSlug;
          existing.device_category = parsed.device_category;
          existing.part_category = parsed.part_category;
          existing.inventory_source = parsed.inventory_source;
          existing.issue_label = parsed.issue_label;
          existing.description = parsed.description;
          existing.image_url = imageUrl;
          existing.price = this.toNullableMoney(parsed.price);
          existing.sale_price = this.toNullableMoney(parsed.sale_price);
          existing.service_price = this.toNullableMoney(parsed.service_price);
          existing.stock_quantity = parsed.stock_quantity ?? 0;
          existing.sort_order = parsed.sort_order ?? existing.sort_order;
          existing.is_active = parsed.is_active ?? true;
          existing.deleted_at = null;
          await this.shopProductsRepository.save(existing);
          updated += 1;
          continue;
        }

        const product = this.shopProductsRepository.create({
          ...parsed,
          image_url: imageUrl,
          slug: await this.ensureUniqueSlug(parsed.slug || parsed.title),
          price: this.toNullableMoney(parsed.price),
          sale_price: this.toNullableMoney(parsed.sale_price),
          service_price: this.toNullableMoney(parsed.service_price),
          stock_quantity: parsed.stock_quantity ?? 0,
          sort_order: parsed.sort_order ?? nextAutoSortOrder,
          is_active: parsed.is_active ?? true,
          deleted_at: null,
        });
        await this.shopProductsRepository.save(product);
        if (parsed.sort_order == null) {
          nextAutoSortOrder += 10;
        }
        created += 1;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown import error';
        errors.push({ row: rowNumber, message });
      }
    }

    await unlink(filePath).catch(() => undefined);

    return {
      success: true,
      total: rows.length,
      created,
      updated,
      errors,
    };
  }

  generateProductsTemplateCsv() {
    const header = [
      'title',
      'brand',
      'slug',
      'device_category',
      'part_category',
      'inventory_source',
      'issue_label',
      'description',
      'image_url',
      'price',
      'sale_price',
      'service_price',
      'stock_quantity',
      'sort_order',
      'is_active',
    ];

    const rows = [
      [
        'iPhone 15 OLED Display',
        'Apple',
        'iphone-15-oled-display',
        'smartphones',
        'screen',
        'oem',
        'Cracked front glass',
        'Premium replacement display assembly for iPhone 15.',
        'https://example.com/iphone15-display.jpg',
        '699',
        '649',
        '759',
        '12',
        '10',
        'true',
      ],
      [
        'MacBook Air M2 Battery Pack',
        'Apple',
        'macbook-air-m2-battery-pack',
        'laptops',
        'battery',
        'third-party',
        'Battery health degraded',
        'Replacement battery pack for MacBook Air M2 service jobs.',
        '',
        '299',
        '',
        '349',
        '5',
        '20',
        'true',
      ],
      [
        'iPhone 15 Back Glass Service Bundle',
        'Apple',
        'iphone-15-back-glass-service-bundle',
        'smartphones',
        'screen',
        'third-party',
        'Back glass damage',
        'Available only when booked with service installation.',
        '',
        '',
        '',
        '189',
        '4',
        '30',
        'true',
      ],
    ];

    return [header, ...rows]
      .map((row) =>
        row
          .map((value) => `"${String(value ?? '').replace(/"/g, '""')}"`)
          .join(','),
      )
      .join('\n');
  }

  async listOrders(scope: ShopScope = 'active') {
    await this.purgeExpiredTrash();

    const qb = this.shopOrdersRepository.createQueryBuilder('order');
    this.applyScope(qb, 'order', scope);
    qb.orderBy('order.created_at', 'DESC').addOrderBy('order.id', 'DESC');

    const orders = await qb.getMany();

    return orders.map((order) => this.serializeOrder(order));
  }

  async updateOrder(id: number, updateDto: UpdateShopOrderDto) {
    const order = await this.shopOrdersRepository.findOne({ where: { id, deleted_at: null } });
    if (!order) {
      throw new NotFoundException(`Shop order with ID ${id} not found`);
    }

    if (updateDto.status !== undefined) order.status = updateDto.status;
    if (updateDto.admin_note !== undefined) order.admin_note = updateDto.admin_note;
    if (updateDto.payment_method !== undefined) order.payment_method = updateDto.payment_method;

    const updated = await this.shopOrdersRepository.save(order);
    return this.serializeOrder(updated);
  }

  async softDeleteOrder(id: number) {
    const order = await this.shopOrdersRepository.findOne({ where: { id } });
    if (!order) {
      throw new NotFoundException(`Shop order with ID ${id} not found`);
    }

    if (!order.deleted_at) {
      order.deleted_at = new Date();
      await this.shopOrdersRepository.save(order);
    }

    return this.serializeOrder(order);
  }

  async restoreOrder(id: number) {
    const order = await this.shopOrdersRepository.findOne({ where: { id } });
    if (!order) {
      throw new NotFoundException(`Shop order with ID ${id} not found`);
    }

    order.deleted_at = null;
    const restored = await this.shopOrdersRepository.save(order);
    return this.serializeOrder(restored);
  }

  async permanentlyDeleteOrder(id: number) {
    const order = await this.shopOrdersRepository.findOne({ where: { id } });
    if (!order) {
      throw new NotFoundException(`Shop order with ID ${id} not found`);
    }

    await this.shopOrdersRepository.remove(order);
    return { success: true };
  }

  async registerUploadedProductImage(filePath: string, fileName: string) {
    await this.ensureUploadsDir();
    const extension = path.extname(fileName || filePath) || '.jpg';
    const targetName = `${uuidv4()}${extension.toLowerCase()}`;
    const targetPath = path.join(this.uploadsDir, targetName);

    if (filePath !== targetPath) {
      const contents = await readFile(filePath);
      await writeFile(targetPath, contents);
      await unlink(filePath).catch(() => undefined);
    }

    return {
      image_url: `/uploads/shop/products/${targetName}`,
    };
  }

  private async purgeExpiredTrash() {
    const cutoff = new Date(Date.now() - this.trashRetentionDays * 24 * 60 * 60 * 1000);

    await this.shopProductsRepository.delete({
      deleted_at: LessThan(cutoff),
    });

    await this.shopOrdersRepository.delete({
      deleted_at: LessThan(cutoff),
    });
  }

  private applyScope(qb: any, alias: string, scope: ShopScope) {
    if (scope === 'trash') {
      qb.where(`${alias}.deleted_at IS NOT NULL`);
      return;
    }

    qb.where(`${alias}.deleted_at IS NULL`);
  }

  private serializeProduct(product: ShopProduct, admin = false) {
    return {
      id: product.id,
      slug: product.slug,
      title: product.title,
      brand: product.brand,
      device_category: product.device_category,
      part_category: product.part_category,
      inventory_source: product.inventory_source,
      issue_label: product.issue_label,
      description: product.description,
      image_url: product.image_url,
      price: product.price !== null ? Number(product.price) : null,
      sale_price: product.sale_price !== null ? Number(product.sale_price) : null,
      service_price: product.service_price !== null ? Number(product.service_price) : null,
      stock_quantity: product.stock_quantity,
      sort_order: product.sort_order,
      is_active: product.is_active,
      ...(admin
        ? {
            deleted_at: product.deleted_at,
            created_at: product.created_at,
            updated_at: product.updated_at,
          }
        : {}),
    };
  }

  private serializeOrder(order: ShopOrder) {
    return {
      ...order,
      subtotal_amount: Number(order.subtotal_amount),
      service_amount: Number(order.service_amount),
      total_amount: Number(order.total_amount),
      deleted_at: order.deleted_at,
    };
  }

  private async ensureUniqueSlug(value: string, excludeId?: number) {
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

  private async getNextSortOrder() {
    const result = await this.shopProductsRepository
      .createQueryBuilder('product')
      .select('MAX(product.sort_order)', 'maxSortOrder')
      .getRawOne<{ maxSortOrder: string | null }>();

    const currentMax = Number(result?.maxSortOrder ?? 0);
    return Number.isFinite(currentMax) ? currentMax + 10 : 10;
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

  private toNullableMoney(value?: number | null) {
    if (value === null || value === undefined || Number.isNaN(Number(value))) {
      return null;
    }

    return Number(value).toFixed(2);
  }

  private async prepareImageUrl(value?: string | null) {
    if (!value) {
      return null;
    }

    if (/^https?:\/\//i.test(value)) {
      return this.downloadImageFromUrl(value);
    }

    return value;
  }

  private async downloadImageFromUrl(url: string) {
    await this.ensureUploadsDir();

    const response = await axios.get<ArrayBuffer>(url, {
      responseType: 'arraybuffer',
      timeout: 15000,
      maxRedirects: 5,
    });

    const extension = this.resolveImageExtension(
      response.headers['content-type'],
      new URL(url).pathname,
    );
    const fileName = `${uuidv4()}${extension}`;
    const filePath = path.join(this.uploadsDir, fileName);

    await writeFile(filePath, Buffer.from(response.data));

    return `/uploads/shop/products/${fileName}`;
  }

  private resolveImageExtension(contentType?: string, pathname = '') {
    const fromPath = path.extname(pathname).toLowerCase();
    if (fromPath && fromPath.length <= 5) {
      return fromPath;
    }

    const normalized = String(contentType || '').toLowerCase();
    if (normalized.includes('png')) return '.png';
    if (normalized.includes('webp')) return '.webp';
    if (normalized.includes('gif')) return '.gif';
    if (normalized.includes('svg')) return '.svg';
    if (normalized.includes('avif')) return '.avif';
    return '.jpg';
  }

  private async ensureUploadsDir() {
    await mkdir(this.uploadsDir, { recursive: true });
  }

  private readCsvRows(filePath: string) {
    return new Promise<Record<string, string>[]>((resolve, reject) => {
      const rows: Record<string, string>[] = [];
      fs.createReadStream(filePath)
        .pipe(csvParser())
        .on('data', (row) => rows.push(row))
        .on('end', () => resolve(rows))
        .on('error', reject);
    });
  }

  private parseProductCsvRow(row: Record<string, string>): CreateShopProductDto {
    const title = String(row.title || '').trim();
    if (!title) {
      throw new BadRequestException('Missing required "title" column.');
    }

    const device = this.parseEnumValue(
      row.device_category,
      Object.values(ShopDeviceCategory),
      'device_category',
    ) as ShopDeviceCategory;
    const part = this.parseEnumValue(
      row.part_category,
      Object.values(ShopPartCategory),
      'part_category',
    ) as ShopPartCategory;
    const source = this.parseEnumValue(
      row.inventory_source,
      Object.values(ShopInventorySource),
      'inventory_source',
    ) as ShopInventorySource;

    return {
      title,
      brand: String(row.brand || '').trim() || undefined,
      slug: String(row.slug || '').trim() || undefined,
      device_category: device,
      part_category: part,
      inventory_source: source,
      issue_label: String(row.issue_label || '').trim() || undefined,
      description: String(row.description || '').trim() || undefined,
      image_url: String(row.image_url || '').trim() || undefined,
      price: this.parseOptionalNumber(row.price),
      sale_price: this.parseOptionalNumber(row.sale_price),
      service_price: this.parseOptionalNumber(row.service_price),
      stock_quantity: this.parseOptionalInteger(row.stock_quantity) ?? 0,
      sort_order: this.parseOptionalInteger(row.sort_order) ?? undefined,
      is_active: this.parseOptionalBoolean(row.is_active) ?? true,
    };
  }

  private parseEnumValue(value: string, allowed: string[], field: string) {
    const normalized = String(value || '')
      .trim()
      .toLowerCase();

    if (!normalized || !allowed.includes(normalized)) {
      throw new BadRequestException(
        `Invalid "${field}" value. Allowed: ${allowed.join(', ')}`,
      );
    }

    return normalized;
  }

  private parseOptionalNumber(value: string) {
    if (value === undefined || value === null || String(value).trim() === '') {
      return null;
    }

    const parsed = Number(value);
    if (Number.isNaN(parsed)) {
      throw new BadRequestException('Invalid numeric value in CSV row.');
    }

    return parsed;
  }

  private parseOptionalInteger(value: string) {
    if (value === undefined || value === null || String(value).trim() === '') {
      return null;
    }

    const parsed = Number.parseInt(String(value), 10);
    if (Number.isNaN(parsed)) {
      throw new BadRequestException('Invalid integer value in CSV row.');
    }

    return parsed;
  }

  private parseOptionalBoolean(value: string) {
    if (value === undefined || value === null || String(value).trim() === '') {
      return null;
    }

    const normalized = String(value).trim().toLowerCase();
    if (['1', 'true', 'yes', 'active'].includes(normalized)) {
      return true;
    }
    if (['0', 'false', 'no', 'hidden'].includes(normalized)) {
      return false;
    }

    throw new BadRequestException('Invalid boolean value in CSV row.');
  }
}
