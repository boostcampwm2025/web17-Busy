export default function LoadingSpinner() {
  return (
    <div className="flex h-full min-h-50 w-full items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-black" />
    </div>
  );
}
