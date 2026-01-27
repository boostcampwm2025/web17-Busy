export const EditInput = ({ value, onChange, className = '' }: any) => (
  <input
    type="text"
    value={value}
    onChange={onChange}
    className={`border-b-2 border-primary/50 focus:border-primary bg-transparent outline-none px-1 text-primary w-full ${className}`}
    autoFocus
  />
);

export const EditTextarea = ({ value, onChange }: any) => (
  <textarea
    value={value}
    onChange={onChange}
    className="w-full h-32 p-3 border-2 border-primary/20 rounded-lg focus:border-primary outline-none bg-white/50 resize-none text-primary leading-relaxed"
    placeholder="자기소개를 입력해주세요."
  />
);
