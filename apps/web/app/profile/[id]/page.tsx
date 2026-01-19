export default async function Profile({ params }: { params: { id: string } }) {
  const { id } = await Promise.resolve(params);

  await new Promise((resolve) => setTimeout(resolve, 500));
  return (
    <div className="flex h-full justify-center items-center">
      <p className="text-xl">프로필 페이지 영역 {id}</p>
    </div>
  );
}
