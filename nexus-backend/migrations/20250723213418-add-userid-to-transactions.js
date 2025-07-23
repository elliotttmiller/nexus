'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn(
      'transactions', // table name
      'user_id',      // new column name
      {
        type: Sequelize.INTEGER,
        allowNull: true, // safer for legacy data
        references: {
          model: 'users', // Name of the table it references
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      }
    );
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('transactions', 'user_id');
  }
};
