import { useDragReorder } from '@/hooks/common/use-drag-reorder';
import { usePlayerStore } from '@/stores/usePlayerStore';
import QueueItem from './QueueItem';
import QueueToolbar from './QueueToolbar';

export default function QueueList() {
  const queue = usePlayerStore((s) => s.queue);
  const moveTo = usePlayerStore((s) => s.moveTo);

  const { dragOverIndex, getDragProps } = useDragReorder(moveTo);

  return (
    <div className="flex-1 flex flex-col p-6 overflow-hidden bg-gray-4/30">
      <QueueToolbar />

      {queue.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-center">
          <div>
            <p className="font-bold text-gray-1">재생목록이 비어있습니다.</p>
            <p className="text-sm text-gray-2 mt-1">음악을 추가하면 여기에서 관리할 수 있어요.</p>
          </div>
        </div>
      ) : (
        <ul className="flex-1 overflow-y-auto space-y-3 pr-1">
          {queue.map((music, index) => (
            <QueueItem
              key={`${music.id}-${index}`}
              music={music}
              index={index}
              isLast={index === queue.length - 1}
              isDragOver={dragOverIndex === index}
              dragProps={getDragProps(index)}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
