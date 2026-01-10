USE vibr;

-- users
INSERT INTO
    user (
        user_id,
        nickname,
        provider,
        provider_user_id,
        email
    )
VALUES (
        '11111111-1111-1111-1111-111111111111',
        'alice',
        'spotify',
        'sp_alice',
        'alice@example.com'
    ),
    (
        '22222222-2222-2222-2222-222222222222',
        'bob',
        'spotify',
        'sp_bob',
        'bob@example.com'
    );

-- follow
INSERT INTO
    follow (
        following_user_id,
        followed_user_id
    )
VALUES (
        '11111111-1111-1111-1111-111111111111',
        '22222222-2222-2222-2222-222222222222'
    );

-- music
INSERT INTO
    music (
        music_id,
        track_uri,
        provider,
        album_cover_url,
        title,
        artist_name,
        duration_ms
    )
VALUES (
        'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        'spotify:track:4qdBPJta3BVPXCS0wJZ6yO',
        'spotify',
        'https://i.scdn.co/image/ab67616d0000b273e92e8f0639aba51d50ba2916',
        '입춘',
        '한로로',
        248407
    ),
    (
        'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
        'spotify:track:BBB',
        'spotify',
        'https://i.scdn.co/image/ab67616d0000b2734fedba0f305c4f11cf8320d0',
        'I"m in Luck',
        'tomy wyne',
        191489
    );

-- playlist
INSERT INTO
    playlist (playlist_id, user_id, title)
VALUES (
        '33333333-3333-3333-3333-333333333333',
        '11111111-1111-1111-1111-111111111111',
        'favorites'
    );

-- playlist_music
INSERT INTO
    playlist_music (
        playlist_music_id,
        playlist_id,
        music_id,
        order_index
    )
VALUES (
        '44444444-4444-4444-4444-444444444444',
        '33333333-3333-3333-3333-333333333333',
        'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        0
    ),
    (
        '55555555-5555-5555-5555-555555555555',
        '33333333-3333-3333-3333-333333333333',
        'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
        1
    );

-- post
INSERT INTO
    post (
        post_id,
        author_id,
        cover_img_url,
        content
    )
VALUES (
        '66666666-6666-6666-6666-666666666666',
        '11111111-1111-1111-1111-111111111111',
        'https://i.scdn.co/image/ab67616d0000b273e92e8f0639aba51d50ba2916',
        '입춘 좋아요'
    );

-- post_music
INSERT INTO
    post_music (
        post_music_id,
        post_id,
        music_id,
        order_index
    )
VALUES (
        '77777777-7777-7777-7777-777777777777',
        '66666666-6666-6666-6666-666666666666',
        'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        0
    );