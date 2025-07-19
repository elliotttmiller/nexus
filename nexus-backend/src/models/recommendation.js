const { DataTypes } = require('sequelize');
const sequelize = require('../db');

const Recommendation = sequelize.define('Recommendation', {
  user_id: { type: DataTypes.INTEGER, allowNull: false },
  type: { type: DataTypes.STRING },
  data: { type: DataTypes.JSONB },
}, { timestamps: true });

module.exports = (sequelize, DataTypes) => {
  const Recommendation = sequelize.define('Recommendation', {
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    type: {
      type: DataTypes.STRING
    },
    data: {
      type: DataTypes.JSONB
    }
  }, {
    tableName: 'recommendations',
    freezeTableName: true
  });
  return Recommendation;
}; 