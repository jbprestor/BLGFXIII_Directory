import { useEffect, useState, useMemo } from "react";
import api from "../lib/axios.js";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorDisplay from "../components/ErrorDisplay";
import SearchFilters from "../components/SearchFilters";
import PersonnelTable from "../components/PersonnelTable";
import QuickStats from "../components/QuickStats";
import EmptyState from "../components/EmptyState";
import EditModal from "../components/EditModal";
import DetailsModal from "../components/DetailsModal";
import { formatDate } from "../utils/formatters";
import AddModal from "../components/AddModal.jsx";

export default function DirectoryPage() {
  // State declarations
  const [directory, setDirectory] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLguType, setSelectedLguType] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedRegion, setSelectedRegion] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteLoading, setDeleteLoading] = useState(null);
  const [updateLoading, setUpdateLoading] = useState(null);
  const [editingPerson, setEditingPerson] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newPerson, setNewPerson] = useState({});
  const [createLoading, setCreateLoading] = useState(false);
  const itemsPerPage = 10;

  // Data fetching
  useEffect(() => {
    const fetchDirectory = async () => {
      try {
        const res = await api.get();
        if (Array.isArray(res.data)) {
          setDirectory(res.data);
        } else {
          console.error("Unexpected response format:", res.data);
          setDirectory([]);
        }
      } catch (err) {
        console.error("Error fetching directory:", err);
        setError("Failed to load directory");
      } finally {
        setLoading(false);
      }
    };

    fetchDirectory();
  }, []);

  // Derived data
  const uniqueRegions = useMemo(() =>
    [...new Set(directory
      .filter(person => person.region)
      .map(person => person.region)
    )].sort(),
    [directory]
  );

  // Filter data based on search and filters
  const filteredData = useMemo(() => {
    let result = directory.filter(person => {
      const matchesSearch =
        searchTerm === "" ||
        person.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        person.lguName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        person.plantillaPosition?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        person.emailAddress?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        person.region?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        person.province?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesLguType = selectedLguType === "all" || person.lguType === selectedLguType;
      const matchesStatus = selectedStatus === "all" || person.statusOfAppointment === selectedStatus;
      const matchesRegion = selectedRegion === "all" || person.region === selectedRegion;

      return matchesSearch && matchesLguType && matchesStatus && matchesRegion;
    });

    // Sorting logic
    if (sortConfig.key) {
      result.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

        if (aValue < bValue) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }

    return result;
  }, [directory, searchTerm, selectedLguType, selectedStatus, selectedRegion, sortConfig]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const currentItems = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredData.slice(startIndex, startIndex + itemsPerPage);
  }, [currentPage, filteredData]);

  // Handler functions
  const handleSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const handleViewDetails = (person) => {
    setSelectedPerson(person);
    setIsDetailsModalOpen(true);
  };

  // Delete functionality
  const handleDelete = async (person) => {
    const confirmDelete = window.confirm(
      `Are you sure you want to delete ${person.name}?`
    );

    if (!confirmDelete) return;

    setDeleteLoading(person._id);

    try {
      await api.delete(`/${person._id}`);

      // Update frontend state to remove the deleted record
      setDirectory((prev) => prev.filter((item) => item._id !== person._id));

      alert(`${person.name} has been deleted successfully!`);
    } catch (error) {
      console.error("Error deleting directory entry:", error);
      alert("Failed to delete. Please try again.");
    } finally {
      setDeleteLoading(null);
    }
  };

  const handleEdit = (person) => { 
    setEditingPerson({ ...person });
    setIsEditModalOpen(true);
  };

  // Update functionality
  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!editingPerson) return;

    setUpdateLoading(editingPerson._id);

    try {
      const res = await api.put(`/${editingPerson._id}`, editingPerson);

      // Update frontend state with the updated record
      setDirectory(prev => prev.map(item =>
        item._id === editingPerson._id ? res.data : item
      ));

      setIsEditModalOpen(false);
      setEditingPerson(null);
      alert(`${editingPerson.name} has been updated successfully!`);
    } catch (error) {
      console.error("Error updating directory entry:", error);
      alert("Failed to update. Please try again.");
    } finally {
      setUpdateLoading(null);
    }
  };

  // Create new assessor functionality
  const handleCreateNew = () => {
    setNewPerson({
      name: '',
      lguType: '',
      lguName: '',
      plantillaPosition: '',
      emailAddress: '',
      contactNumber: '',
      dateOfAssumption: '',
      statusOfAppointment: '',
      region: '',
      province: '',
      district: '',
      municipality: '',
      dateOfBirth: '',
      educationalBackground: '',
      eligibility: '',
      notes: ''
    });
    setIsCreateModalOpen(true);
  };

  const handleCreate = async (formData) => {
    console.log('=== CREATE PERSONNEL WITH CORRECT SCHEMA ===');
    console.log('Form data received:', formData);

    setCreateLoading(true);

    try {
      // Send data exactly matching your MongoDB schema
      const payload = {
        name: formData.name,
        sex: formData.sex,
        civilStatus: formData.civilStatus,
        lguType: formData.lguType,
        lguName: formData.lguName,
        incomeClass: formData.incomeClass,
        plantillaPosition: formData.plantillaPosition,
        statusOfAppointment: formData.statusOfAppointment,
        salaryGrade: formData.salaryGrade || '',
        stepIncrement: formData.stepIncrement || '',
        birthday: formData.birthday,
        dateOfMandatoryRetirement: formData.dateOfMandatoryRetirement || '',
        dateOfCompulsoryRetirement: formData.dateOfCompulsoryRetirement || '',
        bachelorDegree: formData.bachelorDegree || '',
        masteralDegree: formData.masteralDegree || '',
        doctoralDegree: formData.doctoralDegree || '',
        eligibility: formData.eligibility || '',
        emailAddress: formData.emailAddress || '',
        contactNumber: formData.contactNumber || '',
        dateOfAppointment: formData.dateOfAppointment,
        prcLicenseNumber: formData.prcLicenseNumber || '',

        // Add empty fields for other forms to prevent undefined errors
        reportType: '',
        quarter: '',
        year: '',
        description: '',
        firstName: '',
        lastName: '',
        position: '',
        department: '',
        userEmail: '',
        userPhone: ''
      };

      console.log('Payload being sent:', payload);

      const res = await api.post('/', payload);
      console.log('Success response:', res.data);

      // Update frontend state
      setDirectory(prev => [...prev, res.data]);
      setIsCreateModalOpen(false);
      setNewPerson({}); // Reset form

      alert(`New assessor ${formData.name} has been added successfully!`);

    } catch (error) {
      console.error('=== ERROR DETAILS ===');
      console.error('Error message:', error.message);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);

      alert(`Failed to create: ${error.response?.data?.message || error.message}`);
    } finally {
      setCreateLoading(false);
    }
  };
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditingPerson(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleNewInputChange = (e) => {
    const { name, value } = e.target;
    setNewPerson(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleClearFilters = () => {
    setSearchTerm("");
    setSelectedLguType("all");
    setSelectedStatus("all");
    setSelectedRegion("all");
    setCurrentPage(1);
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorDisplay error={error} onRetry={() => window.location.reload()} />;

  return (
    <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8 space-y-4 sm:space-y-8">
      {/* Page Header with Add Button */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="text-center sm:text-left">
          <h1 className="text-2xl sm:text-4xl font-bold mb-2 sm:mb-4">BLGF Personnel Directory</h1>
          <p className="text-sm sm:text-xl text-base-content/70 max-w-1xl">
            Comprehensive directory of BLGF personnel across Local Government Units in the Philippines.
          </p>
        </div>
        <button
          onClick={handleCreateNew}
          className="btn btn-primary btn-lg"
        >
          + Add New Assessor
        </button>
      </div>

      {/* Search and Filters */}
      <SearchFilters
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        selectedLguType={selectedLguType}
        setSelectedLguType={setSelectedLguType}
        selectedStatus={selectedStatus}
        setSelectedStatus={setSelectedStatus}
        selectedRegion={selectedRegion}
        setSelectedRegion={setSelectedRegion}
        uniqueRegions={uniqueRegions}
        resultCount={filteredData.length}
      />

      {/* Table View */}
      <PersonnelTable
        data={currentItems}
        sortConfig={sortConfig}
        onSort={handleSort}
        onViewDetails={handleViewDetails}
        onEdit={handleEdit}
        onDelete={handleDelete}
        deleteLoading={deleteLoading}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />

      {/* Empty State */}
      {filteredData.length === 0 && !loading && (
        <EmptyState onClearFilters={handleClearFilters} />
      )}

      {/* Quick Stats */}
      <QuickStats directory={directory} />

      {/* Modals */}

      <AddModal
        isOpen={isCreateModalOpen}
        onAddPersonnel={handleCreate}
        onClose={() => setIsCreateModalOpen(false)}
        loading={createLoading}  // Changed from loading to match AddModal expectation
      />

      <EditModal
        isOpen={isEditModalOpen}
        editingPerson={editingPerson}
        updateLoading={updateLoading}
        onInputChange={handleInputChange}
        onUpdate={handleUpdate}
        onClose={() => setIsEditModalOpen(false)}
        formatDate={formatDate}
      />

      <DetailsModal
        isOpen={isDetailsModalOpen}
        selectedPerson={selectedPerson}
        onClose={() => setIsDetailsModalOpen(false)}
        onEdit={handleEdit}
        formatDate={formatDate}
      />

    </div>
  );
}