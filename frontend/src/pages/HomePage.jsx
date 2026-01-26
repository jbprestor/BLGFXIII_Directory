import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext.jsx";
import UserLoginModal from "../components/modals/users/UserLoginModal.jsx";
import UserRegisterModal from "../components/modals/users/UserRegisterModal.jsx";
import useApi from "../services/axios.js";
import { useNavigate } from "react-router";
import { Building, Users, AlertCircle, BarChart3, ChevronRight, FileText } from "../components/common/Icon";

export default function HomePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { getDashboardStats } = useApi();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadStats();
    }
  }, [user]);

  const loadStats = async () => {
    try {
      const res = await getDashboardStats();
      setStats(res.data);
    } catch (err) {
      console.error("Failed to load dashboard stats", err);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="max-w-7xl mx-auto">
        {/* Landing Hero */}
        <section className="bg-base-100 rounded-xl shadow-lg border border-base-300/50 p-4 sm:p-12 min-h-[calc(100vh-100px)] flex flex-col items-center justify-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />

          <div className="text-center max-w-2xl relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="w-32 h-32 mx-auto mb-6 flex items-center justify-center">
              <img
                src="https://blgf.gov.ph/wp-content/uploads/2022/05/BLGF-Seal-Regular.png"
                alt="BLGF Logo"
                className="w-full h-full object-contain drop-shadow-xl"
              />
            </div>

            <h1 className="text-4xl sm:text-5xl font-extrabold text-base-content mb-4 tracking-tight">
              BLGF Region XIII
            </h1>
            <p className="text-base-content/60 text-xl mb-8 font-light">
              Integrated Monitoring & Assessment Portal
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => setIsLoginModalOpen(true)}
                className="btn btn-primary btn-lg shadow-xl shadow-primary/20 hover:scale-105 transition-transform"
              >
                Login to Portal
              </button>
              <button className="btn btn-outline btn-lg hover:bg-base-200">
                Learn More
              </button>
            </div>
          </div>
        </section>

        {isLoginModalOpen && (
          <UserLoginModal
            onClose={() => setIsLoginModalOpen(false)}
            onSuccess={() => setIsLoginModalOpen(false)}
            onRequestAccess={() => {
              setIsLoginModalOpen(false);
              setIsRegisterModalOpen(true);
            }}
          />
        )}

        {isRegisterModalOpen && (
          <UserRegisterModal
            onClose={() => setIsRegisterModalOpen(false)}
            onGoToLogin={() => {
              setIsRegisterModalOpen(false);
              setIsLoginModalOpen(true);
            }}
          />
        )}
      </div>
    );
  }

  // authenticated view
  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Dashboard</h1>
          <p className="text-base-content/60">Welcome back, {user.firstName}!</p>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-sm btn-ghost" onClick={loadStats}>Refresh Data</button>
        </div>
      </div>

      {/* 1. THE PULSE (Real-time Stats) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Registered LGUs"
          value={loading ? "..." : stats?.totalLgus}
          icon={<Building className="w-6 h-6 text-blue-500" />}
          color="bg-blue-500/10"
          onClick={() => navigate('/lgu-profile')}
        />
        <StatCard
          title="Active Assessors"
          value={loading ? "..." : stats?.totalAssessors}
          icon={<Users className="w-6 h-6 text-purple-500" />}
          color="bg-purple-500/10"
          onClick={() => navigate('/directory')}
        />
        <StatCard
          title="Vacant Head Assessors"
          value={loading ? "..." : stats?.vacantHeadAssessors}
          icon={<AlertCircle className="w-6 h-6 text-orange-500" />}
          className={stats?.vacantHeadAssessors > 0 ? "border-orange-200 bg-orange-50" : ""}
          color="bg-orange-500/10"
          trend="Action Needed"
          trendColor="text-orange-600"
          onClick={() => navigate('/lgu-profile?filter=vacant_head')}
        />
        <StatCard
          title="SMV Projects At Risk"
          value={loading ? "..." : stats?.smvStats?.atRisk}
          icon={<BarChart3 className="w-6 h-6 text-red-500" />}
          className={stats?.smvStats?.atRisk > 0 ? "border-red-200 bg-red-50" : ""}
          color="bg-red-500/10"
          trend="Compliance Alert"
          trendColor="text-red-600"
          onClick={() => navigate('/smv-monitoring')}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 2. SMV PIPELINE CHART */}
        <div className="lg:col-span-2 card bg-base-100 shadow-sm border border-base-200">
          <div className="card-body">
            <h3 className="card-title text-base sm:text-lg flex justify-between">
              <span>SMV Revision Status (2025)</span>
              <span className="text-xs font-normal opacity-60 bg-base-200 px-2 py-1 rounded">Live Pipeline</span>
            </h3>

            <div className="mt-4 space-y-4">
              {loading ? (
                <div className="h-48 flex items-center justify-center text-base-content/30">Loading pipeline data...</div>
              ) : (
                <div className="space-y-3">
                  {Object.entries(stats?.smvStats?.pipeline || {})
                    .filter(([_, count]) => count > 0)
                    .sort((a, b) => b[1] - a[1]) // Sort by count desc
                    .map(([stage, count]) => {
                      const total = stats?.smvStats?.total || 1;
                      const percentage = Math.round((count / total) * 100);
                      return (
                        <div key={stage} className="group">
                          <div className="flex justify-between text-sm mb-1">
                            <span className="font-medium text-base-content/80">{stage}</span>
                            <span className="text-base-content/60">{count} LGUs ({percentage}%)</span>
                          </div>
                          <div className="h-3 w-full bg-base-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary transition-all duration-1000 ease-out rounded-full group-hover:brightness-110 relative"
                              style={{ width: `${percentage}%` }}
                            >
                              <div className="absolute inset-0 bg-white/20 animate-[shimmer_2s_infinite]"></div>
                            </div>
                          </div>
                        </div>
                      );
                    })}

                  {(!stats?.smvStats?.pipeline || Object.values(stats.smvStats.pipeline).every(v => v === 0)) && (
                    <div className="text-center py-8 opacity-50 text-sm">No active SMV revisions found.</div>
                  )}
                </div>
              )}
            </div>

            <div className="card-actions justify-end mt-4">
              <button className="btn btn-sm btn-outline gap-2" onClick={() => navigate('/smv-monitoring')}>
                View Full Monitoring <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* 3. QUICK ACTIONS / SHORTCUTS */}
        <div className="card bg-base-100 shadow-sm border border-base-200 h-fit">
          <div className="card-body">
            <h3 className="card-title text-base sm:text-lg mb-2">Quick Actions</h3>
            <div className="grid grid-cols-1 gap-2">
              <button className="btn btn-ghost justify-start h-auto py-3 px-4 bg-base-200/50 hover:bg-base-200" onClick={() => navigate('/qrrpa-monitoring')}>
                <div className="p-2 rounded-lg bg-green-100 text-green-600 mr-3"><FileText className="w-5 h-5" /></div>
                <div className="text-left">
                  <div className="font-medium">Submit QRRPA</div>
                  <div className="text-xs opacity-60">Upload quarterly report</div>
                </div>
              </button>
              <button className="btn btn-ghost justify-start h-auto py-3 px-4 bg-base-200/50 hover:bg-base-200" onClick={() => navigate('/assessors/new')}>
                <div className="p-2 rounded-lg bg-indigo-100 text-indigo-600 mr-3"><Users className="w-5 h-5" /></div>
                <div className="text-left">
                  <div className="font-medium">Add New Assessor</div>
                  <div className="text-xs opacity-60">Register staff profile</div>
                </div>
              </button>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}

function StatCard({ title, value, icon, color, trend, trendColor, className = "", onClick }) {
  return (
    <div
      onClick={onClick}
      className={`card bg-base-100 shadow-sm border border-base-200 hover:shadow-md transition-all cursor-pointer ${className}`}
    >
      <div className="card-body p-5">
        <div className="flex justify-between items-start">
          <div>
            <div className="text-sm font-medium text-base-content/60 mb-1">{title}</div>
            <div className="text-3xl font-bold">{value}</div>
            {trend && <div className={`text-xs font-medium mt-1 ${trendColor}`}>{trend}</div>}
          </div>
          <div className={`p-3 rounded-xl ${color}`}>
            {icon}
          </div>
        </div>
      </div>
    </div>
  );
}
