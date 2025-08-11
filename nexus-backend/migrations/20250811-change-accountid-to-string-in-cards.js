"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn("cards", "account_id", {
      type: Sequelize.STRING,
      allowNull: false,
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn("cards", "account_id", {
      type: Sequelize.INTEGER,
      allowNull: false,
    });
  },
};
