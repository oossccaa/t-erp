import { NestFactory, Reflector } from '@nestjs/core'
import { ValidationPipe, ClassSerializerInterceptor } from '@nestjs/common'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import { AppModule } from './app.module'
import { HttpExceptionFilter } from './common/filters/http-exception.filter'
import { TransformInterceptor } from './common/interceptors/transform.interceptor'
import helmet from 'helmet'
import compression from 'compression'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)

  // 安全中間件
  app.use(helmet({
    contentSecurityPolicy: process.env.NODE_ENV === 'production' ? undefined : false,
  }))
  
  // 壓縮中間件
  app.use(compression())

  // 全域驗證管道
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    })
  )

  // 全域異常過濾器
  app.useGlobalFilters(new HttpExceptionFilter())

  // 全域序列化攔截器
  app.useGlobalInterceptors(
    new ClassSerializerInterceptor(app.get(Reflector)),
    new TransformInterceptor(app.get(Reflector))
  )

  // CORS 設定
  app.enableCors({
    origin: (process.env.CORS_ORIGIN || 'http://localhost:3001,http://localhost:3002').split(','),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })

  // 全域前綴
  app.setGlobalPrefix(process.env.API_PREFIX || 'api')

  // Swagger API 文檔
  const config = new DocumentBuilder()
    .setTitle('T-ERP API')
    .setDescription('小工廠進銷存系統 API 文檔')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('認證', '用戶認證相關接口')
    .addTag('用戶管理', '用戶管理相關接口')
    .addTag('產品管理', '產品管理相關接口')
    .addTag('產品分類', '產品分類管理相關接口')
    .addTag('供應商管理', '供應商管理相關接口')
    .addTag('客戶管理', '客戶管理相關接口')
    .build()

  const document = SwaggerModule.createDocument(app, config)
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  })

  const port = process.env.PORT || 3000
  await app.listen(port)
  
  console.log(`🚀 Application is running on: http://localhost:${port}`)
  console.log(`📚 API Documentation: http://localhost:${port}/api/docs`)
  console.log(`🔐 Default Admin: username=admin, password=admin123`)
}

bootstrap()