import { Injectable } from '@nestjs/common';

@Injectable()
export class CheckHealthUseCase {
  execute() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }
}
