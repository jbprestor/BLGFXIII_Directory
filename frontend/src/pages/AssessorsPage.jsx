// src/pages/AssessorsPage.jsx
import { useEffect, useState, useMemo, useCallback, useRef } from "react";
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

  // Filters / UI state
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRegion, setSelectedRegion] = useState("all");
  const [selectedProvince, setSelectedProvince] = useState("all");
  const [selectedLguType, setSelectedLguType] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedSex, setSelectedSex] = useState("all");

  const [sortConfig, setSortConfig] = useState({ key: null, direction: "ascending" });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Loading flags
  const [deleteLoading, setDeleteLoading] = useState(null);
  const [updateLoading, setUpdateLoading] = useState(null);
  const [createLoading, setCreateLoading] = useState(false);

  // Modals / selected rows
  const [editingAssessor, setEditingAssessor] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedAssessor, setSelectedAssessor] = useState(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Build payload defaults before sending to API
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

  // Guard for concurrent fetches
  const isFetchingRef = useRef(false);

  // Stable refresh function used after create/update/delete
  const refreshAssessors = useCallback(async () => {
    if (isFetchingRef.current) {
      console.debug("refreshAssessors: already fetching, skipping");
      return;
    }
    isFetchingRef.current = true;
    setLoading(true);
    try {
      const res = await getAllAssessors();
      const rawData = Array.isArray(res?.data) ? res.data : [];

      const mapped = rawData.map((a) => ({
        ...a,
        fullName: [a.firstName, a.middleName, a.lastName].filter(Boolean).join(" "),
        lguName: a.lgu?.name || "",
        lguType: a.lgu?.classification || "",
        region: a.lgu?.region || "",
        province: a.lgu?.province || "",
      }));

      setAssessors(mapped);
      setError(null);
    } catch (err) {
      console.error("refreshAssessors error:", err);
      setError("Failed to load assessors directory: " + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  }, [getAllAssessors]);

  // initial load — run once on mount to avoid dependency-driven loops
  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!mounted) return;
      if (isFetchingRef.current) return;
      isFetchingRef.current = true;
      setLoading(true);
      try {
        const res = await getAllAssessors();
        const rawData = Array.isArray(res?.data) ? res.data : [];

        const mapped = rawData.map((a) => ({
          ...a,
          fullName: [a.firstName, a.middleName, a.lastName].filter(Boolean).join(" "),
          lguName: a.lgu?.name || "",
          lguType: a.lgu?.classification || "",
          region: a.lgu?.region || "",
          province: a.lgu?.province || "",
        }));

        setAssessors(mapped);
        setError(null);
      } catch (err) {
        console.error("initial fetchAssessors error:", err);
        setError("Failed to load assessors directory: " + (err.response?.data?.message || err.message));
      } finally {
        setLoading(false);
        isFetchingRef.current = false;
      }
    })();

    return () => { mounted = false; };
  }, []); // intentionally empty: run only once on mount

  // unique regions for the region dropdown
  const uniqueRegions = useMemo(
    () => [...new Set(assessors.map((a) => a.region).filter(Boolean))].sort(),
    [assessors]
  );

  // unique provinces — dependent on selectedRegion (province list updates when region changes)
  const uniqueProvinces = useMemo(() => {
    const provs = assessors
      .filter((a) => (selectedRegion === "all" ? true : a.region === selectedRegion))
      .map((a) => a.province)
      .filter(Boolean);
    return [...new Set(provs)].sort();
  }, [assessors, selectedRegion]);

  // Whenever region changes reset selectedProvince to "all" to avoid inconsistent filters
  useEffect(() => {
    setSelectedProvince("all");
  }, [selectedRegion]);

  // Filter + search + sort logic (result that will be shown and exported)
  const filteredData = useMemo(() => {
    const searchLower = searchTerm.trim().toLowerCase();

    let result = assessors.filter((a) => {
      const searchMatch =
        !searchLower ||
        ["fullName", "lguName", "plantillaPosition", "officeEmail", "region"].some(
          (field) => (a[field] || "").toLowerCase().includes(searchLower)
        );

      const regionMatch = selectedRegion === "all" || a.region === selectedRegion;
      const provinceMatch = selectedProvince === "all" || a.province === selectedProvince;
      const lguTypeMatch = selectedLguType === "all" || a.lguType === selectedLguType;
      const statusMatch = selectedStatus === "all" || a.statusOfAppointment === selectedStatus;
      const sexMatch = selectedSex === "all" || a.sex === selectedSex;

      return searchMatch && regionMatch && provinceMatch && lguTypeMatch && statusMatch && sexMatch;
    });

    if (sortConfig.key) {
      result.sort((a, b) => {
        const aVal = (a[sortConfig.key] ?? "").toString().toLowerCase();
        const bVal = (b[sortConfig.key] ?? "").toString().toLowerCase();
        if (aVal < bVal) return sortConfig.direction === "ascending" ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === "ascending" ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [
    assessors,
    searchTerm,
    selectedRegion,
    selectedProvince,
    selectedLguType,
    selectedStatus,
    selectedSex,
    sortConfig,
  ]);

  // pagination
  const totalPages = Math.max(1, Math.ceil(filteredData.length / itemsPerPage));
  const currentItems = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredData.slice(start, start + itemsPerPage);
  }, [currentPage, filteredData]);

  // ----- CRUD handlers -----
  const handleCreate = async (formData) => {
    setCreateLoading(true);
    try {
      await createAssessor(buildPayload(formData));
      // toast.success("Assessor added successfully");
      setIsCreateModalOpen(false);
      await refreshAssessors();
    } catch (err) {
      // toast.error("Failed to add assessor: " + (err.response?.data?.message || err.message));
    } finally {
      setCreateLoading(false);
    }
  };

  const handleUpdate = async (updatedAssessor) => {
    if (!updatedAssessor) return;
    try {
      setUpdateLoading(updatedAssessor._id);
      await updateAssessor(updatedAssessor._id, buildPayload(updatedAssessor));
      // toast.success("Assessor updated");
      setIsEditModalOpen(false);
      await refreshAssessors();
    } catch (err) {
      // toast.error("Failed to update: " + (err.response?.data?.message || err.message));
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
          await refreshAssessors();
        } catch (err) {
          toast.error(`Failed to delete ${assessor.fullName}: ` + (err.response?.data?.message || err.message));
        } finally {
          setDeleteLoading(null);
        }
      }
    );
  };

  // Clear filters helper (used by SearchFilters and EmptyState)
  const clearAllFilters = useCallback(() => {
    setSearchTerm("");
    setSelectedRegion("all");
    setSelectedProvince("all");
    setSelectedLguType("all");
    setSelectedStatus("all");
    setSelectedSex("all");
    setCurrentPage(1);
  }, []);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorDisplay error={error} onRetry={refreshAssessors} />;

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
        selectedLguType={selectedLguType}
        setSelectedLguType={setSelectedLguType}
        selectedStatus={selectedStatus}
        setSelectedStatus={setSelectedStatus}
        selectedRegion={selectedRegion}
        setSelectedRegion={setSelectedRegion}
        selectedProvince={selectedProvince}
        setSelectedProvince={setSelectedProvince}
        selectedSex={selectedSex}
        setSelectedSex={setSelectedSex}
        uniqueRegions={uniqueRegions}
        uniqueProvinces={uniqueProvinces}
        resultCount={filteredData.length}
        exportData={filteredData} // pass filtered rows so export matches visible results
      />

      <PersonnelTable
        data={currentItems}
        onViewDetails={(a) => {
          setSelectedAssessor(a);
          setIsDetailsModalOpen(true);
        }}
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
        <EmptyState onClearFilters={clearAllFilters} />
      )}

      {canAdd && (
        <AddModal
          isOpen={isCreateModalOpen}
          onAddPersonnel={handleCreate}
          onClose={() => setIsCreateModalOpen(false)}
          loading={createLoading}
        />
      )}

      {canEdit && (
        <EditModal
          isOpen={isEditModalOpen}
          editingPerson={editingAssessor}
          updateLoading={updateLoading}
          onInputChange={(e) => setEditingAssessor(prev => ({ ...prev, [e.target.name]: e.target.value }))}
          onUpdate={handleUpdate}
          onClose={() => setIsEditModalOpen(false)}
          formatDate={formatDate}
        />
      )}

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
