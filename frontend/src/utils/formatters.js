// utils/formatters.js
export const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  } catch (e) {
    return "Invalid Date";
  }
};