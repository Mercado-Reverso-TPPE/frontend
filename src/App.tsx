import { QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "react-router";
import { criarClienteDeConsulta } from "@/api/consulta";
import { ProvedorDeSessao } from "@/hooks/useSessao";
import { roteador } from "@/rotas";

const clienteDeConsulta = criarClienteDeConsulta();

export default function App() {
  return (
    <QueryClientProvider client={clienteDeConsulta}>
      <ProvedorDeSessao>
        <RouterProvider router={roteador} />
      </ProvedorDeSessao>
    </QueryClientProvider>
  );
}
