import React, { useEffect, useState } from 'react';
import { useModalStore } from '@/stores';
import { X, FolderOpen } from 'lucide-react';
import { Playlist } from '@/types';

import { CoverImgUploader } from './CoverImgUploader';
import { MusicSearch } from './MusicSearch';
import { SelectedMusicList } from './SelectedMusicList';
import { MusicResponseDto } from '@repo/dto';

export const ContentWriteModal = ({ initialMusic }: { initialMusic?: MusicResponseDto }) => {
  const { closeModal } = useModalStore();

  // --- 지역상태 관리 ---
  const [selectedMusics, setSelectedMusics] = useState<MusicResponseDto[]>(initialMusic ? [initialMusic] : []);
  const [content, setContent] = useState('');

  const [customCoverPreview, setCustomCoverPreview] = useState<string | null>(null);
  const [customCoverFile, setCustomCoverFile] = useState<File | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // 현재 커버 이미지 계산 (커스텀 > 첫 번째 곡 커버 > 기본 이미지)
  const activeCover = customCoverPreview || selectedMusics[0]?.albumCoverUrl || 'https://via.placeholder.com/400?text=No+Music';

  // --- 핸들러 함수 ---
  // 파일 업로드
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCustomCoverFile(file);

    const url = URL.createObjectURL(file);
    setCustomCoverPreview(url);

    // 같은 파일 다시 선택 가능하게
    e.target.value = '';
  };

  // 모달 unmount 시 미리보기 URL 해제 (메모리 누수 방지)
  useEffect(() => {
    return () => {
      if (customCoverPreview) URL.revokeObjectURL(customCoverPreview);
    };
  }, [customCoverPreview]);

  // 컨텐츠 등록 api 요청
  const handleSubmit = async () => {
    const fd = new FormData();
    fd.append('content', content);

    fd.append(
      'musics',
      JSON.stringify(
        selectedMusics.map((m) => ({
          musicId: m.id,
          title: m.title,
          artistName: m.artistName,
          albumCoverUrl: m.albumCoverUrl,
          trackUri: m.trackUri,
          provider: m.provider,
          durationMs: m.durationMs,
        })),
      ),
    );

    if (customCoverFile) fd.append('coverImgUrl', customCoverFile);

    const res = await fetch('/api/post', {
      method: 'POST',
      body: fd,
      credentials: 'include',
    });

    if (!res.ok) throw new Error(`등록 실패 - ${res.body}`);

    closeModal();
  };

  // 음악 추가
  const handleAddMusic = (music: MusicResponseDto) => {
    // 중복 체크
    if (!selectedMusics.find((m) => m.id === music.id)) {
      setSelectedMusics([...selectedMusics, music]);
    }
    // 추가 후 검색창 초기화 및 닫기
    setSearchQuery('');
    setIsSearchOpen(false);
  };

  // 플레이리스트 통으로 추가
  const handleAddPlaylist = (playlist: Playlist) => {
    const newMusics = playlist.musics.filter((pMusic) => !selectedMusics.some((selected) => selected.id === pMusic.id));

    if (newMusics.length > 0) {
      setSelectedMusics([...selectedMusics, ...newMusics]);
    }
    setSearchQuery('');
    setIsSearchOpen(false);
  };

  // 음악 삭제 핸들러
  const handleRemoveMusic = (id: string) => {
    setSelectedMusics(selectedMusics.filter((m) => m.id !== id));
  };

  // 음악 순서 변경
  const handleMoveMusic = (index: number, direction: 'up' | 'down') => {
    const newMusics = [...selectedMusics];
    if (direction === 'up' && index > 0) {
      [newMusics[index], newMusics[index - 1]] = [newMusics[index - 1]!, newMusics[index]!];
    } else if (direction === 'down' && index < newMusics.length - 1) {
      [newMusics[index], newMusics[index + 1]] = [newMusics[index + 1]!, newMusics[index]!];
    }
    setSelectedMusics(newMusics);
  };

  // --- 3. 렌더링 (Render) ---
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-primary/40 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-[8px_8px_0px_0px_var(--color-primary)] border-2 border-primary flex flex-col max-h-[90vh] overflow-hidden transition-all">
        {/* 헤더 */}
        <div className="flex items-center justify-between px-6 py-4 border-b-2 border-primary bg-white z-10 shrink-0">
          <h2 className="text-xl font-black text-primary">새 게시물 만들기</h2>
          <button onClick={closeModal} className="p-1 hover:bg-gray-4 rounded-full transition-colors group">
            <X className="w-6 h-6 text-primary group-hover:text-accent-pink transition-colors" />
          </button>
        </div>

        {/* 바디 */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar flex flex-col">
          <div className="flex flex-col md:flex-row gap-6 mb-8">
            {/* 1. 커버 이미지 업로더 */}
            <CoverImgUploader currentCover={activeCover} onFileChange={handleFileChange} />

            {/* 2. 선택된 음악 리스트 */}
            <SelectedMusicList musics={selectedMusics} onRemove={handleRemoveMusic} onMove={handleMoveMusic} />
          </div>

          {/* 3. 검색 영역 */}
          <MusicSearch
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            isSearchOpen={isSearchOpen}
            setIsSearchOpen={setIsSearchOpen}
            onAddMusic={handleAddMusic}
            onAddPlaylist={handleAddPlaylist}
          />

          {/* 4. 텍스트 입력 */}
          <div className="mb-2">
            <label className="text-sm font-bold text-gray-1 mb-2 block">내용</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="이 음악에 대한 이야기를 들려주세요..."
              className="w-full h-32 p-4 rounded-xl border-2 border-primary text-primary bg-white focus:outline-none focus:ring-2 focus:ring-accent-cyan focus:bg-gray-4/30 resize-none font-medium custom-scrollbar placeholder:text-gray-2 transition-colors"
            />
          </div>
        </div>

        <div className="p-6 border-t-2 border-primary bg-white shrink-0 flex items-center justify-between">
          <button className="flex items-center text-gray-1 font-bold hover:text-primary transition-colors">
            <FolderOpen className="w-5 h-5 mr-2" />
            <span className="hidden sm:inline">임시 보관함</span>
          </button>

          <div className="flex gap-3">
            <button className="px-6 py-2.5 rounded-full font-bold border-2 border-gray-3 text-gray-1 hover:border-primary hover:text-primary hover:bg-gray-4 transition-colors">
              임시 저장
            </button>
            <button
              className="px-8 py-2.5 rounded-full font-bold bg-primary text-white border-2 border-primary hover:bg-white hover:text-primary hover:shadow-[4px_4px_0px_0px_var(--color-accent-cyan)] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
              disabled={selectedMusics.length === 0}
              onClick={handleSubmit}
            >
              등록
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
