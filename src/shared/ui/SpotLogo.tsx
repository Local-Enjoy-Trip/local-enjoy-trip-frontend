import spotLogo from "@/assets/spot-logo.svg";

type SpotLogoProps = {
  className?: string;
};

export function SpotLogo({ className = "w-[59px]" }: SpotLogoProps) {
  return (
    <div className={`relative inline-flex items-center ${className}`}>
      <img className="h-auto w-full" src={spotLogo} alt="SPOT" />
    </div>
  );
}
