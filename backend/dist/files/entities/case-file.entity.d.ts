import { ServiceCase } from '../../cases/entities/service-case.entity';
import { User } from '../../users/entities/user.entity';
export declare enum FileType {
    IMAGE = "image",
    VIDEO = "video",
    PDF = "pdf",
    OTHER = "other"
}
export declare class CaseFile {
    id: number;
    case_id: number;
    file_url: string;
    file_type: FileType;
    uploaded_by: number;
    created_at: Date;
    case_: ServiceCase;
    uploaded_by_user: User;
}
