export default function LoadingOverlay({ isVisible, title, message, spinnerColor = "border-blue-600" }) {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-3xl p-8 max-w-sm w-full mx-4 text-center shadow-2xl border border-white/10">
        <div className="mb-6">
          <div className={`animate-spin rounded-full h-14 w-14 border-2 ${spinnerColor.replace('border-', 'border-t-')} border-gray-200 mx-auto`}></div>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{title || 'Carregando...'}</h3>
        {message && <p className="text-gray-600 text-sm leading-relaxed">{message}</p>}
      </div>
    </div>
  );
}