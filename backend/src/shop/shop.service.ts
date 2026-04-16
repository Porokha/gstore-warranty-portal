import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateShopProductDto } from './dto/create-shop-product.dto';
import { PublicShopProductsDto } from './dto/public-shop-products.dto';
import { UpdateShopOrderDto } from './dto/update-shop-order.dto';
import { UpdateShopProductDto } from './dto/update-shop-product.dto';
import { ShopProduct } from './entities/shop-product.entity';
import { ShopOrder } from './entities/shop-order.entity';

@Injectable()
export class ShopService {
  constructor(
    @InjectRepository(ShopProduct)
    private readonly shopProductsRepository: Repository<ShopProduct>,
    @InjectRepository(ShopOrder)
    private readonly shopOrdersRepository: Repository<ShopOrder>,
  ) {}

  async listPublicProducts(filters: PublicShopProductsDto) {
    const qb = this.shopProductsRepository.createQueryBuilder('product');

    qb.where('product.is_active = true');

    if (filters.device) {
      qb.andWhere('product.device_category = :device', { device: filters.device });
    }

    if (filters.part) {
      qb.andWhere('product.part_category = :part', { part: filters.part });
    }

    if (filters.source) {
      qb.andWhere('product.inventory_source = :source', { source: filters.source });
    }

    if (filters.search) {
      qb.andWhere(
        '(LOWER(product.title) LIKE :search OR LOWER(COALESCE(product.issue_label, "")) LIKE :search OR LOWER(COALESCE(product.description, "")) LIKE :search)',
        { search: `%${filters.search.toLowerCase()}%` },
      );
    }

    qb.orderBy('product.sort_order', 'ASC').addOrderBy('product.id', 'ASC');

    const products = await qb.getMany();

    return products.map((product) => this.serializeProduct(product));
  }

  async listAdminProducts() {
    const products = await this.shopProductsRepository.find({
      order: { sort_order: 'ASC', id: 'ASC' },
    });

    return products.map((product) => this.serializeProduct(product, true));
  }

  async createProduct(createDto: CreateShopProductDto) {
    const product = this.shopProductsRepository.create({
      ...createDto,
      slug: await this.ensureUniqueSlug(createDto.slug || createDto.title),
      price: this.toMoney(createDto.price),
      sale_price: this.toNullableMoney(createDto.sale_price),
      service_price: this.toNullableMoney(createDto.service_price),
      stock_quantity: createDto.stock_quantity ?? 0,
      sort_order: createDto.sort_order ?? 0,
      is_active: createDto.is_active ?? true,
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
    if (updateDto.device_category !== undefined) product.device_category = updateDto.device_category;
    if (updateDto.part_category !== undefined) product.part_category = updateDto.part_category;
    if (updateDto.inventory_source !== undefined) {
      product.inventory_source = updateDto.inventory_source;
    }
    if (updateDto.issue_label !== undefined) product.issue_label = updateDto.issue_label;
    if (updateDto.description !== undefined) product.description = updateDto.description;
    if (updateDto.image_url !== undefined) product.image_url = updateDto.image_url;
    if (updateDto.price !== undefined) product.price = this.toMoney(updateDto.price);
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

  async listOrders() {
    const orders = await this.shopOrdersRepository.find({
      order: { created_at: 'DESC', id: 'DESC' },
    });

    return orders.map((order) => ({
      ...order,
      subtotal_amount: Number(order.subtotal_amount),
      service_amount: Number(order.service_amount),
      total_amount: Number(order.total_amount),
    }));
  }

  async updateOrder(id: number, updateDto: UpdateShopOrderDto) {
    const order = await this.shopOrdersRepository.findOne({ where: { id } });
    if (!order) {
      throw new NotFoundException(`Shop order with ID ${id} not found`);
    }

    if (updateDto.status !== undefined) order.status = updateDto.status;
    if (updateDto.admin_note !== undefined) order.admin_note = updateDto.admin_note;
    if (updateDto.payment_method !== undefined) order.payment_method = updateDto.payment_method;

    const updated = await this.shopOrdersRepository.save(order);
    return {
      ...updated,
      subtotal_amount: Number(updated.subtotal_amount),
      service_amount: Number(updated.service_amount),
      total_amount: Number(updated.total_amount),
    };
  }

  private serializeProduct(product: ShopProduct, admin = false) {
    return {
      id: product.id,
      slug: product.slug,
      title: product.title,
      device_category: product.device_category,
      part_category: product.part_category,
      inventory_source: product.inventory_source,
      issue_label: product.issue_label,
      description: product.description,
      image_url: product.image_url,
      price: Number(product.price),
      sale_price: product.sale_price !== null ? Number(product.sale_price) : null,
      service_price: product.service_price !== null ? Number(product.service_price) : null,
      stock_quantity: product.stock_quantity,
      sort_order: product.sort_order,
      is_active: product.is_active,
      ...(admin
        ? {
            created_at: product.created_at,
            updated_at: product.updated_at,
          }
        : {}),
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

  private slugify(value: string) {
    return value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 120) || 'product';
  }

  private toMoney(value: number) {
    return Number(value).toFixed(2);
  }

  private toNullableMoney(value?: number | null) {
    if (value === null || value === undefined || Number.isNaN(Number(value))) {
      return null;
    }

    return Number(value).toFixed(2);
  }
}
