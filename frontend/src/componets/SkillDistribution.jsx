import React, { useMemo } from 'react';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const SkillDistribution = ({ applications }) => {
  // Aggregate skills from all applications
  const skillsData = useMemo(() => {
    const skillMap = {};
    
    applications.forEach(app => {
      if (app.resumeAnalysis?.skills && Array.isArray(app.resumeAnalysis.skills)) {
        app.resumeAnalysis.skills.forEach(skill => {
          skillMap[skill] = (skillMap[skill] || 0) + 1;
        });
      }
    });

    return Object.entries(skillMap)
      .map(([name, count]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        count,
        percentage: Math.round((count / applications.length) * 100)
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10); // Top 10 skills
  }, [applications]);

  const COLORS = [
    '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6',
    '#f97316', '#06b6d4', '#6366f1', '#84cc16', '#ef4444'
  ];

  if (skillsData.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow">
        <p className="text-gray-600 text-center">No skills data available</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-xl font-bold mb-6">Skill Distribution</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Bar Chart */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-semibold mb-4 text-center">Top Skills (Count)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={skillsData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#8b5cf6" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie Chart */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-semibold mb-4 text-center">Skill Distribution (%)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={skillsData}
                dataKey="count"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label
              >
                {skillsData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => `${value} candidates`} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Skills List */}
      <div className="mt-6">
        <h3 className="font-semibold mb-4">Skills Breakdown</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {skillsData.map((skill, index) => (
            <div key={skill.name} className="p-4 bg-gray-50 rounded-lg border-l-4" style={{ borderColor: COLORS[index % COLORS.length] }}>
              <p className="font-semibold text-sm">{skill.name}</p>
              <p className="text-2xl font-bold" style={{ color: COLORS[index % COLORS.length] }}>{skill.count}</p>
              <p className="text-xs text-gray-600 mt-1">{skill.percentage}% of candidates</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SkillDistribution;
