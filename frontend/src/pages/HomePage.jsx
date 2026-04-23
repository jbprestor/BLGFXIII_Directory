import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext.jsx";
import UserLoginModal from "../components/modals/users/UserLoginModal.jsx";
import UserRegisterModal from "../components/modals/users/UserRegisterModal.jsx";
import useApi from "../services/axios.js";
import { useNavigate } from "react-router";
import { Building, Users, AlertCircle, BarChart3, ChevronRight, FileText, Bell, Clock } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

export default function HomePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { getDashboardStats } = useApi();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // Carousel State
  const [activeAlertIndex, setActiveAlertIndex] = useState(0);

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

  // Generate dynamic alerts based on stats
  const generateAlerts = () => {
    if (!stats) return [];
    const alerts = [];
    if (stats.vacantHeadAssessors > 0) {
      alerts.push({ type: 'warning', text: `${stats.vacantHeadAssessors} LGUs have vacant Head Assessor positions`, link: '/lgu-profile?filter=vacant_head' });
    }
    if (stats.smvStats?.atRisk > 0) {
      alerts.push({ type: 'error', text: `${stats.smvStats.atRisk} SMV Projects are currently marked 'At Risk' or 'Delayed'`, link: '/smv-processes' });
    }
    if (alerts.length === 0) {
      alerts.push({ type: 'success', text: "All systems operational. No critical alerts today.", link: null });
    }
    return alerts;
  };

  const alerts = generateAlerts();

  useEffect(() => {
    if (alerts.length <= 1) return;
    const interval = setInterval(() => {
      setActiveAlertIndex((prev) => (prev + 1) % alerts.length);
    }, 5000); // Rotate every 5 seconds
    return () => clearInterval(interval);
  }, [alerts.length]);


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

  const COLORS = ['#10B981', '#F59E0B', '#EF4444', '#6366F1']; // Green, Yellow, Red, Indigo

  // authenticated view
  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12 animate-in fade-in duration-500">
      
      {/* HEADER & ALERTS */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Dashboard Overview</h1>
            <p className="text-base-content/60">Welcome back, {user.firstName}! Here's what's happening.</p>
          </div>
          <button className="btn btn-sm btn-outline gap-2" onClick={loadStats}>
             Refresh Data
          </button>
        </div>

        {/* NOTIFICATION CAROUSEL */}
        {!loading && alerts.length > 0 && (
          <div className={`alert ${alerts[activeAlertIndex].type === 'error' ? 'alert-error' : alerts[activeAlertIndex].type === 'warning' ? 'alert-warning' : 'alert-success'} shadow-sm py-3 transition-colors duration-500`}>
            <Bell className="w-5 h-5 shrink-0" />
            <span className="flex-1 text-sm font-medium">
              {alerts[activeAlertIndex].text}
            </span>
            {alerts[activeAlertIndex].link && (
               <button onClick={() => navigate(alerts[activeAlertIndex].link)} className="btn btn-xs btn-ghost">View</button>
            )}
            <div className="flex gap-1">
               {alerts.map((_, i) => (
                 <div key={i} className={`w-2 h-2 rounded-full ${i === activeAlertIndex ? 'bg-current opacity-100' : 'bg-current opacity-30'} transition-opacity`} />
               ))}
            </div>
          </div>
        )}
      </div>

      {/* ROW 1: THE PULSE (Real-time Stats) */}
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
          icon={<Users className="w-6 h-6 text-indigo-500" />}
          color="bg-indigo-500/10"
          onClick={() => navigate('/directory')}
        />
        <StatCard
          title="Vacant Head Assessors"
          value={loading ? "..." : stats?.vacantHeadAssessors}
          icon={<AlertCircle className="w-6 h-6 text-orange-500" />}
          className={stats?.vacantHeadAssessors > 0 ? "border-orange-200 bg-orange-50/50" : ""}
          color="bg-orange-500/10"
          trend={stats?.vacantHeadAssessors > 0 ? "Action Needed" : "All Filled"}
          trendColor={stats?.vacantHeadAssessors > 0 ? "text-orange-600" : "text-green-600"}
          onClick={() => navigate('/lgu-profile')}
        />
        <StatCard
          title="SMV Projects At Risk"
          value={loading ? "..." : stats?.smvStats?.atRisk}
          icon={<BarChart3 className="w-6 h-6 text-red-500" />}
          className={stats?.smvStats?.atRisk > 0 ? "border-red-200 bg-red-50/50" : ""}
          color="bg-red-500/10"
          trend={stats?.smvStats?.atRisk > 0 ? "Compliance Alert" : "All On Track"}
          trendColor={stats?.smvStats?.atRisk > 0 ? "text-red-600" : "text-green-600"}
          onClick={() => navigate('/smv-processes')}
        />
      </div>

      {/* ROW 2: DATA VISUALIZATIONS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* SMV PIPELINE BAR CHART */}
        <div className="lg:col-span-2 card bg-base-100 shadow-sm border border-base-200">
          <div className="card-body p-6">
            <h3 className="card-title text-lg mb-4">SMV Revision Pipeline</h3>
            <div className="h-72 w-full">
              {loading ? (
                <div className="h-full flex items-center justify-center opacity-50">Loading chart...</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats?.smvStats?.pipeline?.filter(d => d.count > 0) || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                    <XAxis dataKey="name" tick={{fontSize: 10}} interval={0} angle={-25} textAnchor="end" height={60} />
                    <YAxis tick={{fontSize: 12}} allowDecimals={false} />
                    <Tooltip cursor={{fill: '#f3f4f6'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                    <Bar dataKey="count" fill="#4f46e5" radius={[4, 4, 0, 0]} name="LGUs" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>

        {/* SMV RISK DONUT CHART */}
        <div className="card bg-base-100 shadow-sm border border-base-200">
          <div className="card-body p-6">
            <h3 className="card-title text-lg mb-4">SMV Risk Breakdown</h3>
            <div className="h-64 w-full flex items-center justify-center relative">
              {loading ? (
                <div className="opacity-50">Loading data...</div>
              ) : (
                <>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={stats?.smvStats?.riskBreakdown?.filter(d => d.value > 0) || [{name: 'No Data', value: 1}]}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                        stroke="none"
                      >
                        {(stats?.smvStats?.riskBreakdown?.filter(d => d.value > 0) || []).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                      <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{fontSize: '12px'}} />
                    </PieChart>
                  </ResponsiveContainer>
                  {/* Center Text */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-[-20px]">
                    <span className="text-2xl font-bold text-base-content">{stats?.smvStats?.total || 0}</span>
                    <span className="text-xs text-base-content/60">Total Projects</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ROW 3: RECENT ACTIVITY & QUICK ACTIONS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* RECENT ACTIVITY FEED */}
        <div className="lg:col-span-2 card bg-base-100 shadow-sm border border-base-200">
          <div className="card-body p-6">
            <h3 className="card-title text-lg mb-4">Recent Activity</h3>
            {loading ? (
              <div className="h-32 flex items-center justify-center opacity-50">Loading activities...</div>
            ) : stats?.recentActivities?.length > 0 ? (
              <div className="space-y-4">
                {stats.recentActivities.map((activity) => (
                  <div key={activity.id} className="flex gap-4 items-start pb-4 border-b border-base-200 last:border-0 last:pb-0">
                    <div className="p-2 rounded-full bg-primary/10 text-primary mt-1">
                      <Clock className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <p className="font-medium text-sm">
                          {activity.lguName} <span className="font-normal opacity-60">({activity.lguType})</span>
                        </p>
                        <span className="text-xs opacity-50">{new Date(activity.date).toLocaleDateString()}</span>
                      </div>
                      <p className="text-sm opacity-70 mt-1">
                        Updated {activity.type} to <span className="font-medium">{activity.status}</span>
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 opacity-50 text-sm">No recent activity found.</div>
            )}
          </div>
        </div>

        {/* QUICK ACTIONS */}
        <div className="card bg-base-100 shadow-sm border border-base-200 h-fit">
          <div className="card-body p-6">
            <h3 className="card-title text-lg mb-4">Quick Actions</h3>
            <div className="grid grid-cols-1 gap-3">
              <button className="btn justify-start h-auto py-3 px-4 bg-green-50 hover:bg-green-100 border-green-200 text-green-900 shadow-sm" onClick={() => navigate('/qrrpa-monitoring')}>
                <div className="p-2 rounded-lg bg-green-200/50 text-green-700 mr-2"><FileText className="w-5 h-5" /></div>
                <div className="text-left flex-1">
                  <div className="font-semibold text-sm">Submit QRRPA</div>
                  <div className="text-xs opacity-70">Upload quarterly report</div>
                </div>
                <ChevronRight className="w-4 h-4 opacity-50" />
              </button>
              
              <button className="btn justify-start h-auto py-3 px-4 bg-indigo-50 hover:bg-indigo-100 border-indigo-200 text-indigo-900 shadow-sm" onClick={() => navigate('/assessors/new')}>
                <div className="p-2 rounded-lg bg-indigo-200/50 text-indigo-700 mr-2"><Users className="w-5 h-5" /></div>
                <div className="text-left flex-1">
                  <div className="font-semibold text-sm">Add New Assessor</div>
                  <div className="text-xs opacity-70">Register staff profile</div>
                </div>
                <ChevronRight className="w-4 h-4 opacity-50" />
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
      className={`card bg-base-100 shadow-sm border border-base-200 hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer ${className}`}
    >
      <div className="card-body p-5">
        <div className="flex justify-between items-start">
          <div>
            <div className="text-xs font-medium text-base-content/60 mb-1 uppercase tracking-wider">{title}</div>
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
