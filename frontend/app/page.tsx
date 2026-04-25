import AuthGuard from "../src/components/AuthGuard";
import EstoqueMecanicaFrontend from "../src/components/EstoqueMecanicaFrontend";

export default function Home() {
  return (
    <AuthGuard>
      <EstoqueMecanicaFrontend />
    </AuthGuard>
  );
}