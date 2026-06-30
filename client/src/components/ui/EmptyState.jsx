import Button from './Button';

export default function EmptyState({ icon = '📭', title = 'Nothing here yet', subtext, action, onAction }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-6">
      <div className="text-5xl mb-4 opacity-80">{icon}</div>
      <h3 className="font-heading text-xl text-white mb-1">{title}</h3>
      {subtext && <p className="text-white/50 text-sm max-w-sm mb-5">{subtext}</p>}
      {action && (
        <Button onClick={onAction} variant="primary">
          {action}
        </Button>
      )}
    </div>
  );
}
