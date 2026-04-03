import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Keyboard } from "lucide-react";

const shortcuts = [
  { keys: ["Ctrl", "Shift", "D"], description: "Tableau de bord" },
  { keys: ["Ctrl", "Shift", "T"], description: "Tâches" },
  { keys: ["Ctrl", "Shift", "H"], description: "Habitudes" },
  { keys: ["Ctrl", "Shift", "F"], description: "Focus" },
  { keys: ["Ctrl", "Shift", "J"], description: "Journal" },
  { keys: ["Ctrl", "Shift", "G"], description: "Objectifs" },
  { keys: ["Ctrl", "Shift", "B"], description: "Badges" },
  { keys: ["Ctrl", "Shift", "A"], description: "Analyse" },
  { keys: ["Ctrl", "Shift", "S"], description: "Paramètres" },
  { keys: ["?"], description: "Afficher les raccourcis" },
];

export function KeyboardShortcutsModal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "?" && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const target = e.target as HTMLElement;
        if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) return;
        e.preventDefault();
        setOpen(true);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="h-5 w-5 text-primary" />
            Raccourcis clavier
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-2 mt-2">
          {shortcuts.map((s, i) => (
            <div key={i} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-muted/50 transition-colors">
              <span className="text-sm text-muted-foreground">{s.description}</span>
              <div className="flex items-center gap-1">
                {s.keys.map((key, j) => (
                  <kbd
                    key={j}
                    className="px-2 py-1 text-xs font-mono bg-muted border border-border rounded-md shadow-sm"
                  >
                    {key}
                  </kbd>
                ))}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
