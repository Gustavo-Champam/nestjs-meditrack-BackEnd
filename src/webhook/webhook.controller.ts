import { Body, Controller, Post } from '@nestjs/common';

@Controller('webhook')
export class WebhookController {
  // ESP32 chama este endpoint apÃ³s dispensar
  @Post('dispense-confirm')
  confirm(@Body() body: any) {
    // TODO: validar assinatura, registrar log no Mongo etc.
    console.log('Dispense confirm:', body);
    return { ok: true };
  }
}




