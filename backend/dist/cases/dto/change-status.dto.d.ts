import { CaseStatusLevel, ResultType } from '../entities/service-case.entity';
export declare class ChangeStatusDto {
    new_status_level: CaseStatusLevel;
    result_type?: ResultType;
    note_public?: string;
    note_private?: string;
}
