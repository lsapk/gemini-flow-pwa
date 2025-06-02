
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface FrequencyTabsProps {
  frequencies: Array<{
    key: string;
    label: string;
    shortLabel: string;
    count: number;
  }>;
  activeFrequency: string;
  onFrequencyChange: (frequency: string) => void;
  className?: string;
}

export function FrequencyTabs({ 
  frequencies, 
  activeFrequency, 
  onFrequencyChange, 
  className 
}: FrequencyTabsProps) {
  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {frequencies.map((freq) => (
        <Button
          key={freq.key}
          variant={activeFrequency === freq.key ? "default" : "outline"}
          size="sm"
          onClick={() => onFrequencyChange(freq.key)}
          className="flex items-center gap-1 h-auto py-1.5 px-2"
        >
          <span className="hidden sm:inline">{freq.label}</span>
          <span className="sm:hidden">{freq.shortLabel}</span>
          <Badge 
            variant="secondary" 
            className="ml-1 h-4 px-1 text-xs"
          >
            {freq.count}
          </Badge>
        </Button>
      ))}
    </div>
  );
}
