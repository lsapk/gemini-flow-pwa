
import React from "react";
import { IconBase, IconProps } from "./utils";

export const TargetIcon: React.FC<IconProps> = (props) => (
  <IconBase {...props}>
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="12" r="6" />
    <circle cx="12" cy="12" r="2" />
  </IconBase>
);
