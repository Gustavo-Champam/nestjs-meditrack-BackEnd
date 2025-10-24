// src/users/users.module.ts

import { Module } from '@nestjs/common';
import { UsersService } from './users.service';  // ServiÃ§o de usuÃ¡rios
import { UsersController } from './users.controller';  // Controlador de usuÃ¡rios
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './schemas/user.schema';

@Module({
  controllers: [UsersController],
  imports: [MongooseModule.forFeature([{ name: User.name, schema: UserSchema }])],
  providers: [UsersService],
  exports: [UsersService],  // Exportando o UsersService para ser utilizado em outros mÃ³dulos
})
export class UsersModule {}





