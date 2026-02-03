import { Injectable } from '@nestjs/common';
import { Post } from 'src/modules/post/entities/post.entity';

@Injectable()
export class FeedCompositionPolicy {
  compose(following: Post[], trending: Post[], recent: Post[]) {
    // 중복제거하면서 합침
    const map = new Map<string, Post>();

    for (const p of following) {
      map.set(p.id, p);
    }

    for (const p of [...trending, ...recent]) {
      if (map.has(p.id)) continue;
      map.set(p.id, p);
    }

    const posts = Array.from(map.values());

    // 랜덤 배치
    return this.shuffle(posts);
  }

  shuffle(array: any[]) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }
}
