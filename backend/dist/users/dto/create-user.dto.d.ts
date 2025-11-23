import { UserRole, LanguagePreference } from '../entities/user.entity';
export declare class CreateUserDto {
    username: string;
    password: string;
    name: string;
    last_name: string;
    role: UserRole;
    phone?: string;
    email?: string;
    language_preference: LanguagePreference;
}
