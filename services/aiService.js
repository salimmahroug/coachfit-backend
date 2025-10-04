import axios from "axios";

/**
 * Génère un programme d'entraînement personnalisé avec l'IA
 * @param {Object} clientData - Données du client
 * @returns {Object} - Programme d'entraînement structuré
 */
export const generateWorkoutProgram = async (clientData) => {
  try {
    const {
      name,
      age,
      weight,
      height,
      fitnessLevel,
      goals,
      availableDays,
      sessionDuration,
      preferredTime,
      equipment,
      medicalConditions,
    } = clientData;

    // Calculer le nombre de jours par semaine
    const daysPerWeek = availableDays?.length || 3;

    // Construction du prompt pour l'IA
    const prompt = `
Crée un programme d'entraînement personnalisé pour un client avec les caractéristiques suivantes:

- Nom: ${name}
- Âge: ${age} ans
- Poids: ${weight} kg
- Taille: ${height} cm
- Niveau de fitness: ${fitnessLevel}
- Objectifs: ${goals?.join(", ") || "Fitness général"}
- Disponibilité: ${daysPerWeek} jours/semaine (${
      availableDays?.join(", ") || "non spécifié"
    }), ${sessionDuration || 60} minutes/session
- Moment préféré: ${preferredTime || "morning"}
- Équipement disponible: ${equipment?.join(", ") || "bodyweight"}
${
  medicalConditions && medicalConditions.length > 0
    ? `- Conditions médicales: ${medicalConditions.join(", ")}`
    : ""
}

Génère un programme d'entraînement structuré sur ${
      daysPerWeek * 4
    } semaines avec:
1. Un nom de programme accrocheur
2. Une description détaillée
3. Des séances d'entraînement pour chaque jour disponible
4. Pour chaque séance, liste 5-8 exercices avec:
   - Nom de l'exercice
   - Nombre de séries
   - Nombre de répétitions (ou durée en secondes)
   - Temps de repos entre les séries
   - Notes et conseils d'exécution

Format de réponse JSON:
{
  "name": "Nom du programme",
  "description": "Description détaillée",
  "duration": ${daysPerWeek * 4},
  "frequency": ${daysPerWeek},
  "workouts": [
    {
      "day": 1,
      "name": "Nom de la séance",
      "focus": "Zone ciblée",
      "exercises": [
        {
          "name": "Nom de l'exercice",
          "sets": 3,
          "reps": "10-12",
          "rest": 60,
          "notes": "Conseils d'exécution"
        }
      ]
    }
  ]
}
`;

    // Configuration de l'API (OpenAI ou autre)
    const apiUrl =
      process.env.AI_API_URL || "https://api.openai.com/v1/chat/completions";
    const apiKey = process.env.AI_API_KEY;

    console.log(
      "🔑 Vérification clé API:",
      apiKey ? "✅ Présente" : "❌ Absente"
    );

    if (!apiKey) {
      console.log("⚠️ Aucune clé API - Utilisation du générateur fallback");
      // Mode fallback: génération locale simple
      return generateFallbackProgram(clientData);
    }

    console.log("🤖 Appel à Groq AI en cours...");
    console.log("📡 URL:", apiUrl);
    console.log(
      "🎯 Modèle:",
      process.env.AI_MODEL || "llama-3.3-70b-versatile"
    );

    // Appel à l'API IA
    const response = await axios.post(
      apiUrl,
      {
        model: process.env.AI_MODEL || "llama-3.3-70b-versatile",
        messages: [
          {
            role: "system",
            content:
              "Tu es un coach sportif expert qui crée des programmes d'entraînement personnalisés. Réponds toujours en JSON valide.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 2000,
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("✅ Réponse Groq AI reçue!");

    // Extraction et parsing de la réponse
    let content = response.data.choices[0].message.content;
    console.log("📝 Contenu de la réponse:", content.substring(0, 200) + "...");

    // Nettoyer les balises markdown si présentes (```json ... ```)
    content = content.trim();
    if (content.startsWith("```json")) {
      content = content.replace(/^```json\s*/i, "").replace(/```\s*$/, "");
      console.log("🧹 Balises markdown supprimées");
    } else if (content.startsWith("```")) {
      content = content.replace(/^```\s*/, "").replace(/```\s*$/, "");
      console.log("🧹 Balises markdown supprimées");
    }

    const programData = JSON.parse(content);

    // Ajout des métadonnées IA
    programData.generatedByAI = true;
    programData.aiModel = process.env.AI_MODEL || "llama-3.3-70b-versatile";

    console.log("🎉 Programme IA généré avec succès!");
    return programData;
  } catch (error) {
    console.error(
      "❌ Erreur lors de la génération du programme:",
      error.message
    );
    if (error.response) {
      console.error("📛 Détails erreur API:", {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data,
      });
    }

    console.log("⚠️ Utilisation du générateur fallback");
    // En cas d'erreur, utiliser le programme de fallback
    return generateFallbackProgram(clientData);
  }
};

/**
 * Génère un programme de base sans IA (fallback)
 * @param {Object} clientData - Données du client
 * @returns {Object} - Programme d'entraînement basique
 */
const generateFallbackProgram = (clientData) => {
  console.log(
    "🔄 FALLBACK: Génération de programme basique pour",
    clientData.name
  );

  const { name, fitnessLevel, goals, availableDays, sessionDuration } =
    clientData;

  const daysPerWeek = availableDays?.length || 3;

  const program = {
    name: `Programme ${goals?.[0] || "Fitness"} pour ${name}`,
    description: `Programme d'entraînement personnalisé basé sur votre niveau ${fitnessLevel}`,
    duration: daysPerWeek * 4,
    frequency: daysPerWeek,
    generatedByAI: false,
    workouts: [],
  };

  // Génération de séances basiques selon le niveau
  const basicExercises = {
    beginner: [
      { name: "Squats au poids du corps", sets: 3, reps: "10-12", rest: 60 },
      {
        name: "Pompes (genoux au sol si nécessaire)",
        sets: 3,
        reps: "8-10",
        rest: 60,
      },
      { name: "Planche", sets: 3, reps: "20-30 secondes", rest: 45 },
      { name: "Fentes alternées", sets: 3, reps: "10 par jambe", rest: 60 },
      { name: "Étirements", sets: 1, reps: "5 minutes", rest: 0 },
    ],
    intermediate: [
      { name: "Squats avec poids", sets: 4, reps: "12-15", rest: 60 },
      { name: "Pompes standard", sets: 4, reps: "12-15", rest: 60 },
      {
        name: "Planche avec variations",
        sets: 3,
        reps: "45 secondes",
        rest: 45,
      },
      { name: "Burpees", sets: 3, reps: "10", rest: 90 },
      { name: "Mountain climbers", sets: 3, reps: "20", rest: 60 },
      { name: "Étirements dynamiques", sets: 1, reps: "5 minutes", rest: 0 },
    ],
    advanced: [
      { name: "Squats jump", sets: 4, reps: "15", rest: 90 },
      { name: "Pompes diamant", sets: 4, reps: "15", rest: 60 },
      {
        name: "Planche avec levée de jambe",
        sets: 4,
        reps: "60 secondes",
        rest: 45,
      },
      { name: "Burpees avec saut", sets: 4, reps: "15", rest: 90 },
      { name: "Sprint sur place", sets: 4, reps: "30 secondes", rest: 60 },
      {
        name: "Gainage latéral",
        sets: 3,
        reps: "45 secondes par côté",
        rest: 60,
      },
    ],
  };

  const exercises = basicExercises[fitnessLevel] || basicExercises.intermediate;

  for (let i = 0; i < daysPerWeek; i++) {
    program.workouts.push({
      day: i + 1,
      name: `Séance ${i + 1} - Full Body`,
      focus: "Corps entier",
      exercises: exercises.map((ex) => ({
        ...ex,
        notes: "Assurez-vous d'avoir une bonne technique",
      })),
    });
  }

  return program;
};

export default { generateWorkoutProgram };
