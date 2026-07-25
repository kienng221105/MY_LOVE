import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Response<T> {
  success: boolean;
  message: string;
  data: T;
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, Response<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<Response<T>> {
    return next.handle().pipe(
      map((result) => {
        let message = 'Thao tác thành công';
        let data = result;

        if (result && typeof result === 'object' && 'message' in result && 'data' in result) {
          message = result.message;
          data = result.data;
        }

        return {
          success: true,
          message,
          data,
        };
      })
    );
  }
}
