export function StaticPage({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="max-w-(--breakpoint-md) mx-auto w-full px-4 py-16">
      <h1 className="font-display font-bold text-3xl sm:text-4xl mb-3">
        {title}
      </h1>
      {subtitle && (
        <p className="text-black/60 text-lg mb-10 max-w-xl">{subtitle}</p>
      )}
      <div className="flex flex-col gap-6 text-black/70 leading-relaxed">
        {children}
      </div>
    </div>
  );
}
