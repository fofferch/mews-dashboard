// server.js
const express = require('express');
const cors = require('cors');
const Performance = require('./db'); // importe le model Performance (et connecte à MongoDB)
const app = express();

app.use(cors());
app.use(express.json());

function formatDataForDashboard(mewsData) {
  const data = mewsData.Documents.find(doc => doc.Name === "Données").Data;
  
  return {
    nb_ch_dispos: findMetric(data, 'SEJOUR', 'Chambre', 'Disponible'),
    nb_ch_vendues: findMetric(data, 'SEJOUR', 'Chambre', 'Occupés'),
    to: findMetric(data, 'SEJOUR', 'Chambre', 'Occupation'), // Stocké en décimal (e.g. 0.75 pour 75%)
    pm_ht: findMetric(data, 'SEJOUR', 'Chambre', 'Tarif moyen (par nuit)'),
    revpar: findMetric(data, 'SEJOUR', 'Chambre', 'Revenu par disponibilité'),
    ca_heb_ht: findMetric(data, 'SEJOUR', '', 'Chiffre d\'affaires'),
    ca_pdj_ht: findMetric(data, 'HEBERGEMENT', '', 'Chiffre d\'affaires total'),
    ca_restaurant: findMetric(data, 'RESTAURANT', '', 'Chiffre d\'affaires total'),
    ca_annexe: 0,
    ca_total: findMetric(data, 'Total', '', 'Chiffre d\'affaires')
  };
}

function findMetric(data, group, subgroup, metric) {
  const row = data.find(r => r[0] === group && r[1] === subgroup && r[2] === metric);
  return row ? parseFloat(row[3]) : 0;
}

async function findYesterdayData(hotel) {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const start = new Date(yesterday.setHours(0,0,0,0));
  const end = new Date(yesterday.setHours(23,59,59,999));
  
  return await Performance.findOne({
    hotel: hotel,
    date: { $gte: start, $lte: end }
  });
}

function calculateVariations(currentData, yesterdayData) {
  if (!yesterdayData) return {};
  
  const safeVariation = (current, past) => past !== 0 ? ((current - past) / past) * 100 : 0;

  return {
    to_var: safeVariation(currentData.to, yesterdayData.to),
    pm_var: safeVariation(currentData.pm_ht, yesterdayData.pm_ht),
    revpar_var: safeVariation(currentData.revpar, yesterdayData.revpar),
    ca_heb_var: safeVariation(currentData.ca_heb_ht, yesterdayData.ca_heb_ht),
    ca_restaurant_var: safeVariation(currentData.ca_restaurant, yesterdayData.ca_restaurant),
    ca_total_var: safeVariation(currentData.ca_total, yesterdayData.ca_total)
  };
}

app.get('/', (req, res) => {
  console.log('GET request received');
  res.send('Server running');
});

app.get('/webhook', (req, res) => {
  res.send('Webhook endpoint ready to receive POST requests');
});

app.post('/webhook', async (req, res) => {
  try {
    const formattedData = formatDataForDashboard(req.body);
    const hotelName = req.body.Documents[0].Data[2][1];
    const yesterdayData = await findYesterdayData(hotelName);

    const performance = new Performance({
      date: new Date(req.body.Documents[0].Data[5][1]),
      hotel: hotelName,
      ...formattedData,
      variations: calculateVariations(formattedData, yesterdayData)
    });
    
    await performance.save();
    res.sendStatus(200);
  } catch (error) {
    console.error('Error:', error);
    res.sendStatus(500);
  }
});

// Utilisez le port fourni par Render, sinon fallback sur 3000
const port = process.env.PORT || 10000;
app.listen(port, '0.0.0.0', () => {
    console.log(`Server running on port ${port}`);
    console.log(`Webhook URL: ${process.env.RENDER_EXTERNAL_URL}/webhook`);
});