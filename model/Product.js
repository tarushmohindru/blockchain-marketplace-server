const mongoose = require("mongoose");
const { Schema } = mongoose;

const productSchema = new Schema({
  title: { type: String, required: true, unique: false },
  providerId: { type: Number, required: true, unique: false },
  priceId: { type: String, required: false, unique: true },
  description: { type: String, required: true },
  price: {
    type: Number,
    min: [1, "wrong min price"],
    max: [10000, "wrong max price"],
  },
  currency: { type: String, required: true },
  valueType: { type: String, required: true },
  discount: {
    type: Number,
    min: [0, "wrong min discount"],
    max: [99, "wrong max discount"],
  },
  rating: {
    type: Number,
    min: [0, "wrong min rating"],
    max: [5, "wrong max rating"],
    default: 0,
  },
  stock: { type: Number, min: [0, "wrong min stock"], default: 0 },
  brand: { type: String, required: true },
  orderQuantityLimit: { type: Number, required: true },
  termsAndConditionsInstructions: { type: String, required: true },
  expiryAndValidity: { type: String, required: true },
  redemptionInstructions: { type: String, required: true },
  isPhoneMandatory: { type: Boolean, required: true },
  category: { type: String, required: true },
  thumbnail: { type: String, required: true },
  images: { type: [String], required: true },
  deleted: { type: Boolean, default: false },
});

const virtual = productSchema.virtual("id");
virtual.get(function () {
  return this._id;
});

productSchema.set("toJSON", {
  virtuals: true,
  versionKey: false,
  transform: function (doc, ret) {
    delete ret._id;
  },
});

exports.Product = mongoose.model("Product", productSchema);
