const mongoose = require('mongoose');

const leadSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: { type: String, trim: true },
    status: { type: String, enum: ['New', 'Contacted', 'Qualified', 'Lost'], default: 'New' },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company' },
    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// ---- Soft delete: every query hides deleted leads automatically ----
// Bypass with Lead.find().setOptions({ withDeleted: true })
function hideDeleted(next) {
  if (!this.getOptions().withDeleted) {
    this.where({ isDeleted: false });
  }
  next();
}
leadSchema.pre(/^find/, hideDeleted);
leadSchema.pre('countDocuments', hideDeleted);

// Aggregations (dashboard) also exclude deleted leads
leadSchema.pre('aggregate', function (next) {
  this.pipeline().unshift({ $match: { isDeleted: false } });
  next();
});

leadSchema.methods.softDelete = function () {
  this.isDeleted = true;
  this.deletedAt = new Date();
  return this.save();
};

module.exports = mongoose.model('Lead', leadSchema);
