import { Button } from "@/components/ui/button";
import { CardSummary } from "./components/CardSummary";
import { UsersRound } from "lucide-react";

export default function Home() {
  return (
    <div>
      <h2 className="text-2xl mb-4">Dashboard</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-x-20">
        <CardSummary
          icon={UsersRound}
          total="12.450"
          average={15}
          title="Total Companies"
          tooltipText="Ver las compañias creadas"
        />
        <div>Card Sumarry</div>
        <div>Card Sumarry</div>
        <div>Card Sumarry</div>
      </div>
    </div>
  );
}
