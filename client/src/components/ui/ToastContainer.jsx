import Toast from './Toast';

export default function ToastContainer({ toasts, onClose }) {
  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-3">
      {toasts.map((t) => (
        <Toast key={t.id} type={t.type} message={t.message} onClose={() => onClose(t.id)} />
      ))}
    </div>
  );
}
