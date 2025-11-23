import { Repository } from 'typeorm';
import { Setting } from './settings.entity';
export declare class SettingsService {
    private settingsRepository;
    constructor(settingsRepository: Repository<Setting>);
    get(key: string): Promise<string | null>;
    set(key: string, value: string, description?: string): Promise<Setting>;
    getAll(): Promise<Record<string, string>>;
    getApiKeys(): Promise<{
        woocommerce_url?: string;
        woocommerce_consumer_key?: string;
        woocommerce_consumer_secret?: string;
        bog_merchant_id?: string;
        bog_secret_key?: string;
        bog_api_url?: string;
        sender_api_key?: string;
        sender_api_url?: string;
    }>;
    setApiKeys(keys: {
        woocommerce_url?: string;
        woocommerce_consumer_key?: string;
        woocommerce_consumer_secret?: string;
        bog_merchant_id?: string;
        bog_secret_key?: string;
        bog_api_url?: string;
        sender_api_key?: string;
        sender_api_url?: string;
    }): Promise<void>;
}
