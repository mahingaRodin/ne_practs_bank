export default function Alert({ type = 'error', message, onClose }) {
  if (!message) return null;
  const styles = {
    error: 'bg-red-50 border-red-200 text-red-700',
    success: 'bg-green-50 border-green-200 text-green-700',
    info: 'bg-blue-50 border-blue-200 text-blue-700',
  };
  return (
    <div className={`mb-4 p-3 rounded-lg border text-sm flex justify-between items-start ${styles[type]}`}>
      <span>{message}</span>
      {onClose && (
        <button onClick={onClose} className="ml-2 opacity-60 hover:opacity-100">✕</button>
      )}
    </div>
  );
}
