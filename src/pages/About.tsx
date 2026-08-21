export default function About() {
  return (
    <div className="space-y-6">
      <h1 className="text-4xl font-bold text-gray-900">Map</h1>

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
        <iframe
          title="Google Maps preview"
          src="https://www.google.com/maps/d/embed?mid=1dpvIVeNtDy8QDSQ42dLNXsPGxEw2ruI"
          className="h-[calc(100vh-13rem)] min-h-[520px] w-full"
          loading="lazy"
        />
      </div>
    </div>
  );
}
