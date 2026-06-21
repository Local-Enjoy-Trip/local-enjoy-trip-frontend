import spotLogo from "@/assets/spot-logo.png";

export function SpotLogo() {
  return (
    <div className="relative inline-flex w-24 items-center">
      <img className="h-auto w-full" src={spotLogo} alt="SPOT" />
    </div>
  );
}
