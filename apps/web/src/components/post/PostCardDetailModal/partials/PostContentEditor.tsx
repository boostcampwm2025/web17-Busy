type Props = {
  value: string;
  isSaving: boolean;
  isSaveDisabled: boolean;
  onChange: (v: string) => void;
  onSave: () => void;
  onCancel: () => void;
};

export default function PostContentEditor({ value, isSaving, isSaveDisabled, onChange, onSave, onCancel }: Props) {
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => onChange(e.target.value);

  return (
    <div className="flex-1 overflow-y-auto p-4">
      <textarea
        className="w-full p-3 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-accent-cyan transition-all"
        value={value}
        onChange={handleChange}
        rows={10}
      />
      <div className="flex justify-end gap-2 mt-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-bold text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
        >
          취소
        </button>
        <button
          type="button"
          onClick={onSave}
          disabled={isSaveDisabled}
          className="px-4 py-2 text-sm font-bold text-white bg-accent-cyan rounded-lg hover:bg-cyan-500 transition-colors disabled:opacity-50"
        >
          {isSaving ? '저장 중...' : '저장'}
        </button>
      </div>
    </div>
  );
}
