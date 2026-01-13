import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const UserId = createParamDecorator<never, string | null>(
  (_: never, ctx: ExecutionContext) => {
    const req = ctx.switchToHttp().getRequest();
    const user = req.user;
    return user?.sub ?? user?.id ?? null;
  },
);
