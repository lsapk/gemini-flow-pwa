import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, Target, CheckCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { Goal } from "@/types";

interface GoalListProps {
  goals: Goal[];
  onRefresh: () => void;
  renderGoal: (goal: Goal) => React.ReactElement;
}

export default function GoalList({ goals, onRefresh, renderGoal }: GoalListProps) {
  const [draggedGoal, setDraggedGoal] = useState<Goal | null>(null);
  const { user } = useAuth();

  const handleDragStart = (goal: Goal) => {
    setDraggedGoal(goal);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>, targetGoal: Goal) => {
    e.preventDefault();

    if (!draggedGoal || draggedGoal.id === targetGoal.id || !user) return;

    // Optimistically update the UI
    const updatedGoals = goals.map(goal => {
      if (goal.id === draggedGoal.id) {
        return { ...goal, category: targetGoal.category };
      }
      return goal;
    });

    // Call the API to update the goal
    // try {
    //   await updateGoal(draggedGoal.id, { category: targetGoal.category });
    //   toast.success('Goal category updated!');
    //   onRefresh();
    // } catch (error) {
    //   console.error('Error updating goal:', error);
    //   toast.error('Failed to update goal category.');
    //   // Revert the UI to the previous state in case of an error
    //   setGoals(goals);
    // } finally {
    //   setDraggedGoal(null);
    // }
    setDraggedGoal(null);
  };

  return (
    <div className="space-y-4">
      {goals.map((goal) => renderGoal(goal))}
    </div>
  );
}
