import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Gstore Warranty Portal API v1.0';
  }
}

