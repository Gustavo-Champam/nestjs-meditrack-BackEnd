﻿import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @IsString() name: string;
  @IsEmail() email: string;
  @IsString() @MinLength(6) password: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsString() address?: string;
  @IsOptional() age?: number;
}




