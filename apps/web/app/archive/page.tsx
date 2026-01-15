export default async function Archive() {
  await new Promise((resolve) => setTimeout(resolve, 5000));
  return (
    <div className="flex h-full justify-center items-center">
      <p className="text-xl">보관함 페이지 영역</p>
    </div>
  );
}
