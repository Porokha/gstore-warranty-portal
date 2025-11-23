import { ServiceCase, CaseStatusLevel, ResultType } from './service-case.entity';
import { User } from '../../users/entities/user.entity';
export declare class CaseStatusHistory {
    id: number;
    case_id: number;
    changed_by: number;
    previous_status_level: CaseStatusLevel;
    new_status_level: CaseStatusLevel;
    previous_result: ResultType;
    new_result: ResultType;
    note_public: string;
    note_private: string;
    created_at: Date;
    case_: ServiceCase;
    changed_by_user: User;
}
