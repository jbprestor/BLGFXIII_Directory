import { useEffect, useState, useMemo, useCallback } from "react";
import api from "../services/axios.js";
import LoadingSpinner from "../components/common/LoadingSpinner";
import ErrorDisplay from "../components/common/ErrorDisplay.jsx";
import SearchFilters from "../components/directory/SearchFilters.jsx";
import PersonnelTable from "../components/directory/PersonnelTable.jsx";
import QuickStats from "../components/directory/QuickStats.jsx";
import EmptyState from "../components/common/EmptyState.jsx";
import EditModal from "../components/modals/EditModal.jsx";
import DetailsModal from "../components/modals/DetailsModal.jsx";
import AddModal from "../components/modals/AddModal.jsx";
import { formatDate } from "../utils/formatters";

export default function DirectoryPage() {
  // ---------- STATE ----------
  const [directory, setDirectory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLguType, setSelectedLguType] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedRegion, setSelectedRegion] = useState("all");
  const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: "ascending",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [deleteLoading, setDeleteLoading] = useState(null);
  const [updateLoading, setUpdateLoading] = useState(null);
  const [createLoading, setCreateLoading] = useState(false);

  const [editingPerson, setEditingPerson] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const [selectedPerson, setSelectedPerson] = useState(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newPerson, setNewPerson] = useState({});

  // ---------- DATA FETCH ----------
  useEffect(() => {
    const fetchDirectory = async () => {
      try {
        const res = await api.get();
        setDirectory(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error(err);
        setError("Failed to load directory");
      } finally {
        setLoading(false);
      }
    };
    fetchDirectory();
  }, []);

  // ---------- DERIVED DATA ----------
  const uniqueRegions = useMemo(
    () => [...new Set(directory.map((p) => p.region).filter(Boolean))].sort(),
    [directory]
  );

  const filteredData = useMemo(() => {
    let result = directory.filter((person) => {
      const searchMatch =
        searchTerm === "" ||
        Object.values({
          name: person.name,
          lguName: person.lguName,
          plantillaPosition: person.plantillaPosition,
          emailAddress: person.emailAddress,
          region: person.region,
          province: person.province,
        }).some((val) => val?.toLowerCase().includes(searchTerm.toLowerCase()));

      const lguMatch =
        selectedLguType === "all" || person.lguType === selectedLguType;
      const statusMatch =
        selectedStatus === "all" ||
        person.statusOfAppointment === selectedStatus;
      const regionMatch =
        selectedRegion === "all" || person.region === selectedRegion;

      return searchMatch && lguMatch && statusMatch && regionMatch;
    });

    if (sortConfig.key) {
      result.sort((a, b) => {
        const aVal = a[sortConfig.key] ?? "";
        const bVal = b[sortConfig.key] ?? "";
        if (aVal < bVal) return sortConfig.direction === "ascending" ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === "ascending" ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [
    directory,
    searchTerm,
    selectedLguType,
    selectedStatus,
    selectedRegion,
    sortConfig,
  ]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const currentItems = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredData.slice(start, start + itemsPerPage);
  }, [currentPage, filteredData]);

  // ---------- HANDLERS ----------
  const handleSort = useCallback(
    (key) => {
      const direction =
        sortConfig.key === key && sortConfig.direction === "ascending"
          ? "descending"
          : "ascending";
      setSortConfig({ key, direction });
    },
    [sortConfig]
  );

  const handleViewDetails = useCallback((person) => {
    setSelectedPerson(person);
    setIsDetailsModalOpen(true);
  }, []);

  const handleEdit = useCallback((person) => {
    setEditingPerson({ ...person });
    setIsEditModalOpen(true);
  }, []);

  const handleDelete = useCallback(async (person) => {
    if (!window.confirm(`Are you sure you want to delete ${person.name}?`))
      return;

    setDeleteLoading(person._id);
    try {
      await api.delete(`/${person._id}`);
      setDirectory((prev) => prev.filter((p) => p._id !== person._id));
      alert(`${person.name} deleted successfully`);
    } catch {
      alert("Failed to delete");
    } finally {
      setDeleteLoading(null);
    }
  }, []);

  const buildPayload = (data) => ({
    name: data.name,
    sex: data.sex,
    civilStatus: data.civilStatus,
    lguType: data.lguType,
    lguName: data.lguName,
    incomeClass: data.incomeClass,
    plantillaPosition: data.plantillaPosition,
    statusOfAppointment: data.statusOfAppointment,
    salaryGrade: data.salaryGrade ?? "",
    stepIncrement: data.stepIncrement ?? "",
    birthday: data.birthday,
    dateOfMandatoryRetirement: data.dateOfMandatoryRetirement ?? "",
    dateOfCompulsoryRetirement: data.dateOfCompulsoryRetirement ?? "",
    bachelorDegree: data.bachelorDegree ?? "",
    masteralDegree: data.masteralDegree ?? "",
    doctoralDegree: data.doctoralDegree ?? "",
    eligibility: data.eligibility ?? "",
    emailAddress: data.emailAddress ?? "",
    contactNumber: data.contactNumber ?? "",
    dateOfAppointment: data.dateOfAppointment,
    prcLicenseNumber: data.prcLicenseNumber ?? "",
  });

const handleUpdate = async (id, updatedData) => {
  try {
    setUpdateLoading(id);
    
    const response = await fetch(`/api/directory/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updatedData),
    });
    
    const result = await response.json();
    
    if (result.success) {
      showNotification("Record updated successfully!");
      // Refresh your data or update state
      fetchDirectoryData(); // Your function to refresh data
      onCloseEditModal();
    } else {
      showNotification(`Update failed: ${result.message}`, 'error');
    }
  } catch (error) {
    console.error("Error updating directory:", error);
    showNotification("Failed to update record. Please try again.", 'error');
  } finally {
    setUpdateLoading(null);
  }
};

  const handleCreateNew = () => {
    setNewPerson({
      name: "",
      lguType: "",
      lguName: "",
      plantillaPosition: "",
      emailAddress: "",
      contactNumber: "",
      statusOfAppointment: "",
    });
    setIsCreateModalOpen(true);
  };

  const handleCreate = async (formData) => {
    setCreateLoading(true);
    try {
      const payload = buildPayload(formData);
      const res = await api.post("/", payload);
      setDirectory((prev) => [...prev, res.data]);
      setIsCreateModalOpen(false);
      setNewPerson({});
      alert(`${formData.name} added successfully`);
    } catch {
      alert("Failed to create personnel");
    } finally {
      setCreateLoading(false);
    }
  };

  const handleClearFilters = () => {
    setSearchTerm("");
    setSelectedLguType("all");
    setSelectedStatus("all");
    setSelectedRegion("all");
    setCurrentPage(1);
  };

  // ---------- RENDER ----------
  if (loading) return <LoadingSpinner />;
  if (error)
    return (
      <ErrorDisplay error={error} onRetry={() => window.location.reload()} />
    );

  return (
    <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8 space-y-4 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="text-center sm:text-left">
          <h1 className="text-2xl sm:text-4xl font-bold mb-2 sm:mb-4">
            BLGF Personnel Directory
          </h1>
          <p className="text-sm sm:text-xl text-base-content/70 max-w-1xl">
            Comprehensive directory of BLGF personnel across Local Government
            Units in the Philippines.
          </p>
        </div>
        <button onClick={handleCreateNew} className="btn btn-primary btn-lg">
          + Add New Assessor
        </button>
      </div>

      {/* Filters */}
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
      {/* Stats */}
      <QuickStats directory={directory} />
      {/* Table */}
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

      {/* Empty */}
      {filteredData.length === 0 && !loading && (
        <EmptyState onClearFilters={handleClearFilters} />
      )}

      {/* Modals */}
      <AddModal
        isOpen={isCreateModalOpen}
        onAddPersonnel={handleCreate}
        onClose={() => setIsCreateModalOpen(false)}
        loading={createLoading}
      />
      <EditModal
        isOpen={isEditModalOpen}
        editingPerson={editingPerson}
        updateLoading={updateLoading}
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
