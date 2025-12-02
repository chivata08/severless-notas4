import { SignIn } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';

const LandingPage = () => {
  const navigate = useNavigate();

  // Función que redirige al dashboard después de un inicio de sesión exitoso
  const handleSignIn = () => {
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">
        Calculadora de Notas Serverless
      </h1>
      {/* Componente de inicio de sesión de Clerk */}
      <SignIn routing="path" path="/sign-in" afterSignInUrl="/dashboard" />
    </div>
  );
};

export default LandingPage;