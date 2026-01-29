import { Test, TestingModule } from '@nestjs/testing';
import { getRedisConnectionToken } from '@nestjs-modules/ioredis';
import { Driver } from 'neo4j-driver';
import { AlgorithmStreamConsumer } from './algorithm-stream.consumer';
import { AlgorithmService } from './algorithm.service';
import { REDIS_KEYS } from 'src/infra/redis/redis-keys';

// --- Mocks ---
const mockRedis = {
  xgroup: jest.fn(),
  xreadgroup: jest.fn(),
  xack: jest.fn(),
};

const mockTx = {
  run: jest.fn().mockResolvedValue({ records: [] }),
};

const mockSession = {
  executeWrite: jest.fn((callback) => callback(mockTx)),
  executeRead: jest.fn((callback) => callback(mockTx)),
  close: jest.fn().mockResolvedValue(undefined),
};

const mockDriver = {
  session: jest.fn().mockReturnValue(mockSession),
};

describe('Algorithm Module Integration Test', () => {
  let consumer: AlgorithmStreamConsumer;
  let service: AlgorithmService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AlgorithmStreamConsumer,
        AlgorithmService,
        {
          provide: getRedisConnectionToken(),
          useValue: mockRedis,
        },
        {
          provide: 'NEO4J_DRIVER',
          useValue: mockDriver,
        },
      ],
    }).compile();

    consumer = module.get<AlgorithmStreamConsumer>(AlgorithmStreamConsumer);
    service = module.get<AlgorithmService>(AlgorithmService);

    jest.clearAllMocks();
  });

  describe('pollAndProcess', () => {
    it('should correctly process all defined event types according to the spec', async () => {
      const mockEntries = [
        [
          '1000-1',
          [
            'userId',
            'user_fe_1',
            'eventType',
            'POST_DETAIL_SUMMARY',
            'source',
            'fe_ux',
            'targetPostId',
            'post_1',
            'serverTs',
            '1738200000000',
            'meta',
            JSON.stringify({
              dwellMs: 15000,
              playedMusicCount: 1,
              listenMsByMusic: { music_1: 10000 },
            }),
          ],
        ],
        [
          '1000-2',
          [
            'userId',
            'user_fe_1',
            'eventType',
            'ARCHIVE_ADD_MUSICS',
            'source',
            'fe_ux',
            'serverTs',
            '1738200001000',
            'meta',
            JSON.stringify({
              musicIds: ['music_2', 'music_3'],
              count: 2,
            }),
          ],
        ],
        [
          '1000-3',
          [
            'userId',
            'user_be_1',
            'eventType',
            'LIKE_ADD',
            'source',
            'be',
            'targetPostId',
            'post_2',
            'serverTs',
            '1738200002000',
            'method',
            'POST',
            'path',
            '/api/likes',
          ],
        ],
        [
          '1000-4',
          [
            'userId',
            'user_be_1',
            'eventType',
            'LIKE_REMOVE',
            'source',
            'be',
            'targetPostId',
            'post_2',
            'serverTs',
            '1738200003000',
          ],
        ],
        [
          '1000-5',
          [
            'userId',
            'user_be_1',
            'eventType',
            'FOLLOW_ADD',
            'source',
            'be',
            'targetUserId',
            'user_target_99',
            'serverTs',
            '1738200004000',
          ],
        ],
      ];

      mockRedis.xreadgroup.mockResolvedValue([['key', mockEntries]]);

      const addBatchSpy = jest
        .spyOn(service, 'addRelationshipsBatch')
        .mockResolvedValue(undefined);
      const removeBatchSpy = jest
        .spyOn(service, 'removeRelationshipsBatch')
        .mockResolvedValue(undefined);

      await consumer.pollAndProcess();

      expect(addBatchSpy).toHaveBeenCalledTimes(1);
      const addPayload = addBatchSpy.mock.calls[0][0];

      expect(addPayload).toHaveLength(4);

      // 1-1. FE 상세 조회 (VIEWED -> post_1)
      expect(addPayload).toContainEqual(
        expect.objectContaining({
          userId: 'user_fe_1',
          targetId: 'post_1',
          targetLabel: 'Content',
          relationType: 'VIEWED',
        }),
      );

      // [수정됨] 1-2. FE 음악 청취 (LISTENED -> post_1)
      // 음악 노드를 안 쓰기로 했으므로 targetId는 post_1이어야 합니다.
      expect(addPayload).toContainEqual(
        expect.objectContaining({
          userId: 'user_fe_1',
          targetId: 'post_1', // [수정] music_1 -> post_1
          targetLabel: 'Content', // [수정] Music -> Content
          relationType: 'LISTENED',
          // 어떤 음악인지는 props에 들어있는지 확인
          props: expect.objectContaining({ sourceMusicId: 'music_1' }),
        }),
      );

      // 1-3. BE 좋아요 (LIKED -> post_2)
      expect(addPayload).toContainEqual(
        expect.objectContaining({
          userId: 'user_be_1',
          targetId: 'post_2',
          relationType: 'LIKED',
          weight: 5,
        }),
      );

      // 1-4. BE 팔로우 (FOLLOWS -> user_target_99)
      expect(addPayload).toContainEqual(
        expect.objectContaining({
          userId: 'user_be_1',
          targetId: 'user_target_99',
          targetLabel: 'User',
          relationType: 'FOLLOWS',
          weight: 10,
        }),
      );

      // 2. removeRelationshipsBatch 검증
      expect(removeBatchSpy).toHaveBeenCalledTimes(1);
      const removePayload = removeBatchSpy.mock.calls[0][0];
      expect(removePayload).toHaveLength(1);
      expect(removePayload[0]).toEqual(
        expect.objectContaining({
          userId: 'user_be_1',
          targetId: 'post_2',
          relationType: 'LIKED',
          action: 'REMOVE',
        }),
      );

      // 3. ACK 검증
      // validIds(1,3,4,5) 뒤에 skipIds(2)가 붙는 순서입니다.
      expect(mockRedis.xack).toHaveBeenCalledWith(
        REDIS_KEYS.LOG_EVENTS_STREAM,
        'algorithm-group',
        '1000-1',
        '1000-3',
        '1000-4',
        '1000-5',
        '1000-2', // [수정] 1000-2를 맨 뒤로 이동
      );
    });
  });
});
