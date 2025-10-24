import { IsString } from 'class-validator';
export class BindDeviceDto {
  @IsString() pairToken: string;
  @IsString() deviceId: string;
}




