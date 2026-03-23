export default async function CheckInPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-2xl font-bold">Check-in</h1>
      <p className="mt-2 text-gray-600">
        Mark attendance for event {eventId}.
      </p>
    </div>
  );
}
