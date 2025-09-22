import { useEffect, useState, useMemo, useCallback } from "react";
import { useAuth } from "../contexts/AuthContext.jsx";
import useApi from "../services/axios.js";
import LoadingSpinner from "../components/common/LoadingSpinner.jsx";
import ErrorDisplay from "../components/common/ErrorDisplay.jsx";
import SearchFilters from "../components/directory/SearchFilters.jsx";
import PersonnelTable from "../components/directory/PersonnelTable.jsx";
import QuickStats from "../components/directory/QuickStats.jsx";
import EmptyState from "../components/common/EmptyState.jsx";
import EditModal from "../components/modals/assessorsDirectory/EditModal.jsx";
import DetailsModal from "../components/modals/assessorsDirectory/DetailsModal.jsx";
import AddModal from "../components/modals/assessorsDirectory/AddModal.jsx";
import { confirmToastDaisy } from "../components/common/ConfirmToast.jsx";
import { formatDate } from "../utils/formatters.js";
import toast from "react-hot-toast";

export default function AssessorsPage() {
  const { user } = useAuth();
  const { getAllAssessors, createAssessor, updateAssessor, deleteAssessor } =
    useApi();

  const canAdd = user?.role === "Admin";
  const canEdit = user?.role === "Admin";
  const canDelete = user?.role === "Admin";

  const [assessors, setAssessors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRegion, setSelectedRegion] = useState("all");
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "ascending" });
  const [currentPage, setCurrentPage] = useState(1);

  const [deleteLoading, setDeleteLoading] = useState(null);
  const [updateLoading, setUpdateLoading] = useState(null);
  const [createLoading, setCreateLoading] = useState(false);

  const [editingAssessor, setEditingAssessor] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedAssessor, setSelectedAssessor] = useState(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const itemsPerPage = 10;

  // Build payload with defaults
  const buildPayload = useCallback(
    (data) => ({
      ...data,
      salaryGrade: data.salaryGrade ?? "",
      stepIncrement: data.stepIncrement ?? 1,
      bachelorDegree: data.bachelorDegree ?? "",
      masteralDegree: data.masteralDegree ?? "",
      doctoralDegree: data.doctoralDegree ?? "",
      eligibility: data.eligibility ?? "",
      prcLicenseNumber: data.prcLicenseNumber ?? "",
      officeEmail: data.officeEmail ?? "",
      personalEmail: data.personalEmail ?? "",
      isActive: data.isActive ?? true,
    }),
    []
  );

  // Fetch assessors
  const fetchAssessors = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getAllAssessors();
      let rawData = Array.isArray(res?.data) ? res.data : [];

      const mapped = rawData.map((a) => ({
        ...a,
        fullName: [a.firstName, a.middleName, a.lastName].filter(Boolean).join(" "),
        lguName: a.lgu?.name || "N/A",
        lguType: a.lgu?.classification || "N/A",
        region: a.lgu?.region || "N/A",
      }));

      setAssessors(mapped);
      setError(null);
    } catch (err) {
      console.error(err);
      setError("Failed to load assessors directory: " + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  }, [getAllAssessors]);

  useEffect(() => { fetchAssessors(); }, []);

  const uniqueRegions = useMemo(
    () => [...new Set(assessors.map((a) => a.region).filter(Boolean))].sort(),
    [assessors]
  );

  const filteredData = useMemo(() => {
    const searchLower = searchTerm.toLowerCase();
    let result = assessors.filter((a) => {
      const searchMatch =
        !searchTerm ||
        ["fullName", "lguName", "plantillaPosition", "officeEmail", "region"].some(
          (field) => a[field]?.toLowerCase().includes(searchLower)
        );
      return searchMatch && (selectedRegion === "all" || a.region === selectedRegion);
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
  }, [assessors, searchTerm, selectedRegion, sortConfig]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const currentItems = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredData.slice(start, start + itemsPerPage);
  }, [currentPage, filteredData]);

  // ----- CRUD Handlers -----
  const handleCreate = async (formData) => {
    setCreateLoading(true);
    try {
      await createAssessor(buildPayload(formData));
      toast.success("Assessor added successfully");
      setIsCreateModalOpen(false);
      fetchAssessors();
    } catch (err) {
      toast.error("Failed to add assessor: " + (err.response?.data?.message || err.message));
    } finally {
      setCreateLoading(false);
    }
  };

  const handleUpdate = async (updatedAssessor) => {
    if (!updatedAssessor) return;
    try {
      setUpdateLoading(updatedAssessor._id);
      await updateAssessor(updatedAssessor._id, buildPayload(updatedAssessor));
      toast.success(`${updatedAssessor.fullName} updated successfully`);
      setIsEditModalOpen(false);
      fetchAssessors();
    } catch (err) {
      toast.error("Failed to update record: " + (err.response?.data?.message || err.message));
    } finally {
      setUpdateLoading(null);
    }
  };

  const handleDelete = (assessor) => {
    confirmToastDaisy(
      `Are you sure you want to delete ${assessor.fullName}?`,
      async () => {
        setDeleteLoading(assessor._id);
        try {
          await deleteAssessor(assessor._id);
          toast.success(`${assessor.fullName} deleted successfully`);
          fetchAssessors();
        } catch (err) {
          toast.error(`Failed to delete ${assessor.fullName}: ` + (err.response?.data?.message || err.message));
        } finally {
          setDeleteLoading(null);
        }
      }
    );
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorDisplay error={error} onRetry={fetchAssessors} />;

  return (
    <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8 space-y-4 sm:space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="text-center sm:text-left">
          <h1 className="text-2xl sm:text-4xl font-bold mb-2 sm:mb-4">Assessors Directory</h1>
          <p className="text-sm sm:text-lg text-base-content/70 max-w-2xl">
            Directory of Local Assessors across LGUs in the Philippines.
          </p>
        </div>
        {canAdd && (
          <button onClick={() => setIsCreateModalOpen(true)} className="btn btn-primary btn-lg">
            + Add Assessor
          </button>
        )}
      </div>

      <SearchFilters
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        selectedRegion={selectedRegion}
        setSelectedRegion={setSelectedRegion}
        uniqueRegions={uniqueRegions}
        resultCount={filteredData.length}
      />

      <PersonnelTable
        data={currentItems}
        onViewDetails={(a) => { setSelectedAssessor(a); setIsDetailsModalOpen(true); }}
        onEdit={canEdit ? (a) => { setEditingAssessor(a); setIsEditModalOpen(true); } : undefined}
        onDelete={canDelete ? handleDelete : undefined}
        deleteLoading={deleteLoading}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        canEdit={canEdit}
        canDelete={canDelete}
      />

      <QuickStats directory={assessors} />

      {filteredData.length === 0 && !loading && (
        <EmptyState onClearFilters={() => { setSearchTerm(""); setSelectedRegion("all"); setCurrentPage(1); }} />
      )}

      {canAdd && <AddModal isOpen={isCreateModalOpen} onAddPersonnel={handleCreate} onClose={() => setIsCreateModalOpen(false)} loading={createLoading} />}

      {canEdit && <EditModal
        isOpen={isEditModalOpen}
        editingPerson={editingAssessor}
        updateLoading={updateLoading}
        onInputChange={(e) => setEditingAssessor(prev => ({ ...prev, [e.target.name]: e.target.value }))}
        onUpdate={handleUpdate}
        onClose={() => setIsEditModalOpen(false)}
        formatDate={formatDate}
      />}

      <DetailsModal
        isOpen={isDetailsModalOpen}
        selectedPerson={selectedAssessor}
        onClose={() => setIsDetailsModalOpen(false)}
        onEdit={canEdit ? (a) => { setEditingAssessor(a); setIsEditModalOpen(true); } : undefined}
        formatDate={formatDate}
      />
    </div>
  );
}
