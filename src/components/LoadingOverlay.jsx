export default function LoadingOverlay({ isVisible, title, message, spinnerColor = "border-blue-600" }) {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-8 max-w-sm w-full mx-4 text-center">
        <div className="mb-4">
          <div className={`animate-spin rounded-full h-16 w-16 border-b-2 ${spinnerColor} mx-auto`}></div>
        </div>
        <h3 className="text-lg font-semibold text-gray-800 mb-2">{title}</h3>
        {message && <p className="text-gray-600 text-sm">{message}</p>}
      </div>
    </div>
  );
} 