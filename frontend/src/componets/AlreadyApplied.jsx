export default function  AlreadyApplied  () {
    return (
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-md shadow-sm mb-6">
        <div className="flex items-center">
          <svg
            className="h-6 w-6 text-yellow-500 mr-3"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M13 16h-1v-4h-1m1-4h.01M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <p className="text-yellow-800 font-medium">
            You have already applied for this job.
          </p>
        </div>
      </div>
    );
  };
  