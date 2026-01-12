export default function LoadingSpinner({ hStyle }: { hStyle?: string }) {
  return (
    <div className={`flex w-full items-center justify-center ${hStyle ? hStyle : 'h-full min-h-50'}`}>
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-black" />
    </div>
  );
}
