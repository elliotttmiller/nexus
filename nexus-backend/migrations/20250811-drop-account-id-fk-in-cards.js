"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Drop the foreign key constraint on account_id if it exists
    // The constraint name may vary, so we use a raw query to find and drop it
    await queryInterface.sequelize.query(`
      DO $$
      DECLARE
        constraint_name text;
      BEGIN
        SELECT tc.constraint_name INTO constraint_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu
          ON tc.constraint_name = kcu.constraint_name
        WHERE tc.table_name = 'cards'
          AND kcu.column_name = 'account_id'
          AND tc.constraint_type = 'FOREIGN KEY';
        IF constraint_name IS NOT NULL THEN
          EXECUTE 'ALTER TABLE "cards" DROP CONSTRAINT ' || constraint_name || ';';
        END IF;
      END $$;
    `);
  },

  down: async (queryInterface, Sequelize) => {
    // No-op: Do not re-add the constraint automatically
  }
};
