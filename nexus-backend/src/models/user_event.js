const { DataTypes } = require('sequelize');
const sequelize = require('../db');

const UserEvent = sequelize.define('UserEvent', {
  user_id: { type: DataTypes.INTEGER },
  event_type: { type: DataTypes.STRING },
  event_data: { type: DataTypes.JSONB },
}, { timestamps: true });

module.exports = UserEvent; 