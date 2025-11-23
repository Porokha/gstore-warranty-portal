import { SettingsService } from './settings.service';
export declare class SettingsController {
    private settingsService;
    constructor(settingsService: SettingsService);
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
    setApiKeys(keys: any): Promise<{
        success: boolean;
        message: string;
    }>;
}
