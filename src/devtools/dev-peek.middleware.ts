import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class DevPeekOffMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const disabled = !process.env.ENABLE_RESET_DEV_PEEK || process.env.ENABLE_RESET_DEV_PEEK === 'false';
    if (disabled && req.path.startsWith('/auth/password/dev')) {
      return res.status(404).json({ message: 'Not found' });
    }
    next();
  }
}
