import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ExchangeTokenDto } from './dto/exchangeDto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('spotify/exchange')
  async exchange(@Body() { code, verifier }: ExchangeTokenDto) {
    // 1. get access token by authorization code
    const { accessToken, refreshToken } = await this.authService.exchange(
      code,
      verifier,
    );

    // 2. request user info
    this.authService.verifyUser(accessToken, refreshToken);

    // 3. build jwt by user info
    this.authService.buildJwtWith();
  }

  @Post('spotify/refresh')
  refresh() {
    // todo
    // access token 새로 받아오기
    // https://developer.spotify.com/documentation/web-api/tutorials/refreshing-tokens
  }
}
