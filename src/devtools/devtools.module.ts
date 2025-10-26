import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
import { DevPeekOffMiddleware } from './dev-peek.middleware';

@Module({})
export class DevtoolsModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(DevPeekOffMiddleware)
      .forRoutes({ path: 'auth/password/dev/*', method: RequestMethod.ALL });
  }
}
