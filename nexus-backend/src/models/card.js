const { DataTypes } = require('sequelize');
const sequelize = require('../db');

const Card = sequelize.define('Card', {
  account_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  card_name: {
    type: DataTypes.STRING
  },
  apr: {
    type: DataTypes.DECIMAL(5,2)
  },
  balance: {
    type: DataTypes.DECIMAL(12,2)
  },
  due_date: {
    type: DataTypes.DATE
  },
  rewards: {
    type: DataTypes.JSONB
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
  tableName: 'cards',
  freezeTableName: true,
  timestamps: true
});

module.exports = Card; 