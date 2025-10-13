import { useMemo } from "react";

export default function SMVTimelineAlerts({ tableData }) {
  const urgentAlerts = useMemo(() => {
    if (!tableData || tableData.length === 0) return [];

    const alerts = [];

    tableData.forEach(row => {
      // Overdue LGUs
      if (row.complianceStatus === "Overdue") {
        alerts.push({
          type: "error",
          lgu: row.lguName,
          message: `${Math.abs(row.daysRemaining || 0)} days overdue!`,
          priority: 3,
        });
      }
      // At Risk LGUs
      else if (row.complianceStatus === "At Risk") {
        alerts.push({
          type: "warning",
          lgu: row.lguName,
          message: `Only ${row.daysRemaining || 0} days remaining`,
          priority: 2,
        });
      }
      // Specific milestone alerts
      if (row.alerts && row.alerts.length > 0) {
        row.alerts.forEach(alert => {
          alerts.push({
            type: alert.type === "danger" ? "error" : "warning",
            lgu: row.lguName,
            message: alert.message,
            priority: alert.type === "danger" ? 3 : 1,
          });
        });
      }
    });

    // Sort by priority (highest first)
    return alerts.sort((a, b) => b.priority - a.priority).slice(0, 5); // Show top 5
  }, [tableData]);

  if (urgentAlerts.length === 0) {
    return (
      <div className="alert alert-success shadow-lg mb-6">
        <div className="flex items-center gap-2">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <h3 className="font-bold">All LGUs On Track!</h3>
            <div className="text-sm opacity-80">No urgent deadlines or overdue items</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-3">
        <svg className="w-5 h-5 text-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <h3 className="text-lg font-bold text-base-content">Urgent Alerts</h3>
        <div className="badge badge-error">{urgentAlerts.length}</div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
        {urgentAlerts.map((alert, index) => (
          <div
            key={index}
            className={`alert ${
              alert.type === "error" ? "alert-error" : "alert-warning"
            } shadow-lg p-3 hover:scale-105 transition-transform duration-200`}
          >
            <div className="flex flex-col gap-1 w-full">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm">{alert.lgu}</span>
                {alert.type === "error" ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                )}
              </div>
              <p className="text-xs opacity-90">{alert.message}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
