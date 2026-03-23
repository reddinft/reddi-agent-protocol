"use client";

import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { VariantProps } from "class-variance-authority";
import type { CSSProperties } from "react";

interface Props extends VariantProps<typeof buttonVariants> {
  href: string;
  className?: string;
  style?: CSSProperties;
  children: React.ReactNode;
  disabled?: boolean;
}

export default function LinkButton({ href, variant, size, className, style, children, disabled }: Props) {
  if (disabled) {
    return (
      <span
        className={cn(buttonVariants({ variant, size }), "pointer-events-none opacity-50", className)}
        style={style}
      >
        {children}
      </span>
    );
  }
  return (
    <Link href={href} className={cn(buttonVariants({ variant, size }), className)} style={style}>
      {children}
    </Link>
  );
}
