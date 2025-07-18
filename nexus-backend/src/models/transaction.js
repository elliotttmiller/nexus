const { DataTypes } = require('sequelize');
const sequelize = require('../db');

const Transaction = sequelize.define('Transaction', {
  card_id: { type: DataTypes.INTEGER, allowNull: false },
  amount: { type: DataTypes.DECIMAL(12,2) },
  merchant: { type: DataTypes.STRING },
  category: { type: DataTypes.STRING },
  date: { type: DataTypes.DATE },
}, { timestamps: false });

module.exports = Transaction; 