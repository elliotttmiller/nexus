// Migration: Add ai_card_analysis JSONB column to transactions
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('transactions', 'ai_card_analysis', {
      type: Sequelize.JSONB,
      allowNull: true,
      comment: 'Stores AI card recommendation analysis for this transaction',
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('transactions', 'ai_card_analysis');
  },
};
