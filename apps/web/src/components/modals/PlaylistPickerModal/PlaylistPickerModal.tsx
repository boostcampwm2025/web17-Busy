'use client';

import { useEffect, useMemo, useState } from 'react';
import { X } from 'lucide-react';

import { useModalStore } from '@/stores/useModalStore';
import { getAllPlaylists, addMusicsToPlaylist } from '@/api';
import { DEFAULT_IMAGES } from '@/constants';
import { coalesceImageSrc } from '@/utils';

import type { MusicRequestDto, MusicResponseDto as Music } from '@repo/dto';
import { LoadingSpinner } from '@/components';

type Props = {};

const toMusicRequestDto = (m: Music): MusicRequestDto => ({
  id: m.id, // DB UUID 보장(ensure 후 들어옴)
  trackUri: m.trackUri,
  provider: m.provider,
  albumCoverUrl: m.albumCoverUrl,
  title: m.title,
  artistName: m.artistName,
  durationMs: m.durationMs,
});

export default function PlaylistPickerModal(_props: Props) {
  const { isOpen, modalType, modalProps, closeModal } = useModalStore();

  const enabled = isOpen && modalType === 'PLAYLIST_PICKER';
  const music = enabled ? (modalProps?.music as Music | undefined) : undefined;

  const [playlists, setPlaylists] = useState<Array<{ id: string; title: string; tracksCount: number; firstAlbumCoverUrl: string }>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const canSubmit = Boolean(music) && !isSubmitting;

  useEffect(() => {
    if (!enabled) return;
    if (!music) {
      closeModal();
      return;
    }

    let alive = true;

    const run = async () => {
      setIsLoading(true);
      setErrorMsg(null);

      try {
        const list = await getAllPlaylists();
        if (!alive) return;
        setPlaylists(list);
      } catch {
        if (!alive) return;
        setPlaylists([]);
        setErrorMsg('플레이리스트 목록을 불러오지 못했습니다.');
      } finally {
        if (alive) setIsLoading(false);
      }
    };

    void run();

    return () => {
      alive = false;
    };
  }, [enabled, music, closeModal]);

  const handleSelect = async (playlistId: string) => {
    if (!music) return;
    if (!canSubmit) return;

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      await addMusicsToPlaylist(playlistId, [toMusicRequestDto(music)]);
      closeModal();
    } catch {
      setErrorMsg('플레이리스트에 저장하지 못했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const emptyText = useMemo(() => {
    if (isLoading) return null;
    if (errorMsg) return null;
    if (playlists.length === 0) return '플레이리스트가 없습니다.';
    return null;
  }, [isLoading, errorMsg, playlists.length]);

  if (!enabled) return null;

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-primary/40 backdrop-blur-sm p-4 animate-fade-in">
      <div className="absolute inset-0" onClick={closeModal} />

      <div className="relative bg-white w-full max-w-md rounded-3xl border-2 border-primary flex flex-col max-h-[70vh] overflow-hidden animate-scale-up z-10">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b-2 border-primary bg-white">
          <h2 className="text-xl font-black text-primary">플레이리스트 선택</h2>
          <button onClick={closeModal} className="p-1 hover:bg-grayish rounded-full transition-colors">
            <X className="w-6 h-6 text-primary" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
          {isLoading ? (
            <div className="py-6">
              <LoadingSpinner />
            </div>
          ) : errorMsg ? (
            <div className="py-10 text-center text-gray-2">
              <p className="font-bold text-sm">{errorMsg}</p>
            </div>
          ) : emptyText ? (
            <div className="py-10 text-center text-gray-2">
              <p className="font-bold text-sm">{emptyText}</p>
            </div>
          ) : (
            <ul className="space-y-1">
              {playlists.map((pl) => (
                <li key={pl.id}>
                  <button
                    type="button"
                    onClick={() => void handleSelect(pl.id)}
                    disabled={!canSubmit}
                    className="w-full flex items-center justify-between p-3 hover:bg-grayish rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="flex items-center min-w-0">
                      <img
                        src={coalesceImageSrc(pl.firstAlbumCoverUrl, DEFAULT_IMAGES.ALBUM)}
                        alt={pl.title}
                        className="w-10 h-10 rounded-lg border border-gray-3 object-cover shrink-0"
                      />
                      <div className="ml-3 min-w-0 text-left">
                        <p className="font-bold text-primary truncate">{pl.title}</p>
                        <p className="text-xs text-gray-2">{pl.tracksCount}곡</p>
                      </div>
                    </div>

                    <span className="text-xs font-black text-primary">{isSubmitting ? '저장 중…' : '선택'}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer (옵션) */}
        <div className="px-6 py-4 border-t border-gray-100 text-[11px] text-gray-2">
          {/* TODO(BE): 플리 생성/검색/정렬 등 UX 확정 후 확장 */}
          저장할 플레이리스트를 선택하세요.
        </div>
      </div>
    </div>
  );
}
