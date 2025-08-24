// apps/client/src/components/ui/TeamBadge.jsx
import { useState } from 'react';
import { teamLogo, teamName } from '../../lib/teams';

export default function TeamBadge({ id, name, size = 24, showName = true, className = '' }) {
  // אם לא הועבר name, נביא מהמיפוי
  const displayName = name || teamName(id);
  const [imgOk, setImgOk] = useState(true);
  const src = teamLogo(id);

  // fallback: עיגול עם האות הראשונה
  const initial = displayName?.[0]?.toUpperCase() || '?';

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      {imgOk ? (
        <img
          src={src}
          alt={displayName}
          width={size}
          height={size}
          className="rounded-full border border-white/15 bg-white/10 object-contain"
          onError={() => setImgOk(false)}
          loading="lazy"
        />
      ) : (
        <div
          style={{ width: size, height: size }}
          className="rounded-full border border-white/15 bg-white/10 flex items-center justify-center text-xs"
          aria-label={displayName}
          title={displayName}
        >
          {initial}
        </div>
      )}

      {showName && <span className="text-sm">{displayName}</span>}
    </div>
  );
}
