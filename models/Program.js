import mongoose from "mongoose";

const exerciseSchema = new mongoose.Schema({
  name: String,
  sets: Number,
  reps: String,
  duration: Number,
  rest: Number,
  notes: String,
});

const workoutSchema = new mongoose.Schema({
  day: {
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
  name: String,
  type: {
    type: String,
    enum: ["strength", "cardio", "flexibility", "mixed"],
  },
  duration: Number,
  exercises: [exerciseSchema],
  warmup: String,
  cooldown: String,
});

const programSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: String,
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
      required: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    duration: {
      value: Number,
      unit: {
        type: String,
        enum: ["days", "weeks", "months"],
        default: "weeks",
      },
    },
    frequency: {
      type: Number,
      default: 3,
    },
    workouts: [workoutSchema],
    status: {
      type: String,
      enum: ["draft", "active", "completed", "paused"],
      default: "active",
    },
    generatedByAI: {
      type: Boolean,
      default: false,
    },
    aiModel: String,
    progress: [
      {
        date: Date,
        notes: String,
        completed: Boolean,
      },
    ],
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Program", programSchema);
