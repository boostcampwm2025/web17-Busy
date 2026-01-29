import { Check } from 'lucide-react';

interface AgreementItemProps {
  label: string;
  checked: boolean;
  onChange: () => void;
  onLinkClick?: () => void;
}

export const AgreementItem = ({ label, checked, onChange, onLinkClick }: AgreementItemProps) => (
  <div className="flex items-center justify-between group py-2">
    <div className="flex items-center gap-3 cursor-pointer flex-1" onClick={onChange}>
      <div
        className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
          checked ? 'bg-primary border-primary' : 'bg-white border-gray-300 group-hover:border-primary'
        }`}
      >
        <Check className={`w-3.5 h-3.5 text-white ${checked ? 'opacity-100' : 'opacity-0'}`} />
      </div>
      <span className={`text-sm ${checked ? 'text-primary font-medium' : 'text-gray-500'}`}>{label}</span>
    </div>
    {onLinkClick && (
      <button onClick={onLinkClick} className="text-gray-400 hover:text-primary transition-colors p-1">
        <span className="text-xs border-b border-gray-300">보기</span>
      </button>
    )}
  </div>
);
