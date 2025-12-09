import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common'
import { Observable } from 'rxjs'
import { map } from 'rxjs/operators'
import { ClassSerializerInterceptor } from '@nestjs/common'

@Injectable()
export class TransformInterceptor extends ClassSerializerInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return super.intercept(context, next).pipe(
      map((data) => {
        // 如果回應已經是標準格式，直接返回
        if (data && typeof data === 'object' && 'success' in data) {
          return data
        }

        // 否則包裝成標準格式
        return {
          success: true,
          data,
          message: '操作成功',
          timestamp: new Date().toISOString(),
        }
      }),
    )
  }
}