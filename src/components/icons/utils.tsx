
import React from "react";
import { cn } from "@/lib/utils";

// Base interface for all icons
export interface IconProps extends React.SVGProps<SVGSVGElement> {
  className?: string;
  size?: number;
}

// Base component for creating consistent icons
export const IconBase: React.FC<IconProps & { children: React.ReactNode }> = ({ 
  className, 
  size = 24, 
  children,
  ...props 
}) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={cn("", className)}
    {...props}
  >
    {children}
  </svg>
);
