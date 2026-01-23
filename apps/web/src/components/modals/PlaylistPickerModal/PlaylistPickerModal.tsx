'use client';

import { useEffect, useMemo, useState } from 'react';
import { X, Plus } from 'lucide-react';
import { toast } from 'react-toastify';

import { useModalStore } from '@/stores/useModalStore';
import { getAllPlaylists, addMusicsToPlaylist, createNewPlaylist } from '@/api';
import { DEFAULT_IMAGES } from '@/constants';
import { coalesceImageSrc } from '@/utils';

import type { MusicRequestDto, MusicResponseDto as Music } from '@repo/dto';
import { LoadingSpinner } from '@/components';

type PlaylistBrief = {
  id: string;
  title: string;
  tracksCount: number;
  firstAlbumCoverUrl: string;
};

const toMusicRequestDto = (m: Music): MusicRequestDto => ({
  id: m.id,
  trackUri: m.trackUri,
  provider: m.provider,
  albumCoverUrl: m.albumCoverUrl,
  title: m.title,
  artistName: m.artistName,
  durationMs: m.durationMs,
});

const dedupeById = (musics: Music[]): Music[] => {
  const seen = new Set<string>();
  const out: Music[] = [];
  for (const m of musics) {
    if (seen.has(m.id)) continue;
    seen.add(m.id);
    out.push(m);
  }
  return out;
};

export default function PlaylistPickerModal() {
  const { isOpen, modalType, modalProps, closeModal } = useModalStore();
  const enabled = isOpen && modalType === 'PLAYLIST_PICKER';

  const musics = enabled ? (modalProps?.musics as Music[] | undefined) : undefined;

  const [playlists, setPlaylists] = useState<PlaylistBrief[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [submittingPlaylistId, setSubmittingPlaylistId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const canSubmit = Boolean(musics && musics.length > 0) && !submittingPlaylistId && !isCreating;

  useEffect(() => {
    if (!enabled) return;

    if (!musics || musics.length === 0) {
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
  }, [enabled, musics, closeModal]);

  const handleSaveResultToast = (addedCount: number) => {
    if (addedCount === 0) toast.info('이미 플레이리스트에 있는 곡이에요.');
    else toast.success('보관함에 저장했어요.');
  };

  const saveToPlaylist = async (playlistId: string) => {
    if (!musics || musics.length === 0) return;

    const unique = dedupeById(musics);
    const req = unique.map(toMusicRequestDto);

    const res = await addMusicsToPlaylist(playlistId, req);

    const addedCount = Array.isArray(res.addedMusics) ? res.addedMusics.length : 0;
    handleSaveResultToast(addedCount);

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

    setIsCreating(true);
    setErrorMsg(null);

    try {
      const created = await createNewPlaylist();
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
        <div className="flex items-center justify-between px-6 py-4 border-b-2 border-primary bg-white">
          <h2 className="text-xl font-black text-primary">플레이리스트 선택</h2>
          <button onClick={closeModal} className="p-1 hover:bg-grayish rounded-full transition-colors">
            <X className="w-6 h-6 text-primary" />
          </button>
        </div>

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
