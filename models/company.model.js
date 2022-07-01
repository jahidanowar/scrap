const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const companySchema = new Schema(
  {
    cin: {
      type: String,
      required: [true, "CIN is required"],
      unique: [true, "CIN must be unique"],
    },
    registrationNumber: String,
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
    category: String,
    sub_category: String,
    company_class: String,
    date_of_incorporation: String,
    activity: String,
    authorised_capital: String,
    paid_up_capital: String,
    listing_status: String,
    last_anoual_general_meeting: String,
    last_balance_sheet: String,
    adderess: String,
    email: String,
    directors: [],
  },
  {
    timestamps: true,
  }
);

companySchema.index({ cin: 1 });

module.exports = mongoose.model("Company", companySchema);
