type Props = {
  isSubmitDisabled: boolean;
  onSubmit: () => void;
};

export const ContentWriteFooter = ({ isSubmitDisabled, onSubmit }: Props) => (
  <div className="p-6 border-t-2 border-primary bg-white shrink-0 flex items-center flex-row-reverse">
    <button
      type="button"
      className="px-8 py-2.5 rounded-full font-bold bg-primary text-white border-2 border-primary hover:bg-white hover:text-primary hover:shadow-[4px_4px_0px_0px_var(--color-accent-cyan)] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
      disabled={isSubmitDisabled}
      onClick={onSubmit}
    >
      등록
    </button>
  </div>
);
