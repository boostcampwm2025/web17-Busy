import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request>();
    const jwt = req.cookies?.jwt;

    if (!jwt) throw new UnauthorizedException('JWT가 확인되지 않습니다.');

    try {
      const payload = await this.jwtService.verifyAsync(jwt);
      (req as any).user = payload;
      return true;
    } catch {
      throw new UnauthorizedException('JWT를 읽는데 실패했습니다.');
    }
  }
}
