'use client';

import { useEffect, useMemo, useState } from 'react';
import { X, Plus } from 'lucide-react';
import { toast } from 'react-toastify';

import { useModalStore } from '@/stores/useModalStore';
import { getAllPlaylists, addMusicsToPlaylist, createNewPlaylist } from '@/api';
import { DEFAULT_IMAGES } from '@/constants';
import { coalesceImageSrc } from '@/utils';

import type { MusicRequestDto, MusicResponseDto as Music, AddMusicsToPlaylistResDto } from '@repo/dto';
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

  // 버튼/항목 클릭 중
  const [submittingPlaylistId, setSubmittingPlaylistId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const canSubmit = Boolean(music) && !submittingPlaylistId && !isCreating;

  const fetchPlaylists = async () => {
    const list = await getAllPlaylists();
    setPlaylists(list);
  };

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
        await fetchPlaylists();
        if (!alive) return;
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

  const handleSaveResultToast = (res: AddMusicsToPlaylistResDto) => {
    const added = Array.isArray(res.addedMusics) ? res.addedMusics.length : 0;

    // BE가 "중복 제외 후 실제 추가된 곡만" 반환
    if (added === 0) toast.info('이미 플레이리스트에 있는 곡이에요.');
    else toast.success('보관함에 저장했어요.');
  };

  const saveToPlaylist = async (playlistId: string) => {
    if (!music) return;

    const req = [toMusicRequestDto(music)];
    const res = await addMusicsToPlaylist(playlistId, req);

    handleSaveResultToast(res);
    closeModal();
  };

  const handleSelect = async (playlistId: string) => {
    if (!canSubmit) return;

    setSubmittingPlaylistId(playlistId);
    setErrorMsg(null);

    try {
      await saveToPlaylist(playlistId);
    } catch {
      setErrorMsg('플레이리스트에 저장하지 못했습니다. 잠시 후 다시 시도해주세요.');
      toast.error('저장에 실패했습니다.');
    } finally {
      setSubmittingPlaylistId(null);
    }
  };

  const handleCreateAndSave = async () => {
    if (!canSubmit) return;
    if (!music) return;

    setIsCreating(true);
    setErrorMsg(null);

    try {
      const created = await createNewPlaylist(); // 기본 제목 생성은 BE에서
      await saveToPlaylist(created.id);
    } catch {
      setErrorMsg('새 플레이리스트를 만들지 못했습니다.');
      toast.error('플레이리스트 생성에 실패했습니다.');
    } finally {
      setIsCreating(false);
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

        {/* Create */}
        <div className="px-6 py-3 border-b border-gray-100">
          <button
            type="button"
            onClick={() => void handleCreateAndSave()}
            disabled={!canSubmit}
            className="w-full flex items-center justify-center gap-2 rounded-xl border-2 border-primary bg-white font-black text-primary py-3
                       hover:bg-grayish disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="w-4 h-4" />
            {isCreating ? '생성/저장 중…' : '새 플레이리스트 만들고 저장'}
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
              {playlists.map((pl) => {
                const busy = submittingPlaylistId === pl.id;

                return (
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

                      <span className="text-xs font-black text-primary">{busy ? '저장 중…' : '선택'}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-100 text-[11px] text-gray-2">저장할 플레이리스트를 선택하세요.</div>
      </div>
    </div>
  );
}
