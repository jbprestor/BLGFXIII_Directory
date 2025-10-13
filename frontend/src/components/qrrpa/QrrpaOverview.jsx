import React from "react";

function formatDateTimePhilippines(value) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (isNaN(date.getTime())) return null;
  try {
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
      timeZone: "Asia/Manila",
    }).format(date);
  } catch {
    return null;
  }
}

function getRankIcon(rank) {
  switch(rank) {
    case 1: return "🏆";
    case 2: return "🥈";
    case 3: return "🥉";
    case 4: return "4️⃣";
    case 5: return "5️⃣";
    default: return "🏅";
  }
}

function getRankColor(rank) {
  switch(rank) {
    case 1: return "text-warning bg-warning/10 border-warning/20";
    case 2: return "text-base-content/70 bg-base-200 border-base-300";
    case 3: return "text-accent bg-accent/10 border-accent/20";
    case 4: return "text-info bg-info/10 border-info/20";
    case 5: return "text-success bg-success/10 border-success/20";
    default: return "text-base-content bg-base-200 border-base-300";
  }
}

function getCompletionBadge(completionRate, isCompleted) {
  if (isCompleted) {
    return <span className="text-xs bg-success text-success-content px-2 py-1 rounded-full font-semibold">✓ Complete</span>;
  } else if (completionRate >= 75) {
    return <span className="text-xs bg-warning text-warning-content px-2 py-1 rounded-full font-semibold">{completionRate}% Nearly Done</span>;
  } else if (completionRate >= 50) {
    return <span className="text-xs bg-info text-info-content px-2 py-1 rounded-full font-semibold">{completionRate}% In Progress</span>;
  } else if (completionRate > 0) {
    return <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded-full font-semibold">{completionRate}% Started</span>;
  } else {
    return <span className="text-xs bg-base-300 text-base-content px-2 py-1 rounded-full font-semibold">0% Not Started</span>;
  }
}

function getProgressBarColor(completionRate, isCompleted) {
  if (isCompleted) return "bg-success";
  if (completionRate >= 75) return "bg-warning";
  if (completionRate >= 50) return "bg-info";
  if (completionRate > 0) return "bg-orange-400";
  return "bg-base-300";
}

export default function QrrpaOverview({ records }) {
  // Debug: Let's see what we're working with
  console.log('QRRPA Records:', records);
  console.log('Sample record:', records[0]);
  
  // Filter submitted records and sort by submission date (earliest first)
  const submittedRecords = records
    .filter(r => r.status === 'Submitted' && r.dateSubmitted)
    .map(r => ({
      ...r,
      lguName: r.lguId?.name || r.lguName || 'Unknown LGU',
      province: r.lguId?.province || r.province || 'Unknown Province',
      classification: r.lguId?.classification || r.classification || 'Unknown',
      submissionDate: new Date(r.dateSubmitted)
    }))
    .sort((a, b) => a.submissionDate - b.submissionDate);

  // Top 5 LGUs (first to submit)
  const top5LGUs = submittedRecords.slice(0, 5);

  // We need to get the total municipalities from the LGU database, not just from QRRPA records
  // For now, let's create a mapping of known municipalities per province
  const KNOWN_MUNICIPALITIES_COUNT = {
    'Agusan del Sur': 13,
    'Agusan del Norte': 9, // Adjust these numbers based on your actual data
    'Surigao del Norte': 20,
    'Surigao del Sur': 17,
    'Dinagat Islands': 7
  };

  // Group all records by province to check completion (municipalities only)
  const provinceStats = records.reduce((acc, record) => {
    const province = record.province || record.lguId?.province || 'Unknown Province';
    const classification = record.classification || record.lguId?.classification || '';
    
    console.log(`Record: ${record.lguName || record.lguId?.name}, Province: ${province}, Classification: ${classification}`);
    
    // Only count municipalities (exact match with "Municipality")
    const isMunicipality = classification === 'Municipality';
    
    if (!acc[province]) {
      acc[province] = {
        total: KNOWN_MUNICIPALITIES_COUNT[province] || 0, // Use known count
        submitted: 0,
        submittedRecords: [],
        lastSubmissionDate: null
      };
    }
    
    if (isMunicipality && record.status === 'Submitted' && record.dateSubmitted) {
      acc[province].submitted++;
      acc[province].submittedRecords.push(record);
      const submissionDate = new Date(record.dateSubmitted);
      if (!acc[province].lastSubmissionDate || submissionDate > acc[province].lastSubmissionDate) {
        acc[province].lastSubmissionDate = submissionDate;
      }
    }
    return acc;
  }, {});

  console.log('Province Stats:', provinceStats);

  // Get all provinces with their completion status, sort completed provinces first, then by completion percentage
  const topProvinces = Object.entries(provinceStats)
    .map(([province, stats]) => ({
      province,
      totalLGUs: stats.total,
      submittedCount: stats.submitted,
      completionDate: stats.lastSubmissionDate,
      completionRate: Math.round((stats.submitted / stats.total) * 100),
      isCompleted: stats.submitted === stats.total && stats.submitted > 0
    }))
    .sort((a, b) => {
      // First sort by completion status (completed first)
      if (a.isCompleted && !b.isCompleted) return -1;
      if (!a.isCompleted && b.isCompleted) return 1;
      
      // If both completed, sort by completion date
      if (a.isCompleted && b.isCompleted) {
        return a.completionDate - b.completionDate;
      }
      
      // If both incomplete, sort by completion percentage (higher first)
      return b.completionRate - a.completionRate;
    });

  // Group by cities and get earliest submission per city
  const citySubmissions = submittedRecords
    .filter(r => r.classification && r.classification.toLowerCase().includes('city'))
    .reduce((acc, record) => {
      const cityName = record.lguName;
      if (!acc[cityName] || record.submissionDate < acc[cityName].submissionDate) {
        acc[cityName] = record;
      }
      return acc;
    }, {});

  const topCities = Object.values(citySubmissions)
    .sort((a, b) => a.submissionDate - b.submissionDate);

  // Overall statistics
  const totalRecords = records.length;
  const submittedCount = submittedRecords.length;
  const submissionRate = totalRecords > 0 ? ((submittedCount / totalRecords) * 100).toFixed(1) : 0;

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-xl p-4 border border-primary/20">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/20 rounded-lg">
              <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-primary">{submittedCount}</p>
              <p className="text-sm text-base-content/70">LGUs Submitted</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-secondary/10 to-secondary/5 rounded-xl p-4 border border-secondary/20">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-secondary/20 rounded-lg">
              <svg className="w-6 h-6 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-secondary">{submissionRate}%</p>
              <p className="text-sm text-base-content/70">Completion Rate</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-accent/10 to-accent/5 rounded-xl p-4 border border-accent/20">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-accent/20 rounded-lg">
              <svg className="w-6 h-6 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H9m0 0H5m0 0h2m0 0h4" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-accent">{totalRecords}</p>
              <p className="text-sm text-base-content/70">Total LGUs</p>
            </div>
          </div>
        </div>
      </div>

      {/* Top 5 LGUs Rankings */}
      <div className="bg-base-100 rounded-xl p-6 shadow-lg border border-base-300/50">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-yellow-100 rounded-lg">
            <span className="text-2xl">🏆</span>
          </div>
          <div>
            <h3 className="text-xl font-bold text-base-content">Top 5 Earliest Submissions</h3>
            <p className="text-sm text-base-content/60">LGUs who submitted first</p>
          </div>
        </div>

        {top5LGUs.length > 0 ? (
          <div className="space-y-3">
            {top5LGUs.map((record, index) => (
              <div 
                key={record._id || index} 
                className={`flex items-center justify-between p-4 rounded-lg border-2 ${getRankColor(index + 1)} transition-all duration-200 hover:shadow-md`}
              >
                <div className="flex items-center gap-4">
                  <div className="text-2xl">{getRankIcon(index + 1)}</div>
                  <div>
                    <p className="font-bold text-lg">{record.lguName}</p>
                    <p className="text-sm opacity-75">{record.province} • {record.classification}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{formatDateTimePhilippines(record.dateSubmitted)}</p>
                  <p className="text-xs opacity-75">#{index + 1} to submit</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-base-content/50">
            <div className="text-4xl mb-2">📋</div>
            <p>No submissions yet</p>
          </div>
        )}
      </div>

      {/* Province Rankings */}
      <div className="bg-base-100 rounded-xl p-6 shadow-lg border border-base-300/50">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-green-100 rounded-lg">
            <span className="text-2xl">🏛️</span>
          </div>
          <div>
            <h3 className="text-xl font-bold text-base-content">Province Submission Status</h3>
            <p className="text-sm text-base-content/60">All provinces showing municipalities only (excludes cities)</p>
          </div>
        </div>

        {topProvinces.length > 0 ? (
          <div className="space-y-4">
            {topProvinces.map((provinceData, index) => (
              <div 
                key={provinceData.province} 
                className="p-5 bg-base-200/50 rounded-xl border border-base-300/30 hover:bg-base-200/70 transition-all duration-200 shadow-sm"
              >
                {/* Province Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-primary text-primary-content rounded-full flex items-center justify-center font-bold text-lg">
                      {index + 1}
                    </div>
                    <div>
                      <h4 className="font-bold text-xl text-base-content">{provinceData.province}</h4>
                      <p className="text-base text-base-content/70">
                        <span className="font-semibold text-primary">{provinceData.submittedCount}</span> of <span className="font-semibold">{provinceData.totalLGUs}</span> municipalities submitted
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    {getCompletionBadge(provinceData.completionRate, provinceData.isCompleted)}
                    {provinceData.completionDate && (
                      <p className="text-sm text-base-content/60 mt-2">
                        Last submission: {formatDateTimePhilippines(provinceData.completionDate)}
                      </p>
                    )}
                  </div>
                </div>
                
                {/* Statistics Row */}
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="text-center p-3 bg-base-100 rounded-lg">
                    <p className="text-2xl font-bold text-primary">{provinceData.totalLGUs}</p>
                    <p className="text-xs text-base-content/60">Total Municipalities</p>
                  </div>
                  <div className="text-center p-3 bg-base-100 rounded-lg">
                    <p className="text-2xl font-bold text-success">{provinceData.submittedCount}</p>
                    <p className="text-xs text-base-content/60">Submitted</p>
                  </div>
                  <div className="text-center p-3 bg-base-100 rounded-lg">
                    <p className="text-2xl font-bold text-warning">{provinceData.totalLGUs - provinceData.submittedCount}</p>
                    <p className="text-xs text-base-content/60">Pending</p>
                  </div>
                </div>
                
                {/* Progress Bar */}
                <div className="w-full bg-base-300/50 rounded-full h-3 mb-2">
                  <div 
                    className={`h-3 rounded-full transition-all duration-500 ${getProgressBarColor(provinceData.completionRate, provinceData.isCompleted)}`}
                    style={{ width: `${provinceData.completionRate}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-sm text-base-content/60">
                  <span>0%</span>
                  <span className="font-semibold">{provinceData.completionRate}% Complete</span>
                  <span>100%</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-base-content/50">
            <div className="text-4xl mb-2">🏛️</div>
            <p>No province data available</p>
          </div>
        )}
      </div>

      {/* City Rankings */}
      <div className="bg-base-100 rounded-xl p-6 shadow-lg border border-base-300/50">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-blue-100 rounded-lg">
            <span className="text-2xl">🏙️</span>
          </div>
          <div>
            <h3 className="text-xl font-bold text-base-content">City Rankings</h3>
            <p className="text-sm text-base-content/60">Cities ranked by submission order</p>
          </div>
        </div>

        {topCities.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {topCities.map((record, index) => (
              <div 
                key={record.lguName} 
                className="flex items-center justify-between p-4 bg-base-200/50 rounded-lg border border-base-300/30 hover:bg-base-200/70 transition-all duration-200"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-secondary text-secondary-content rounded-full flex items-center justify-center font-bold text-sm">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-semibold">{record.lguName}</p>
                    <p className="text-xs text-base-content/60">{record.province}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">{formatDateTimePhilippines(record.dateSubmitted)}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-base-content/50">
            <div className="text-4xl mb-2">🏙️</div>
            <p>No city submissions yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
