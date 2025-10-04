import express from "express";
import Session from "../models/Session.js";
import Client from "../models/Client.js";
import Program from "../models/Program.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

// Protéger toutes les routes
router.use(protect);

// GET /api/sessions - Récupérer toutes les séances
router.get("/", async (req, res) => {
  try {
    const { clientId, programId, status, startDate, endDate } = req.query;

    const filter = { createdBy: req.user._id };

    if (clientId) filter.client = clientId;
    if (programId) filter.program = programId;
    if (status) filter.status = status;

    if (startDate || endDate) {
      filter.scheduledDate = {};
      if (startDate) filter.scheduledDate.$gte = new Date(startDate);
      if (endDate) filter.scheduledDate.$lte = new Date(endDate);
    }

    const sessions = await Session.find(filter)
      .populate("client", "name email")
      .populate("program", "name")
      .sort({ scheduledDate: -1 });

    res.json({
      success: true,
      count: sessions.length,
      sessions,
    });
  } catch (error) {
    console.error("❌ Erreur récupération séances:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des séances",
      error: error.message,
    });
  }
});

// GET /api/sessions/:id - Récupérer une séance
router.get("/:id", async (req, res) => {
  try {
    const session = await Session.findOne({
      _id: req.params.id,
      createdBy: req.user._id,
    })
      .populate("client", "name email age weight")
      .populate("program", "name description");

    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Séance non trouvée",
      });
    }

    res.json({
      success: true,
      session,
    });
  } catch (error) {
    console.error("❌ Erreur récupération séance:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération de la séance",
      error: error.message,
    });
  }
});

// POST /api/sessions - Créer une séance
router.post("/", async (req, res) => {
  try {
    const {
      clientId,
      programId,
      workoutId,
      workoutName,
      scheduledDate,
      startTime,
      duration,
      exercises,
      notes,
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

    // Créer la séance
    const session = await Session.create({
      client: clientId,
      program: programId,
      workout: workoutId,
      workoutName,
      scheduledDate: new Date(scheduledDate),
      startTime,
      duration: duration || client.sessionDuration || 60,
      exercises: exercises || [],
      notes,
      createdBy: req.user._id,
    });

    const populatedSession = await Session.findById(session._id)
      .populate("client", "name email")
      .populate("program", "name");

    res.status(201).json({
      success: true,
      message: "Séance planifiée avec succès",
      session: populatedSession,
    });
  } catch (error) {
    console.error("❌ Erreur création séance:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la création de la séance",
      error: error.message,
    });
  }
});

// PATCH /api/sessions/:id - Mettre à jour une séance
router.patch("/:id", async (req, res) => {
  try {
    const session = await Session.findOne({
      _id: req.params.id,
      createdBy: req.user._id,
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Séance non trouvée",
      });
    }

    const allowedUpdates = [
      "scheduledDate",
      "startTime",
      "duration",
      "status",
      "notes",
      "exercises",
      "rating",
      "difficulty",
      "completedAt",
    ];

    Object.keys(req.body).forEach((key) => {
      if (allowedUpdates.includes(key)) {
        session[key] = req.body[key];
      }
    });

    // Si marquée comme complétée, enregistrer la date
    if (req.body.status === "completed" && !session.completedAt) {
      session.completedAt = new Date();
    }

    await session.save();

    const populatedSession = await Session.findById(session._id)
      .populate("client", "name email")
      .populate("program", "name");

    res.json({
      success: true,
      message: "Séance mise à jour avec succès",
      session: populatedSession,
    });
  } catch (error) {
    console.error("❌ Erreur mise à jour séance:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la mise à jour de la séance",
      error: error.message,
    });
  }
});

// DELETE /api/sessions/:id - Supprimer une séance
router.delete("/:id", async (req, res) => {
  try {
    const session = await Session.findOneAndDelete({
      _id: req.params.id,
      createdBy: req.user._id,
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Séance non trouvée",
      });
    }

    res.json({
      success: true,
      message: "Séance supprimée avec succès",
    });
  } catch (error) {
    console.error("❌ Erreur suppression séance:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la suppression de la séance",
      error: error.message,
    });
  }
});

// GET /api/sessions/upcoming - Récupérer les séances à venir
router.get("/filter/upcoming", async (req, res) => {
  try {
    const sessions = await Session.find({
      createdBy: req.user._id,
      scheduledDate: { $gte: new Date() },
      status: "scheduled",
    })
      .populate("client", "name email")
      .populate("program", "name")
      .sort({ scheduledDate: 1 })
      .limit(10);

    res.json({
      success: true,
      count: sessions.length,
      sessions,
    });
  } catch (error) {
    console.error("❌ Erreur séances à venir:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des séances à venir",
      error: error.message,
    });
  }
});

export default router;
