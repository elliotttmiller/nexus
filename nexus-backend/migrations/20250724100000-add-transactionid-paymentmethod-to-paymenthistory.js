'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('payment_history', 'transaction_id', {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn('payment_history', 'payment_method', {
      type: Sequelize.STRING,
      allowNull: true,
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('payment_history', 'transaction_id');
    await queryInterface.removeColumn('payment_history', 'payment_method');
  }
}; 