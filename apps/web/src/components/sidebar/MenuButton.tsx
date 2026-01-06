import { LucideProps } from 'lucide-react';
import { ForwardRefExoticComponent, RefAttributes } from 'react';

type MenuButtonProps = {
  Icon: ForwardRefExoticComponent<Omit<LucideProps, 'ref'> & RefAttributes<SVGSVGElement>>;
  label: string;
  handleClick: () => void;
  isActive: boolean;
  shouldShowSpan: boolean;
};

export default function MenuButton({ Icon, label, handleClick, isActive, shouldShowSpan }: MenuButtonProps) {
  return (
    <button
      title={label}
      onClick={handleClick}
      className={`w-full flex items-center p-3 rounded-xl transition-all duration-200
                  border-2 ${
                    isActive
                      ? 'bg-white border-primary shadow-[2px_2px_0px_0px_#00214D]'
                      : 'border-transparent hover:bg-gray-4 hover:border-primary/30'
                  }`}
    >
      <Icon />
      {shouldShowSpan && <span className="ml-4 font-bold whitespace-nowrap overflow-hidden">{label}</span>}
    </button>
  );
}
