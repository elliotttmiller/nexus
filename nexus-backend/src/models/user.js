const { DataTypes } = require('sequelize');
const { encrypt, decrypt } = require('../utils/encryption');

module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    email: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
      validate: {
        isEmail: true,
      },
    },
    password_hash: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    twofa_secret: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    refresh_token: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  }, {
    tableName: 'users',
    timestamps: true,
    underscored: true,
  });

  // Add any instance or class methods here
  User.associate = function(models) {
    // Define associations here
    User.hasMany(models.Card, {
      foreignKey: 'user_id',
      as: 'cards',
    });
    
    User.hasMany(models.PaymentHistory, {
      foreignKey: 'user_id',
      as: 'paymentHistory',
    });
  };

  return User;
};