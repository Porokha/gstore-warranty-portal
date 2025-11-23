import { AuthService } from './auth.service';
export declare class AuthController {
    private authService;
    constructor(authService: AuthService);
    login(req: any): Promise<{
        access_token: string;
        user: {
            id: any;
            username: any;
            name: any;
            last_name: any;
            role: any;
            language_pref: any;
        };
    }>;
    getProfile(req: any): any;
    logout(): {
        message: string;
    };
}
