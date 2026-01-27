'use client';

type Props = {
  content: string;
  onClickMore?: () => void;
};

export default function PostContentPreview({ content, onClickMore }: Props) {
  const handleMore = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    onClickMore?.();
  };

  return (
    <div className="text-primary">
      <p className="text-base font-medium leading-relaxed line-clamp-3">{content}</p>
      <button type="button" onClick={handleMore} className="text-gray-400 text-sm font-bold mt-2 hover:text-primary">
        더보기...
      </button>
    </div>
  );
}
