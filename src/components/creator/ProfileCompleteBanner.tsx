import { useState } from "react";
import { Link } from "react-router-dom";

interface ProfileCompleteBannerProps {
  completion: number;
  missingFields: string[];
  optionalFields?: string[];
}

/**
 * Dismissable banner shown to creators with incomplete profiles.
 * - missingFields: campos que reducen el score (rojo)
 * - optionalFields: campos opcionales recomendados (amarillo) — ej. dirección de envío
 */
export function ProfileCompleteBanner({
  completion,
  missingFields,
  optionalFields = [],
}: ProfileCompleteBannerProps) {
  const [dismissed, setDismissed] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const totalPending = missingFields.length + optionalFields.length;

  // No mostrar si: descartado por el usuario, no hay nada pendiente, o el perfil está 100%
  if (dismissed || totalPending === 0) return null;
  // Si los obligatorios están todos solucionados pero solo quedan opcionales, igual mostrar
  // (para que el creador llene la dirección de envío)

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
                {missingFields.length > 0 ? "Perfil incompleto — mejora tus matches" : "¡Perfil básico completo! Añade los detalles opcionales"}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {missingFields.length > 0
                  ? <>Los creadores con perfil completo tienen hasta <strong>3x más matches</strong> con marcas.</>
                  : "Completar tu dirección de envío permite recibir productos de intercambio de las marcas."}
              </p>
            </div>

            <div className="flex items-center gap-3 flex-shrink-0">
              <button
                onClick={() => setShowDetails(v => !v)}
                className="text-xs text-primary hover:underline"
              >
                {showDetails ? "Ocultar" : `${totalPending} campo${totalPending !== 1 ? "s" : ""} pendiente${totalPending !== 1 ? "s" : ""}`}
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

          {/* Progress bar — only shown when there are required fields pending */}
          {missingFields.length > 0 && (
            <div className="mt-3 h-1.5 w-full bg-primary/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-700"
                style={{ width: `${completion}%` }}
              />
            </div>
          )}

          {/* Field chips */}
          {showDetails && (
            <div className="mt-3 space-y-2">
              {/* Required fields — red chips */}
              {missingFields.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {missingFields.map((field) => (
                    <span
                      key={field}
                      className="text-xs px-2 py-0.5 bg-destructive/10 text-destructive rounded-full border border-destructive/20"
                    >
                      {field}
                    </span>
                  ))}
                </div>
              )}
              {/* Optional fields — amber chips */}
              {optionalFields.length > 0 && (
                <div className="flex flex-wrap gap-1.5 items-center">
                  {missingFields.length > 0 && (
                    <span className="text-xs text-muted-foreground w-full">Opcionales (recomendado):</span>
                  )}
                  {optionalFields.map((field) => (
                    <span
                      key={field}
                      className="text-xs px-2 py-0.5 bg-amber-50 text-amber-700 rounded-full border border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800/40"
                    >
                      {field}
                    </span>
                  ))}
                </div>
              )}
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
