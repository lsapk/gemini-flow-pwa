
import React from "react";
import { IconBase, IconProps } from "./utils";

export const ChartLineIcon: React.FC<IconProps> = (props) => (
  <IconBase {...props}>
    <path d="M3 3v18h18" />
    <path d="m19 9-5 5-4-4-3 3" />
  </IconBase>
);
