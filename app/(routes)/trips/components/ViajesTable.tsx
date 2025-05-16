const getEstadoBadge = (estado: string) => {
  const estados: Record<string, { label: string; className: string }> = {
    planificado: {
      label: "Planificado",
      className: "bg-gray-300 text-gray-800 hover:bg-gray-400"
    },
    en_ruta: {
      label: "En Ruta",
      className: "bg-sky-400 text-white hover:bg-sky-500"
    },
    realizado: {
      label: "Realizado",
      className: "bg-green-500 text-white hover:bg-green-600"
    },
    incidente: {
      label: "Incidente",
      className: "bg-yellow-400 text-gray-800 hover:bg-yellow-500"
    },
    cancelado: {
      label: "Cancelado",
      className: "bg-red-500 text-white hover:bg-red-600"
    }
  };

  const estadoConfig = estados[estado] || estados.planificado;

  return (
    <Badge className={estadoConfig.className}>
      {estadoConfig.label}
    </Badge>
  );
}; 