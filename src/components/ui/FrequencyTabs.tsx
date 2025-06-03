
import { Button } from "@/components/ui/button";

interface FrequencyTabsProps {
  frequencies: { key: string; label: string; count: number }[];
  activeFrequency: string;
  onFrequencyChange: (frequency: string) => void;
}

const FrequencyTabs = ({ frequencies, activeFrequency, onFrequencyChange }: FrequencyTabsProps) => {
  return (
    <div className="flex gap-1 sm:gap-2 overflow-x-auto pb-2">
      <div className="flex gap-1 sm:gap-2 min-w-max">
        {frequencies.map((freq) => (
          <Button
            key={freq.key}
            variant={activeFrequency === freq.key ? "default" : "outline"}
            size="sm"
            onClick={() => onFrequencyChange(freq.key)}
            className="text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-2 whitespace-nowrap flex-shrink-0"
          >
            {/* Affichage mobile avec abréviations */}
            <span className="sm:hidden">
              {freq.key === "all" ? "Ttes" : 
               freq.key === "daily" ? "Quot" :
               freq.key === "weekly" ? "Heb" :
               freq.key === "monthly" ? "Men" : freq.label}
              <span className="ml-1">({freq.count})</span>
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
