export default function HomePage() {
  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <section className="hero min-h-96 bg-base-200">
        <div className="hero-content text-center">
          <div className="max-w-2xl">
            <h1 className="text-5xl font-bold mb-8">Welcome to BLGF Portal</h1>
            <p className="text-xl mb-8 text-base-content/70">
              Your comprehensive gateway to Bureau of Local Government Finance services, 
              providing efficient and transparent financial management solutions for local government units.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <button className="btn btn-primary btn-lg">
                <span>🚀</span>
                Get Started
              </button>
              <button className="btn btn-outline btn-lg">
                <span>📖</span>
                Learn More
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Stats */}
      <section className="container mx-auto px-4">
        <div className="stats stats-vertical lg:stats-horizontal shadow w-full">
          <div className="stat">
            <div className="stat-figure text-primary">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
            </div>
            <div className="stat-title">Registered LGUs</div>
            <div className="stat-value text-primary">1,634</div>
            <div className="stat-desc">Active local government units</div>
          </div>
          
          <div className="stat">
            <div className="stat-figure text-secondary">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div className="stat-title">Reports Processed</div>
            <div className="stat-value text-secondary">24,891</div>
            <div className="stat-desc">This fiscal year</div>
          </div>
          
          <div className="stat">
            <div className="stat-figure text-accent">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div className="stat-title">System Uptime</div>
            <div className="stat-value text-accent">99.8%</div>
            <div className="stat-desc">Average availability</div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="container mx-auto px-4 py-8">
        <h2 className="text-3xl font-bold text-center mb-8">Core Services</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Directory Card */}
          <div className="card bg-base-100 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
            <div className="card-body items-center text-center">
              <div className="text-4xl mb-4">📁</div>
              <h3 className="card-title">Directory</h3>
              <p className="text-base-content/70">Access comprehensive LGU contact information and organizational structure.</p>
              <div className="card-actions">
                <button className="btn btn-primary btn-sm">Browse Directory</button>
              </div>
            </div>
          </div>

          {/* SMV Profiling Card */}
          <div className="card bg-base-100 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
            <div className="card-body items-center text-center">
              <div className="text-4xl mb-4">📊</div>
              <h3 className="card-title">SMV Profiling</h3>
              <p className="text-base-content/70">Statistical Market Value profiling and financial analysis tools.</p>
              <div className="card-actions">
                <button className="btn btn-secondary btn-sm">View Analytics</button>
              </div>
            </div>
          </div>

          {/* QRRPA Card */}
          <div className="card bg-base-100 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
            <div className="card-body items-center text-center">
              <div className="text-4xl mb-4">📋</div>
              <h3 className="card-title">QRRPA Submission</h3>
              <p className="text-base-content/70">Quarterly Real Property Assessment report submissions.</p>
              <div className="card-actions">
                <button className="btn btn-accent btn-sm">Submit Report</button>
              </div>
            </div>
          </div>

          {/* Create/Manage Card */}
          <div className="card bg-base-100 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
            <div className="card-body items-center text-center">
              <div className="text-4xl mb-4">➕</div>
              <h3 className="card-title">Create & Manage</h3>
              <p className="text-base-content/70">Create new records and manage existing data entries.</p>
              <div className="card-actions">
                <button className="btn btn-warning btn-sm">Create New</button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Recent Activity Timeline */}
      <section className="container mx-auto px-4 py-8">
        <h2 className="text-3xl font-bold text-center mb-8">Recent System Activity</h2>
        <div className="timeline">
          <div className="timeline-item">
            <div className="timeline-start timeline-box">
              <div className="font-bold">System Update</div>
              <div className="text-sm opacity-70">Enhanced security features deployed</div>
            </div>
            <div className="timeline-middle">
              <div className="w-4 h-4 bg-primary rounded-full"></div>
            </div>
            <div className="timeline-end text-sm opacity-50">2 hours ago</div>
          </div>
          
          <div className="timeline-item">
            <div className="timeline-start text-sm opacity-50">5 hours ago</div>
            <div className="timeline-middle">
              <div className="w-4 h-4 bg-secondary rounded-full"></div>
            </div>
            <div className="timeline-end timeline-box">
              <div className="font-bold">Report Generated</div>
              <div className="text-sm opacity-70">Q3 2024 financial summary completed</div>
            </div>
          </div>
          
          <div className="timeline-item">
            <div className="timeline-start timeline-box">
              <div className="font-bold">New LGU Registration</div>
              <div className="text-sm opacity-70">Municipality of San Fernando joined the system</div>
            </div>
            <div className="timeline-middle">
              <div className="w-4 h-4 bg-accent rounded-full"></div>
            </div>
            <div className="timeline-end text-sm opacity-50">1 day ago</div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="bg-base-200 py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-xl mb-8 text-base-content/70 max-w-2xl mx-auto">
            Join thousands of local government units already using our platform 
            to streamline their financial operations and reporting processes.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <button className="btn btn-primary btn-lg">
              <span>📝</span>
              Register Your LGU
            </button>
            <button className="btn btn-outline btn-lg">
              <span>📞</span>
              Contact Support
            </button>
            <button className="btn btn-ghost btn-lg">
              <span>📚</span>
              View Documentation
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}