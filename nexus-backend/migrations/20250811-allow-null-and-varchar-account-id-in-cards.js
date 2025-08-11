'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Change account_id to VARCHAR(255) and allow nulls
    await queryInterface.changeColumn('cards', 'account_id', {
      type: Sequelize.STRING(255),
      allowNull: true,
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Revert account_id to INTEGER and NOT NULL (if needed)
    await queryInterface.changeColumn('cards', 'account_id', {
      type: Sequelize.INTEGER,
      allowNull: false,
    });
  }
};
