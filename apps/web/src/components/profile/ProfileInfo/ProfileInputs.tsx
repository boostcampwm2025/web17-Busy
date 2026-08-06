import type { ChangeEventHandler } from 'react';

type EditInputProps = {
  value: string;
  onChange: ChangeEventHandler<HTMLInputElement>;
  className?: string;
};

type EditTextareaProps = {
  value: string;
  onChange: ChangeEventHandler<HTMLTextAreaElement>;
};

export const EditInput = ({ value, onChange: handleChange, className = '' }: EditInputProps) => (
  <input
    type="text"
    value={value}
    onChange={handleChange}
    className={`border-b-2 border-primary/50 focus:border-primary bg-transparent outline-none px-1 text-primary w-full ${className}`}
    autoFocus
  />
);

export const EditTextarea = ({ value, onChange: handleChange }: EditTextareaProps) => (
  <textarea
    value={value}
    onChange={handleChange}
    className="w-full h-32 p-3 border-2 border-primary/20 rounded-lg focus:border-primary outline-none bg-white/50 resize-none text-primary leading-relaxed"
    placeholder="자기소개를 입력해주세요."
  />
);
