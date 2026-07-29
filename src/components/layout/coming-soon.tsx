export function ComingSoon({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="flex-1 flex items-center justify-center px-4 py-24">
      <div className="max-w-md text-center">
        <p className="text-xs font-semibold tracking-wide uppercase text-black/50 mb-3">
          {eyebrow}
        </p>
        <h1 className="font-display font-bold text-3xl mb-3">{title}</h1>
        <p className="text-black/60">{description}</p>
      </div>
    </div>
  );
}
