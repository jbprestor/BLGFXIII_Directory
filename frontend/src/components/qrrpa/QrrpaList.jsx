import React from "react";

// Helper function for status badge colors and styling
function getStatusBadge(status) {
  const statusConfig = {
    "Not Submitted": {
      color: "badge-error",
      icon: "⏳",
      text: "Not Submitted"
    },
    "Submitted": {
      color: "badge-success", 
      icon: "✅",
      text: "Submitted"
    },
    "Late Submission": {
      color: "badge-warning",
      icon: "⚠️", 
      text: "Late Submission"
    }
  };

  const config = statusConfig[status] || {
    color: "badge-ghost",
    icon: "❓",
    text: status || "Unknown"
  };

  return (
    <span className={`badge ${config.color} gap-1 font-medium`}>
      <span>{config.icon}</span>
      {config.text}
    </span>
  );
}

// Helper function to format date and time
function formatDateTime(dateString) {
  if (!dateString) return "-";
  
  try {
    const date = new Date(dateString);
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return "Invalid Date";
    }
    
    // Manual formatting to avoid timezone issues
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    
    const year = date.getFullYear();
    const month = months[date.getMonth()];
    const day = date.getDate();
    let hours = date.getHours();
    const minutes = date.getMinutes();
    
    // Convert to 12-hour format
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // 0 should be 12
    
    // Format minutes with leading zero if needed
    const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;
    
    return `${month} ${day}, ${year} ${hours}:${formattedMinutes} ${ampm}`;
  } catch (error) {
    console.error('Date formatting error:', error);
    return "Invalid Date";
  }
}

export default function QrrpaList({ records, loading }) {
  return (
    <div className="bg-base-100 rounded-lg shadow-sm border border-base-300">
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <span className="loading loading-spinner loading-lg text-primary"></span>
          <span className="ml-3 text-base-content/70 font-medium">Loading records...</span>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="table table-zebra w-full">
            <thead className="bg-base-200">
              <tr className="text-base-content font-semibold">
                <th className="text-left">
                  <div className="flex items-center gap-2">
                    🏛️ <span>LGU</span>
                  </div>
                </th>
                <th className="text-center">
                  <div className="flex items-center justify-center gap-2">
                    📅 <span>Period</span>
                  </div>
                </th>
                <th className="text-center">
                  <div className="flex items-center justify-center gap-2">
                    📊 <span>Status</span>
                  </div>
                </th>
                <th className="text-center">
                  <div className="flex items-center justify-center gap-2">
                    🕒 <span>Date Submitted</span>
                  </div>
                </th>
                <th className="text-left">
                  <div className="flex items-center gap-2">
                    📝 <span>Description</span>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {records.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-12">
                    <div className="flex flex-col items-center gap-3">
                      <div className="text-4xl opacity-50">📭</div>
                      <div className="text-base-content/70 font-medium">No records found</div>
                      <div className="text-sm text-base-content/50">Try adjusting your search criteria or check back later</div>
                    </div>
                  </td>
                </tr>
              )}
              {records.map((record) => (
                <tr key={record._id || record.id} className="hover:bg-base-200/50 transition-colors">
                  <td className="font-medium text-base-content">
                    <div className="flex items-center gap-2">
                      <div className="avatar placeholder">
                        <div className="bg-primary text-primary-content rounded-full w-8 h-8 text-xs">
                          <span>{(record.lguId?.name || record.lguId || "-").charAt(0)}</span>
                        </div>
                      </div>
                      <div>
                        <div className="font-semibold">{record.lguId?.name || (record.lguId && (record.lguId.name || record.lguId)) || "-"}</div>
                        {record.lguId?.province && (
                          <div className="text-xs text-base-content/60">{record.lguId.province}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="text-center">
                    <span className="badge badge-outline badge-primary font-mono">
                      {record.period || "-"}
                    </span>
                  </td>
                  <td className="text-center">
                    {getStatusBadge(record.status)}
                  </td>
                  <td className="text-center font-medium text-base-content">
                    {formatDateTime(record.dateSubmitted)}
                  </td>
                  <td className="text-base-content">
                    <div className="max-w-xs">
                      {record.description ? (
                        <div className="tooltip tooltip-top" data-tip={record.description}>
                          <p className="truncate text-sm">{record.description}</p>
                        </div>
                      ) : (
                        <span className="text-base-content/50 italic text-sm">No description</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
