type PageHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
};

export function PageHeader({ eyebrow, title, description }: PageHeaderProps) {
  return (
    <header className="mb-6">
      {eyebrow ? <p className="mb-2 text-xs font-extrabold text-[#69746e]">{eyebrow}</p> : null}
      <h1 className="m-0 text-[2rem] leading-tight font-extrabold text-[#24231f]">{title}</h1>
      {description ? <p className="mt-2.5 leading-relaxed text-[#6f6a60]">{description}</p> : null}
    </header>
  );
}
