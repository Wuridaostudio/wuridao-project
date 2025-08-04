import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'WURIDAO API is running!';
  }

  getHealth(): string {
    return 'WURIDAO API is running!';
  }
}
