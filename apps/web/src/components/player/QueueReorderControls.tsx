import { ChevronDown, ChevronUp } from 'lucide-react';

import { usePlayerStore } from '@/stores/usePlayerStore';

type Props = {
  index: number;
  isLast: boolean;
};

/** 큐에서 곡 하나를 한 칸씩 올리고 내리는 버튼 쌍. 목록 양 끝에서는 해당 방향이 잠긴다. */
export default function QueueReorderControls({ index, isLast }: Props) {
  const moveUp = usePlayerStore((s) => s.moveUp);
  const moveDown = usePlayerStore((s) => s.moveDown);

  const handleMoveUpClick = () => {
    moveUp(index);
  };

  const handleMoveDownClick = () => {
    moveDown(index);
  };

  return (
    <div className="flex flex-col">
      <button
        type="button"
        onClick={handleMoveUpClick}
        disabled={index === 0}
        title="위로"
        className="p-1 text-gray-1 enabled:hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed"
      >
        <ChevronUp className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={handleMoveDownClick}
        disabled={isLast}
        title="아래로"
        className="p-1 text-gray-1 enabled:hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed"
      >
        <ChevronDown className="w-4 h-4" />
      </button>
    </div>
  );
}
