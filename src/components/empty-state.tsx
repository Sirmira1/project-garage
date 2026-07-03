interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  children?: React.ReactNode;
}

export function EmptyState({
  icon,
  title,
  description,
  children,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-[color:var(--border)] bg-asphalt-2/50 px-6 py-14 text-center">
      {icon && <div className="text-steel-dim">{icon}</div>}
      <div>
        <p className="font-display text-lg">{title}</p>
        {description && (
          <p className="mx-auto mt-1 max-w-sm text-sm text-steel">
            {description}
          </p>
        )}
      </div>
      {children}
    </div>
  );
}
