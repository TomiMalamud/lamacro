import { cn } from "@/lib/utils";

export default function InlineLink({
  href,
  children,
  className,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <a
      target="_blank"
      rel="noopener"
      href={href}
      className={cn(
        "underline underline-offset-4 hover:decoration-stone-900 hover:text-stone-900 dark:hover:decoration-stone-200 dark:hover:text-stone-200 transition-all duration-300",
        className,
      )}
    >
      {children}
    </a>
  );
}
