import { useEffect, useState, useMemo, useCallback } from "react";
import { useLocation } from "react-router";
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

export default function DirectoryPage() {
  const { user } = useAuth();
  const { getAllAssessors, createAssessor, updateAssessor, deleteAssessor } = useApi();

  const canAdd = user?.role === "Admin";
  const canEdit = user?.role === "Admin";
  const canDelete = user?.role === "Admin";

  // State management
  const [directory, setDirectory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all"); // "all", "heads", "assistants", "staff", "retired"
  const [selectedLguType, setSelectedLguType] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedRegion, setSelectedRegion] = useState("all");
  const [selectedProvince, setSelectedProvince] = useState("all");
  const [selectedSex, setSelectedSex] = useState("all");
  const [selectedLicenseStatus, setSelectedLicenseStatus] = useState("all");
  const [selectedPositionCategory, setSelectedPositionCategory] = useState("all");

  const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: "ascending",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const location = useLocation();

  // Modal & Loading States
  const [deleteLoading, setDeleteLoading] = useState(null);
  const [updateLoading, setUpdateLoading] = useState(null);
  const [createLoading, setCreateLoading] = useState(false);
  const [editingPerson, setEditingPerson] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const itemsPerPage = 8;

  const fetchDirectory = useCallback(async () => {
    try {
      const res = await getAllAssessors();
      if (import.meta.env.MODE === "development") {
        console.log("Fetched directory data");
      }
      const rawData = Array.isArray(res.data) ? res.data : [];
      const mappedData = rawData.map(p => {
        const lgu = p.lgu || {};
        let type = lgu.classification || p.lguType;
        if (type === "HUC" || type === "CC" || type === "ICC") type = "City";

        return {
          ...p,
          fullName: [p.firstName, p.middleName, p.lastName].filter(Boolean).join(" "),
          lguName: lgu.name || p.lguName,
          lguType: type,
          province: lgu.province || p.province,
          region: lgu.region || p.region
        };
      });
      setDirectory(mappedData);
    } catch (_err) {
      console.error(_err);
      setError("Failed to load directory");
    } finally {
      setLoading(false);
    }
  }, [getAllAssessors]);

  useEffect(() => {
    fetchDirectory();
  }, [fetchDirectory]);

  // Handle URL query params for notifications
  useEffect(() => {
    if (!loading && directory.length > 0) {
      const params = new URLSearchParams(location.search);
      const id = params.get("id");
      if (id) {
        const person = directory.find((p) => p._id === id);
        if (person) {
          setSelectedPerson(person);
          setIsDetailsModalOpen(true);
        }
      }
    }
  }, [location.search, directory, loading]);

  // Derived data
  const uniqueRegions = useMemo(
    () => [...new Set(directory.map((p) => p.region).filter(Boolean))].sort(),
    [directory]
  );

  const uniqueProvinces = useMemo(() => {
    const provs = directory
      .filter((a) => (selectedRegion === "all" ? true : a.region === selectedRegion))
      .map((a) => a.province)
      .filter(Boolean);
    return [...new Set(provs)].sort();
  }, [directory, selectedRegion]);

  // Helper logic for categorization
  const getCategory = (person) => {
    if (person.statusOfAppointment === "Retired") return "retired";

    const pos = (person.plantillaPosition || "").toLowerCase();

    // Check both plantilla and designation for robustness
    const designation = ((person.officialDesignation || "") + " " + pos).toLowerCase();

    const isAssessor = pos.includes("assessor") || designation.includes("assessor");
    const isAssistant = pos.includes("assistant") || designation.includes("assistant");

    // Heads: usually contain "Assessor" but NOT "Assistant", and often Provincial/City/Municipal
    // Strict check: if contains Assistant, it's Assistant. Else if Assessor, it's Head.
    if (isAssistant) return "assistants";
    if (isAssessor) return "heads";

    return "staff";
  };

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
          "officeEmail",
          "region",
          "province",
          "firstName",
          "lastName" // Fallbacks if name is split
        ].some((field) => {
          if (field === "name" && !person.name) {
            // Try fullName construction if name missing
            const fullName = [person.firstName, person.middleName, person.lastName].filter(Boolean).join(" ");
            return fullName.toLowerCase().includes(searchLower);
          }
          return person[field]?.toLowerCase().includes(searchLower)
        });

      // Category Logic for Tabs
      const category = getCategory(person);
      const isRetired = person.statusOfAppointment === "Retired";

      let tabMatch = false;
      if (activeTab === "all") {
        tabMatch = !isRetired;
      } else if (activeTab === "retired") {
        tabMatch = isRetired;
      } else {
        // Heads, Assistants, Staff -> must be Active AND match category
        tabMatch = !isRetired && category === activeTab;
      }

      // Other Filters
      const regionMatch = selectedRegion === "all" || person.region === selectedRegion;
      const provinceMatch = selectedProvince === "all" || person.province === selectedProvince;
      const lguTypeMatch = selectedLguType === "all" || person.lguType === selectedLguType;
      const statusMatch = selectedStatus === "all" || person.statusOfAppointment === selectedStatus;
      const sexMatch = selectedSex === "all" || person.sex === selectedSex;

      let licenseMatch = true;
      if (selectedLicenseStatus === "REA") licenseMatch = !!person.prcLicenseNumber;
      if (selectedLicenseStatus === "Non-REA") licenseMatch = !person.prcLicenseNumber;

      // Position Category from Advanced Search (Optional overlap with Tabs)
      let posCatMatch = true;
      if (selectedPositionCategory !== "all") {
        const designation = ((person.officialDesignation || "") + " " + (person.plantillaPosition || "")).toLowerCase();
        const isAssistant = designation.includes("assistant");
        if (selectedPositionCategory === "Head Assessor") posCatMatch = !isAssistant;
        if (selectedPositionCategory === "Assistant Assessor") posCatMatch = isAssistant;
      }

      return (
        searchMatch &&
        tabMatch &&
        regionMatch &&
        provinceMatch &&
        lguTypeMatch &&
        statusMatch &&
        sexMatch &&
        licenseMatch &&
        posCatMatch
      );
    });

    if (sortConfig.key) {
      result.sort((a, b) => {
        // Handle name specifically if needed, otherwise generic
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
    selectedProvince,
    selectedSex,
    selectedLicenseStatus,
    selectedPositionCategory,
    sortConfig,
    activeTab,
  ]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const currentItems = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredData.slice(start, start + itemsPerPage);
  }, [currentPage, filteredData]);

  // Helper function to build API payload
  const buildPayload = useCallback(
    (data) => ({
      ...data, // Spread original data to keep IDs etc
      name: data.name,
      firstName: data.firstName,
      lastName: data.lastName,
      middleName: data.middleName,
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
        `Are you sure you want to delete ${person.name || person.fullName || "this person"}?`,
        async () => {
          setDeleteLoading(person._id);
          try {
            await deleteAssessor(person._id);
            setDirectory((prev) => prev.filter((p) => p._id !== person._id));
            toast.success("Deleted successfully");
            await fetchDirectory();
          } catch {
            toast.error("Failed to delete");
          } finally {
            setDeleteLoading(null);
          }
        }
      );
    },
    [fetchDirectory, deleteAssessor]
  );

  const handleUpdate = useCallback(
    async (e) => {
      if (e && e.preventDefault) e.preventDefault(); // Handle both form event and direct call
      if (!editingPerson) return;
      const dataToUpdate = e.preventDefault ? editingPerson : e; // If called directly with data

      try {
        setUpdateLoading(dataToUpdate._id || editingPerson._id);
        const payload = buildPayload(dataToUpdate);

        await updateAssessor(dataToUpdate._id || editingPerson._id, payload);

        setIsEditModalOpen(false);
        toast.success("Updated successfully");
        await fetchDirectory();
      } catch (error) {
        console.error("Error updating directory:", error);
        toast.error("Failed to update");
      } finally {
        setUpdateLoading(null);
      }
    },
    [editingPerson, buildPayload, fetchDirectory, updateAssessor]
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
        await createAssessor(payload);
        await fetchDirectory();
        setIsCreateModalOpen(false);
        toast.success("Created successfully");
      } catch {
        toast.error("Failed to create personnel");
      } finally {
        setCreateLoading(false);
      }
    },
    [buildPayload, fetchDirectory, createAssessor]
  );

  const handleClearFilters = useCallback(() => {
    setSearchTerm("");
    setSelectedLguType("all");
    setSelectedStatus("all");
    setSelectedRegion("all");
    setSelectedProvince("all");
    setSelectedSex("all");
    setSelectedLicenseStatus("all");
    setSelectedPositionCategory("all");
    setCurrentPage(1);
  }, []);

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
        {canAdd && (
          <button onClick={handleCreateNew} className="btn btn-primary btn-lg">
            + Add New Assessor
          </button>
        )}
      </div>

      {/* Tabs */}
      <div role="tablist" className="tabs tabs-boxed">
        <a
          role="tab"
          className={`tab ${activeTab === "all" ? "tab-active" : ""}`}
          onClick={() => setActiveTab("all")}
        >
          All
        </a>
        <a
          role="tab"
          className={`tab ${activeTab === "heads" ? "tab-active" : ""}`}
          onClick={() => setActiveTab("heads")}
        >
          Provincial/City/Municipal Assessors
        </a>
        <a
          role="tab"
          className={`tab ${activeTab === "assistants" ? "tab-active" : ""}`}
          onClick={() => setActiveTab("assistants")}
        >
          Assistants Assessors
        </a>
        <a
          role="tab"
          className={`tab ${activeTab === "staff" ? "tab-active" : ""}`}
          onClick={() => setActiveTab("staff")}
        >
          Staff
        </a>
        <a
          role="tab"
          className={`tab ${activeTab === "retired" ? "tab-active" : ""}`}
          onClick={() => setActiveTab("retired")}
        >
          Retired
        </a>
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
        exportData={filteredData}
      />

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
        canEdit={canEdit}
        canDelete={canDelete}
      />

      {/* Empty state */}
      {filteredData.length === 0 && !loading && (
        <EmptyState onClearFilters={handleClearFilters} />
      )}

      {/* Stats */}
      <QuickStats directory={directory} />

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
