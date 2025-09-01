import { useState } from "react";
import api from "../lib/axios.js"

export default function CreatePage() {
   const [selectedForm, setSelectedForm] = useState("assessor");
   const [formData, setFormData] = useState({
      // Assessor Form (from your MongoDB schema)
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

      // Report Form
      reportType: "",
      quarter: "",
      year: "",
      description: "",

      // User Form
      firstName: "",
      lastName: "",
      position: "",
      department: "",
      userEmail: "",
      userPhone: ""
   });

   const [isSubmitting, setIsSubmitting] = useState(false);

   const handleInputChange = (e) => {
      const { name, value } = e.target;
      setFormData(prev => ({
         ...prev,
         [name]: value
      }));
   };

   const handleSubmit = async (e) => {
      e.preventDefault();
      setIsSubmitting(true);

      try {
         let url = ""; 

         if (selectedForm === "assessor") {
            url = "/";
         } else if (selectedForm === "report") {
            url = `{${api}/api/reports}`;
         } else if (selectedForm === "user") {
            url = `{${api}/api/users}`;
         }

         const response = await api.post(url, formData);

         alert(`${selectedForm} created successfully!`);
         console.log("Created Record:", response.data);

         // Reset form after successful submit
         setFormData({
            name: "", sex: "", civilStatus: "", lguType: "", lguName: "", incomeClass: "",
            plantillaPosition: "", statusOfAppointment: "", salaryGrade: "", stepIncrement: "",
            birthday: "", dateOfMandatoryRetirement: "", dateOfCompulsoryRetirement: "",
            bachelorDegree: "", masteralDegree: "", doctoralDegree: "", eligibility: "",
            emailAddress: "", contactNumber: "", dateOfAppointment: "", prcLicenseNumber: "",
            reportType: "", quarter: "", year: "", description: "",
            firstName: "", lastName: "", position: "", department: "", userEmail: "", userPhone: ""
         });

      } catch (error) {
         console.error("Error creating record:", error);
         alert("Failed to create record. Check console for details.");
      } finally {
         setIsSubmitting(false);
      }
   };


   const lguTypes = ["City", "Municipality", "Province"];
   const appointmentStatuses = ["Permanent", "Temporary", "Casual", "Job Order", "Contractual"];
   const civilStatuses = ["Single", "Married", "Widowed", "Separated", "Other"];
   const sexOptions = ["Male", "Female", "Other"];
   const incomeClasses = ["1st Class", "2nd Class", "3rd Class", "4th Class", "5th Class", "6th Class"];
   const reportTypes = ["QRRPA", "SMV Profile", "Financial Report", "Audit Report"];
   const quarters = ["Q1", "Q2", "Q3", "Q4"];
   const years = ["2024", "2023", "2022", "2021"];

   const renderAssessorForm = () => (
      <div className="space-y-8">
         {/* Personal Information */}
         <div className="border-b border-base-300 pb-6">
            <h3 className="text-lg font-semibold mb-4">Personal Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="form-control">
                  <label className="label">
                     <span className="label-text">Full Name *</span>
                  </label>
                  <input
                     type="text"
                     name="name"
                     placeholder="e.g., Juan Dela Cruz"
                     className="input input-bordered"
                     value={formData.name}
                     onChange={handleInputChange}
                     required
                  />
               </div>

               <div className="form-control">
                  <label className="label">
                     <span className="label-text">Sex *</span>
                  </label>
                  <select
                     name="sex"
                     className="select select-bordered"
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
                     <span className="label-text">Civil Status *</span>
                  </label>
                  <select
                     name="civilStatus"
                     className="select select-bordered"
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
                     <span className="label-text">Birthday *</span>
                  </label>
                  <input
                     type="date"
                     name="birthday"
                     className="input input-bordered"
                     value={formData.birthday}
                     onChange={handleInputChange}
                     required
                  />
               </div>
            </div>
         </div>

         {/* LGU Information */}
         <div className="border-b border-base-300 pb-6">
            <h3 className="text-lg font-semibold mb-4">LGU Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="form-control">
                  <label className="label">
                     <span className="label-text">LGU Type *</span>
                  </label>
                  <select
                     name="lguType"
                     className="select select-bordered"
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
                     <span className="label-text">LGU Name *</span>
                  </label>
                  <input
                     type="text"
                     name="lguName"
                     placeholder="e.g., City of Manila"
                     className="input input-bordered"
                     value={formData.lguName}
                     onChange={handleInputChange}
                     required
                  />
               </div>

               <div className="form-control">
                  <label className="label">
                     <span className="label-text">Income Class *</span>
                  </label>
                  <select
                     name="incomeClass"
                     className="select select-bordered"
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

         {/* Position Information */}
         <div className="border-b border-base-300 pb-6">
            <h3 className="text-lg font-semibold mb-4">Position Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="form-control">
                  <label className="label">
                     <span className="label-text">Plantilla Position *</span>
                  </label>
                  <input
                     type="text"
                     name="plantillaPosition"
                     placeholder="e.g., Local Assessment Operations Officer II"
                     className="input input-bordered"
                     value={formData.plantillaPosition}
                     onChange={handleInputChange}
                     required
                  />
               </div>

               <div className="form-control">
                  <label className="label">
                     <span className="label-text">Status of Appointment *</span>
                  </label>
                  <select
                     name="statusOfAppointment"
                     className="select select-bordered"
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
                     <span className="label-text">Salary Grade</span>
                  </label>
                  <input
                     type="text"
                     name="salaryGrade"
                     placeholder="e.g., SG 18"
                     className="input input-bordered"
                     value={formData.salaryGrade}
                     onChange={handleInputChange}
                  />
               </div>

               <div className="form-control">
                  <label className="label">
                     <span className="label-text">Step Increment</span>
                  </label>
                  <input
                     type="number"
                     name="stepIncrement"
                     placeholder="e.g., 3"
                     className="input input-bordered"
                     value={formData.stepIncrement}
                     onChange={handleInputChange}
                     min="0"
                     max="8"
                  />
               </div>
            </div>
         </div>

         {/* Dates */}
         <div className="border-b border-base-300 pb-6">
            <h3 className="text-lg font-semibold mb-4">Important Dates</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="form-control">
                  <label className="label">
                     <span className="label-text">Date of Appointment *</span>
                  </label>
                  <input
                     type="date"
                     name="dateOfAppointment"
                     className="input input-bordered"
                     value={formData.dateOfAppointment}
                     onChange={handleInputChange}
                     required
                  />
               </div>

               <div className="form-control">
                  <label className="label">
                     <span className="label-text">Date of Mandatory Retirement</span>
                  </label>
                  <input
                     type="date"
                     name="dateOfMandatoryRetirement"
                     className="input input-bordered"
                     value={formData.dateOfMandatoryRetirement}
                     onChange={handleInputChange}
                  />
               </div>

               <div className="form-control">
                  <label className="label">
                     <span className="label-text">Date of Compulsory Retirement</span>
                  </label>
                  <input
                     type="date"
                     name="dateOfCompulsoryRetirement"
                     className="input input-bordered"
                     value={formData.dateOfCompulsoryRetirement}
                     onChange={handleInputChange}
                  />
               </div>
            </div>
         </div>

         {/* Educational Background */}
         <div className="border-b border-base-300 pb-6">
            <h3 className="text-lg font-semibold mb-4">Educational Background</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="form-control">
                  <label className="label">
                     <span className="label-text">Bachelor's Degree</span>
                  </label>
                  <input
                     type="text"
                     name="bachelorDegree"
                     placeholder="e.g., BS in Civil Engineering"
                     className="input input-bordered"
                     value={formData.bachelorDegree}
                     onChange={handleInputChange}
                  />
               </div>

               <div className="form-control">
                  <label className="label">
                     <span className="label-text">Master's Degree</span>
                  </label>
                  <input
                     type="text"
                     name="masteralDegree"
                     placeholder="e.g., Master in Public Administration"
                     className="input input-bordered"
                     value={formData.masteralDegree}
                     onChange={handleInputChange}
                  />
               </div>

               <div className="form-control">
                  <label className="label">
                     <span className="label-text">Doctoral Degree</span>
                  </label>
                  <input
                     type="text"
                     name="doctoralDegree"
                     placeholder="e.g., PhD in Development Studies"
                     className="input input-bordered"
                     value={formData.doctoralDegree}
                     onChange={handleInputChange}
                  />
               </div>

               <div className="form-control">
                  <label className="label">
                     <span className="label-text">Eligibility</span>
                  </label>
                  <input
                     type="text"
                     name="eligibility"
                     placeholder="e.g., RA 1080 (Civil Engineer)"
                     className="input input-bordered"
                     value={formData.eligibility}
                     onChange={handleInputChange}
                  />
               </div>
            </div>
         </div>

         {/* Contact Information */}
         <div className="border-b border-base-300 pb-6">
            <h3 className="text-lg font-semibold mb-4">Contact Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="form-control">
                  <label className="label">
                     <span className="label-text">Email Address</span>
                  </label>
                  <input
                     type="email"
                     name="emailAddress"
                     placeholder="e.g., juan.delacruz@lgu.gov.ph"
                     className="input input-bordered"
                     value={formData.emailAddress}
                     onChange={handleInputChange}
                  />
               </div>

               <div className="form-control">
                  <label className="label">
                     <span className="label-text">Contact Number</span>
                  </label>
                  <input
                     type="tel"
                     name="contactNumber"
                     placeholder="e.g., 09123456789"
                     className="input input-bordered"
                     value={formData.contactNumber}
                     onChange={handleInputChange}
                  />
               </div>
            </div>
         </div>

         {/* Professional Information */}
         <div>
            <h3 className="text-lg font-semibold mb-4">Professional Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="form-control">
                  <label className="label">
                     <span className="label-text">PRC License Number</span>
                  </label>
                  <input
                     type="text"
                     name="prcLicenseNumber"
                     placeholder="e.g., 1234567"
                     className="input input-bordered"
                     value={formData.prcLicenseNumber}
                     onChange={handleInputChange}
                  />
               </div>
            </div>
         </div>
      </div>
   );

   const renderReportForm = () => (
      <div className="space-y-6">
         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="form-control">
               <label className="label">
                  <span className="label-text">Report Type *</span>
               </label>
               <select
                  name="reportType"
                  className="select select-bordered"
                  value={formData.reportType}
                  onChange={handleInputChange}
                  required
               >
                  <option value="">Select Report Type</option>
                  {reportTypes.map(type => (
                     <option key={type} value={type}>{type}</option>
                  ))}
               </select>
            </div>

            <div className="form-control">
               <label className="label">
                  <span className="label-text">Quarter *</span>
               </label>
               <select
                  name="quarter"
                  className="select select-bordered"
                  value={formData.quarter}
                  onChange={handleInputChange}
                  required
               >
                  <option value="">Select Quarter</option>
                  {quarters.map(quarter => (
                     <option key={quarter} value={quarter}>{quarter}</option>
                  ))}
               </select>
            </div>

            <div className="form-control">
               <label className="label">
                  <span className="label-text">Year *</span>
               </label>
               <select
                  name="year"
                  className="select select-bordered"
                  value={formData.year}
                  onChange={handleInputChange}
                  required
               >
                  <option value="">Select Year</option>
                  {years.map(year => (
                     <option key={year} value={year}>{year}</option>
                  ))}
               </select>
            </div>
         </div>

         <div className="form-control">
            <label className="label">
               <span className="label-text">Description</span>
            </label>
            <textarea
               name="description"
               placeholder="Report description and notes"
               className="textarea textarea-bordered h-32"
               value={formData.description}
               onChange={handleInputChange}
            />
         </div>

         <div className="form-control">
            <label className="label">
               <span className="label-text">Upload File</span>
            </label>
            <input
               type="file"
               className="file-input file-input-bordered w-full"
               accept=".pdf,.doc,.docx,.xls,.xlsx"
            />
            <div className="label">
               <span className="label-text-alt">Accepted formats: PDF, DOC, DOCX, XLS, XLSX (Max: 10MB)</span>
            </div>
         </div>
      </div>
   );

   const renderUserForm = () => (
      <div className="space-y-6">
         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="form-control">
               <label className="label">
                  <span className="label-text">First Name *</span>
               </label>
               <input
                  type="text"
                  name="firstName"
                  placeholder="Juan"
                  className="input input-bordered"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  required
               />
            </div>

            <div className="form-control">
               <label className="label">
                  <span className="label-text">Last Name *</span>
               </label>
               <input
                  type="text"
                  name="lastName"
                  placeholder="Dela Cruz"
                  className="input input-bordered"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  required
               />
            </div>

            <div className="form-control">
               <label className="label">
                  <span className="label-text">Position *</span>
               </label>
               <input
                  type="text"
                  name="position"
                  placeholder="City Treasurer"
                  className="input input-bordered"
                  value={formData.position}
                  onChange={handleInputChange}
                  required
               />
            </div>

            <div className="form-control">
               <label className="label">
                  <span className="label-text">Department *</span>
               </label>
               <input
                  type="text"
                  name="department"
                  placeholder="Treasury Department"
                  className="input input-bordered"
                  value={formData.department}
                  onChange={handleInputChange}
                  required
               />
            </div>

            <div className="form-control">
               <label className="label">
                  <span className="label-text">Email *</span>
               </label>
               <input
                  type="email"
                  name="userEmail"
                  placeholder="juan.delacruz@lgu.gov.ph"
                  className="input input-bordered"
                  value={formData.userEmail}
                  onChange={handleInputChange}
                  required
               />
            </div>

            <div className="form-control">
               <label className="label">
                  <span className="label-text">Phone *</span>
               </label>
               <input
                  type="tel"
                  name="userPhone"
                  placeholder="+63-912-345-6789"
                  className="input input-bordered"
                  value={formData.userPhone}
                  onChange={handleInputChange}
                  required
               />
            </div>
         </div>
      </div>
   );

   return (
      <div className="container mx-auto px-4 py-8 space-y-8">
         {/* Page Header */}
         <div className="text-center">
            <h1 className="text-4xl font-bold mb-4">Create New Record</h1>
            <p className="text-xl text-base-content/70 max-w-2xl mx-auto">
               Create new entries for assessors, reports, and system users.
            </p>
         </div>

         {/* Form Type Selection */}
         <div className="flex justify-center">
            <div className="tabs tabs-boxed">
               <a
                  className={`tab ${selectedForm === 'assessor' ? 'tab-active' : ''}`}
                  onClick={() => setSelectedForm('assessor')}
               >
                  <span className="mr-2">👤</span>
                  New Assessor
               </a>
               <a
                  className={`tab ${selectedForm === 'report' ? 'tab-active' : ''}`}
                  onClick={() => setSelectedForm('report')}
               >
                  <span className="mr-2">📄</span>
                  New Report
               </a>
               <a
                  className={`tab ${selectedForm === 'user' ? 'tab-active' : ''}`}
                  onClick={() => setSelectedForm('user')}
               >
                  <span className="mr-2">👥</span>
                  New User
               </a>
            </div>
         </div>

         {/* Form Card */}
         <div className="card bg-base-100 shadow-xl max-w-4xl mx-auto border border-primary/20">
            <form onSubmit={handleSubmit} className="card-body">
               {/* Dynamically render the chosen form */}
               {selectedForm === 'assessor' && renderAssessorForm()}
               {selectedForm === 'report' && renderReportForm()}
               {selectedForm === 'user' && renderUserForm()}

               {/* Submit */}
               <div className="card-actions justify-end mt-8">
                  <button
                     type="submit"
                     disabled={isSubmitting}
                     className="btn btn-primary"
                  >
                     {isSubmitting ? (
                        <>
                           <span className="loading loading-spinner loading-sm mr-2"></span>
                           Creating...
                        </>
                     ) : (
                        `Create ${selectedForm === 'assessor' ? 'Assessor' : selectedForm === 'report' ? 'Report' : 'User'}`
                     )}
                  </button>
               </div>
            </form>
         </div>
      </div>
   );
}