
import React, { useState } from "react";
import { Bot } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

const AssistantButton = () => {
  const navigate = useNavigate();
  const [isHovered, setIsHovered] = useState(false);

  const handleClick = () => {
    navigate("/assistant");
  };

  return (
    <Button
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="fixed bottom-6 right-6 z-50 rounded-full shadow-lg p-3 bg-primary hover:bg-primary/90 transition-all"
      size="icon"
    >
      <Bot className="h-6 w-6 text-primary-foreground" />
      {isHovered && (
        <span className="absolute -top-10 right-0 bg-background text-sm font-medium px-3 py-1 rounded shadow-md">
          Assistant IA
        </span>
      )}
    </Button>
  );
};

export default AssistantButton;
