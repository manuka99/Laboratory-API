const { Schema } = require("mongoose");
const User = require("./User");

const GeneralUserSchema = new Schema(
  {
    gender: {
      type: String,
      required: [true, "Gender must not be empty"],
      enum: ["female", "male"],
    },
    nationalID: {
      type: String,
      required: true,
      unique: true,
    },
    dateOfBirth: {
      type: String,
      required: true,
      select: false
    },
    street: {
      type: String,
      required: [true, "street must not be empty."],
      select: false
    },
    province: {
      type: String,
      required: [true, "province must not be empty."],
      select: false
    },
    district: {
      type: String,
      required: [true, "district must not be empty."],
      select: false
    },
    country: {
      type: String,
      required: [true, "country must not be empty."],
    },
    nationality: {
      type: Array,
      required: true,
      select: false
    },
    address: {
      type: String,
      required: [true, "Address must not be empty."],
      minlength: [8, "Address must have at least 8 characters."],
      maxlength: [500, "Address must not have more than 60 characters."],
      select: false
    },
    zipCode: {
      type: String,
      required: [true, "Zip Code must not be empty."],
      select: false
    }, 
    imagePaths: {
      type: Array,
      required: true,
      select: false
    },
    mainAccountID: {
      type: String,
      unique: true,
    },
    previousAccounts: {
      type: Array,
    },
  },
  { timestamps: true }
);

const GeneralUser = User.discriminator("general", GeneralUserSchema);
module.exports = GeneralUser;
