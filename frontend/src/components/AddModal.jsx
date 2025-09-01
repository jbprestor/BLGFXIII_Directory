// components/AddModal.js - Updated version
import { useState, useEffect } from "react";

export default function AddModal({ 
  isOpen, 
  onClose, 
  onAddPersonnel,
  loading  // Changed from isSubmitting to loading to match parent
}) {
  const [formData, setFormData] = useState({
    name: "",
    sex: "",
    civilStatus: "",
    lguType: "",
    lguName: "",
    incomeClass: "",
    plantillaPosition: "",
    statusOfAppointment: "",
    salaryGrade: "",
    stepIncrement: "",
    birthday: "",
    dateOfMandatoryRetirement: "",
    dateOfCompulsoryRetirement: "",
    bachelorDegree: "",
    masteralDegree: "",
    doctoralDegree: "",
    eligibility: "",
    emailAddress: "",
    contactNumber: "",
    dateOfAppointment: "",
    prcLicenseNumber: "",
  });

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setFormData({
        name: "", sex: "", civilStatus: "", lguType: "", lguName: "", incomeClass: "",
        plantillaPosition: "", statusOfAppointment: "", salaryGrade: "", stepIncrement: "",
        birthday: "", dateOfMandatoryRetirement: "", dateOfCompulsoryRetirement: "",
        bachelorDegree: "", masteralDegree: "", doctoralDegree: "", eligibility: "",
        emailAddress: "", contactNumber: "", dateOfAppointment: "", prcLicenseNumber: "",
      });
    }
  }, [isOpen]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate required fields
    const requiredFields = ['name', 'sex', 'civilStatus', 'lguType', 'lguName', 
                           'incomeClass', 'plantillaPosition', 'statusOfAppointment', 
                           'birthday', 'dateOfAppointment'];
    
    const missingFields = requiredFields.filter(field => !formData[field]);
    
    if (missingFields.length > 0) {
      alert(`Please fill in all required fields: ${missingFields.join(', ')}`);
      return;
    }

    try {
      await onAddPersonnel(formData);
      // Don't close here - let parent handle it on success
    } catch (error) {
      console.error('Error submitting form:', error);
    }
  };

  const handleClose = () => {
    onClose();
  };

  const lguTypes = ["City", "Municipality", "Province"];
  const appointmentStatuses = ["Permanent", "Temporary", "Casual", "Job Order", "Contractual"];
  const civilStatuses = ["Single", "Married", "Widowed", "Separated", "Other"];
  const sexOptions = ["Male", "Female", "Other"];
  const incomeClasses = ["1st Class", "2nd Class", "3rd Class", "4th Class", "5th Class", "6th Class"];

  if (!isOpen) return null;

  return (
    <div className="modal modal-open backdrop-blur-sm">
      <div className="modal-box max-w-5xl max-h-[95vh] overflow-hidden bg-gradient-to-br from-base-100 to-base-200 shadow-2xl border border-base-300">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-base-300 bg-gradient-to-r from-primary/10 to-secondary/10">
          <div className="flex items-center space-x-4">
            <div className="bg-primary text-primary-content rounded-full w-12 h-12 flex items-center justify-center">
              <span className="text-lg font-bold">+</span>
            </div>
            <div>
              <h3 className="font-bold text-2xl text-primary">Add New Personnel</h3>
              <p className="text-base-content/70">Create a new BLGF personnel record</p>
            </div>
          </div>
          <button 
            className="btn btn-ghost btn-circle"
            onClick={handleClose}
            type="button"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Modal Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(95vh-180px)]">
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
                    <span className="label-text font-medium">Full Name *</span>
                  </label>
                  <input
                    type="text"
                    className="input input-bordered focus:input-primary"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">Sex *</span>
                  </label>
                  <select
                    className="select select-bordered focus:select-primary"
                    name="sex"
                    value={formData.sex}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select Sex</option>
                    {sexOptions.map(option => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </div>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">Civil Status *</span>
                  </label>
                  <select
                    className="select select-bordered focus:select-primary"
                    name="civilStatus"
                    value={formData.civilStatus}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select Civil Status</option>
                    {civilStatuses.map(status => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </div>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">Birthday *</span>
                  </label>
                  <input
                    type="date"
                    className="input input-bordered focus:input-primary"
                    name="birthday"
                    value={formData.birthday}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>
            </div>

            {/* LGU Information Section */}
            <div className="mb-8">
              <div className="flex items-center mb-4">
                <div className="bg-secondary/20 p-2 rounded-lg mr-3">
                  <svg className="w-5 h-5 text-secondary" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-2a1 1 0 00-1-1H9a1 1 0 00-1 1v2a1 1 0 01-1 1H4a1 1 0 110-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z" clipRule="evenodd" />
                  </svg>
                </div>
                <h4 className="text-xl font-semibold text-secondary">LGU Information</h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">LGU Type *</span>
                  </label>
                  <select
                    className="select select-bordered focus:select-secondary"
                    name="lguType"
                    value={formData.lguType}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select LGU Type</option>
                    {lguTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">LGU Name *</span>
                  </label>
                  <input
                    type="text"
                    className="input input-bordered focus:input-secondary"
                    name="lguName"
                    value={formData.lguName}
                    onChange={handleInputChange}
                    required
                    placeholder="Enter LGU name"
                  />
                </div>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">Income Class *</span>
                  </label>
                  <select
                    className="select select-bordered focus:select-secondary"
                    name="incomeClass"
                    value={formData.incomeClass}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select Income Class</option>
                    {incomeClasses.map(incomeClass => (
                      <option key={incomeClass} value={incomeClass}>{incomeClass}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Position Information Section */}
            <div className="mb-8">
              <div className="flex items-center mb-4">
                <div className="bg-accent/20 p-2 rounded-lg mr-3">
                  <svg className="w-5 h-5 text-accent" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6 6V5a3 3 0 013-3h2a3 3 0 013 3v1h2a2 2 0 012 2v3.57A22.952 22.952 0 0110 13a22.95 22.95 0 01-8-1.43V8a2 2 0 012-2h2zm2-1a1 1 0 011-1h2a1 1 0 011 1v1H8V5zm1 5a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <h4 className="text-xl font-semibold text-accent">Position Information</h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">Plantilla Position *</span>
                  </label>
                  <input
                    type="text"
                    className="input input-bordered focus:input-accent"
                    name="plantillaPosition"
                    value={formData.plantillaPosition}
                    onChange={handleInputChange}
                    required
                    placeholder="Enter position title"
                  />
                </div>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">Status of Appointment *</span>
                  </label>
                  <select
                    className="select select-bordered focus:select-accent"
                    name="statusOfAppointment"
                    value={formData.statusOfAppointment}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select Status</option>
                    {appointmentStatuses.map(status => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </div>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">Salary Grade</span>
                  </label>
                  <input
                    type="text"
                    className="input input-bordered focus:input-accent"
                    name="salaryGrade"
                    value={formData.salaryGrade}
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
                    className="input input-bordered focus:input-accent"
                    name="stepIncrement"
                    value={formData.stepIncrement}
                    onChange={handleInputChange}
                    min="0"
                    max="8"
                  />
                </div>
              </div>
            </div>

            {/* Dates Section */}
            <div className="mb-8">
              <div className="flex items-center mb-4">
                <div className="bg-warning/20 p-2 rounded-lg mr-3">
                  <svg className="w-5 h-5 text-warning" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                  </svg>
                </div>
                <h4 className="text-xl font-semibold text-warning">Important Dates</h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">Date of Appointment *</span>
                  </label>
                  <input
                    type="date"
                    className="input input-bordered focus:input-warning"
                    name="dateOfAppointment"
                    value={formData.dateOfAppointment}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">Date of Mandatory Retirement</span>
                  </label>
                  <input
                    type="date"
                    className="input input-bordered focus:input-warning"
                    name="dateOfMandatoryRetirement"
                    value={formData.dateOfMandatoryRetirement}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">Date of Compulsory Retirement</span>
                  </label>
                  <input
                    type="date"
                    className="input input-bordered focus:input-warning"
                    name="dateOfCompulsoryRetirement"
                    value={formData.dateOfCompulsoryRetirement}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
            </div>

            {/* Education Section */}
            <div className="mb-8">
              <div className="flex items-center mb-4">
                <div className="bg-info/20 p-2 rounded-lg mr-3">
                  <svg className="w-5 h-5 text-info" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z"/>
                  </svg>
                </div>
                <h4 className="text-xl font-semibold text-info">Education & Qualifications</h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">Bachelor's Degree</span>
                  </label>
                  <input
                    type="text"
                    className="input input-bordered focus:input-info"
                    name="bachelorDegree"
                    value={formData.bachelorDegree}
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
                    className="input input-bordered focus:input-info"
                    name="masteralDegree"
                    value={formData.masteralDegree}
                    onChange={handleInputChange}
                    placeholder="Enter master's degree"
                  />
                </div>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">Doctoral Degree</span>
                  </label>
                  <input
                    type="text"
                    className="input input-bordered focus:input-info"
                    name="doctoralDegree"
                    value={formData.doctoralDegree}
                    onChange={handleInputChange}
                    placeholder="Enter doctoral degree"
                  />
                </div>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">Eligibility</span>
                  </label>
                  <input
                    type="text"
                    className="input input-bordered focus:input-info"
                    name="eligibility"
                    value={formData.eligibility}
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
                    className="input input-bordered focus:input-info"
                    name="prcLicenseNumber"
                    value={formData.prcLicenseNumber}
                    onChange={handleInputChange}
                    placeholder="Enter PRC license number"
                  />
                </div>
              </div>
            </div>

            {/* Contact Information Section */}
            <div className="mb-8">
              <div className="flex items-center mb-4">
                <div className="bg-success/20 p-2 rounded-lg mr-3">
                  <svg className="w-5 h-5 text-success" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                  </svg>
                </div>
                <h4 className="text-xl font-semibold text-success">Contact Information</h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">Email Address</span>
                  </label>
                  <input
                    type="email"
                    className="input input-bordered focus:input-success"
                    name="emailAddress"
                    value={formData.emailAddress}
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
                    className="input input-bordered focus:input-success"
                    name="contactNumber"
                    value={formData.contactNumber}
                    onChange={handleInputChange}
                    placeholder="+63 XXX XXX XXXX"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Modal Actions */}
          <div className="flex justify-between items-center p-6 border-t border-base-300 bg-base-50">
            <button
              type="button"
              className="btn btn-ghost"
              onClick={handleClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary px-8"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="loading loading-spinner loading-sm"></span>
                  Adding...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                  </svg>
                  Add Personnel
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}