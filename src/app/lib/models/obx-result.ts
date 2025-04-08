import { Schema, model, models } from "mongoose";

const ObxResultSchema = new Schema(
  {
    patientDetails: {
      patientId: { type: String },
      patientName: { type: String },
      dob: { type: String },
      gender: { type: String },
    },
    results: [
      {
        testName: { type: String },
        result: { type: String },
        units: { type: String },
        referenceRange: { type: String },
        flag: { type: String },
      },
    ],
  },
  {
    timestamps: true,
  }
);

const ObxResult = models.ObxResult || model("ObxResult", ObxResultSchema);

export default ObxResult;
