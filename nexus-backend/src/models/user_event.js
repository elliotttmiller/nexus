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
  }
}, {
  tableName: 'user_events',
  freezeTableName: true
});

module.exports = UserEvent; 