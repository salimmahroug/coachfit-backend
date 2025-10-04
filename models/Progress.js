import mongoose from "mongoose";

const progressSchema = new mongoose.Schema(
  {
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
      required: [true, "Le client est requis"],
    },
    program: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Program",
      required: [true, "Le programme est requis"],
    },
    date: {
      type: Date,
      required: [true, "La date est requise"],
      default: Date.now,
    },
    type: {
      type: String,
      enum: ["measurement", "photo", "performance", "note"],
      required: [true, "Le type de progression est requis"],
    },
    // Mesures corporelles
    measurements: {
      weight: Number,
      bodyFat: Number,
      muscleMass: Number,
      chest: Number,
      waist: Number,
      hips: Number,
      arms: Number,
      thighs: Number,
      calves: Number,
    },
    // Performance
    performance: {
      exerciseName: String,
      maxWeight: Number,
      maxReps: Number,
      totalVolume: Number,
      personalRecord: Boolean,
    },
    // Photos
    photos: [
      {
        url: String,
        type: {
          type: String,
          enum: ["front", "back", "side"],
        },
      },
    ],
    // Notes générales
    notes: {
      type: String,
      trim: true,
    },
    mood: {
      type: String,
      enum: ["excellent", "good", "neutral", "tired", "poor"],
    },
    energy: {
      type: Number,
      min: 1,
      max: 10,
    },
    sleep: {
      type: Number,
      min: 0,
      max: 24,
    },
    nutrition: {
      type: String,
      enum: ["excellent", "good", "average", "poor"],
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index pour les requêtes fréquentes
progressSchema.index({ client: 1, date: -1 });
progressSchema.index({ program: 1, date: -1 });
progressSchema.index({ type: 1, date: -1 });

export default mongoose.model("Progress", progressSchema);
