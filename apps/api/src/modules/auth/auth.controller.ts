import { Controller, Get } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('spotify/exchange')
  exchange() {
    // todo
    // 1. get access token by authorization code
    // 2. request user info
    // 3. build jwt by user info
  }
}
