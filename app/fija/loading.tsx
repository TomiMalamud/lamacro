export default function Loading() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="h-8 bg-gray-200 rounded animate-pulse mb-2"></div>
        <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2"></div>
      </div>

      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="w-full overflow-x-auto">
          <div className="min-w-full border-collapse border border-gray-300">
            <div className="bg-gray-100 h-12 border border-gray-300 animate-pulse"></div>
            {Array.from({ length: 10 }).map((_, index) => (
              <div
                key={index}
                className={`h-12 border border-gray-300 animate-pulse ${
                  index % 2 === 0 ? "bg-white" : "bg-gray-50"
                }`}
              ></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
