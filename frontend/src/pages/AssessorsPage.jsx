import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { useAuth } from "../contexts/AuthContext.jsx";
import useApi from "../services/axios.js";
import { useLocation } from "react-router"; // Import useLocation
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

  const location = useLocation(); // Hook to get URL params

  // Filters / UI state
  const [searchTerm, setSearchTerm] = useState("");

  // Update search term from URL on mount/update
  // Update search term from URL on mount/update and check for ID
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const search = params.get("search");
    const id = params.get("id");

    if (search) {
      setSearchTerm(search);
    }

    // Deep link to specific assessor via ID
    if (id) {
      if (assessors.length > 0) {
        const found = assessors.find(a => a._id === id || a.id === id);

        if (found) {
          // 1. Open the modal
          setSelectedAssessor(found);
          setIsDetailsModalOpen(true);

          // 2. Clear all filters to ensure visibility
          setSelectedRegion("all");
          setSelectedProvince("all");
          setSelectedLguType("all");
          setSelectedStatus("all");
          setSelectedSex("all");
          setSelectedLicenseStatus("all");
          setSelectedPositionCategory("all");

          // 3. Switch to correct tab based on status
          const isRetired = found.statusOfAppointment === "Retired";
          setActiveTab(isRetired ? "retired" : "active");

          // 4. Set search term to isolate this person
          if (found.fullName) {
            setSearchTerm(found.fullName);
          }
        }
      }
    }
  }, [location.search, assessors]);
  const [selectedRegion, setSelectedRegion] = useState("all");
  const [selectedProvince, setSelectedProvince] = useState("all");
  const [selectedLguType, setSelectedLguType] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedSex, setSelectedSex] = useState("all");
  const [selectedLicenseStatus, setSelectedLicenseStatus] = useState("all"); // new state
  const [selectedPositionCategory, setSelectedPositionCategory] = useState("all"); // new state for Head vs Assistant
  const [activeTab, setActiveTab] = useState("active"); // "active" or "retired"

  const [sortConfig, _setSortConfig] = useState({ key: null, direction: "ascending" });
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
      prcLicenseExpiration: data.prcLicenseExpiration || null,
      officialDesignation: data.officialDesignation ?? "",
      officeEmail: data.officeEmail ?? "",
      personalEmail: data.personalEmail ?? "",
      contactNumber: data.contactNumber ?? "",
      mobileNumber: data.mobileNumber ?? "",
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
    } catch (_err) {
      console.error("refreshAssessors error:", _err);
      setError("Failed to load assessors directory: " + (_err.response?.data?.message || _err.message));
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

      let licenseMatch = true;
      if (selectedLicenseStatus === "REA") {
        licenseMatch = !!a.prcLicenseNumber; // Must have a license
      } else if (selectedLicenseStatus === "Non-REA") {
        licenseMatch = !a.prcLicenseNumber; // Must NOT have a license
      }

      const isRetired = a.statusOfAppointment === "Retired";
      const isInActiveTab = activeTab === "active" ? !isRetired : isRetired;

      // Position Category Logic
      let positionMatch = true;
      if (selectedPositionCategory !== "all") {
        // Check both fields to ensure we catch "Assistant" if it's in either
        const designation = ((a.officialDesignation || "") + " " + (a.plantillaPosition || "")).toLowerCase();
        const isAssistant = designation.includes("assistant");

        if (selectedPositionCategory === "Head Assessor") {
          // Must include "assessor" (usually) but NOT "assistant"
          // Or we can just say !isAssistant if we assume the list is mostly Assessors/Assistants
          // Let's be safe: !isAssistant
          positionMatch = !isAssistant;
        } else if (selectedPositionCategory === "Assistant Assessor") {
          positionMatch = isAssistant;
        }
      }

      return searchMatch && regionMatch && provinceMatch && lguTypeMatch && statusMatch && sexMatch && licenseMatch && isInActiveTab && positionMatch;
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
    selectedLicenseStatus,
    sortConfig,
    activeTab,
    selectedPositionCategory,
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
    } catch (_err) {
      console.error("create assessor error:", _err);
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
    } catch (_err) {
      console.error("update assessor error:", _err);
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
        } catch (_err) {
          toast.error(`Failed to delete ${assessor.fullName}: ` + (_err.response?.data?.message || _err.message));
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
    setSelectedLicenseStatus("all");
    setSelectedPositionCategory("all");
    setCurrentPage(1);
  }, []);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorDisplay error={error} onRetry={refreshAssessors} />;

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header - Mobile Optimized */}
      <div className="flex flex-col gap-3 sm:gap-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
          <div className="text-center sm:text-left min-w-0 flex-1">
            <h1 className="text-xl sm:text-2xl lg:text-4xl font-bold mb-1 sm:mb-2">Assessors Directory</h1>
            <p className="text-xs sm:text-sm lg:text-lg text-base-content/70 max-w-2xl">
              Directory of Local Assessors across LGUs in the Philippines.
            </p>
          </div>

          {canAdd && (
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="btn btn-primary btn-sm sm:btn-md lg:btn-lg w-full sm:w-auto flex-shrink-0"
            >
              <span className="text-sm sm:text-base">+ Add Assessor</span>
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-6">
        {/* Tabs */}
        <div role="tablist" className="tabs tabs-boxed bg-base-100 p-2 shadow-sm border border-base-200 rounded-xl inline-flex w-auto self-start">
          <a
            role="tab"
            className={`tab px-6 h-10 rounded-lg transition-all ${activeTab === "active" ? "tab-active bg-primary text-primary-content shadow-md" : "hover:bg-base-200"}`}
            onClick={() => setActiveTab("active")}
          >
            Active Personnel
          </a>
          <a
            role="tab"
            className={`tab px-6 h-10 rounded-lg transition-all ${activeTab === "retired" ? "tab-active bg-primary text-primary-content shadow-md" : "hover:bg-base-200"}`}
            onClick={() => setActiveTab("retired")}
          >
            Retired Personnel
          </a>
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
          selectedLicenseStatus={selectedLicenseStatus}
          setSelectedLicenseStatus={setSelectedLicenseStatus}
          selectedPositionCategory={selectedPositionCategory}
          setSelectedPositionCategory={setSelectedPositionCategory}
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
    </div>
  );
}
