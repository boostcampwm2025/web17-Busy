import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ExchangeTokenDto } from './dto/exchangeDto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('spotify/exchange')
  async exchange(@Body() { code, verifier }: ExchangeTokenDto) {
    // 1. get access token by authorization code
    const spotifyTokens = await this.authService.exchange(code, verifier);

    // 2. request user info
    const user = await this.authService.handleSpotifySignIn(spotifyTokens);

    // 3. issue jwt by user info
    const appJwt = await this.authService.issueJwt(user);

    return {
      spotifyAccessToken: spotifyTokens.accessToken,
      appJwt,
    };
  }

  @Post('spotify/refresh')
  refresh() {
    // todo
    // access token 새로 받아오기
    // https://developer.spotify.com/documentation/web-api/tutorials/refreshing-tokens
  }
}
