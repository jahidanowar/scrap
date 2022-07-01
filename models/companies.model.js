const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const companySchema = new Schema({
  cin: {
    type: String,
    required: [true, "CIN is required"],
    unique: [true, "CIN must be unique"],
  },
  company: {
    title: String,
    link: {
      type: String,
      required: [true, "Link is required"],
      unique: [true, "Link must be unique"],
    },
  },
  roc: String,
  status: String,
});

module.exports = mongoose.model("Company", companySchema);
