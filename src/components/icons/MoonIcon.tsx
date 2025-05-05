
import React from "react";
import { IconBase, IconProps } from "./utils";

export const MoonIcon: React.FC<IconProps> = (props) => (
  <IconBase {...props}>
    <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
  </IconBase>
);
