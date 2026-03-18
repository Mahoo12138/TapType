import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface MainProps extends HTMLAttributes<HTMLElement> {
  fixed?: boolean;
}

export const Main = ({ fixed, className, ...props }: MainProps) => {
  return (
    <main
      className={cn(
        "mx-auto w-full px-4",
        fixed ? "container" : "max-w-7xl",
        className
      )}
      {...props}
    />
  )
}

Main.displayName = "Main";
