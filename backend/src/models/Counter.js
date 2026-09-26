const mongoose = require('mongoose');

// Atomic counters, used for the daily token numbers (#1, #2, ...) of each shop.
const counterSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  seq: { type: Number, default: 0 },
});

counterSchema.statics.next = async function (key) {
  const counter = await this.findOneAndUpdate({ _id: key }, { $inc: { seq: 1 } }, { upsert: true, new: true });
  return counter.seq;
};

module.exports = mongoose.model('Counter', counterSchema);
