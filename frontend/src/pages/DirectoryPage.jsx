import { useEffect, useState } from "react";
import axios from "axios";

export default function DirectoryPage() {
  const [directory, setDirectory] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLguType, setSelectedLguType] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // FETCH DATA FROM MONGODB
  useEffect(() => {
    const fetchDirectory = async () => {
      try {
        const res = await axios.get(
          "https://automatic-tribble-grqpw6gp9pq39jqx-5001.app.github.dev/api/directory"
        );
        setDirectory(res.data);
        console.log(res.data);
      } catch (err) {
        console.error("Error fetching directory:", err);
        setError("Failed to load directory");
      } finally {
        setLoading(false);
      }
    };

    fetchDirectory();
  }, []);

  // Filter data based on search and filters
  const filteredData = directory.filter(person => {
    const matchesSearch = 
      person.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      person.lguName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      person.plantillaPosition?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      person.emailAddress?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesLguType = selectedLguType === "all" || person.lguType === selectedLguType;
    const matchesStatus = selectedStatus === "all" || person.statusOfAppointment === selectedStatus;

    return matchesSearch && matchesLguType && matchesStatus;
  });

  const handleViewDetails = (person) => {
    // In a real app, this would navigate to a detailed view
    alert(`Viewing details for ${person.name}`);
  };

  const handleContact = (person) => {
    // In a real app, this would open a contact modal or form
    alert(`Contacting ${person.name}`);
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="loading loading-spinner loading-lg text-primary mb-4"></div>
          <p className="text-lg">Loading directory data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="alert alert-error shadow-lg max-w-md">
          <div>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="stroke-current flex-shrink-0 h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>{error}</span>
          </div>
          <button className="btn btn-sm btn-outline" onClick={() => window.location.reload()}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Page Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">BLGF Personnel Directory</h1>
        <p className="text-xl text-base-content/70 max-w-2xl mx-auto">
          Comprehensive directory of BLGF personnel across Local Government Units in the Philippines.
        </p>
      </div>

      {/* Search and Filters */}
      <div className="card bg-base-100 shadow-xl border border-base-300">
        <div className="card-body">
          <h2 className="card-title mb-4">Search & Filter</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            {/* Search Input */}
            <div className="form-control">
              <label className="label">
                <span className="label-text">Search Personnel</span>
              </label>
              <input
                type="text"
                placeholder="Search by name, LGU, position, or email..."
                className="input input-bordered w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* LGU Type Filter */}
            <div className="form-control">
              <label className="label">
                <span className="label-text">LGU Type</span>
              </label>
              <select
                className="select select-bordered w-full"
                value={selectedLguType}
                onChange={(e) => setSelectedLguType(e.target.value)}
              >
                <option value="all">All Types</option>
                <option value="City">City</option>
                <option value="Municipality">Municipality</option>
                <option value="Province">Province</option>
              </select>
            </div>

            {/* Status Filter */}
            <div className="form-control">
              <label className="label">
                <span className="label-text">Appointment Status</span>
              </label>
              <select
                className="select select-bordered w-full"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="Permanent">Permanent</option>
                <option value="Temporary">Temporary</option>
                <option value="Casual">Casual</option>
                <option value="Job Order">Job Order</option>
                <option value="Contractual">Contractual</option>
              </select>
            </div>
          </div>

          {/* Results Count */}
          <div className="flex justify-between items-center">
            <div className="badge badge-neutral badge-lg">
              {filteredData.length} result{filteredData.length !== 1 ? 's' : ''} found
            </div>
            <button className="btn btn-outline btn-sm">
              <span>📊</span>
              Export Results
            </button>
          </div>
        </div>
      </div>

      {/* Results Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredData.map(person => { 
          // Determine border color based on LGU type
          let borderColorClass = "border-primary/20"; // Default
          if (person.lguType === "City") borderColorClass = "border-blue-400";
          if (person.lguType === "Municipality") borderColorClass = "border-green-400";
          if (person.lguType === "Province") borderColorClass = "border-purple-400";
          
          return (
            <div 
              key={person._id} 
              className={`card bg-base-100 shadow-xl border-2 ${borderColorClass} hover:shadow-2xl transition-all duration-300 hover:scale-[1.02]`}
            >
              <div className="card-body">
                {/* Header */}
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="card-title text-lg">{person.name}</h3>
                    <div className="flex gap-2 mt-2">
                      <div className="badge badge-primary">{person.lguType}</div>
                      <div className="badge badge-outline">{person.statusOfAppointment}</div>
                    </div>
                  </div>
                  <div className={`badge ${person.sex === 'Male' ? 'badge-info' : 'badge-secondary'}`}>
                    {person.sex}
                  </div>
                </div>

                {/* Details */}
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <span>🏢</span>
                    <span><strong>LGU:</strong> {person.lguName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>💼</span>
                    <span><strong>Position:</strong> {person.plantillaPosition}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>💰</span>
                    <span><strong>Salary Grade:</strong> {person.salaryGrade || 'N/A'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>📧</span>
                    <span className="truncate">{person.emailAddress || 'N/A'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>📞</span>
                    <span>{person.contactNumber || 'N/A'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>🎓</span>
                    <span><strong>Education:</strong> {person.bachelorDegree || 'N/A'}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="card-actions justify-end mt-4">
                  <button
                    className="btn btn-outline btn-sm"
                    onClick={() => handleContact(person)}
                  >
                    <span>📧</span>
                    Contact
                  </button>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => handleViewDetails(person)}
                  >
                    <span>👁️</span>
                    View Details
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredData.length === 0 && !loading && (
        <div className="text-center py-16">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-2xl font-bold mb-2">No Results Found</h3>
          <p className="text-base-content/70 mb-4">
            Try adjusting your search terms or filters to find what you're looking for.
          </p>
          <button
            className="btn btn-primary"
            onClick={() => {
              setSearchTerm("");
              setSelectedLguType("all");
              setSelectedStatus("all");
            }}
          >
            Clear Filters
          </button>
        </div>
      )}

      {/* Quick Stats */}
      <div className="stats stats-vertical lg:stats-horizontal shadow w-full border border-base-300">
        <div className="stat border-base-300">
          <div className="stat-title">Total Personnel</div>
          <div className="stat-value text-primary">{directory.length}</div>
          <div className="stat-desc">Registered in system</div>
        </div>

        <div className="stat border-base-300">
          <div className="stat-title">Cities</div>
          <div className="stat-value text-secondary">
            {directory.filter(p => p.lguType === 'City').length}
          </div>
          <div className="stat-desc">Personnel in cities</div>
        </div>

        <div className="stat border-base-300">
          <div className="stat-title">Municipalities</div>
          <div className="stat-value text-accent">
            {directory.filter(p => p.lguType === 'Municipality').length}
          </div>
          <div className="stat-desc">Personnel in municipalities</div>
        </div>

        <div className="stat">
          <div className="stat-title">Provinces</div>
          <div className="stat-value text-warning">
            {directory.filter(p => p.lguType === 'Province').length}
          </div>
          <div className="stat-desc">Personnel in provinces</div>
        </div>
      </div>
    </div>
  );
}