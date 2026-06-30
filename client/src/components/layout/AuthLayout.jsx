import { Link } from 'react-router-dom';

export default function AuthLayout({ children, title, subtitle }) {
  return (
    <div className="min-h-screen bg-base flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-accent/10 blur-3xl" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-blue-500/10 blur-3xl" />
      <Link to="/" className="font-heading text-3xl font-bold text-accent mb-8 relative z-10">
        EstateCore
      </Link>
      <div className="glass rounded-xl w-full max-w-md p-8 relative z-10">
        {title && <h1 className="font-heading text-2xl text-white mb-1">{title}</h1>}
        {subtitle && <p className="text-white/50 text-sm mb-6">{subtitle}</p>}
        {children}
      </div>
    </div>
  );
}
