import spotLogo from "@/assets/spot-logo.svg";

export function SpotLogo() {
  return (
    <div className="relative inline-flex w-[59px] items-center">
      <img className="h-auto w-full" src={spotLogo} alt="SPOT" />
    </div>
  );
}
