const { DataTypes } = require('sequelize');
const sequelize = require('../db');
const { encrypt, decrypt } = require('../utils/encryption');

module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    email: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false
    },
    password_hash: {
      type: DataTypes.STRING,
      allowNull: false
    },
    twofa_secret: {
      type: DataTypes.STRING
    }
  }, {
    tableName: 'users',
    freezeTableName: true
  });
  return User;
}; 