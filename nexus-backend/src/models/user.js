const { DataTypes } = require('sequelize');
const sequelize = require('../db');
const { encrypt, decrypt } = require('../utils/encryption');

const User = sequelize.define('User', {
  email: { type: DataTypes.STRING, unique: true, allowNull: false },
  password_hash: { type: DataTypes.STRING, allowNull: false },
  twofa_secret: {
    type: DataTypes.STRING,
    set(value) {
      if (value) this.setDataValue('twofa_secret', encrypt(value));
      else this.setDataValue('twofa_secret', null);
    },
    get() {
      const raw = this.getDataValue('twofa_secret');
      return raw ? decrypt(raw) : null;
    }
  }
}, { timestamps: true });

module.exports = User; 