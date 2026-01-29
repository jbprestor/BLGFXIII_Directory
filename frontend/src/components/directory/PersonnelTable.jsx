// components/directory/PersonnelTable.jsx
import React, { useState } from "react";

export default function PersonnelTable({
  data,
  onViewDetails,
  onEdit,
  onDelete,
  deleteLoading,
  currentPage,
  totalPages,
  onPageChange,
  canEdit = false,
  canDelete = false,
}) {
  const [expandedRow, setExpandedRow] = useState(null);

  const toggleRowExpansion = (id) =>
    setExpandedRow(expandedRow === id ? null : id);

  return (
    <div className="card bg-base-100 shadow-xl border border-base-300 overflow-hidden">
      <div className="card-body p-0">
        {/* Desktop Table View */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="table table-zebra w-full">
            <thead>
              <tr className="bg-base-200">
                <th className="p-2 text-xs sm:text-sm">Name</th>
                <th className="p-2 text-xs sm:text-sm hidden sm:table-cell">
                  LGU Type
                </th>
                <th className="p-2 text-xs sm:text-sm hidden md:table-cell">
                  LGU Name
                </th>
                <th className="p-2 text-xs sm:text-sm">Position</th>
                <th className="p-2 text-xs sm:text-sm hidden lg:table-cell">
                  Status
                </th>
                <th className="p-2 text-xs sm:text-sm">Actions</th>
              </tr>
            </thead>

            <tbody>
              {data.map((person) => (
                <React.Fragment key={person._id}>
                  <tr
                    className="hover cursor-pointer"
                    onClick={() => toggleRowExpansion(person._id)}
                  >
                    {/* Name */}
                    <td className="p-2">
                      <div className="flex items-center space-x-3">
                        <div className="avatar placeholder">
                          <div className="bg-neutral text-neutral-content rounded-full w-8 sm:w-10">
                            <span className="text-xs sm:text-sm">
                              {person?.fullName?.charAt(0)?.toUpperCase() ||
                                "U"}
                            </span>
                          </div>
                        </div>
                        <div>
                          <div className="font-bold text-xs sm:text-sm">
                            {person.fullName || "Unnamed"}
                          </div>
                          <div className="text-xs opacity-50">
                            {person.personalEmail || person.officeEmail
                              ? `${person.personalEmail || "N/A"} / ${person.officeEmail || "N/A"
                              }`
                              : "N/A"}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* LGU Type */}
                    <td className="p-2 hidden sm:table-cell">
                      <span
                        className={`badge badge-xs sm:badge-sm ${person.lguType === "City"
                          ? "badge-primary"
                          : person.lguType === "Municipality"
                            ? "badge-secondary"
                            : person.lguType === "Province"
                              ? "badge-accent"
                              : "badge-outline"
                          }`}
                      >
                        {person.lguType || "N/A"}
                      </span>
                    </td>

                    {/* LGU Name */}
                    <td className="p-2 hidden md:table-cell">
                      {person.lguName || "N/A"}
                    </td>

                    {/* Position */}
                    <td className="p-2 text-xs sm:text-sm">
                      {person.plantillaPosition || "N/A"}
                    </td>

                    {/* Status */}
                    <td className="p-2 hidden lg:table-cell">
                      <span className="badge badge-outline badge-xs sm:badge-sm">
                        {person.statusOfAppointment || "N/A"}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="p-2" onClick={(e) => e.stopPropagation()}>
                      <div className="flex flex-wrap gap-1">
                        <button
                          className="btn btn-primary btn-xs"
                          onClick={() => onViewDetails(person)}
                        >
                          Details
                        </button>

                        {canEdit && onEdit && (
                          <button
                            className="btn btn-info btn-xs"
                            onClick={() => onEdit(person)}
                          >
                            Update
                          </button>
                        )}

                        {canDelete && onDelete && (
                          <button
                            className="btn btn-error btn-xs"
                            onClick={() => onDelete(person)}
                            disabled={deleteLoading === person._id}
                          >
                            {deleteLoading === person._id ? (
                              <span className="loading loading-spinner loading-xs"></span>
                            ) : (
                              "Delete"
                            )}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>

                  {/* Expanded Details */}
                  {expandedRow === person._id && (
                    <tr>
                      <td colSpan={6} className="bg-base-200 p-4">
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                          <div>
                            <strong>Personal Email:</strong>{" "}
                            {person.personalEmail || "N/A"}
                          </div>
                          <div>
                            <strong>Office Email:</strong>{" "}
                            {person.officeEmail || "N/A"}
                          </div>
                          <div>
                            <strong>Contact:</strong>{" "}
                            {person.contactNumber || "N/A"}
                          </div>
                          <div>
                            <strong>Mobile:</strong>{" "}
                            {person.mobileNumber || "N/A"}
                          </div>
                          <div>
                            <strong>LGU:</strong> {person.lguName || "N/A"}
                          </div>
                          <div>
                            <strong>Status:</strong>{" "}
                            {person.statusOfAppointment || "N/A"}
                          </div>
                          <div>
                            <strong>Plantilla Position:</strong>{" "}
                            {person.plantillaPosition || "N/A"}
                          </div>
                          <div>
                            <strong>Official Designation:</strong>{" "}
                            {person.officialDesignation || "N/A"}
                          </div>
                          <div>
                            <strong>Salary Grade:</strong>{" "}
                            {person.salaryGrade || "N/A"}
                          </div>
                          <div>
                            <strong>PRC License:</strong>{" "}
                            {person.prcLicenseNumber || "N/A"}
                          </div>
                          <div>
                            <strong>PRC Expiry:</strong>{" "}
                            {person.prcLicenseExpiration
                              ? new Date(
                                person.prcLicenseExpiration
                              ).toLocaleDateString()
                              : "N/A"}
                          </div>
                          <div>
                            <strong>Appointment Date:</strong>{" "}
                            {person.dateOfAppointment
                              ? new Date(
                                person.dateOfAppointment
                              ).toLocaleDateString()
                              : "N/A"}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="sm:hidden flex flex-col divide-y divide-base-300">
          {data.map((person) => (
            <div key={person._id} className="p-4 bg-base-100 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="avatar placeholder flex-shrink-0">
                  <div className="bg-neutral text-neutral-content rounded-full w-10">
                    <span className="text-xs">
                      {person?.fullName?.charAt(0)?.toUpperCase() || "U"}
                    </span>
                  </div>
                </div>
                <div className="min-w-0">
                  <div className="font-bold text-sm truncate">
                    {person.fullName || "Unnamed"}
                  </div>
                  <div className="text-xs text-base-content/70 truncate">
                    {person.plantillaPosition || "Position N/A"}
                  </div>
                  <div className="text-[10px] text-base-content/50 uppercase tracking-wide">
                    {person.lguName || "LGU N/A"}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  className="btn btn-ghost btn-sm btn-circle"
                  onClick={() => onViewDetails(person)}
                  title="View Details"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </button>
                {(canEdit || canDelete) && (
                  <div className="dropdown dropdown-end">
                    <label tabIndex={0} className="btn btn-ghost btn-sm btn-circle">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                      </svg>
                    </label>
                    <ul tabIndex={0} className="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-32 z-50">
                      {canEdit && (
                        <li><button onClick={() => onEdit(person)}>Edit</button></li>
                      )}
                      {canDelete && (
                        <li><button className="text-error" onClick={() => onDelete(person)}>Delete</button></li>
                      )}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          ))}
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
                if (totalPages <= 5) pageNum = i + 1;
                else if (currentPage <= 3) pageNum = i + 1;
                else if (currentPage >= totalPages - 2)
                  pageNum = totalPages - 4 + i;
                else pageNum = currentPage - 2 + i;

                return (
                  <button
                    key={pageNum}
                    className={`join-item btn btn-xs sm:btn-sm ${currentPage === pageNum ? "btn-primary" : ""
                      }`}
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
