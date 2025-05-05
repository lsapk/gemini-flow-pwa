
import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

// Loading state component
export const ChartLoading = ({ height = 300 }: { height?: number }) => (
  <div className="flex items-center justify-center" style={{ height }}>
    <Skeleton className="h-[80%] w-[90%]" />
  </div>
);
