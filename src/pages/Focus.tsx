
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TimerIcon } from "@/components/icons/DeepFlowIcons";
import { Progress } from "@/components/ui/progress";

const Focus = () => {
  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(true);
  const [mode, setMode] = useState<"focus" | "break">("focus");
  const [secondsLeft, setSecondsLeft] = useState(25 * 60); // 25 minutes in seconds
  const [progress, setProgress] = useState(0);

  const focusTime = 25 * 60; // 25 minutes in seconds
  const breakTime = 5 * 60; // 5 minutes in seconds

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;

    if (isActive && !isPaused) {
      interval = setInterval(() => {
        setSecondsLeft((seconds) => {
          if (seconds <= 1) {
            clearInterval(interval!);
            const nextMode = mode === "focus" ? "break" : "focus";
            const nextTime = nextMode === "focus" ? focusTime : breakTime;
            setMode(nextMode);
            setIsPaused(true);
            return nextTime;
          }
          return seconds - 1;
        });
      }, 1000);
    } else if (interval) {
      clearInterval(interval);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, isPaused, mode]);

  useEffect(() => {
    const totalSeconds = mode === "focus" ? focusTime : breakTime;
    setProgress(((totalSeconds - secondsLeft) / totalSeconds) * 100);
  }, [secondsLeft, mode]);

  const startTimer = () => {
    setIsActive(true);
    setIsPaused(false);
  };

  const pauseTimer = () => {
    setIsPaused(true);
  };

  const resetTimer = () => {
    setIsActive(false);
    setIsPaused(true);
    setMode("focus");
    setSecondsLeft(focusTime);
  };

  const formatTime = (timeInSeconds: number) => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = timeInSeconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  };

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <TimerIcon className="h-8 w-8" />
          Mode Focus
        </h1>
        <p className="text-muted-foreground">
          Utilisez la technique Pomodoro pour rester concentré et productif.
        </p>
      </div>

      <Card className="glass-card mx-auto max-w-md">
        <CardHeader>
          <CardTitle className="text-center">
            {mode === "focus" ? "Temps de travail" : "Pause"}
          </CardTitle>
          <CardDescription className="text-center">
            {mode === "focus"
              ? "Concentrez-vous sur votre tâche"
              : "Prenez une courte pause"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex justify-center">
            <div className="w-48 h-48 rounded-full border-8 border-primary/20 flex items-center justify-center relative">
              <svg className="absolute inset-0 w-full h-full -rotate-90">
                <circle
                  cx="96"
                  cy="96"
                  r="88"
                  fill="none"
                  strokeWidth="8"
                  stroke="currentColor"
                  className="text-primary"
                  strokeDasharray="552.9"
                  strokeDashoffset={552.9 - (progress / 100) * 552.9}
                />
              </svg>
              <span className="text-4xl font-bold">{formatTime(secondsLeft)}</span>
            </div>
          </div>

          <div className="flex justify-center space-x-4 pt-4">
            {isPaused ? (
              <Button onClick={startTimer} size="lg">
                {isActive ? "Reprendre" : "Démarrer"}
              </Button>
            ) : (
              <Button onClick={pauseTimer} variant="outline" size="lg">
                Pause
              </Button>
            )}
            <Button onClick={resetTimer} variant="outline" size="lg">
              Réinitialiser
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Focus;
