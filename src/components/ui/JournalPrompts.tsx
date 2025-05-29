
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lightbulb, RefreshCw } from "lucide-react";
import { useState } from "react";

interface JournalPromptsProps {
  onPromptSelect: (prompt: string) => void;
}

export function JournalPrompts({ onPromptSelect }: JournalPromptsProps) {
  const [currentPrompts, setCurrentPrompts] = useState(getRandomPrompts());

  const allPrompts = [
    "Qu'est-ce qui m'a rendu fier aujourd'hui ?",
    "Quel défi ai-je surmonté récemment ?",
    "Pour quoi suis-je reconnaissant en ce moment ?",
    "Quelle leçon ai-je apprise cette semaine ?",
    "Comment puis-je améliorer ma journée de demain ?",
    "Qu'est-ce qui m'inspire le plus en ce moment ?",
    "Quel petit bonheur ai-je vécu aujourd'hui ?",
    "Comment me suis-je rapproché de mes objectifs ?",
    "Qu'est-ce qui me préoccupe et comment puis-je y faire face ?",
    "Quelle habitude positive puis-je développer ?",
    "Qu'est-ce qui me motive à continuer ?",
    "Comment ai-je pris soin de moi aujourd'hui ?",
    "Quelle personne a eu un impact positif sur ma journée ?",
    "Qu'est-ce que j'aimerais me rappeler de ce moment ?",
    "Comment puis-je être plus bienveillant envers moi-même ?"
  ];

  function getRandomPrompts() {
    const shuffled = [...allPrompts].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 3);
  }

  const refreshPrompts = () => {
    setCurrentPrompts(getRandomPrompts());
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-yellow-500" />
          Suggestions d'écriture
        </CardTitle>
        <Button variant="ghost" size="sm" onClick={refreshPrompts}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-2">
        {currentPrompts.map((prompt, index) => (
          <Button
            key={index}
            variant="outline"
            className="w-full text-left justify-start h-auto p-3 whitespace-normal"
            onClick={() => onPromptSelect(prompt)}
          >
            {prompt}
          </Button>
        ))}
      </CardContent>
    </Card>
  );
}
