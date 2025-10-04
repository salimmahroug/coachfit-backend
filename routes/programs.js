import express from "express";
import Program from "../models/Program.js";
import Client from "../models/Client.js";
import { protect } from "../middleware/auth.js";
import { generateWorkoutProgram } from "../services/aiService.js";

const router = express.Router();

// Toutes les routes sont protégées
router.use(protect);

// @route   POST /api/programs/generate
// @desc    Générer un programme avec l'IA
// @access  Private
router.post("/generate", async (req, res) => {
  try {
    const { clientId } = req.body;
    console.log("🔄 Début génération programme pour client:", clientId);

    // Vérifier que le client existe et appartient à l'utilisateur
    const client = await Client.findOne({
      _id: clientId,
      createdBy: req.user._id,
    });

    if (!client) {
      console.log("❌ Client non trouvé:", clientId);
      return res.status(404).json({
        success: false,
        message: "Client non trouvé",
      });
    }

    console.log("✅ Client trouvé:", client.name);
    console.log(
      "📊 Données client:",
      JSON.stringify(
        {
          name: client.name,
          fitnessLevel: client.fitnessLevel,
          goals: client.goals,
          availableDays: client.availableDays,
          sessionDuration: client.sessionDuration,
        },
        null,
        2
      )
    );

    // Générer le programme avec l'IA
    console.log("🤖 Appel à generateWorkoutProgram...");
    const programData = await generateWorkoutProgram(client);
    console.log("✅ Programme généré par IA:", programData.name);

    // Adapter les données pour le modèle Program
    const adaptedWorkouts = programData.workouts.map((workout, index) => {
      const dayNames = [
        "monday",
        "tuesday",
        "wednesday",
        "thursday",
        "friday",
        "saturday",
        "sunday",
      ];
      return {
        day: dayNames[index % 7],
        name: workout.name,
        type: "mixed",
        duration: client.sessionDuration || 60,
        exercises: workout.exercises || [],
        warmup: "Échauffement : 5-10 minutes de cardio léger",
        cooldown: "Retour au calme : étirements 5-10 minutes",
      };
    });

    // Créer le programme dans la base de données
    console.log("💾 Création du programme dans MongoDB...");
    const program = await Program.create({
      name: programData.name,
      description: programData.description,
      client: client._id, // Utiliser 'client' au lieu de 'clientId'
      createdBy: req.user._id,
      duration: {
        value: programData.duration || 4,
        unit: "weeks",
      },
      frequency: programData.frequency || 3,
      workouts: adaptedWorkouts,
      status: "active",
      generatedByAI: programData.generatedByAI || false,
      aiModel: programData.aiModel || null,
    });
    console.log("✅ Programme créé avec succès:", program._id);

    res.status(201).json({
      success: true,
      message: "Programme généré avec succès",
      program,
    });
  } catch (error) {
    console.error("❌ Erreur génération programme:", error);
    console.error("❌ Stack trace:", error.stack);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la génération du programme",
      error: error.message,
    });
  }
});

// @route   GET /api/programs
// @desc    Obtenir tous les programmes de l'utilisateur
// @access  Private
router.get("/", async (req, res) => {
  try {
    const { clientId, status } = req.query;

    const filter = { createdBy: req.user._id };

    if (clientId) {
      filter.client = clientId; // Utiliser 'client' au lieu de 'clientId'
    }

    if (status) {
      filter.status = status;
    }

    const programs = await Program.find(filter)
      .populate("client", "name email") // Utiliser 'client' au lieu de 'clientId'
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: programs.length,
      programs,
    });
  } catch (error) {
    console.error("❌ Erreur récupération programmes:", error);
    console.error("❌ Stack trace:", error.stack);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des programmes",
      error: error.message,
    });
  }
});

// @route   POST /api/programs
// @desc    Créer un programme manuellement
// @access  Private
router.post("/", async (req, res) => {
  try {
    const { clientId } = req.body;

    // Vérifier que le client existe et appartient à l'utilisateur
    const client = await Client.findOne({
      _id: clientId,
      createdBy: req.user._id,
    });

    if (!client) {
      return res.status(404).json({
        success: false,
        message: "Client non trouvé",
      });
    }

    const programData = {
      ...req.body,
      client: clientId, // Mapper clientId vers 'client'
      createdBy: req.user._id,
    };

    // Supprimer clientId si présent pour éviter les conflits
    delete programData.clientId;

    const program = await Program.create(programData);

    res.status(201).json({
      success: true,
      message: "Programme créé avec succès",
      program,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Erreur lors de la création du programme",
      error: error.message,
    });
  }
});

// @route   GET /api/programs/:id
// @desc    Obtenir un programme par ID
// @access  Private
router.get("/:id", async (req, res) => {
  try {
    const program = await Program.findOne({
      _id: req.params.id,
      createdBy: req.user._id,
    }).populate("client", "name email fitnessLevel goals"); // Utiliser 'client' au lieu de 'clientId'

    if (!program) {
      return res.status(404).json({
        success: false,
        message: "Programme non trouvé",
      });
    }

    res.json({
      success: true,
      program,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération du programme",
      error: error.message,
    });
  }
});

// @route   PUT /api/programs/:id
// @desc    Mettre à jour un programme
// @access  Private
router.put("/:id", async (req, res) => {
  try {
    let program = await Program.findOne({
      _id: req.params.id,
      createdBy: req.user._id,
    });

    if (!program) {
      return res.status(404).json({
        success: false,
        message: "Programme non trouvé",
      });
    }

    program = await Program.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.json({
      success: true,
      message: "Programme mis à jour avec succès",
      program,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Erreur lors de la mise à jour du programme",
      error: error.message,
    });
  }
});

// @route   DELETE /api/programs/:id
// @desc    Supprimer un programme
// @access  Private
router.delete("/:id", async (req, res) => {
  try {
    const program = await Program.findOne({
      _id: req.params.id,
      createdBy: req.user._id,
    });

    if (!program) {
      return res.status(404).json({
        success: false,
        message: "Programme non trouvé",
      });
    }

    await Program.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: "Programme supprimé avec succès",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erreur lors de la suppression du programme",
      error: error.message,
    });
  }
});

// @route   POST /api/programs/:id/progress
// @desc    Ajouter une entrée de progression
// @access  Private
router.post("/:id/progress", async (req, res) => {
  try {
    const program = await Program.findOne({
      _id: req.params.id,
      createdBy: req.user._id,
    });

    if (!program) {
      return res.status(404).json({
        success: false,
        message: "Programme non trouvé",
      });
    }

    program.progress.push(req.body);
    await program.save();

    res.json({
      success: true,
      message: "Progression ajoutée avec succès",
      program,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Erreur lors de l'ajout de la progression",
      error: error.message,
    });
  }
});

export default router;
