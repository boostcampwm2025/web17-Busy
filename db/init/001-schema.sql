-- Active: 1766478395869@@127.0.0.1@3306
-- Active: 1766478395869@@127.0.0.1@3306
-- 001-schema.sql
-- MySQL 8.4 / InnoDB / utf8mb4

SET NAMES utf8mb4;

SET time_zone = '+09:00';

USE vibr;

-- =========================
-- user
-- =========================
CREATE TABLE `user` (
    user_id CHAR(36) NOT NULL,
    nickname VARCHAR(12) NOT NULL,
    profile_image_url VARCHAR(2083) NULL,
    profile_introduction VARCHAR(255) NULL,
    provider ENUM('apple', 'spotify') NOT NULL,
    provider_user_id VARCHAR(255) NOT NULL,
    email VARCHAR(255) NULL,
    provider_refresh_token VARCHAR(2083) NULL,
    PRIMARY KEY (user_id),
    INDEX idx_user_provider_user_id (provider, provider_user_id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- =========================
-- music
-- =========================
CREATE TABLE music (
    music_id CHAR(36) NOT NULL,
    track_uri VARCHAR(511) NOT NULL,
    provider ENUM('apple', 'spotify') NOT NULL,
    album_cover_url VARCHAR(511) NOT NULL,
    title VARCHAR(1000) NOT NULL,
    artist_name VARCHAR(1000) NOT NULL,
    duration_ms INT NOT NULL,
    PRIMARY KEY (music_id),
    UNIQUE KEY uq_music_track (provider, track_uri)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- =========================
-- now_playlist_music
-- =========================
CREATE TABLE now_playlist_music (
    now_playlist_music_id CHAR(36) NOT NULL,
    user_id CHAR(36) NOT NULL,
    music_id CHAR(36) NOT NULL,
    order_index INT NOT NULL,
    PRIMARY KEY (now_playlist_music_id),
    CONSTRAINT fk_now_playlist_music_user FOREIGN KEY (user_id) REFERENCES user (user_id) ON DELETE CASCADE,
    CONSTRAINT fk_now_playlist_music_music FOREIGN KEY (music_id) REFERENCES music (music_id) ON DELETE RESTRICT
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- =========================
-- follow (PK: (following_user_id, followed_user_id))
-- =========================
CREATE TABLE follow (
    following_user_id CHAR(36) NOT NULL,
    followed_user_id CHAR(36) NOT NULL,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    PRIMARY KEY (
        following_user_id,
        followed_user_id
    ),
    CONSTRAINT fk_follow_following FOREIGN KEY (following_user_id) REFERENCES user (user_id) ON DELETE CASCADE,
    CONSTRAINT fk_follow_followed FOREIGN KEY (followed_user_id) REFERENCES user (user_id) ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- =========================
-- post
-- =========================
CREATE TABLE post (
    post_id CHAR(36) NOT NULL,
    author_id CHAR(36) NOT NULL,
    cover_img_url VARCHAR(2083) NOT NULL,
    content VARCHAR(2300) NOT NULL,
    like_count INT NOT NULL DEFAULT 0,
    comment_count INT NOT NULL DEFAULT 0,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    deleted_at DATETIME(6) NULL,
    PRIMARY KEY (post_id),
    CONSTRAINT fk_post_author FOREIGN KEY (author_id) REFERENCES user (user_id) ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- =========================
-- post_music
-- =========================
CREATE TABLE post_music (
    post_music_id CHAR(36) NOT NULL,
    post_id CHAR(36) NOT NULL,
    music_id CHAR(36) NOT NULL,
    order_index INT NOT NULL,
    PRIMARY KEY (post_music_id),
    UNIQUE KEY uq_post_music_order (post_id, order_index),
    CONSTRAINT fk_post_music_post FOREIGN KEY (post_id) REFERENCES post (post_id) ON DELETE CASCADE,
    CONSTRAINT fk_post_music_music FOREIGN KEY (music_id) REFERENCES music (music_id) ON DELETE RESTRICT
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- =========================
-- like (PK: (user_id, post_id))
-- =========================
CREATE TABLE `like` (
    user_id CHAR(36) NOT NULL,
    post_id CHAR(36) NOT NULL,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    PRIMARY KEY (user_id, post_id),
    CONSTRAINT fk_like_user FOREIGN KEY (user_id) REFERENCES user (user_id) ON DELETE CASCADE,
    CONSTRAINT fk_like_post FOREIGN KEY (post_id) REFERENCES post (post_id) ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- =========================
-- comment
-- =========================
CREATE TABLE comment (
    comment_id CHAR(36) NOT NULL,
    author_id CHAR(36) NOT NULL,
    post_id CHAR(36) NOT NULL,
    content VARCHAR(2300) NOT NULL,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    deleted_at DATETIME(6) NULL,
    PRIMARY KEY (comment_id),
    CONSTRAINT fk_comment_author FOREIGN KEY (author_id) REFERENCES user (user_id) ON DELETE CASCADE,
    CONSTRAINT fk_comment_post FOREIGN KEY (post_id) REFERENCES post (post_id) ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- =========================
-- playlist
-- =========================
CREATE TABLE playlist (
    playlist_id CHAR(36) NOT NULL,
    user_id CHAR(36) NOT NULL,
    title VARCHAR(20) NOT NULL,
    PRIMARY KEY (playlist_id),
    CONSTRAINT fk_playlist_user FOREIGN KEY (user_id) REFERENCES user (user_id) ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- =========================
-- playlist_music
-- =========================
CREATE TABLE playlist_music (
    playlist_music_id CHAR(36) NOT NULL,
    playlist_id CHAR(36) NOT NULL,
    music_id CHAR(36) NOT NULL,
    order_index INT NOT NULL,
    PRIMARY KEY (playlist_music_id),
    UNIQUE KEY uq_playlist_music_unique (playlist_id, music_id),
    UNIQUE KEY uq_playlist_music_order (playlist_id, order_index),
    CONSTRAINT fk_playlist_music_playlist FOREIGN KEY (playlist_id) REFERENCES playlist (playlist_id) ON DELETE CASCADE,
    CONSTRAINT fk_playlist_music_music FOREIGN KEY (music_id) REFERENCES music (music_id) ON DELETE RESTRICT
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- =========================
-- notification
-- type ENUM 값이 표에 없어서 VARCHAR로 처리 (너가 enum 후보 주면 ENUM으로 바꿔줄게)
-- =========================
CREATE TABLE notification (
    notification_id CHAR(36) NOT NULL,
    receiver_id CHAR(36) NOT NULL,
    actor_id CHAR(36) NOT NULL,
    type VARCHAR(50) NOT NULL,
    related_id CHAR(36) NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    PRIMARY KEY (notification_id),
    CONSTRAINT fk_notification_receiver FOREIGN KEY (receiver_id) REFERENCES user (user_id) ON DELETE CASCADE,
    CONSTRAINT fk_notification_actor FOREIGN KEY (actor_id) REFERENCES user (user_id) ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- =========================
-- sync_room
-- =========================
CREATE TABLE sync_room (
    room_id CHAR(36) NOT NULL,
    code VARCHAR(8) NOT NULL,
    title VARCHAR(100) NOT NULL,
    host_id CHAR(36) NOT NULL,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    PRIMARY KEY (room_id),
    UNIQUE KEY uq_sync_room_code (code),
    CONSTRAINT fk_sync_room_host FOREIGN KEY (host_id) REFERENCES user (user_id) ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- =========================
-- sync_room_member (PK: (room_id, user_id))
-- =========================
CREATE TABLE sync_room_member (
    room_id CHAR(36) NOT NULL,
    user_id CHAR(36) NOT NULL,
    role ENUM('host', 'member') NOT NULL DEFAULT 'member',
    joined_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    PRIMARY KEY (room_id, user_id),
    CONSTRAINT fk_sync_room_member_room FOREIGN KEY (room_id) REFERENCES sync_room (room_id) ON DELETE CASCADE,
    CONSTRAINT fk_sync_room_member_user FOREIGN KEY (user_id) REFERENCES user (user_id) ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- =========================
-- sync_chat_message
-- =========================
CREATE TABLE sync_chat_message (
    message_id CHAR(36) NOT NULL,
    room_id CHAR(36) NOT NULL,
    user_id CHAR(36) NOT NULL,
    content VARCHAR(2083) NOT NULL,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    PRIMARY KEY (message_id),
    CONSTRAINT fk_sync_chat_message_room FOREIGN KEY (room_id) REFERENCES sync_room (room_id) ON DELETE CASCADE,
    CONSTRAINT fk_sync_chat_message_user FOREIGN KEY (user_id) REFERENCES user (user_id) ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- =========================
-- sync_room_playlist_music
-- =========================
CREATE TABLE sync_room_playlist_music (
    sync_room_playlist_music_id CHAR(36) NOT NULL,
    room_id CHAR(36) NOT NULL,
    music_id CHAR(36) NOT NULL,
    order_index INT NOT NULL,
    PRIMARY KEY (sync_room_playlist_music_id),
    UNIQUE KEY uq_sync_room_playlist_order (room_id, order_index),
    CONSTRAINT fk_sync_room_playlist_room FOREIGN KEY (room_id) REFERENCES sync_room (room_id) ON DELETE CASCADE,
    CONSTRAINT fk_sync_room_playlist_music FOREIGN KEY (music_id) REFERENCES music (music_id) ON DELETE RESTRICT
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;