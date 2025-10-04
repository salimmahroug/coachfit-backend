import mongoose from "mongoose";

const clientSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Le nom est requis"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "L'email est requis"],
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    age: {
      type: Number,
      required: [true, "L'âge est requis"],
      min: 1,
    },
    weight: Number,
    height: Number,
    fitnessLevel: {
      type: String,
      enum: ["beginner", "intermediate", "advanced"],
      required: true,
    },
    goals: [
      {
        type: String,
        enum: [
          "weight_loss",
          "muscle_gain",
          "endurance",
          "strength",
          "flexibility",
          "general_fitness",
        ],
      },
    ],
    medicalConditions: [String],
    availableDays: [
      {
        type: String,
        enum: [
          "monday",
          "tuesday",
          "wednesday",
          "thursday",
          "friday",
          "saturday",
          "sunday",
        ],
      },
    ],
    sessionDuration: {
      type: Number,
      default: 60,
    },
    preferredTime: {
      type: String,
      enum: ["morning", "afternoon", "evening"],
      default: "morning",
    },
    equipment: [String],
    notes: String,
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Client", clientSchema);
