// db.js
const mongoose = require('mongoose');

// On utilise une variable d'environnement pour l'URI MongoDB.
// Assurez-vous d'ajouter cette variable dans vos Settings Render.
const MONGODB_URI = process.env.MONGODB_URI;

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

const performanceSchema = new mongoose.Schema({
  date: Date,
  hotel: { type: String, required: true },
  nb_ch_dispos: Number,
  nb_ch_vendues: Number,
  to: {
    type: Number,
    // Ces getters et setters convertissent la valeur stockée en base (décimal)
    // en pourcentage à l'affichage, et inversement lors de l'enregistrement.
    get: v => (v * 100).toFixed(1),
    set: v => v / 100
  },
  pm_ht: Number,
  revpar: Number,
  ca_heb_ht: Number,
  ca_pdj_ht: Number,
  ca_restaurant: Number,
  ca_annexe: Number,
  ca_total: Number,
  variations: {
    to_var: Number,
    pm_var: Number,
    revpar_var: Number,
    ca_heb_var: Number,
    ca_restaurant_var: Number,
    ca_total_var: Number
  }
}, {
  // Active les getters lors de la transformation du document en objet/JSON
  toJSON: { getters: true },
  toObject: { getters: true }
});

module.exports = mongoose.model('Performance', performanceSchema);
