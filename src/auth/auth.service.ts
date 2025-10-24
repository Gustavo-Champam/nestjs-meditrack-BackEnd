import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  constructor(private users: UsersService, private jwt: JwtService) {}

  async validateUser(email: string, password: string) {
    const user: any = await this.users.findByEmail(email);
    if (!user) return null;
    const hashed = user.password_hash ?? user.password;
    const ok = hashed ? await bcrypt.compare(password, String(hashed)) : false;
    return ok ? user : null;
  }

  async login(email: string, password: string) {
    const user = await this.validateUser(email, password);
    if (!user) throw new UnauthorizedException('Credenciais inválidas');
    const payload = { sub: String(user._id), email: user.email };
    return this.jwt.sign(payload);
  }
}


