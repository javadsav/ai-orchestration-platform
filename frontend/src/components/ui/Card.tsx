import type { HTMLAttributes, ReactNode } from "react";

interface CardProps extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  title?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
}

export function Card({ title, actions, children, className, ...rest }: CardProps) {
  return (
    <div className={`card ${className ?? ""}`} {...rest}>
      {(title || actions) && (
        <div className="card-header">
          {title ? <h2 className="card-title">{title}</h2> : <span />}
          {actions}
        </div>
      )}
      <div className="card-body">{children}</div>
    </div>
  );
}
