import { UserDto } from '@repo/dto';
import { internalClient } from './client';

export async function logout() {
  await internalClient.post('/auth/logout');
}

export async function authMe() {
  await internalClient.get<UserDto>('/user/me');
}
