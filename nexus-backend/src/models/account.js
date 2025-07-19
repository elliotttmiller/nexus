const { DataTypes } = require('sequelize');
const sequelize = require('../db');

const Account = sequelize.define('Account', {
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  plaid_access_token: {
    type: DataTypes.STRING
  },
  institution: {
    type: DataTypes.STRING
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
  tableName: 'accounts',
  freezeTableName: true,
  timestamps: true
});

module.exports = Account; 