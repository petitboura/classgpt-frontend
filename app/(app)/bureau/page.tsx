import { SectionPage } from "@/components/SectionPage";
import { MesCodes } from "@/components/MesCodes";
import { EspaceEntrerCode } from "@/components/EspaceEntrerCode";

export default function PageBureau() {
  return (
    <SectionPage title="Bureau">
      <div className="flex flex-col gap-4">
        <MesCodes />
        <EspaceEntrerCode />
      </div>
    </SectionPage>
  );
}
