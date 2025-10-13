import { useEffect, useState, useCallback } from "react";
import useApi from "../services/axios.js";

// Encapsulates QRRPA-related API calls and local state
export default function useQrrpa() {
  const { getAllQrrpa, createQrrpa, createQrrpaMultipart, getAllLgus, getAllLgusNoPagination } = useApi();
  const [loading, setLoading] = useState(false);
  const [records, setRecords] = useState([]);
  const [lgus, setLgus] = useState([]);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async (opts = {}) => {
    setLoading(true);
    setError(null);
    try {
      // CRITICAL FIX: Request all records without pagination
      // Backend defaults to limit=10, which causes missing records bug
      const params = { ...opts, limit: 10000 };
      
      const res = await getAllQrrpa(params);
      if (res && res.data && res.data.success) {
        const fetchedRecords = res.data.data.monitorings || res.data.data || [];
        setRecords(fetchedRecords);
      } else if (res && res.data) {
        const fetchedRecords = res.data.monitorings || res.data || [];
        setRecords(fetchedRecords);
      }
    } catch (err) {
      console.error("useQrrpa.fetchData", err);
      setError(err?.response?.data?.message || err.message || "Failed to load records");
    } finally {
      setLoading(false);
    }
  }, [getAllQrrpa]);

  const fetchLgus = useCallback(async () => {
    try {
      if (typeof getAllLgusNoPagination === "function") {
        const res = await getAllLgusNoPagination();
        if (res && res.data) setLgus(res.data.lgus || res.data || []);
      } else {
        const res = await getAllLgus({ all: true, limit: 10000 });
        if (res && res.data) setLgus(res.data.lgus || res.data || []);
      }
    } catch (err) {
      console.error("useQrrpa.fetchLgus", err);
      setError(err?.response?.data?.message || err.message || "Failed to load LGUs");
    }
  }, [getAllLgus, getAllLgusNoPagination]);

  const [uploadProgress, setUploadProgress] = useState(0);

  const createRecord = useCallback(async (payload) => {
    setError(null);
    setUploadProgress(0);

    try {
      // If payload contains a File under 'attachment', send multipart
      if (payload && payload.attachment instanceof File) {
        const formData = new FormData();
        Object.keys(payload).forEach((k) => {
          if (payload[k] !== undefined && payload[k] !== null) {
            if (k === 'attachment') {
              formData.append('attachment', payload[k]);
            } else {
              formData.append(k, payload[k]);
            }
          }
        });

        const res = await createQrrpaMultipart(formData, (progressEvent) => {
          if (progressEvent.total) {
            const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(percent);
          }
        });

        if (res && res.data && res.data.success) {
          await fetchData();
          setUploadProgress(0);
          return { success: true, data: res.data };
        }
        return { success: false, message: res?.data?.message };
      }

      // Fallback to JSON endpoint
      const res = await createQrrpa(payload);
      if (res && res.data && res.data.success) {
        await fetchData();
        return { success: true, data: res.data };
      }
      return { success: false, message: res?.data?.message };
    } catch (err) {
      console.error("useQrrpa.createRecord", err);
      setError(err?.response?.data?.message || err.message || "Failed to create record");
      return { success: false, message: err?.response?.data?.message || err.message };
    }
  }, [createQrrpa, createQrrpaMultipart, fetchData]);

  useEffect(() => {
    fetchData();
    fetchLgus();
  }, [fetchData, fetchLgus]);

  return {
    loading,
    records,
    lgus,
    error,
    uploadProgress,
    fetchData,
    fetchLgus,
    createRecord,
    setError,
  };
}
