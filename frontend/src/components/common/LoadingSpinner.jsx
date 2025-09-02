// components/LoadingSpinner.js
export default function LoadingSpinner({ message = "Loading directory data..." }) {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="loading loading-spinner loading-lg text-primary mb-4"></div>
        <p className="text-lg">{message}</p>
      </div>
    </div>
  );
}