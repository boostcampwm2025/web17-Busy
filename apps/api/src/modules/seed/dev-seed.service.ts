import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../user/entities/user.entity';
import { Music } from '../music/entities/music.entity';
import { Post } from '../post/entities/post.entity';
import { PostMusic } from '../post/entities/post-music.entity';
import { Like } from '../like/entities/like.entity';
import { Provider } from 'src/common/constants';

@Injectable()
export class DevSeedService implements OnApplicationBootstrap {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Music)
    private readonly musicRepo: Repository<Music>,
    @InjectRepository(Post)
    private readonly postRepo: Repository<Post>,
    @InjectRepository(PostMusic)
    private readonly postMusicRepo: Repository<PostMusic>,
    @InjectRepository(Like)
    private readonly likeRepo: Repository<Like>,
  ) {}

  async onApplicationBootstrap() {
    if (process.env.NODE_ENV === 'production') return;

    await this.seedMockUsers();
    await this.seedMockMusics();
    await this.seedMockPosts();

    console.log('seeding completed');
  }

  private async seedMockUsers() {
    const seedUsers = [
      {
        id: '11111111-1111-1111-1111-111111111111',
        nickname: '테스트 사용자 1',
        email: 'example111@naver.com',
        profileImgUrl: '',
        bio: '하이요~~',
      },
      {
        id: '22222222-2222-2222-2222-222222222222',
        nickname: '테스트 사용자 2',
        email: 'example222@naver.com',
        profileImgUrl: '',
        bio: '하이요~~',
      },
    ];

    await Promise.all(seedUsers.map((u) => this.userRepo.save(u)));
  }

  private async seedMockMusics() {
    const seedMusics = [
      {
        id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        albumCoverUrl:
          'https://is1-ssl.mzstatic.com/image/thumb/Music122/v4/9a/fa/45/9afa45ec-7823-7e58-5580-27c01cdd709d/akmu_cover.jpg/600x600bb.jpg',
        artistName: '악뮤',
        durationMs: 283800,
        provider: Provider.ITUNES,
        title: '오랜 날 오랜 밤',
        trackUri:
          'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview115/v4/57/b1/84/57b184a7-a483-be7a-7aa8-0f1290d0258b/mzaf_394777065639841416.plus.aac.p.m4a',
      },
      {
        id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
        albumCoverUrl:
          'https://is1-ssl.mzstatic.com/image/thumb/Music116/v4/7f/ca/13/7fca1315-9134-7937-b159-367bbed08dfa/AKMU_LoveLee_Cover_4000x4000.jpg/600x600bb.jpg',
        artistName: '악뮤',
        durationMs: 204577,
        provider: Provider.ITUNES,
        title: '후라이의 꿈',
        trackUri:
          'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/05/5f/72/055f725b-623b-073e-cadb-04c88eea2f3e/mzaf_4121315245673499980.plus.aac.p.m4a',
      },
      {
        id: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
        albumCoverUrl:
          'https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/12/31/63/12316366-55bb-065c-8ad9-47e107fa79b2/AKMU_NEXT_EPISODE.jpg/600x600bb.jpg',
        artistName: '악뮤',
        durationMs: 212808,
        provider: Provider.ITUNES,
        title: '낙하 (with 아이유)',
        trackUri:
          'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/86/4d/a5/864da591-eeb0-27db-bbfa-a190ee20a05c/mzaf_17780542814473670833.plus.aac.p.m4a',
      },
    ];

    await Promise.all(seedMusics.map((m) => this.musicRepo.save(m)));
  }

  private async seedMockPosts() {
    const user1Id = '11111111-1111-1111-1111-111111111111';
    const user2Id = '22222222-2222-2222-2222-222222222222';
    const music1Id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
    const music2Id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
    const music3Id = 'cccccccc-cccc-cccc-cccc-cccccccccccc';
    const post1Id = '33333333-3333-3333-3333-333333333333';
    const post2Id = '44444444-4444-4444-4444-444444444444';

    const seedPosts = [
      {
        id: post1Id,
        author: { id: user1Id },
        coverImgUrl:
          'https://is1-ssl.mzstatic.com/image/thumb/Music122/v4/9a/fa/45/9afa45ec-7823-7e58-5580-27c01cdd709d/akmu_cover.jpg/600x600bb.jpg',
        content: 'AKMU 노래 모음',
        likeCount: 1,
        commentCount: 0,
      },
      {
        id: post2Id,
        author: { id: user2Id },
        coverImgUrl:
          'https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/12/31/63/12316366-55bb-065c-8ad9-47e107fa79b2/AKMU_NEXT_EPISODE.jpg/600x600bb.jpg',
        content: 'AKMU 노래 추천',
        likeCount: 1,
        commentCount: 0,
      },
    ];
    await Promise.all(seedPosts.map((p) => this.postRepo.save(p)));

    const pm1Id = '55555555-5555-5555-5555-555555555555';
    const pm2Id = '66666666-6666-6666-6666-666666666666';
    const pm3Id = '77777777-7777-7777-7777-777777777777';

    const postMusicData = [
      {
        id: pm1Id,
        post: { id: post1Id },
        music: { id: music1Id },
        orderIndex: 0,
      },
      {
        id: pm2Id,
        post: { id: post1Id },
        music: { id: music2Id },
        orderIndex: 1,
      },

      
      {
        id: pm3Id,
        post: { id: post2Id },
        music: { id: music3Id },
        orderIndex: 0,
      },
    ];
    await Promise.all(postMusicData.map((pm) => this.postMusicRepo.save(pm)));

    const seedLikes = [
      { userId: user2Id, postId: post1Id },
      { userId: user1Id, postId: post2Id },
    ];
    await Promise.all(seedLikes.map((l) => this.likeRepo.save(l)));
  }
}
