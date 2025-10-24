import { Body, Controller, Get, Patch, Param, Post, UseGuards, Req } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { MedicationsService } from './medications.service';

@UseGuards(AuthGuard('jwt'))
@Controller('medications')
export class MedicationsController {
  constructor(private readonly medicationsService: MedicationsService) {}

  @Post()
  async create(@Body() dto: any, @Req() req: any) {
    const ownerId = req.user?.sub ?? req.user?.userId;
    return this.medicationsService.create(ownerId, dto);
  }

  @Get()
  async findAll(@Req() req: any) {
    const ownerId = req.user?.sub ?? req.user?.userId;
    const items = await this.medicationsService.findAll(ownerId);
    // formato compatível com os seus testes
    return { value: items, Count: items.length };
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: any, @Req() req: any) {
    const ownerId = req.user?.sub ?? req.user?.userId;
    return this.medicationsService.update(id, ownerId, dto);
  }

  @Post(':id/refill')
  async refill(@Param('id') id: string, @Body() body: any, @Req() req: any) {
    const ownerId = req.user?.sub ?? req.user?.userId;
    const amount = body?.add ?? body?.amount ?? body?.qty ?? 0;
    return this.medicationsService.refill(id, ownerId, amount);
  }
}
