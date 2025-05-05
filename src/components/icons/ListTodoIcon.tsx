
import React from "react";
import { IconBase, IconProps } from "./utils";

export const ListTodoIcon: React.FC<IconProps> = (props) => (
  <IconBase {...props}>
    <rect width="6" height="6" x="4" y="4" rx="1" />
    <path d="M14 5h6" />
    <path d="M14 9h6" />
    <rect width="6" height="6" x="4" y="14" rx="1" />
    <path d="M14 15h6" />
    <path d="M14 19h6" />
  </IconBase>
);
