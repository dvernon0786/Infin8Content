import { Button } from "@/components/ui/button";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const ctaButtonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        brand: "shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 focus-visible:ring-[3px] focus-visible:ring-ring/50",
        ghost: "transition-all duration-200 focus-visible:ring-[3px] focus-visible:ring-ring/50",
      },
      size: {
        default: "h-10",
        lg: "h-12", 
        xl: "h-14",
      },
    },
    defaultVariants: {
      variant: "brand",
      size: "lg",
    },
  }
);

interface CTAButtonProps extends React.ComponentProps<"button">,
  VariantProps<typeof ctaButtonVariants> {
  asChild?: boolean;
}

export function CTAButton({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: CTAButtonProps) {
  const variantStyles = variant === 'brand' 
    ? { background: 'var(--gradient-brand)', color: 'white' }
    : variant === 'ghost'
    ? { border: '2px solid var(--color-primary-blue)', color: 'var(--color-primary-blue)' }
    : {};

  const buttonStyles = {
    ...variantStyles,
    borderRadius: 'var(--radius-lg)', // Use design token for consistent radius
    padding: size === 'default' ? 'var(--spacing-sm) var(--spacing-md)' : 
             size === 'lg' ? 'var(--spacing-md) var(--spacing-xl)' :
             'var(--spacing-lg) var(--spacing-2xl)',
    fontWeight: 'var(--font-weight-semibold)'
  };

  if (asChild && 'asChild' in props) {
    const { asChild: _, ...buttonProps } = props;
    return (
      <Button 
        className={cn(ctaButtonVariants({ variant, size }), className)} 
        style={buttonStyles}
        asChild 
        {...buttonProps} 
      />
    );
  }
  
  return (
    <Button
      className={cn(ctaButtonVariants({ variant, size }), className)}
      style={buttonStyles}
      {...props}
    />
  );
}

export { ctaButtonVariants };
