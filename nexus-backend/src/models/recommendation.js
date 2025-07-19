const { DataTypes } = require('sequelize');
const sequelize = require('../db');

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
  tableName: 'recommendations',
  freezeTableName: true,
  timestamps: true
});

module.exports = Recommendation; 