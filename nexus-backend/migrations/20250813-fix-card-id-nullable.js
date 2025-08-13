'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn('transactions', 'card_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'cards',
        key: 'id',
      },
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn('transactions', 'card_id', {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: 'cards',
        key: 'id',
      },
    });
  }
}; 