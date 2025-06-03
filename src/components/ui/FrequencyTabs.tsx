
import { Button } from "@/components/ui/button";

interface FrequencyTabsProps {
  frequencies: { key: string; label: string; count: number }[];
  activeFrequency: string;
  onFrequencyChange: (frequency: string) => void;
}

const FrequencyTabs = ({ frequencies, activeFrequency, onFrequencyChange }: FrequencyTabsProps) => {
  return (
    <div className="w-full overflow-x-auto pb-2">
      <div className="flex gap-2 min-w-max px-1">
        {frequencies.map((freq) => (
          <Button
            key={freq.key}
            variant={activeFrequency === freq.key ? "default" : "outline"}
            size="sm"
            onClick={() => onFrequencyChange(freq.key)}
            className="text-xs px-3 py-2 whitespace-nowrap flex-shrink-0 min-w-[80px] h-9"
          >
            {/* Affichage mobile avec abréviations */}
            <span className="sm:hidden text-center w-full">
              {freq.key === "all" ? "Toutes" : 
               freq.key === "daily" ? "Quotid." :
               freq.key === "weekly" ? "Hebdo." :
               freq.key === "monthly" ? "Mens." : freq.label.split(' ')[1] || freq.label}
              <br />
              <span className="text-xs opacity-75">({freq.count})</span>
            </span>
            {/* Affichage desktop complet */}
            <span className="hidden sm:inline">
              {freq.label} ({freq.count})
            </span>
          </Button>
        ))}
      </div>
    </div>
  );
};

export default FrequencyTabs;
