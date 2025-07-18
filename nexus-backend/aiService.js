const axios = require('axios');
const AI_BASE_URL = process.env.AI_BASE_URL || 'http://localhost:8000';

async function getCardRank(cards, merchant, category, user_features = {}) {
  const res = await axios.post(`${AI_BASE_URL}/cardrank`, { cards, merchant, category, user_features });
  return res.data.recommendation;
}

async function getInterestKillerSplit(balances, aprs, paymentAmount) {
  const res = await axios.post(`${AI_BASE_URL}/interestkiller`, { balances, aprs, payment_amount: paymentAmount });
  return res.data.split;
}

async function getNextSmartMove(user_state) {
  const res = await axios.post(`${AI_BASE_URL}/nextsmartmove`, { user_state });
  return res.data.move;
}

module.exports = { getCardRank, getInterestKillerSplit, getNextSmartMove }; 