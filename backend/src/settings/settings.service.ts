import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Setting } from './settings.entity';

@Injectable()
export class SettingsService {
  constructor(
    @InjectRepository(Setting)
    private settingsRepository: Repository<Setting>,
  ) {}

  async get(key: string): Promise<string | null> {
    const setting = await this.settingsRepository.findOne({ where: { key } });
    return setting ? setting.value : null;
  }

  async set(key: string, value: string, description?: string): Promise<Setting> {
    let setting = await this.settingsRepository.findOne({ where: { key } });

    if (setting) {
      setting.value = value;
      if (description) setting.description = description;
    } else {
      setting = this.settingsRepository.create({ key, value, description });
    }

    return this.settingsRepository.save(setting);
  }

  async getAll(): Promise<Record<string, string>> {
    const settings = await this.settingsRepository.find();
    const result: Record<string, string> = {};
    settings.forEach((s) => {
      result[s.key] = s.value;
    });
    return result;
  }

  async getApiKeys(): Promise<{
    woocommerce_url?: string;
    woocommerce_consumer_key?: string;
    woocommerce_consumer_secret?: string;
    bog_merchant_id?: string;
    bog_secret_key?: string;
    bog_api_url?: string;
    sender_api_key?: string;
    sender_api_url?: string;
    mobilesentrix_api_url?: string;
    mobilesentrix_consumer_name?: string;
    mobilesentrix_consumer_key?: string;
    mobilesentrix_consumer_secret?: string;
    mobilesentrix_access_token?: string;
    mobilesentrix_access_token_secret?: string;
    mobilesentrix_connected?: boolean;
    mobilesentrix_webhook_secret?: string;
    pos_warranty_webhook_secret?: string;
  }> {
    const settings = await this.getAll();
    return {
      woocommerce_url: settings.WOOCOMMERCE_URL,
      woocommerce_consumer_key: settings.WOOCOMMERCE_CONSUMER_KEY,
      woocommerce_consumer_secret: settings.WOOCOMMERCE_CONSUMER_SECRET,
      bog_merchant_id: settings.BOG_MERCHANT_ID,
      bog_secret_key: settings.BOG_SECRET_KEY,
      bog_api_url: settings.BOG_API_URL,
      sender_api_key: settings.SENDER_API_KEY,
      sender_api_url: settings.SENDER_API_URL,
      mobilesentrix_api_url: settings.MOBILESENTRIX_API_URL,
      mobilesentrix_consumer_name: settings.MOBILESENTRIX_CONSUMER_NAME,
      mobilesentrix_consumer_key: settings.MOBILESENTRIX_CONSUMER_KEY,
      mobilesentrix_consumer_secret: settings.MOBILESENTRIX_CONSUMER_SECRET,
      mobilesentrix_access_token: settings.MOBILESENTRIX_ACCESS_TOKEN,
      mobilesentrix_access_token_secret: settings.MOBILESENTRIX_ACCESS_TOKEN_SECRET,
      mobilesentrix_connected:
        Boolean(settings.MOBILESENTRIX_ACCESS_TOKEN) &&
        Boolean(settings.MOBILESENTRIX_ACCESS_TOKEN_SECRET),
      mobilesentrix_webhook_secret: settings.MOBILESENTRIX_WEBHOOK_SECRET,
      pos_warranty_webhook_secret: settings.POS_WARRANTY_WEBHOOK_SECRET,
    };
  }

  async setApiKeys(keys: {
    woocommerce_url?: string;
    woocommerce_consumer_key?: string;
    woocommerce_consumer_secret?: string;
    bog_merchant_id?: string;
    bog_secret_key?: string;
    bog_api_url?: string;
    sender_api_key?: string;
    sender_api_url?: string;
    mobilesentrix_api_url?: string;
    mobilesentrix_consumer_name?: string;
    mobilesentrix_consumer_key?: string;
    mobilesentrix_consumer_secret?: string;
    mobilesentrix_access_token?: string;
    mobilesentrix_access_token_secret?: string;
    mobilesentrix_webhook_secret?: string;
    pos_warranty_webhook_secret?: string;
  }): Promise<void> {
    const mappings = [
      { key: 'WOOCOMMERCE_URL', value: keys.woocommerce_url },
      { key: 'WOOCOMMERCE_CONSUMER_KEY', value: keys.woocommerce_consumer_key },
      { key: 'WOOCOMMERCE_CONSUMER_SECRET', value: keys.woocommerce_consumer_secret },
      { key: 'BOG_MERCHANT_ID', value: keys.bog_merchant_id },
      { key: 'BOG_SECRET_KEY', value: keys.bog_secret_key },
      { key: 'BOG_API_URL', value: keys.bog_api_url },
      { key: 'SENDER_API_KEY', value: keys.sender_api_key },
      { key: 'SENDER_API_URL', value: keys.sender_api_url },
      { key: 'MOBILESENTRIX_API_URL', value: keys.mobilesentrix_api_url },
      { key: 'MOBILESENTRIX_CONSUMER_NAME', value: keys.mobilesentrix_consumer_name },
      { key: 'MOBILESENTRIX_CONSUMER_KEY', value: keys.mobilesentrix_consumer_key },
      { key: 'MOBILESENTRIX_CONSUMER_SECRET', value: keys.mobilesentrix_consumer_secret },
      { key: 'MOBILESENTRIX_ACCESS_TOKEN', value: keys.mobilesentrix_access_token },
      { key: 'MOBILESENTRIX_ACCESS_TOKEN_SECRET', value: keys.mobilesentrix_access_token_secret },
      { key: 'MOBILESENTRIX_WEBHOOK_SECRET', value: keys.mobilesentrix_webhook_secret },
      { key: 'POS_WARRANTY_WEBHOOK_SECRET', value: keys.pos_warranty_webhook_secret },
    ];

    for (const mapping of mappings) {
      if (mapping.value !== undefined && mapping.value !== null) {
        await this.set(mapping.key, String(mapping.value));
      }
    }
  }
}
