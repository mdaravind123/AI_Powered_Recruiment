import React from 'react';

export default function CandidateCard({ candidate }) {
  // Map application data structure to display format
  const name = candidate.candidateName || 'Name not shown';
  const email = candidate.candidateEmail || '';
  const skills = candidate.resumeAnalysis?.skills || [];
  const summary = candidate.resumeAnalysis?.summary || '';
  const matchScore = candidate.matchScore || 0;
  const resumeUrl = candidate.resumeUrl;

  return (
    <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-200">
      <div className="mb-4">
        <h3 className="text-2xl font-semibold text-gray-800">{name}</h3>
        {email && <p className="text-sm text-gray-500">{email}</p>}
      </div>

      <div className="mb-3">
        <span className="inline-block text-xs font-semibold uppercase text-gray-600 mb-1">
          Match Score
        </span>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className="bg-green-500 h-3 rounded-full transition-all"
            style={{ width: `${matchScore}%` }}
          ></div>
        </div>
        <p className="text-sm mt-1 text-green-700 font-medium">
          {matchScore}%
        </p>
      </div>

      <div className="mb-4">
        <span className="inline-block text-xs font-semibold uppercase text-gray-600 mb-1">
          Skills
        </span>
        <div className="flex flex-wrap gap-2 mt-1">
          {skills && skills.length > 0 ? (
            skills.map((skill, idx) => (
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

      {summary && (
        <div className="mb-4">
          <span className="inline-block text-xs font-semibold uppercase text-gray-600 mb-1">
            Summary
          </span>
          <p className="text-sm text-gray-700 whitespace-pre-line leading-relaxed">
            {summary}
          </p>
        </div>
      )}

      {resumeUrl && (
        <a
          href={`https://drive.google.com/viewerng/viewer?embedded=true&url=${encodeURIComponent(resumeUrl)}`}
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
