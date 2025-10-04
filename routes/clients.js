import express from "express";
import Client from "../models/Client.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

// Toutes les routes sont protégées
router.use(protect);

// @route   GET /api/clients
// @desc    Obtenir tous les clients de l'utilisateur connecté
// @access  Private
router.get("/", async (req, res) => {
  try {
    const clients = await Client.find({ createdBy: req.user._id }).sort({
      createdAt: -1,
    });

    res.json({
      success: true,
      count: clients.length,
      clients,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des clients",
      error: error.message,
    });
  }
});

// @route   POST /api/clients
// @desc    Créer un nouveau client
// @access  Private
router.post("/", async (req, res) => {
  try {
    console.log(
      "📥 Données reçues pour création client:",
      JSON.stringify(req.body, null, 2)
    );

    const clientData = {
      ...req.body,
      createdBy: req.user._id,
    };

    const client = await Client.create(clientData);

    console.log("✅ Client créé avec succès:", client._id);

    res.status(201).json({
      success: true,
      message: "Client créé avec succès",
      client,
    });
  } catch (error) {
    console.error("❌ Erreur création client:", error.message);
    console.error("Détails:", error);

    res.status(400).json({
      success: false,
      message: "Erreur lors de la création du client",
      error: error.message,
    });
  }
});

// @route   GET /api/clients/:id
// @desc    Obtenir un client par ID
// @access  Private
router.get("/:id", async (req, res) => {
  try {
    const client = await Client.findOne({
      _id: req.params.id,
      createdBy: req.user._id,
    });

    if (!client) {
      return res.status(404).json({
        success: false,
        message: "Client non trouvé",
      });
    }

    res.json({
      success: true,
      client,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération du client",
      error: error.message,
    });
  }
});

// @route   PUT /api/clients/:id
// @desc    Mettre à jour un client
// @access  Private
router.put("/:id", async (req, res) => {
  try {
    console.log("📝 Mise à jour client:", req.params.id);
    console.log("📥 Données reçues:", JSON.stringify(req.body, null, 2));

    let client = await Client.findOne({
      _id: req.params.id,
      createdBy: req.user._id,
    });

    if (!client) {
      return res.status(404).json({
        success: false,
        message: "Client non trouvé",
      });
    }

    client = await Client.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    console.log("✅ Client mis à jour avec succès");

    res.json({
      success: true,
      message: "Client mis à jour avec succès",
      client,
    });
  } catch (error) {
    console.error("❌ Erreur mise à jour client:", error.message);
    console.error("Détails:", error);
    res.status(400).json({
      success: false,
      message: "Erreur lors de la mise à jour du client",
      error: error.message,
    });
  }
});

// @route   DELETE /api/clients/:id
// @desc    Supprimer un client
// @access  Private
router.delete("/:id", async (req, res) => {
  try {
    const client = await Client.findOne({
      _id: req.params.id,
      createdBy: req.user._id,
    });

    if (!client) {
      return res.status(404).json({
        success: false,
        message: "Client non trouvé",
      });
    }

    await Client.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: "Client supprimé avec succès",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erreur lors de la suppression du client",
      error: error.message,
    });
  }
});

export default router;
