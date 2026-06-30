export default function Card({ children, header, action, className = '', bodyClassName = '' }) {
  return (
    <div className={`glass rounded-xl ${className}`}>
      {(header || action) && (
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <h3 className="font-heading text-lg text-white">{header}</h3>
          {action}
        </div>
      )}
      <div className={`p-5 ${bodyClassName}`}>{children}</div>
    </div>
  );
}
