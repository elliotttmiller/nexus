'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add missing columns to user_events table
    await queryInterface.addColumn('user_events', 'event_subtype', {
      type: Sequelize.STRING,
      allowNull: true,
    });
    
    await queryInterface.addColumn('user_events', 'ip_address', {
      type: Sequelize.STRING,
      allowNull: true,
    });
    
    await queryInterface.addColumn('user_events', 'user_agent', {
      type: Sequelize.TEXT,
      allowNull: true,
    });
    
    await queryInterface.addColumn('user_events', 'updated_at', {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
    });
    
    // Add indexes for better performance
    await queryInterface.addIndex('user_events', ['event_type']);
    await queryInterface.addIndex('user_events', ['created_at']);
  },

  down: async (queryInterface, Sequelize) => {
    // Remove indexes
    await queryInterface.removeIndex('user_events', ['event_type']);
    await queryInterface.removeIndex('user_events', ['created_at']);
    
    // Remove columns
    await queryInterface.removeColumn('user_events', 'event_subtype');
    await queryInterface.removeColumn('user_events', 'ip_address');
    await queryInterface.removeColumn('user_events', 'user_agent');
    await queryInterface.removeColumn('user_events', 'updated_at');
  }
}; 