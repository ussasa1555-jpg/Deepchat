'use client';

import { checkPasswordStrength, getStrengthColor } from '@/lib/passwordStrength';

interface PasswordStrengthMeterProps {
  password: string;
}

export function PasswordStrengthMeter({ password }: PasswordStrengthMeterProps) {
  if (!password) return null;

  const strength = checkPasswordStrength(password);
  const colorClass = getStrengthColor(strength.score);

  return (
    <div className="mt-2 space-y-1">
      <div className="flex gap-1">
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={`h-1 flex-1 ${
              i <= strength.score ? 'bg-accent' : 'bg-muted/30'
            }`}
          />
        ))}
      </div>
      <p className={`text-xs ${colorClass}`}>{strength.feedback}</p>
    </div>
  );
}







