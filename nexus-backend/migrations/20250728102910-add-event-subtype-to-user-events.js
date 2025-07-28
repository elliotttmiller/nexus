// In migrations/YYYYMMDDHHMMSS-add-event-subtype-to-user-events.js

'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn(
      'user_events',   // The name of the table
      'event_subtype', // The name of the new column
      {
        type: Sequelize.STRING,
        allowNull: true, // Set to false if it should always have a value
        after: 'event_type' // Optional: places the column after 'event_type' for clarity
      }
    );
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('user_events', 'event_subtype');
  }
};
