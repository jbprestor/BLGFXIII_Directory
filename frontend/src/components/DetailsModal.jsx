// components/DetailsModal.js
const DetailsModal = ({
  isOpen,
  selectedPerson,
  onClose,
  onEdit,
  formatDate
}) => {
  if (!isOpen || !selectedPerson) return null;

  return (
    <div className="modal modal-open backdrop-blur-sm">
      <div className="modal-box max-w-6xl max-h-[95vh] overflow-hidden bg-gradient-to-br from-base-100 to-base-200 shadow-2xl border border-base-300">
        {/* Modal Header */}
        <div className="relative p-6 border-b border-base-300 bg-gradient-to-r from-primary/10 via-secondary/10 to-accent/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="avatar placeholder">
                <div className="bg-primary text-primary-content rounded-full w-16 h-16 ring-4 ring-primary/20">
                  <span className="text-2xl font-bold">{selectedPerson.name?.charAt(0) || 'U'}</span>
                </div>
              </div>
              <div>
                <h3 className="font-bold text-3xl text-primary mb-1">{selectedPerson.name}</h3>
                <p className="text-lg text-base-content/70">{selectedPerson.plantillaPosition}</p>
                <div className="flex items-center space-x-2 mt-2">
                  <span className={`badge ${selectedPerson.lguType === 'City' ? 'badge-primary' : selectedPerson.lguType === 'Municipality' ? 'badge-secondary' : 'badge-accent'}`}>
                    {selectedPerson.lguType}
                  </span>
                  <span className="badge badge-outline">{selectedPerson.statusOfAppointment}</span>
                </div>
              </div>
            </div>
            <button 
              className="btn btn-ghost btn-circle btn-lg"
              onClick={onClose}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(95vh-180px)]">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column */}
            <div className="space-y-6">
              {/* Personal Information */}
              <div className="card bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20">
                <div className="card-body p-6">
                  <div className="flex items-center mb-4">
                    <div className="bg-primary/20 p-2 rounded-lg mr-3">
                      <svg className="w-6 h-6 text-primary" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <h4 className="text-xl font-bold text-primary">Personal Information</h4>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-base-100 rounded-lg">
                      <span className="font-medium text-sm">Sex</span>
                      <span className="text-base-content/80">{selectedPerson.sex || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-base-100 rounded-lg">
                      <span className="font-medium text-sm">Civil Status</span>
                      <span className="text-base-content/80">{selectedPerson.civilStatus || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-base-100 rounded-lg">
                      <span className="font-medium text-sm">Birthday</span>
                      <span className="text-base-content/80">{formatDate(selectedPerson.birthday)}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-base-100 rounded-lg">
                      <span className="font-medium text-sm">Email</span>
                      <span className="text-base-content/80 truncate max-w-48">{selectedPerson.emailAddress || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-base-100 rounded-lg">
                      <span className="font-medium text-sm">Contact</span>
                      <span className="text-base-content/80">{selectedPerson.contactNumber || 'N/A'}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Education */}
              <div className="card bg-gradient-to-br from-accent/5 to-accent/10 border border-accent/20">
                <div className="card-body p-6">
                  <div className="flex items-center mb-4">
                    <div className="bg-accent/20 p-2 rounded-lg mr-3">
                      <svg className="w-6 h-6 text-accent" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z"/>
                      </svg>
                    </div>
                    <h4 className="text-xl font-bold text-accent">Education & Qualifications</h4>
                  </div>
                  <div className="space-y-3">
                    <div className="p-3 bg-base-100 rounded-lg">
                      <span className="font-medium text-sm block mb-1">Bachelor's Degree</span>
                      <span className="text-base-content/80">{selectedPerson.bachelorDegree || 'N/A'}</span>
                    </div>
                    <div className="p-3 bg-base-100 rounded-lg">
                      <span className="font-medium text-sm block mb-1">Master's Degree</span>
                      <span className="text-base-content/80">{selectedPerson.masteralDegree || 'N/A'}</span>
                    </div>
                    <div className="p-3 bg-base-100 rounded-lg">
                      <span className="font-medium text-sm block mb-1">Doctoral Degree</span>
                      <span className="text-base-content/80">{selectedPerson.doctoralDegree || 'N/A'}</span>
                    </div>
                    <div className="p-3 bg-base-100 rounded-lg">
                      <span className="font-medium text-sm block mb-1">Eligibility</span>
                      <span className="text-base-content/80">{selectedPerson.eligibility || 'N/A'}</span>
                    </div>
                    <div className="p-3 bg-base-100 rounded-lg">
                      <span className="font-medium text-sm block mb-1">PRC License Number</span>
                      <span className="text-base-content/80">{selectedPerson.prcLicenseNumber || 'N/A'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Right Column */}
            <div className="space-y-6">
              {/* Employment Details */}
              <div className="card bg-gradient-to-br from-secondary/5 to-secondary/10 border border-secondary/20">
                <div className="card-body p-6">
                  <div className="flex items-center mb-4">
                    <div className="bg-secondary/20 p-2 rounded-lg mr-3">
                      <svg className="w-6 h-6 text-secondary" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M6 6V5a3 3 0 013-3h2a3 3 0 013 3v1h2a2 2 0 012 2v3.57A22.952 22.952 0 0110 13a22.95 22.95 0 01-8-1.43V8a2 2 0 012-2h2zm2-1a1 1 0 011-1h2a1 1 0 011 1v1H8V5zm1 5a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <h4 className="text-xl font-bold text-secondary">Employment Details</h4>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-base-100 rounded-lg">
                      <span className="font-medium text-sm">LGU Type</span>
                      <span className="text-base-content/80">{selectedPerson.lguType || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-base-100 rounded-lg">
                      <span className="font-medium text-sm">LGU Name</span>
                      <span className="text-base-content/80">{selectedPerson.lguName || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-base-100 rounded-lg">
                      <span className="font-medium text-sm">Income Class</span>
                      <span className="text-base-content/80">{selectedPerson.incomeClass || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-base-100 rounded-lg">
                      <span className="font-medium text-sm">Position</span>
                      <span className="text-base-content/80">{selectedPerson.plantillaPosition || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-base-100 rounded-lg">
                      <span className="font-medium text-sm">Status</span>
                      <span className="text-base-content/80">{selectedPerson.statusOfAppointment || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-base-100 rounded-lg">
                      <span className="font-medium text-sm">Salary Grade</span>
                      <span className="text-base-content/80">{selectedPerson.salaryGrade || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-base-100 rounded-lg">
                      <span className="font-medium text-sm">Step</span>
                      <span className="text-base-content/80">{selectedPerson.stepIncrement || '0'}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-base-100 rounded-lg">
                      <span className="font-medium text-sm">Date Appointed</span>
                      <span className="text-base-content/80">{formatDate(selectedPerson.dateOfAppointment)}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Retirement Information */}
              <div className="card bg-gradient-to-br from-warning/5 to-warning/10 border border-warning/20">
                <div className="card-body p-6">
                  <div className="flex items-center mb-4">
                    <div className="bg-warning/20 p-2 rounded-lg mr-3">
                      <svg className="w-6 h-6 text-warning" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <h4 className="text-xl font-bold text-warning">Retirement Information</h4>
                  </div>
                  <div className="space-y-3">
                    <div className="p-3 bg-base-100 rounded-lg">
                      <span className="font-medium text-sm block mb-1">Mandatory Retirement Date</span>
                      <span className="text-base-content/80">{formatDate(selectedPerson.dateOfMandatoryRetirement)}</span>
                    </div>
                    <div className="p-3 bg-base-100 rounded-lg">
                      <span className="font-medium text-sm block mb-1">Compulsory Retirement Date</span>
                      <span className="text-base-content/80">{formatDate(selectedPerson.dateOfCompulsoryRetirement)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex justify-between items-center p-6 border-t border-base-300 bg-base-50">
          <div className="flex space-x-4">
            <div className="text-sm text-base-content/60">
              <span className="font-medium">ID:</span> {selectedPerson._id}
            </div>
            <div className="text-sm text-base-content/60">
              <span className="font-medium">Last Updated:</span> {formatDate(selectedPerson.updatedAt)}
            </div>
          </div>
          <div className="flex space-x-3">
            <button 
              className="btn btn-secondary"
              onClick={() => {
                onClose();
                onEdit(selectedPerson);
              }}
            >
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"/>
              </svg>
              Edit
            </button>
            <button
              className="btn btn-primary"
              onClick={onClose}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DetailsModal;