import React from "react";

export default function SkillBadgeList({ skills = [] }) {
  if (!skills.length) return null;

  return (
    <div className="mt-2 flex flex-wrap gap-2">
      {skills.map((skill, index) => (
        <span
          key={index}
          className="bg-gradient-to-r from-green-200 via-green-100 to-green-200 
                     text-green-800 text-sm font-medium px-3 py-1 
                     rounded-full shadow-sm border border-green-300"
        >
          {skill}
        </span>
      ))}
    </div>
  );
}
