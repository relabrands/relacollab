import { useState } from "react";
import { Link } from "react-router-dom";

interface ProfileCompleteBannerProps {
  completion: number;
  missingFields: string[];
}

/**
 * Dismissable banner shown to creators with incomplete profiles.
 * Receives precomputed completion & missingFields so it can be
 * used both in the dashboard (where data is already fetched) and
 * in other pages via the useCreatorProfileCompletion hook.
 */
export function ProfileCompleteBanner({ completion, missingFields }: ProfileCompleteBannerProps) {
  const [dismissed, setDismissed] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  if (dismissed || missingFields.length === 0 || completion >= 100) return null;

  return (
    <div className="mb-6 rounded-xl border border-primary/20 bg-gradient-to-r from-primary/5 to-accent/5 overflow-hidden animate-in slide-in-from-top-2 duration-300">
      <div className="flex items-start gap-3 px-5 py-4">
        {/* Percentage circle */}
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5 border border-primary/20">
          <span className="text-xs font-bold text-primary leading-none">{completion}%</span>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 flex-wrap">
            <div>
              <p className="text-sm font-semibold text-foreground">
                Perfil incompleto — mejora tus matches
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Los creadores con perfil completo tienen hasta <strong>3x más matches</strong> con marcas.
              </p>
            </div>

            <div className="flex items-center gap-3 flex-shrink-0">
              <button
                onClick={() => setShowDetails(v => !v)}
                className="text-xs text-primary hover:underline"
              >
                {showDetails ? "Ocultar" : `${missingFields.length} campo${missingFields.length !== 1 ? "s" : ""} pendiente${missingFields.length !== 1 ? "s" : ""}`}
              </button>
              <button
                onClick={() => setDismissed(true)}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Cerrar"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-3 h-1.5 w-full bg-primary/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-700"
              style={{ width: `${completion}%` }}
            />
          </div>

          {/* Missing fields chips */}
          {showDetails && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {missingFields.map((field) => (
                <span
                  key={field}
                  className="text-xs px-2 py-0.5 bg-destructive/10 text-destructive rounded-full border border-destructive/20"
                >
                  ✕ {field}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* CTA */}
        <Link to="/creator/profile" className="flex-shrink-0 self-center">
          <button className="text-xs font-semibold px-3 py-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity whitespace-nowrap">
            Completar →
          </button>
        </Link>
      </div>
    </div>
  );
}
