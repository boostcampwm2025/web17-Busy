import { toast } from 'react-toastify';

interface ConfirmToastProps {
  message: string;
  onConfirm: () => void;
  onCancel?: () => void;
}

export const showConfirmToast = (message: string, onConfirm: () => void) => {
  const ConfirmComponent = ({ closeToast }: { closeToast?: () => void }) => (
    <div className="flex flex-col items-center text-center gap-2 p-1 mx-auto">
      <p className="font-medium text-sm text-gray-800">{message}</p>
      <div className="flex justify-end gap-2 mt-1">
        <button onClick={closeToast} className="px-3 py-1 text-xs font-bold text-gray-500 bg-gray-100 rounded hover:bg-gray-200">
          취소
        </button>
        <button
          onClick={() => {
            onConfirm();
            closeToast?.();
          }}
          className="px-3 py-1 text-xs font-bold text-white bg-red-500 rounded hover:bg-red-600"
        >
          확인
        </button>
      </div>
    </div>
  );

  toast(<ConfirmComponent />, {
    position: 'top-center',
    autoClose: false,
    closeOnClick: false,
    draggable: false,
  });
};
