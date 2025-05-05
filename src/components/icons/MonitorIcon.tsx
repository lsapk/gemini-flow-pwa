
import React from "react";
import { IconBase, IconProps } from "./utils";

export const MonitorIcon: React.FC<IconProps> = (props) => (
  <IconBase {...props}>
    <rect width="18" height="18" x="3" y="3" rx="2" />
    <path d="M7 7v10" />
    <path d="M12 7v10" />
    <path d="M17 7v10" />
  </IconBase>
);
