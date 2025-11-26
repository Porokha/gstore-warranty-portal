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
    try {
      let setting = await this.settingsRepository.findOne({ where: { key } });
      
      if (setting) {
        setting.value = value;
        if (description) setting.description = description;
        console.log(`💾 Updating setting ${key}: ${value.substring(0, 20)}...`);
      } else {
        setting = this.settingsRepository.create({ key, value, description });
        console.log(`💾 Creating new setting ${key}: ${value.substring(0, 20)}...`);
      }
      
      const saved = await this.settingsRepository.save(setting);
      console.log(`✅ Setting ${key} saved successfully (ID: ${saved.id})`);
      return saved;
    } catch (error) {
      console.error(`❌ Failed to save setting ${key}:`, error);
      console.error('Error details:', error.message, error.stack);
      throw error;
    }
  }

  async getAll(): Promise<Record<string, string>> {
    try {
      const settings = await this.settingsRepository.find();
      console.log(`📋 Found ${settings.length} settings in database`);
      const result: Record<string, string> = {};
      settings.forEach((s) => {
        result[s.key] = s.value;
      });
      return result;
    } catch (error) {
      console.error('❌ Failed to get all settings:', error);
      console.error('Error details:', error.message, error.stack);
      throw error;
    }
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
    try {
      const settings = await this.getAll();
      console.log('📋 Retrieved all settings from database:', Object.keys(settings));
      const result = {
        woocommerce_url: settings.WOOCOMMERCE_URL,
        woocommerce_consumer_key: settings.WOOCOMMERCE_CONSUMER_KEY,
        woocommerce_consumer_secret: settings.WOOCOMMERCE_CONSUMER_SECRET,
        bog_merchant_id: settings.BOG_MERCHANT_ID,
        bog_secret_key: settings.BOG_SECRET_KEY,
        bog_api_url: settings.BOG_API_URL,
        sender_api_key: settings.SENDER_API_KEY,
        sender_api_url: settings.SENDER_API_URL,
      };
      console.log('🔑 API Keys result:', {
        hasUrl: !!result.woocommerce_url,
        hasKey: !!result.woocommerce_consumer_key,
        hasSecret: !!result.woocommerce_consumer_secret,
        url: result.woocommerce_url || 'MISSING',
      });
      return result;
    } catch (error) {
      console.error('❌ Failed to get API keys:', error);
      console.error('Error details:', error.message, error.stack);
      throw error;
    }
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
      // Save even if value is empty string (to clear it)
      if (mapping.value !== undefined && mapping.value !== null) {
        const saved = await this.set(mapping.key, String(mapping.value));
        console.log(`💾 Saved ${mapping.key}: ${saved.value ? `${saved.value.substring(0, 20)}...` : 'empty'}`);
      }
    }
  }
}

