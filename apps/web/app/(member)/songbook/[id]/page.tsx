export default async function SongDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-2xl font-bold">Song Detail</h1>
      <p className="mt-2 text-gray-600">
        Full lyrics and details for song {id} will be displayed here.
      </p>
    </div>
  );
}
