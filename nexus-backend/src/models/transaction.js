const { DataTypes } = require('sequelize');
const sequelize = require('../db');

const Transaction = sequelize.define('Transaction', {
  card_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  amount: {
    type: DataTypes.DECIMAL(12,2)
  },
  merchant: {
    type: DataTypes.STRING
  },
  category: {
    type: DataTypes.STRING
  },
  date: {
    type: DataTypes.DATE
  },
  createdAt: {
    type: DataTypes.DATE,
    field: 'created_at'
  },
  updatedAt: {
    type: DataTypes.DATE,
    field: 'updated_at'
  }
}, {
  tableName: 'transactions',
  freezeTableName: true,
  timestamps: true
});

module.exports = Transaction; 