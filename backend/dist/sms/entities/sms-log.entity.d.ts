export declare enum SmsStatus {
    SENT = "sent",
    FAILED = "failed",
    SKIPPED = "skipped"
}
export declare class SmsLog {
    id: number;
    phone: string;
    template_key: string;
    payload_json: Record<string, any>;
    status: SmsStatus;
    api_response: string;
    created_at: Date;
}
