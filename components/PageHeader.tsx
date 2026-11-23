export function PageHeader({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: React.ReactNode }) {
  return <div className="mb-6 flex flex-col gap-4 sm:mb-7 sm:flex-row sm:items-end sm:justify-between">
    <div className="min-w-0">
      <p className="mb-2 text-xs font-bold tracking-[.12em] text-[#426b56]">{eyebrow}</p>
      <h1 className="break-words text-3xl font-extrabold leading-tight sm:text-[2rem]">{title}</h1>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-[#52665c]">{description}</p>
    </div>
    {action && <div className="w-full shrink-0 sm:w-auto">{action}</div>}
  </div>;
}
