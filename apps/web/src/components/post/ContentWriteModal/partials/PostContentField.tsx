type Props = {
  value: string;
  onChange: (v: string) => void;
};

export const PostContentField = ({ value, onChange }: Props) => {
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => onChange(e.target.value);

  return (
    <div className="mb-2">
      <label htmlFor="postContent" className="text-sm font-bold text-gray-1 mb-2 block">
        내용
      </label>
      <textarea
        id="postContent"
        value={value}
        onChange={handleChange}
        placeholder="이 음악에 대한 이야기를 들려주세요..."
        className="w-full h-32 p-4 rounded-xl border-2 border-primary text-primary bg-white focus:outline-none focus:ring-2 focus:ring-accent-cyan focus:bg-gray-4/30 resize-none font-medium custom-scrollbar placeholder:text-gray-2 transition-colors"
      />
    </div>
  );
};
