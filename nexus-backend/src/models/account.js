const { DataTypes } = require('sequelize');
const sequelize = require('../db');

const Account = sequelize.define('Account', {
  user_id: { type: DataTypes.INTEGER, allowNull: false },
  plaid_access_token: { type: DataTypes.STRING },
  institution: { type: DataTypes.STRING },
}, { timestamps: true });

module.exports = (sequelize, DataTypes) => {
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
    }
  }, {
    tableName: 'accounts',
    freezeTableName: true
  });
  return Account;
}; 