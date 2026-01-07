export default async function Home() {
  await new Promise((resolve) => setTimeout(resolve, 5000));
  return (
    <div className="flex h-full justify-center items-center">
      <p className="text-xl">피드 페이지 영역</p>
    </div>
  );
}
