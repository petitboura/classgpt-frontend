import { SectionPage } from "@/components/SectionPage";
import { ProgrammesRecus } from "@/components/ProgrammesRecus";
import { EspaceProgramme } from "@/components/EspaceProgramme";

export default function PageProgramme() {
  return (
    <SectionPage title="Mon programme">
      <ProgrammesRecus />
      <EspaceProgramme />
    </SectionPage>
  );
}
