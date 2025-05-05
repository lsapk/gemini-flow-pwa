
import React from "react";
import { IconBase, IconProps } from "./utils";

export const TimerIcon: React.FC<IconProps> = (props) => (
  <IconBase {...props}>
    <line x1="10" x2="14" y1="2" y2="2" />
    <line x1="12" x2="12" y1="14" y2="10" />
    <circle cx="12" cy="14" r="8" />
  </IconBase>
);
