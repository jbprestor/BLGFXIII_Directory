// components/PersonnelTable.js
import { useState } from "react";

export default function PersonnelTable({
  data,
  sortConfig,
  onSort,
  onViewDetails,
  onEdit,
  onDelete,
  deleteLoading,
  currentPage,
  totalPages,
  onPageChange
}) {
  const [expandedRow, setExpandedRow] = useState(null);

  const toggleRowExpansion = (id) => {
    setExpandedRow(expandedRow === id ? null : id);
  };

  return (
    <div className="card bg-base-100 shadow-xl border border-base-300 overflow-hidden">
      <div className="card-body p-0">
        <div className="overflow-x-auto">
          <table className="table table-zebra w-full">
            {/* Table Headers */}
            <thead>
              <tr className="bg-base-200">
                <th className="p-2 text-xs sm:text-sm">Name</th>
                <th className="p-2 text-xs sm:text-sm hidden sm:table-cell">LGU Type</th>
                <th className="p-2 text-xs sm:text-sm hidden md:table-cell">LGU Name</th>
                <th className="p-2 text-xs sm:text-sm">Position</th>
                <th className="p-2 text-xs sm:text-sm hidden lg:table-cell">Status</th>
                <th className="p-2 text-xs sm:text-sm">Actions</th>
              </tr>
            </thead>

            {/* Table Body */}
            <tbody>
              {data.map(person => (
                <>
                  <tr key={person._id} className="hover cursor-pointer" onClick={() => toggleRowExpansion(person._id)}>
                    {/* Table cells for each person */}
                    <td className="p-2">
                      <div className="flex items-center space-x-3">
                        <div className="avatar placeholder">
                          <div className="bg-neutral text-neutral-content rounded-full w-8 sm:w-10">
                            <span className="text-xs sm:text-sm">{person?.name?.charAt(0)?.toUpperCase() || 'U'}</span>
                          </div>
                        </div>
                        <div>
                          <div className="font-bold text-xs sm:text-sm">{person.name}</div>
                          <div className="text-xs opacity-50">{person.emailAddress || 'N/A'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-2 hidden sm:table-cell">
                      <span className={`badge badge-xs sm:badge-sm ${person.lguType === 'City' ? 'badge-primary' : person.lguType === 'Municipality' ? 'badge-secondary' : 'badge-accent'}`}>
                        {person.lguType}
                      </span>
                    </td>
                    <td className="p-2 hidden md:table-cell">{person.lguName}</td>
                    <td className="p-2 text-xs sm:text-sm">{person.plantillaPosition}</td>
                    <td className="p-2 hidden lg:table-cell">
                      <span className="badge badge-outline badge-xs sm:badge-sm">{person.statusOfAppointment}</span>
                    </td>
                    <td className="p-2" onClick={(e) => e.stopPropagation()}>
                      <div className="flex flex-wrap gap-1">
                        <button
                          className="btn btn-primary btn-xs"
                          onClick={() => onViewDetails(person)}
                        >
                          <span className="hidden sm:inline">Details</span>
                          <span className="sm:hidden">👁️</span>
                        </button>
                        <button
                          className="btn btn-info btn-xs"
                          onClick={() => onEdit(person)}
                        >
                          <span className="hidden sm:inline">Update</span>
                          <span className="sm:hidden">✏️</span>
                        </button>
                        <button
                          className="btn btn-error btn-xs"
                          onClick={() => onDelete(person)}
                          disabled={deleteLoading === person._id}
                        >
                          {deleteLoading === person._id ? (
                            <span className="loading loading-spinner loading-xs"></span>
                          ) : (
                            <>
                              <span className="hidden sm:inline">Delete</span>
                              <span className="sm:hidden">🗑️</span>
                            </>
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>

                  {/* Expanded row with additional details */}
                  {expandedRow === person._id && (
                    <tr>
                      <td colSpan="6" className="bg-base-200 p-4">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div><strong>Email:</strong> {person.emailAddress || 'N/A'}</div>
                          <div><strong>Contact:</strong> {person.contactNumber || 'N/A'}</div>
                          <div><strong>LGU:</strong> {person.lguName}</div>
                          <div><strong>Status:</strong> {person.statusOfAppointment}</div>
                          <div><strong>Salary Grade:</strong> {person.salaryGrade || 'N/A'}</div>
                          <div><strong>Appointment Date:</strong> {person.dateOfAppointment ? new Date(person.dateOfAppointment).toLocaleDateString() : 'N/A'}</div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center mt-4 sm:mt-6 pb-4">
            <div className="join">
              <button
                className="join-item btn btn-xs sm:btn-sm"
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                «
              </button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }

                return (
                  <button
                    key={pageNum}
                    className={`join-item btn btn-xs sm:btn-sm ${currentPage === pageNum ? 'btn-primary' : ''}`}
                    onClick={() => onPageChange(pageNum)}
                  >
                    {pageNum}
                  </button>
                );
              })}
              <button
                className="join-item btn btn-xs sm:btn-sm"
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                »
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}