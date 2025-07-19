const { DataTypes } = require('sequelize');
const sequelize = require('../db');

const Card = sequelize.define('Card', {
  account_id: { type: DataTypes.INTEGER, allowNull: false },
  card_name: { type: DataTypes.STRING },
  apr: { type: DataTypes.DECIMAL(5,2) },
  balance: { type: DataTypes.DECIMAL(12,2) },
  due_date: { type: DataTypes.DATE },
  rewards: { type: DataTypes.JSONB },
}, { timestamps: true });

module.exports = (sequelize, DataTypes) => {
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
    }
  }, {
    tableName: 'cards',
    freezeTableName: true
  });
  return Card;
}; 