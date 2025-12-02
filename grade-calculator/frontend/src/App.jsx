// frontend/src/App.jsx

import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { SignedIn, SignedOut, RedirectToSignIn, UserButton } from '@clerk/clerk-react';
import GradeCalculatorPage from './pages/GradeCalculatorPage'; // Importar
import LandingPage from './pages/LandingPage'; // Importar

// Componente para el encabezado con el botón de usuario
const Header = () => (
  <header className="p-4 flex justify-between items-center bg-white shadow-md">
    <Link to="/dashboard" className="text-xl font-bold text-blue-600">
      GradeCalc
    </Link>
    <UserButton />
  </header>
);

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Ruta Pública para Login/Sign-up */}
        <Route path="/" element={<LandingPage />} />
        
        {/* Rutas Protegidas */}
        <Route 
          path="/dashboard" 
          element={
            <>
              {/* Si hay sesión iniciada */}
              <SignedIn>
                <Header />
                <main className="min-h-screen bg-gray-50"><GradeCalculatorPage /></main>
              </SignedIn>
              
              {/* Si NO hay sesión iniciada, redirigir al login */}
              <SignedOut>
                {/* Redirigir al inicio de sesión de Clerk */}
                <RedirectToSignIn redirectUrl="/" /> 
              </SignedOut>
            </>
          } 
        />
        
        {/* Opcional: Ruta para el sign-in específico de Clerk */}
        <Route path="/sign-in/*" element={<LandingPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;