// ENHANCED aiService.js

const axios = require('axios');
// Ensure environment variables are loaded
if (!process.env.AI_BASE_URL && !process.env.API_BASE_URL) {
  require('dotenv').config();
}

// Use the public URL for the AI service
const AI_BASE_URL = process.env.AI_BASE_URL || process.env.API_BASE_URL || 'http://localhost:8000'; // Local nexus-ai service

/**
 * Retrieves the optimal card recommendation based on a rich context.
 * This function now sends a much more detailed user and transaction context.
 *
 * @param {Array} userCards - The user's full card portfolio from the database.
 * @param {Object} transactionContext - Context about the current transaction.
 * @param {string} transactionContext.merchantName - e.g., "Starbucks"
 * @param {number} transactionContext.amount - e.g., 7.50
 * @param {string} transactionContext.location - e.g., "New York, NY"
 * @param {Object} userContext - The user's broader financial and goal-oriented state.
 * @param {string} userContext.primaryGoal - e.g., "MAXIMIZE_CASHBACK", "PAY_DOWN_DEBT", "EARN_TRAVEL_POINTS"
 * @param {Object} userContext.creditScoreInfo - { score: 750, utilization: 0.25 }
 * @returns {Promise<Object>} A detailed recommendation object.
 */
async function getCardRank(userCards, transactionContext, userContext) {
  try {
    const res = await axios.post(`${AI_BASE_URL}/v2/cardrank`, {
      user_cards: userCards,
      transaction_context: transactionContext,
      user_context: userContext
    });
    // The new endpoint will return a much richer object
    return res.data;
  } catch (error) {
    console.error("CardRank AI Service Error:", error.response ? error.response.data : error.message);
    // Return a sensible default on failure
    return { recommended_card: userCards[0], reason: "Default card (AI service unavailable).", warning: "AI service connection failed." };
  }
}

/**
 * Calculates the optimal, multi-objective payment split.
 * It now considers not just APR, but also things like utilization impact and promotional periods.
 *
 * @param {Array} accounts - Array of account objects, each with balance, apr, creditLimit, promoAPR, promoEndDate.
 * @param {number} paymentAmount - The total amount to be paid.
 * @param {Object} userContext - The user's broader financial and goal-oriented state.
 * @returns {Promise<Object>} An object containing both payment split plans and their explanations.
 */
async function getInterestKillerSplit(accounts, paymentAmount, userContext) {
  try {
    const res = await axios.post(`${AI_BASE_URL}/v2/interestkiller`, {
      accounts,
      payment_amount: paymentAmount,
      user_context: userContext
    });
    return res.data; // Return the full AI-driven object with both plans
  } catch (error) {
    console.error("InterestKiller AI Service Error:", error.response ? error.response.data : error.message);
    return { 
      error: 'AI service unavailable',
      minimize_interest_plan: { split: [], explanation: 'AI service unavailable' },
      maximize_score_plan: { split: [], explanation: 'AI service unavailable' }
    };
  }
}

/**
 * Determines the single most impactful financial action a user can take right now.
 * This is now powered by a full analysis of the user's state and a generative AI.
 *
 * @param {Object} userState - A comprehensive snapshot of the user's financial life (linked accounts, goals, recent transactions).
 * @returns {Promise<Object>} An object containing the suggested move, its rationale, and required actions.
 */
async function getNextSmartMove(userState) {
  try {
    const res = await axios.post(`${AI_BASE_URL}/v2/nextsmartmove`, { user_state: userState });
    return res.data.move;
  } catch (error) {
    console.error("NextSmartMove AI Service Error:", error.response ? error.response.data : error.message);
    return { title: "Review Your Accounts", reason: "AI service is currently unavailable. Please review your finances manually." };
  }
}

async function getSpendingInsights(transactions) {
  try {
    const res = await axios.post(`${AI_BASE_URL}/v2/spending-insights`, { transactions });
    return res.data.result;
  } catch (error) {
    console.error("SpendingInsights AI Service Error:", error.response ? error.response.data : error.message);
    return { error: "AI service unavailable" };
  }
}

async function getBudgetHealth(userBudget, transactions) {
  try {
    const res = await axios.post(`${AI_BASE_URL}/v2/budget-health`, { user_budget: userBudget, transactions });
    return res.data.result;
  } catch (error) {
    console.error("BudgetHealth AI Service Error:", error.response ? error.response.data : error.message);
    return { error: "AI service unavailable" };
  }
}

async function getCashFlowPrediction(accounts, upcomingBills, transactions) {
  try {
    const res = await axios.post(`${AI_BASE_URL}/v2/cash-flow-prediction`, { accounts, upcoming_bills: upcomingBills, transactions });
    return res.data.result;
  } catch (error) {
    console.error("CashFlowPrediction AI Service Error:", error.response ? error.response.data : error.message);
    return { error: "AI service unavailable" };
  }
}

module.exports = {
  getCardRank,
  getInterestKillerSplit,
  getNextSmartMove,
  getSpendingInsights,
  getBudgetHealth,
  getCashFlowPrediction
}; 