
export default function LayoutLAuth({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col justify-center items-center h-full">
      <p>Matias Rojas Dashboard</p>
      <h1 className="text-3xl my-2"> Bienvenido a mi dashboard</h1>
      <h2 className="text-2xl mb-3">Inicia sesión para continuar</h2>
      {children}
    </div>
  )
}