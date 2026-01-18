import { UserDto } from '../../user';

interface comment {
  id: string;
  content: string;
  createdAt: string;
  author: UserDto;
}

export class GetCommentsResDto {
  comments: comment[];
}
