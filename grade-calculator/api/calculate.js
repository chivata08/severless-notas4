// api/calculate.js

import { PrismaClient } from '@prisma/client';
// Usaremos getAuth de Clerk para asegurar que solo usuarios logueados accedan
import { getAuth } from '@clerk/nextjs/server'; 

const prisma = new PrismaClient();

// Nota: 10.5 es la nota mínima para aprobar, según tu schema.prisma
const PASSING_GRADE = 10.5;

/**
 * Función para calcular el promedio ponderado y la nota faltante.
 * @param {Array<{weight: number, grade: number|null, maxGrade: number}>} evaluations 
 * @returns {{currentAverage: number, gradeNeeded: number|null, isApproved: boolean}}
 */
function calculateGrades(evaluations) {
    let weightedSum = 0;
    let totalWeightedGrade = 0;
    let totalPonderationAchieved = 0;
    
    // 1. Cálculo de promedio actual y ponderación alcanzada
    evaluations.forEach(evalItem => {
        // La nota se asume como 0 si es nula para el cálculo del promedio actual,
        // pero solo si la evaluación tiene peso (weight > 0).
        const grade = evalItem.grade !== null ? evalItem.grade : 0;
        
        weightedSum += grade * evalItem.weight;
        totalPonderationAchieved += evalItem.weight;
        totalWeightedGrade += evalItem.maxGrade * evalItem.weight;
    });

    const currentAverage = weightedSum; // Si las ponderaciones suman 100% (1.0), es el promedio.

    // 2. Determinar la nota faltante (si aún no se ha evaluado el 100%)
    let gradeNeeded = null;
    let isApproved = false;
    const remainingWeight = 1 - totalPonderationAchieved;
    
    if (currentAverage >= PASSING_GRADE) {
        // Ya aprobó con las notas actuales
        isApproved = true;
    } else if (remainingWeight > 0) {
        // Nota total que se necesita: (Nota para aprobar) - (Suma ponderada actual)
        const totalNeeded = PASSING_GRADE - currentAverage;
        
        // Nota necesaria en las evaluaciones restantes
        gradeNeeded = totalNeeded / remainingWeight;
        
        // Si la nota necesaria es mayor a la nota máxima posible (ej: 20), es imposible aprobar
        if (gradeNeeded > 20) { 
            gradeNeeded = null; // O un indicador de "Imposible"
        }
    }
    
    return {
        currentAverage: parseFloat(currentAverage.toFixed(2)),
        gradeNeeded: gradeNeeded ? parseFloat(gradeNeeded.toFixed(2)) : null,
        isApproved: isApproved
    };
}


export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    // 1. Verificar autenticación (Clerk)
    const { userId } = getAuth(req);
    if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    
    try {
        const { courseId, evaluations } = req.body;
        
        // 2. Validar datos
        if (!courseId || !evaluations || !Array.isArray(evaluations)) {
            return res.status(400).json({ error: 'Missing courseId or evaluations data.' });
        }

        // 3. Realizar el cálculo
        const results = calculateGrades(evaluations);
        
        // 4. Buscar el usuario en tu DB (necesitas el ID de Neon DB, no el de Clerk)
        const userInDB = await prisma.user.findUnique({ where: { clerkId: userId }, select: { id: true } });
        if (!userInDB) {
             return res.status(404).json({ error: 'User not found in database.' });
        }
        
        // 5. Guardar la simulación en Neon DB (Persistencia)
        const simulation = await prisma.simulation.create({
            data: {
                courseId: courseId,
                userId: userInDB.id, 
                currentAverage: results.currentAverage,
                gradeNeeded: results.gradeNeeded,
                passingGrade: PASSING_GRADE,
                results: evaluations, // Guarda el detalle de la simulación
            }
        });

        // 6. Devolver los resultados
        return res.status(200).json({ 
            message: 'Calculation successful and saved.',
            simulationId: simulation.id,
            ...results
        });

    } catch (error) {
        console.error('Error in calculation or persistence:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
}