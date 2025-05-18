import { OrigenesDestinosTable } from "./components/OrigenesDestinosTable";

export default function OrigenesDestinosPage() {
  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Orígenes y Destinos</h1>
      </div>
      <OrigenesDestinosTable />
    </div>
  );
} 