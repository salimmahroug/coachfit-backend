import mongoose from "mongoose";

const sessionSchema = new mongoose.Schema(
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
    workout: {
      type: mongoose.Schema.Types.ObjectId,
      required: false,
    },
    workoutName: {
      type: String,
      required: [true, "Le nom de la séance est requis"],
    },
    scheduledDate: {
      type: Date,
      required: [true, "La date de planification est requise"],
    },
    startTime: {
      type: String,
      required: false,
    },
    duration: {
      type: Number,
      default: 60,
      min: 15,
      max: 180,
    },
    status: {
      type: String,
      enum: ["scheduled", "completed", "cancelled", "missed"],
      default: "scheduled",
    },
    completedAt: {
      type: Date,
    },
    notes: {
      type: String,
      trim: true,
    },
    exercises: [
      {
        name: String,
        sets: Number,
        reps: String,
        weight: Number,
        completed: {
          type: Boolean,
          default: false,
        },
        notes: String,
      },
    ],
    rating: {
      type: Number,
      min: 1,
      max: 5,
    },
    difficulty: {
      type: String,
      enum: ["easy", "moderate", "hard", "very_hard"],
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
sessionSchema.index({ client: 1, scheduledDate: -1 });
sessionSchema.index({ createdBy: 1, scheduledDate: -1 });
sessionSchema.index({ status: 1, scheduledDate: 1 });

export default mongoose.model("Session", sessionSchema);
