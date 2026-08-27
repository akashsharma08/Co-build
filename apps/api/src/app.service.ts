import { Injectable } from '@nestjs/common';

export interface HealthResponse {
  name: string;
  status: 'ok';
  timestamp: string;
}

@Injectable()
export class AppService {
  getHealth(): HealthResponse {
    return {
      name: 'cobuild-api',
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }
}
