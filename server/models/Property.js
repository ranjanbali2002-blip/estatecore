const mongoose = require('mongoose');

const propertySchema = new mongoose.Schema(
  {
    workspaceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workspace',
      required: true,
      index: true,
    },
    title: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: ['Apartment', 'Villa', 'Plot', 'Commercial', 'Office'],
      required: true,
    },
    location: { type: String, trim: true },
    price: { type: Number, default: 0 },
    bhk: { type: Number, default: 0 },
    areaSqft: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['Available', 'Under Negotiation', 'Sold'],
      default: 'Available',
    },
    description: { type: String, trim: true },
    imageUrls: [{ type: String }],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

propertySchema.index({ workspaceId: 1, status: 1 });
propertySchema.index({ workspaceId: 1, type: 1 });

module.exports = mongoose.model('Property', propertySchema);
