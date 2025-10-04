import express from "express";
import Progress from "../models/Progress.js";
import Client from "../models/Client.js";
import Program from "../models/Program.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

// Protéger toutes les routes
router.use(protect);

// GET /api/progress - Récupérer toutes les progressions
router.get("/", async (req, res) => {
  try {
    const { clientId, programId, type, startDate, endDate } = req.query;

    const filter = { createdBy: req.user._id };

    if (clientId) filter.client = clientId;
    if (programId) filter.program = programId;
    if (type) filter.type = type;

    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    const progressRecords = await Progress.find(filter)
      .populate("client", "name email")
      .populate("program", "name")
      .sort({ date: -1 });

    res.json({
      success: true,
      count: progressRecords.length,
      progress: progressRecords,
    });
  } catch (error) {
    console.error("❌ Erreur récupération progressions:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des progressions",
      error: error.message,
    });
  }
});

// GET /api/progress/:id - Récupérer une progression
router.get("/:id", async (req, res) => {
  try {
    const progress = await Progress.findOne({
      _id: req.params.id,
      createdBy: req.user._id,
    })
      .populate("client", "name email")
      .populate("program", "name");

    if (!progress) {
      return res.status(404).json({
        success: false,
        message: "Progression non trouvée",
      });
    }

    res.json({
      success: true,
      progress,
    });
  } catch (error) {
    console.error("❌ Erreur récupération progression:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération de la progression",
      error: error.message,
    });
  }
});

// POST /api/progress - Créer une progression
router.post("/", async (req, res) => {
  try {
    const {
      clientId,
      programId,
      date,
      type,
      measurements,
      performance,
      photos,
      notes,
      mood,
      energy,
      sleep,
      nutrition,
    } = req.body;

    // Vérifier que le client existe
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

    // Vérifier que le programme existe
    const program = await Program.findOne({
      _id: programId,
      createdBy: req.user._id,
    });

    if (!program) {
      return res.status(404).json({
        success: false,
        message: "Programme non trouvé",
      });
    }

    // Créer la progression
    const progress = await Progress.create({
      client: clientId,
      program: programId,
      date: date ? new Date(date) : new Date(),
      type,
      measurements,
      performance,
      photos,
      notes,
      mood,
      energy,
      sleep,
      nutrition,
      createdBy: req.user._id,
    });

    const populatedProgress = await Progress.findById(progress._id)
      .populate("client", "name email")
      .populate("program", "name");

    res.status(201).json({
      success: true,
      message: "Progression enregistrée avec succès",
      progress: populatedProgress,
    });
  } catch (error) {
    console.error("❌ Erreur création progression:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la création de la progression",
      error: error.message,
    });
  }
});

// PATCH /api/progress/:id - Mettre à jour une progression
router.patch("/:id", async (req, res) => {
  try {
    const progress = await Progress.findOne({
      _id: req.params.id,
      createdBy: req.user._id,
    });

    if (!progress) {
      return res.status(404).json({
        success: false,
        message: "Progression non trouvée",
      });
    }

    const allowedUpdates = [
      "date",
      "measurements",
      "performance",
      "photos",
      "notes",
      "mood",
      "energy",
      "sleep",
      "nutrition",
    ];

    Object.keys(req.body).forEach((key) => {
      if (allowedUpdates.includes(key)) {
        progress[key] = req.body[key];
      }
    });

    await progress.save();

    const populatedProgress = await Progress.findById(progress._id)
      .populate("client", "name email")
      .populate("program", "name");

    res.json({
      success: true,
      message: "Progression mise à jour avec succès",
      progress: populatedProgress,
    });
  } catch (error) {
    console.error("❌ Erreur mise à jour progression:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la mise à jour de la progression",
      error: error.message,
    });
  }
});

// DELETE /api/progress/:id - Supprimer une progression
router.delete("/:id", async (req, res) => {
  try {
    const progress = await Progress.findOneAndDelete({
      _id: req.params.id,
      createdBy: req.user._id,
    });

    if (!progress) {
      return res.status(404).json({
        success: false,
        message: "Progression non trouvée",
      });
    }

    res.json({
      success: true,
      message: "Progression supprimée avec succès",
    });
  } catch (error) {
    console.error("❌ Erreur suppression progression:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la suppression de la progression",
      error: error.message,
    });
  }
});

// GET /api/progress/client/:clientId/stats - Statistiques de progression
router.get("/client/:clientId/stats", async (req, res) => {
  try {
    const { clientId } = req.params;

    // Vérifier que le client existe
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

    // Récupérer toutes les mesures
    const measurements = await Progress.find({
      client: clientId,
      type: "measurement",
      createdBy: req.user._id,
    }).sort({ date: 1 });

    // Récupérer toutes les performances
    const performances = await Progress.find({
      client: clientId,
      type: "performance",
      createdBy: req.user._id,
    }).sort({ date: 1 });

    // Calculer les statistiques
    const stats = {
      totalMeasurements: measurements.length,
      totalPerformances: performances.length,
      latestMeasurement: measurements[measurements.length - 1] || null,
      latestPerformance: performances[performances.length - 1] || null,
      weightProgress: null,
      bodyFatProgress: null,
    };

    if (measurements.length >= 2) {
      const first = measurements[0].measurements;
      const latest = measurements[measurements.length - 1].measurements;

      if (first.weight && latest.weight) {
        stats.weightProgress = {
          start: first.weight,
          current: latest.weight,
          change: latest.weight - first.weight,
          percentage: (
            ((latest.weight - first.weight) / first.weight) *
            100
          ).toFixed(1),
        };
      }

      if (first.bodyFat && latest.bodyFat) {
        stats.bodyFatProgress = {
          start: first.bodyFat,
          current: latest.bodyFat,
          change: latest.bodyFat - first.bodyFat,
          percentage: (
            ((latest.bodyFat - first.bodyFat) / first.bodyFat) *
            100
          ).toFixed(1),
        };
      }
    }

    res.json({
      success: true,
      stats,
      measurements,
      performances,
    });
  } catch (error) {
    console.error("❌ Erreur statistiques progression:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des statistiques",
      error: error.message,
    });
  }
});

export default router;
