import { useEffect, useState, useMemo, useCallback } from "react";
import api from "../services/axios.js";
import LoadingSpinner from "../components/common/LoadingSpinner";
import ErrorDisplay from "../components/common/ErrorDisplay.jsx";
import SearchFilters from "../components/directory/SearchFilters.jsx";
import PersonnelTable from "../components/directory/PersonnelTable.jsx";
import QuickStats from "../components/directory/QuickStats.jsx";
import EmptyState from "../components/common/EmptyState.jsx";
import EditModal from "../components/modals/assessorsDirectory/EditModal.jsx";
import DetailsModal from "../components/modals/assessorsDirectory/DetailsModal.jsx";
import AddModal from "../components/modals/assessorsDirectory/AddModal.jsx";
import { confirmToastDaisy } from "../components/common/ConfirmToast";
import { formatDate } from "../utils/formatters";
import toast from "react-hot-toast";
 
export default function DirectoryPage() {
  // State management
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
  const [deleteLoading, setDeleteLoading] = useState(null);
  const [updateLoading, setUpdateLoading] = useState(null);
  const [createLoading, setCreateLoading] = useState(false);
  const [editingPerson, setEditingPerson] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const itemsPerPage = 5;

  const fetchDirectory = useCallback(async () => {
    try {
      const res = await api.get();
      console.log("Fetched directory:", res.data);
      setDirectory(Array.isArray(res.data) ? res.data : []);

    } catch (err) {
      console.error(err);
      setError("Failed to load directory");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDirectory();
  }, [fetchDirectory]);

  // Derived data
  const uniqueRegions = useMemo(
    () => [...new Set(directory.map((p) => p.region).filter(Boolean))].sort(),
    [directory]
  );

  const filteredData = useMemo(() => {
    const searchLower = searchTerm.toLowerCase();

    let result = directory.filter((person) => {
      const searchMatch =
        searchTerm === "" ||
        [
          "name",
          "lguName",
          "plantillaPosition",
          "emailAddress",
          "region",
          "province",
        ].some((field) => person[field]?.toLowerCase().includes(searchLower));

      return (
        searchMatch &&
        (selectedLguType === "all" || person.lguType === selectedLguType) &&
        (selectedStatus === "all" ||
          person.statusOfAppointment === selectedStatus) &&
        (selectedRegion === "all" || person.region === selectedRegion)
      );
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

  // Helper function to build API payload
  const buildPayload = useCallback(
    (data) => ({
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
      officeEmail: data.officeEmail ?? "",
      personalEmail: data.personalEmail ?? "",
      contactNumber: data.contactNumber ?? "",
      dateOfAppointment: data.dateOfAppointment,
      prcLicenseNumber: data.prcLicenseNumber ?? "",
    }),
    []
  );

  // Event handlers
  const handleSort = useCallback((key) => {
    setSortConfig((prev) => ({
      key,
      direction:
        prev.key === key && prev.direction === "ascending"
          ? "descending"
          : "ascending",
    }));
  }, []);

  const handleViewDetails = useCallback((person) => {
    setSelectedPerson(person);
    setIsDetailsModalOpen(true);
  }, []);

  const handleEdit = useCallback((person) => {
    setEditingPerson({ ...person });
    setIsEditModalOpen(true);
  }, []);

  const handleDelete = useCallback(
    (person) => {
      confirmToastDaisy(
        `Are you sure you want to delete ${person.name}?`,
        async () => {
          setDeleteLoading(person._id);
          try {
            await api.delete(`/${person._id}`);
            setDirectory((prev) => prev.filter((p) => p._id !== person._id));
            toast.success(`${person.name} deleted successfully`);

            // ✅ Re-fetch latest data
            await fetchDirectory();
          } catch {
            toast.error(`Failed to delete ${person.name}`);
          } finally {
            setDeleteLoading(null);
          }
        }
      );
    },
    [fetchDirectory]
  );

  const handleUpdate = useCallback(
    async (e) => {
      e.preventDefault();
      if (!editingPerson) return;

      try {
        setUpdateLoading(editingPerson._id);

        const payload = buildPayload(editingPerson);
        const res = await api.put(`/${editingPerson._id}`, payload);
        console.log(res);

        setDirectory((prev) =>
          prev.map((person) =>
            person._id === editingPerson._id ? res.data : person
          )
        );

        setIsEditModalOpen(false);
        toast.success(`${editingPerson.name} updated successfully`);
        // ✅ Re-fetch latest data after successful creation
        await fetchDirectory();
      } catch (error) {
        console.error("Error updating directory:", error);
        alert("Failed to update record. Please try again.");
      } finally {
        setUpdateLoading(null);
      }
    },
    [editingPerson, buildPayload, fetchDirectory]
  );

  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setEditingPerson((prev) => ({ ...prev, [name]: value }));
  }, []);

  const handleCreateNew = useCallback(() => {
    setIsCreateModalOpen(true);
  }, []);

  const handleCreate = useCallback(
    async (formData) => {
      setCreateLoading(true);
      try {
        const payload = buildPayload(formData);
        await api.post("/", payload);

        // ✅ Re-fetch latest data after successful creation
        await fetchDirectory();

        setIsCreateModalOpen(false);
      } catch {
        alert("Failed to create personnel");
      } finally {
        setCreateLoading(false);
      }
    },
    [buildPayload, fetchDirectory]
  );

  const handleClearFilters = useCallback(() => {
    setSearchTerm("");
    setSelectedLguType("all");
    setSelectedStatus("all");
    setSelectedRegion("all");
    setCurrentPage(1);
  }, []);

  // Render loading or error states
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

      {/* Empty state */}
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
