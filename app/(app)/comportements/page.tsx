import { SectionPage } from "@/components/SectionPage";
import { MesComportements } from "@/components/MesComportements";

// Agent unique de Clovis (voir components/chat/ChatFlottant.tsx) --
// même constante que partout ailleurs dans l'app.
const AGENT_ID = "clovis";

export default function PageComportements() {
  return (
    <SectionPage title="Mes comportements">
      <MesComportements agentId={AGENT_ID} />
    </SectionPage>
  );
}
