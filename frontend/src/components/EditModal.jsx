// components/EditModal.js
import { useState, useEffect } from 'react';

const EditModal = ({
  isOpen,
  editingPerson,
  updateLoading,
  onInputChange, 
  onUpdate,
  onClose,
  formatDate
}) => {
  const [localData, setLocalData] = useState(editingPerson || {});

  // Update local data when editingPerson changes
  useEffect(() => {
    if (editingPerson) {
      setLocalData(editingPerson);
    }
  }, [editingPerson]);

  if (!isOpen || !editingPerson) return null;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setLocalData(prev => ({
      ...prev,
      [name]: value
    }));
    // Also call the parent handler if provided
    if (onInputChange) {
      onInputChange(e);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onUpdate) {
      onUpdate(e);
    }
  };

  return (
    <div className="modal modal-open backdrop-blur-sm">
      <div className="modal-box max-w-5xl max-h-[95vh] overflow-hidden bg-gradient-to-br from-base-100 to-base-200 shadow-2xl border border-base-300">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-base-300 bg-gradient-to-r from-primary/10 to-secondary/10">
          <div className="flex items-center space-x-4">
            <div className="avatar placeholder">
              <div className="bg-primary text-primary-content rounded-full w-12 h-12">
                <span className="text-lg font-bold">{editingPerson.name?.charAt(0) || 'U'}</span>
              </div>
            </div>
            <div>
              <h3 className="font-bold text-2xl text-primary">Edit Personnel</h3>
              <p className="text-base-content/70">{editingPerson.name}</p>
            </div>
          </div>
          <button
            className="btn btn-ghost btn-circle"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(95vh-180px)]">
          <form onSubmit={handleSubmit}>
            {/* Personal Information Section */}
            <div className="mb-8">
              <div className="flex items-center mb-4">
                <div className="bg-primary/20 p-2 rounded-lg mr-3">
                  <svg className="w-5 h-5 text-primary" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                </div>
                <h4 className="text-xl font-semibold text-primary">Personal Information</h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">Full Name</span>
                  </label>
                  <input
                    type="text"
                    className="input input-bordered focus:input-primary"
                    name="name"
                    value={localData.name || ''}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">Sex</span>
                  </label>
                  <select
                    className="select select-bordered focus:select-primary"
                    name="sex"
                    value={localData.sex || ''}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select Sex</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">Civil Status</span>
                  </label>
                  <select
                    className="select select-bordered focus:select-primary"
                    name="civilStatus"
                    value={localData.civilStatus || ''}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select Status</option>
                    <option value="Single">Single</option>
                    <option value="Married">Married</option>
                    <option value="Widowed">Widowed</option>
                    <option value="Separated">Separated</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">Birthday</span>
                  </label>
                  <input
                    type="date"
                    className="input input-bordered focus:input-primary"
                    name="birthday"
                    value={localData.birthday ? new Date(localData.birthday).toISOString().split('T')[0] : ''}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">Email Address</span>
                  </label>
                  <input
                    type="email"
                    className="input input-bordered focus:input-primary"
                    name="emailAddress"
                    value={localData.emailAddress || ''}
                    onChange={handleInputChange}
                    placeholder="example@email.com"
                  />
                </div>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">Contact Number</span>
                  </label>
                  <input
                    type="text"
                    className="input input-bordered focus:input-primary"
                    name="contactNumber"
                    value={localData.contactNumber || ''}
                    onChange={handleInputChange}
                    placeholder="+63 XXX XXX XXXX"
                  />
                </div>
              </div>
            </div>

            {/* Employment Information Section */}
            <div className="mb-8">
              <div className="flex items-center mb-4">
                <div className="bg-secondary/20 p-2 rounded-lg mr-3">
                  <svg className="w-5 h-5 text-secondary" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6 6V5a3 3 0 013-3h2a3 3 0 013 3v1h2a2 2 0 012 2v3.57A22.952 22.952 0 0110 13a22.95 22.95 0 01-8-1.43V8a2 2 0 012-2h2zm2-1a1 1 0 011-1h2a1 1 0 011 1v1H8V5zm1 5a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <h4 className="text-xl font-semibold text-secondary">Employment Information</h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">LGU Type</span>
                  </label>
                  <select
                    className="select select-bordered focus:select-secondary"
                    name="lguType"
                    value={localData.lguType || ''}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select LGU Type</option>
                    <option value="City">City</option>
                    <option value="Municipality">Municipality</option>
                    <option value="Province">Province</option>
                  </select>
                </div>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">LGU Name</span>
                  </label>
                  <input
                    type="text"
                    className="input input-bordered focus:input-secondary"
                    name="lguName"
                    value={localData.lguName || ''}
                    onChange={handleInputChange}
                    required
                    placeholder="Enter LGU name"
                  />
                </div>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">Income Class</span>
                  </label>
                  <input
                    type="text"
                    className="input input-bordered focus:input-secondary"
                    name="incomeClass"
                    value={localData.incomeClass || ''}
                    onChange={handleInputChange}
                    required
                    placeholder="e.g., 1st Class"
                  />
                </div>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">Plantilla Position</span>
                  </label>
                  <input
                    type="text"
                    className="input input-bordered focus:input-secondary"
                    name="plantillaPosition"
                    value={localData.plantillaPosition || ''}
                    onChange={handleInputChange}
                    required
                    placeholder="Enter position title"
                  />
                </div>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">Status of Appointment</span>
                  </label>
                  <select
                    className="select select-bordered focus:select-secondary"
                    name="statusOfAppointment"
                    value={localData.statusOfAppointment || ''}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select Status</option>
                    <option value="Permanent">Permanent</option>
                    <option value="Temporary">Temporary</option>
                    <option value="Casual">Casual</option>
                    <option value="Job Order">Job Order</option>
                    <option value="Contractual">Contractual</option>
                  </select>
                </div>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">Salary Grade</span>
                  </label>
                  <input
                    type="text"
                    className="input input-bordered focus:input-secondary"
                    name="salaryGrade"
                    value={localData.salaryGrade || ''}
                    onChange={handleInputChange}
                    placeholder="e.g., SG-15"
                  />
                </div>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">Step Increment</span>
                  </label>
                  <input
                    type="number"
                    className="input input-bordered focus:input-secondary"
                    name="stepIncrement"
                    value={localData.stepIncrement || 0}
                    onChange={handleInputChange}
                    min="0"
                    max="8"
                  />
                </div>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">Date of Appointment</span>
                  </label>
                  <input
                    type="date"
                    className="input input-bordered focus:input-secondary"
                    name="dateOfAppointment"
                    value={localData.dateOfAppointment ? new Date(localData.dateOfAppointment).toISOString().split('T')[0] : ''}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Education & Qualifications Section */}
            <div className="mb-8">
              <div className="flex items-center mb-4">
                <div className="bg-accent/20 p-2 rounded-lg mr-3">
                  <svg className="w-5 h-5 text-accent" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" />
                  </svg>
                </div>
                <h4 className="text-xl font-semibold text-accent">Education & Qualifications</h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">Eligibility</span>
                  </label>
                  <input
                    type="text"
                    className="input input-bordered focus:input-accent"
                    name="eligibility"
                    value={localData.eligibility || ''}
                    onChange={handleInputChange}
                    placeholder="Enter eligibility/s"
                  />
                </div>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">PRC License Number</span>
                  </label>
                  <input
                    type="text"
                    className="input input-bordered focus:input-accent"
                    name="prcLicenseNumber"
                    value={localData.prcLicenseNumber || ''}
                    onChange={handleInputChange}
                    placeholder="Enter PRC license number"
                  />
                </div>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">Bachelor's Degree</span>
                  </label>
                  <input
                    type="text"
                    className="input input-bordered focus:input-accent"
                    name="bachelorDegree"
                    value={localData.bachelorDegree || ''}
                    onChange={handleInputChange}
                    placeholder="Enter bachelor's degree"
                  />
                </div>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">Master's Degree</span>
                  </label>
                  <input
                    type="text"
                    className="input input-bordered focus:input-accent"
                    name="masteralDegree"
                    value={localData.masteralDegree || ''}
                    onChange={handleInputChange}
                    placeholder="Enter master's degree"
                  />
                </div>
                <div className="form-control md:col-span-2">
                  <label className="label">
                    <span className="label-text font-medium">Doctoral Degree</span>
                  </label>
                  <input
                    type="text"
                    className="input input-bordered focus:input-accent"
                    name="doctoralDegree"
                    value={localData.doctoralDegree || ''}
                    onChange={handleInputChange}
                    placeholder="Enter doctoral degree"
                  />
                </div>
              </div>
            </div>
          </form>
        </div>

        {/* Modal Actions */}
        <div className="flex justify-between items-center p-6 border-t border-base-300 bg-base-50">
          <div className="text-sm text-base-content/60">
            Last updated: {formatDate(localData.updatedAt)}
          </div>
          <div className="flex space-x-3">
            <button
              type="button"
              className="btn btn-ghost"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary px-8"
              onClick={handleSubmit}
              disabled={updateLoading === localData._id}
            >
              {updateLoading === localData._id ? (
                <>
                  <span className="loading loading-spinner loading-sm"></span>
                  Updating...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Update Personnel
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditModal;