import * as React from "react";
import { cva } from "class-variance-authority";
import { cn } from "../../lib/utils/cn";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xs text-sm font-medium transition-colors duration-150 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-40",
  {
    variants: {
      variant: {
        primary: "bg-clinical-teal text-paper hover:bg-clinical-tealdeep",
        brick: "bg-clinical-brick text-paper hover:bg-[#9c3f29]",
        outline: "border border-ink/15 bg-transparent text-ink hover:bg-ink/5 dark:text-[#DCE7E4] dark:border-white/15 dark:hover:bg-white/5",
        ghost: "bg-transparent text-ink hover:bg-ink/5 dark:text-[#DCE7E4] dark:hover:bg-white/5",
        subtle: "bg-clinical-sagelight text-clinical-tealdeep hover:bg-[#cfe3db]",
        link: "text-clinical-teal underline-offset-4 hover:underline p-0 h-auto",
      },
      size: {
        sm: "h-8 px-3 text-xs",
        md: "h-10 px-4",
        lg: "h-12 px-6 text-base",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  }
);

export const Button = React.forwardRef(
  ({ className, variant, size, ...props }, ref) => (
    <button ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />
  )
);
Button.displayName = "Button";
