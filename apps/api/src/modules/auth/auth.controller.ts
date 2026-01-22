import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Logger,
  NotFoundException,
  Post,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { AuthService } from './auth.service';
import { ExchangeTokenDto } from './dto/exchangeDto';

const JWT_COOKIE_NAME = 'jwt';
const ONE_HOUR_MS = 1000 * 60 * 60;

function isProduction() {
  return process.env.NODE_ENV === 'production';
}

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private readonly authService: AuthService) {}

  /**
   * DEV-ONLY endpoint: 임시 유저 ID로 JWT 발급 (prod에서는 숨김)
   */
  @Post('login/tmp')
  async tmpLogin(
    @Body() body: { id: string },
    @Res({ passthrough: true }) res: Response,
  ) {
    if (isProduction()) {
      throw new NotFoundException();
    }

    if (!body.id) {
      throw new BadRequestException('id is required');
    }

    const appJwt = await this.authService.issueJwt({ id: body.id });

    return { appJwt };
  }

  @Post('logout')
  async logout(@Res({ passthrough: true }) res: Response) {
    // 쿠키 삭제는 같은 옵션(path/samesite/secure)로 덮어써야 확실함
    res.clearCookie(JWT_COOKIE_NAME, {
      httpOnly: true,
      secure: isProduction(),
      sameSite: 'lax',
      path: '/',
    });

    return { ok: true };
  }

  @Post('spotify/exchange')
  async exchange(@Body() { code, verifier }: ExchangeTokenDto) {
    const spotifyTokens = await this.authService.exchange(code, verifier);

    // 프론트 callback이 appJwt를 기대한다면(추후 정리),
    // 여기서도 appJwt 발급을 하려면 아래 2줄을 활성화하면 됨.
    // const user = await this.authService.handleSpotifySignIn(spotifyTokens);
    // const appJwt = await this.authService.issueJwt({ id: user.id });

    return {
      spotifyAccessToken: spotifyTokens.accessToken,
      spotifyTokenExpiresIn: spotifyTokens.expiresIn,
      // appJwt,
    };
  }

  @Post('google/exchange')
  async googleExchange(@Body() body: { code: string; verifier?: string }) {
    if (!body.code) {
      throw new BadRequestException('code is required');
    }

    const tokens = await this.authService.exchangeGoogle(
      body.code,
      body.verifier,
    );
    const user = await this.authService.handleGoogleSignIn(tokens);
    const appJwt = await this.authService.issueJwt({ id: user.id });

    return { appJwt };
  }

  @Get('spotify/token')
  refresh() {
    this.logger.warn('spotify/token is not implemented yet');
    return;
  }

  @Get('check')
  healthCheck() {
    return { status: 'ok' };
  }
}
