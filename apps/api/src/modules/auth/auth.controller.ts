import { Body, Controller, Get, Post, Res, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ExchangeTokenDto } from './dto/exchangeDto';
import type { Response } from 'express';
import { User } from '../user/entities/user.entity';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login/tmp')
  async tmpLogin(
    @Body() body: { id: string },
    @Res({ passthrough: true }) res: Response,
  ) {
    const jwt = await this.authService.issueJwt({ id: body.id });

    res.cookie('jwt', jwt, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      path: '/',
      maxAge: 1000 * 60 * 60, // 1시간
    });

    return { ok: true };
  }

  // AuthGuard, @UserId - feat/31-post-api 브랜치에 있음
  // @UseGuards(AuthGuard)
  @Get('me')
  async me() // @UserId() userId: string
  {
    // this.userService.findById(userId) 구현 후 주석 해제
    // const user = (await this.userService.findById(userId)) as User
    // return {
    //   userId: user.id,
    //   nickname: user.nickname,
    //   profileImgUrl: user.profileImgUrl,
    // }
  }

  @Post('spotify/exchange')
  async exchange(@Body() { code, verifier }: ExchangeTokenDto) {
    try {
      // 1. get access token by authorization code
      const spotifyTokens = await this.authService.exchange(code, verifier);

      // // 2. request user info
      // const user = await this.authService.handleSpotifySignIn(spotifyTokens);

      // // 3. issue jwt by user info
      // const appJwt = await this.authService.issueJwt(user);

      return {
        spotifyAccessToken: spotifyTokens.accessToken,
        spotifyTokenExpiresIn: spotifyTokens.expiresIn,
        // appJwt,
      };
    } catch (err) {
      console.error(err);
      throw new Error(err);
    }
  }

  @Get('spotify/token')
  refresh() {
    // todo
    // access token 새로 받아오기
    // https://developer.spotify.com/documentation/web-api/tutorials/refreshing-tokens
  }
}
