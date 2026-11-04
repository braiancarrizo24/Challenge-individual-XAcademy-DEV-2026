import {
  Injectable,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

import { UsersService } from '../../users/users.service';

interface JwtPayload {
  sub: number;
  email: string;
  role: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private readonly usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('JWT_SECRET'),
    });
  }

  async validate(payload: JwtPayload) {
    if (
      !Number.isInteger(payload.sub) ||
      !payload.email ||
      payload.role !== 'admin'
    ) {
      throw new UnauthorizedException(
        'Token de autenticación inválido.',
      );
    }

    let user;

    try {
      user = await this.usersService.findById(payload.sub);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new UnauthorizedException(
          'El usuario ya no está autorizado.',
        );
      }

      throw error;
    }

    if (
      !user.isActive ||
      user.role !== 'admin' ||
      user.email !== payload.email
    ) {
      throw new UnauthorizedException(
        'El usuario ya no está autorizado.',
      );
    }

    return {
      userId: user.id,
      email: user.email,
      role: user.role,
    };
  }
}