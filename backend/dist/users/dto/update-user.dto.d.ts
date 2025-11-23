import { UserRole, LanguagePreference } from '../entities/user.entity';
export declare class UpdateUserDto {
    password?: string;
    name?: string;
    last_name?: string;
    role?: UserRole;
    phone?: string;
    email?: string;
    language_preference?: LanguagePreference;
}
