import React from 'react';
import { useLGUImages } from "../../assets/LguImages.js";

export default function SMVExcelTable({ filteredTableData }) {
  const lguImages = useLGUImages();

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "-";
    
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date);
  };

  const getStatusColor = (status) => {
    if (status === 'Completed') return 'text-success font-medium';
    if (status === 'Delayed' || status === 'Overdue') return 'text-error font-medium';
    if (status === 'At Risk') return 'text-warning font-medium';
    return 'text-base-content/70';
  };

  return (
    <div className="bg-base-100 rounded-xl shadow-sm border border-base-200 overflow-hidden mt-6">
      <div className="overflow-x-auto">
        <table className="table table-zebra table-xs sm:table-sm w-full whitespace-nowrap">
          <thead className="bg-base-200/50 text-base-content text-[11px] uppercase tracking-wider relative group">
            <tr>
              <th className="font-bold py-3 px-4 border-b-2 border-base-300 sticky left-0 z-10 bg-base-200/90 backdrop-blur">LGU Name</th>
              <th className="font-bold py-3 px-3 border-b-2 border-base-300">Phase Status</th>
              <th className="font-bold py-3 px-3 border-b-2 border-base-300 text-center">1st Pub</th>
              <th className="font-bold py-3 px-3 border-b-2 border-base-300 text-center">2nd Pub</th>
              <th className="font-bold py-3 px-3 border-b-2 border-base-300 text-center">1st Cons</th>
              <th className="font-bold py-3 px-3 border-b-2 border-base-300 text-center">2nd Cons</th>
              <th className="font-bold py-3 px-3 border-b-2 border-base-300 text-center">RO Submission</th>
              <th className="font-bold py-3 px-3 border-b-2 border-base-300 text-center">RO Review</th>
              <th className="font-bold py-3 px-3 border-b-2 border-base-300 text-center">CO Review</th>
              <th className="font-bold py-3 px-3 border-b-2 border-base-300 text-center">SoF Approval</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-base-200">
            {filteredTableData.length === 0 ? (
              <tr>
                <td colSpan="10" className="text-center py-10 text-base-content/50 italic">
                  No LGUs found. Please adjust filters.
                </td>
              </tr>
            ) : (
              filteredTableData.map((row) => {
                const { timeline = {}, currentStage } = row;
                const {
                  firstPublicationDate,
                  secondPublicationDate,
                  firstPublicConsultationDate,
                  secondPublicConsultationDate,
                  regionalOfficeSubmissionDeadline,
                  roReviewDeadline,
                  blgfCentralOfficeReviewDeadline,
                  secretaryOfFinanceReviewDeadline
                } = timeline;

                return (
                  <tr key={row.lguId} className="hover:bg-base-200/30 transition-colors">
                    <td className="sticky left-0 z-10 bg-base-100 group-hover:bg-base-200/30 font-medium py-2 px-4 shadow-[1px_0_0_0_rgba(0,0,0,0.05)] text-xs">
                      {row.lguName}
                    </td>
                    <td className="py-2 px-3">
                      <span className="badge badge-sm badge-ghost text-[10px] font-semibold tracking-wide truncate max-w-[120px]">
                        {currentStage}
                      </span>
                    </td>
                    <td className={`py-2 px-3 text-center text-xs ${!firstPublicationDate ? 'text-base-content/30' : ''}`}>
                      {formatDate(firstPublicationDate)}
                    </td>
                    <td className={`py-2 px-3 text-center text-xs ${!secondPublicationDate ? 'text-base-content/30' : ''}`}>
                      {formatDate(secondPublicationDate)}
                    </td>
                    <td className={`py-2 px-3 text-center text-xs ${!firstPublicConsultationDate ? 'text-base-content/30' : ''}`}>
                      {formatDate(firstPublicConsultationDate)}
                    </td>
                    <td className={`py-2 px-3 text-center text-xs ${!secondPublicConsultationDate ? 'text-base-content/30' : ''}`}>
                      {formatDate(secondPublicConsultationDate)}
                    </td>
                    <td className={`py-2 px-3 text-center text-xs ${!regionalOfficeSubmissionDeadline ? 'text-base-content/30' : ''}`}>
                      {formatDate(regionalOfficeSubmissionDeadline)}
                    </td>
                    <td className={`py-2 px-3 text-center text-xs ${!roReviewDeadline ? 'text-base-content/30' : ''}`}>
                      {formatDate(roReviewDeadline)}
                    </td>
                    <td className={`py-2 px-3 text-center text-xs ${!blgfCentralOfficeReviewDeadline ? 'text-base-content/30' : ''}`}>
                      {formatDate(blgfCentralOfficeReviewDeadline)}
                    </td>
                    <td className={`py-2 px-3 text-center text-xs ${!secretaryOfFinanceReviewDeadline ? 'text-base-content/30' : ''}`}>
                      {formatDate(secretaryOfFinanceReviewDeadline)}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
