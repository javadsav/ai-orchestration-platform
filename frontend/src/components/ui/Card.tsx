import type { HTMLAttributes, ReactNode } from "react";

interface CardProps extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  title?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
}

export function Card({ title, actions, children, className, ...rest }: CardProps) {
  return (
    <div className={`mb-5 rounded-md border border-border bg-surface ${className ?? ""}`} {...rest}>
      {(title || actions) && (
        <div className="flex items-center justify-between border-b border-border px-4 py-3.5">
          {title ? <h2 className="m-0 text-[0.95rem] font-semibold">{title}</h2> : <span />}
          {actions}
        </div>
      )}
      <div className="p-4">{children}</div>
    </div>
  );
}
