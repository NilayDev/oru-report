import mongoose from "mongoose";

const diagnosticMetricSchema = new mongoose.Schema({
  name: String,
  oru_sonic_codes: String,
  oru_sonic_units: String,
  units: String,
  min_age: Number,
  max_age: Number,
  gender: String,
  standard_lower: Number,
  standard_higher: Number,
  everlab_lower: Number,
  everlab_higher: Number,
});

export default mongoose.models.diagnostic_metric ||
  mongoose.model("diagnostic_metric", diagnosticMetricSchema);
