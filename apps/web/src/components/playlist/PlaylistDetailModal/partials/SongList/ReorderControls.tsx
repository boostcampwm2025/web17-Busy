import { ChevronDown, ChevronUp } from 'lucide-react';

type Props = {
  index: number;
  isLast: boolean;
  onMove: (index: number, direction: 'up' | 'down') => void;
};

/** 곡 하나를 한 칸씩 올리고 내리는 컨트롤. 목록 양 끝에서는 해당 방향이 잠긴다. */
export function ReorderControls({ index, isLast, onMove }: Props) {
  return (
    <div className="flex flex-col ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
      <button onClick={() => onMove(index, 'up')} disabled={index === 0} className="p-0.5 hover:text-accent disabled:opacity-20">
        <ChevronUp className="w-3 h-3" />
      </button>
      <button onClick={() => onMove(index, 'down')} disabled={isLast} className="p-0.5 hover:text-accent disabled:opacity-20">
        <ChevronDown className="w-3 h-3" />
      </button>
    </div>
  );
}
