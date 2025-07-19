const { DataTypes } = require('sequelize');
const sequelize = require('../db');

const UserEvent = sequelize.define('UserEvent', {
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  event: {
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
  tableName: 'user_events',
  freezeTableName: true,
  timestamps: true
});

module.exports = UserEvent; 