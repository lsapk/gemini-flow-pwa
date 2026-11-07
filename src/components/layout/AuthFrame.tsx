import { type ReactNode } from "react";
import { CheckCircle2, GraduationCap, Timer } from "lucide-react";

export default function AuthFrame({ children }: { children: ReactNode }) {
  return (
    <main className="auth-scene">
      <div className="auth-frame glass-material">
        <aside className="auth-story">
          <div className="auth-orbit" aria-hidden="true" />
          <div className="relative">
            <p className="eyebrow mb-5">L’ESPACE DE TRAVAIL DEEPFLOW</p>
            <p className="auth-display">De la place pour l’essentiel.</p>
            <p className="mt-4 max-w-[28ch] text-sm leading-6 text-muted-foreground">
              Vos études, vos projets et votre temps au même endroit.
            </p>
          </div>
          <ul className="auth-capabilities">
            <li>
              <GraduationCap size={18} aria-hidden="true" /> Préparer le
              semestre
            </li>
            <li>
              <CheckCircle2 size={18} aria-hidden="true" /> Retrouver ses
              priorités
            </li>
            <li>
              <Timer size={18} aria-hidden="true" /> Se concentrer
            </li>
          </ul>
        </aside>
        <div className="auth-form">{children}</div>
      </div>
    </main>
  );
}
