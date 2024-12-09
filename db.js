// db.js
const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb+srv://cheudes:E22570DWnOBlP6WU@hotel-dashboard.cildw.mongodb.net/hotel-dashboard?retryWrites=true&w=majority';

mongoose.connect(MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

  const performanceSchema = new mongoose.Schema({
    date: Date,
    hotel: String,
    nb_ch_dispos: Number,
    nb_ch_vendues: Number,
    to: {
      type: Number,
      get: v => (v * 100).toFixed(1), // Convertit en pourcentage
      set: v => v / 100 // Stocke en décimal
    },
    pm_ht: Number,
    revpar: Number,
    ca_heb_ht: Number,
    ca_pdj_ht: Number,
    ca_restaurant: Number,
    ca_annexe: Number,
    ca_total: Number
  });

module.exports = mongoose.model('Performance', performanceSchema);