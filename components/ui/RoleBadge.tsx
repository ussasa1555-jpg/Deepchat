/**
 * Role Badge Component
 * Display admin/management badges next to usernames
 */

interface RoleBadgeProps {
  role: 'user' | 'admin' | 'management';
  short?: boolean; // Use [MGM] instead of [MANAGEMENT]
  className?: string;
}

export function RoleBadge({ role, short = true, className = '' }: RoleBadgeProps) {
  // Don't show badge for regular users
  if (role === 'user') return null;

  const label = role === 'management' ? (short ? 'MGM' : 'MANAGEMENT') : 'ADMIN';

  const badgeClassName =
    role === 'management'
      ? 'bg-accent/20 text-accent border-accent' // Green for management
      : 'bg-retro-amber/20 text-retro-amber border-retro-amber'; // Amber for admin

  return (
    <span
      className={`
        inline-flex items-center
        text-xs px-1.5 py-0.5 
        border rounded 
        uppercase font-bold
        ${badgeClassName}
        ${className}
      `}
      title={role === 'management' ? 'Management' : 'Administrator'}
    >
      [{label}]
    </span>
  );
}











