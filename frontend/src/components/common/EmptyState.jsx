// components/EmptyState.js
export default function EmptyState({ onClearFilters }) {
  return (
    <div className="text-center py-8 sm:py-16">
      <div className="text-4xl sm:text-6xl mb-4">🔍</div>
      <h3 className="text-xl sm:text-2xl font-bold mb-2">No Results Found</h3>
      <p className="text-base-content/70 mb-4 text-sm sm:text-base">
        Try adjusting your search terms or filters to find what you're looking for.
      </p>
      <button
        className="btn btn-primary btn-sm sm:btn-md"
        onClick={onClearFilters}
      >
        Clear Filters
      </button>
    </div>
  );
}