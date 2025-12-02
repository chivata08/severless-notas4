import React, { useState } from 'react';
import { useUser } from '@clerk/clerk-react';
import axios from 'axios';

const GradeCalculatorPage = () => {
  const { user } = useUser();
  
  // Estado para la lista de evaluaciones (simulación de notas)
  const [evaluations, setEvaluations] = useState([
    { id: 1, name: 'Parcial 1', weight: 0.20, grade: 14, maxGrade: 20 },
    { id: 2, name: 'Trabajo Final', weight: 0.30, grade: null, maxGrade: 20 }, // Nota faltante
    { id: 3, name: 'Examen Final', weight: 0.50, grade: null, maxGrade: 20 },  // Nota faltante
  ]);
  
  const [courseId, setCourseId] = useState('temp-course-id-01'); // ID temporal para la DB
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleGradeChange = (id, newGrade) => {
    setEvaluations(prev => 
      prev.map(item => 
        item.id === id ? { ...item, grade: newGrade === '' ? null : parseFloat(newGrade) } : item
      )
    );
  };

  const calculateTotalWeight = () => evaluations.reduce((sum, item) => sum + item.weight, 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResults(null);
    
    // Validar que la suma de ponderaciones sea 1.0 (100%)
    if (calculateTotalWeight().toFixed(2) !== '1.00') {
      setError("La suma de las ponderaciones de las evaluaciones debe ser 100%.");
      setLoading(false);
      return;
    }
    
    // Los datos a enviar a la función Serverless /api/calculate
    const dataToSend = {
      courseId: courseId,
      evaluations: evaluations.map(e => ({
        name: e.name,
        weight: e.weight,
        grade: e.grade,
        maxGrade: e.maxGrade
      }))
    };
    
    try {
      // **Llamada a la función Serverless de Vercel**
      const response = await axios.post('/api/calculate', dataToSend);
      setResults(response.data);
      
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Error al conectar con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <h2 className="text-3xl font-bold mb-6">
        Hola, {user?.firstName || user?.emailAddresses[0]?.emailAddress}!
      </h2>
      <p className="text-gray-600 mb-8">
        Ingresa las notas de tus evaluaciones para calcular tu promedio actual y la nota que necesitas para aprobar (10.5).
      </p>

      {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-xl font-semibold mb-4">Evaluaciones del Curso</h3>
        <table className="min-w-full divide-y divide-gray-200 mb-6">
          <thead>
            <tr>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Evaluación</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Peso (%)</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nota (0-20)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {evaluations.map(item => (
              <tr key={item.id}>
                <td className="px-3 py-4 whitespace-nowrap">{item.name}</td>
                <td className="px-3 py-4 whitespace-nowrap">{item.weight * 100}%</td>
                <td className="px-3 py-4 whitespace-nowrap">
                  <input
                    type="number"
                    min="0"
                    max={item.maxGrade}
                    step="0.1"
                    value={item.grade === null ? '' : item.grade}
                    onChange={(e) => handleGradeChange(item.id, e.target.value)}
                    className="w-20 p-2 border border-gray-300 rounded"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        <div className="text-right font-medium text-gray-700 mb-4">
          Ponderación Total: **{calculateTotalWeight().toFixed(2) * 100}%**
        </div>
        
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-blue-400 transition"
        >
          {loading ? 'Calculando...' : 'Calcular Promedio y Necesaria'}
        </button>
      </form>

      {/* Mostrar Resultados */}
      {results && (
        <div className="mt-8 p-6 bg-green-50 rounded-lg border-2 border-green-300">
          <h3 className="text-2xl font-bold text-green-800 mb-4">Resultados de la Simulación</h3>
          <p className="text-lg mb-2">Promedio Ponderado Actual: **{results.currentAverage}**</p>
          <p className="text-lg">
            Nota Mínima Necesaria en las Ponderaciones Faltantes: **{results.gradeNeeded !== null ? results.gradeNeeded : (results.isApproved ? 'APROBADO' : 'IMPOSIBLE APROBAR')}**
          </p>
          <p className="text-sm mt-3 text-gray-600">ID de Historial Guardado: {results.simulationId}</p>
        </div>
      )}
    </div>
  );
};

export default GradeCalculatorPage;