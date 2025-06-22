import React from 'react';

export default function CandidateCard({ candidate }) {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-200">
      <div className="mb-4">
        <h3 className="text-2xl font-semibold text-gray-800">{candidate.name}</h3>
        <p className="text-sm text-gray-500">{candidate.email}</p>
      </div>

      <div className="mb-3">
        <span className="inline-block text-xs font-semibold uppercase text-gray-600 mb-1">
          Match Score
        </span>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className="bg-green-500 h-3 rounded-full transition-all"
            style={{ width: `${candidate.matchScore}%` }}
          ></div>
        </div>
        <p className="text-sm mt-1 text-green-700 font-medium">
          {candidate.matchScore}%
        </p>
      </div>

      <div className="mb-4">
        <span className="inline-block text-xs font-semibold uppercase text-gray-600 mb-1">
          Skills
        </span>
        <div className="flex flex-wrap gap-2 mt-1">
          {candidate.skills && candidate.skills.length > 0 ? (
            candidate.skills.map((skill, idx) => (
              <span
                key={idx}
                className="text-xs bg-green-100 text-green-800 font-medium px-3 py-1 rounded-full shadow-sm"
              >
                {skill}
              </span>
            ))
          ) : (
            <p className="text-sm text-gray-400">No skills listed</p>
          )}
        </div>
      </div>

      {candidate.summary && (
        <div className="mb-4">
          <span className="inline-block text-xs font-semibold uppercase text-gray-600 mb-1">
            Summary
          </span>
          <p className="text-sm text-gray-700 whitespace-pre-line leading-relaxed">
            {candidate.summary}
          </p>
        </div>
      )}

      {candidate.resumeUrl && (
        <a
          href={`https://drive.google.com/viewerng/viewer?embedded=true&url=${encodeURIComponent(candidate.resumeUrl)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-blue-600 hover:text-blue-800 underline font-medium"
        >
          View Resume
        </a>
      )}
    </div>
  );
}
