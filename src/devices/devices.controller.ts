import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { DevicesService } from './devices.service';
import { BindDeviceDto } from './dto/pair.dto';

@Controller('devices')
@UseGuards(JwtAuthGuard)
export class DevicesController {
  constructor(private readonly svc: DevicesService) {}

  @Post('pair')
  pair(@Req() req: any) {
    return this.svc.createPairToken(req.user.sub);
  }

  @Post('bind')
  bind(@Req() req: any, @Body() dto: BindDeviceDto) {
    return this.svc.bind(req.user.sub, dto);
  }
}




