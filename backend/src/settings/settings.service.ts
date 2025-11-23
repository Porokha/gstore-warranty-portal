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
    ];

    for (const mapping of mappings) {
      if (mapping.value !== undefined) {
        await this.set(mapping.key, mapping.value);
      }
    }
  }
}

