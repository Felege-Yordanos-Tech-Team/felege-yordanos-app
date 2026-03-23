export default function MemberDashboard() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-2xl font-bold">Welcome!</h1>
      <p className="mt-2 text-gray-600">
        Your member dashboard. Quick links to your activities.
      </p>
      <div className="mt-6 grid grid-cols-2 gap-4">
        <a
          href="/attendance"
          className="rounded-lg border p-4 text-center hover:bg-gray-50"
        >
          <p className="font-medium">Attendance</p>
          <p className="text-sm text-gray-500">View history</p>
        </a>
        <a
          href="/donate"
          className="rounded-lg border p-4 text-center hover:bg-gray-50"
        >
          <p className="font-medium">Donate</p>
          <p className="text-sm text-gray-500">Make a donation</p>
        </a>
      </div>
    </div>
  );
}
