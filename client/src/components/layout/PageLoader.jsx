/** Full-viewport fallback shown while a lazy route chunk loads. */
export default function PageLoader() {
  return (
    <div className="min-h-screen bg-base flex items-center justify-center">
      <div className="animate-spin h-8 w-8 border-2 border-accent border-t-transparent rounded-full" />
    </div>
  );
}
