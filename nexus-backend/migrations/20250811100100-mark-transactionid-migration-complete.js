'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query(
      "INSERT INTO \"SequelizeMeta\" (name) VALUES ('20250724100000-add-transactionid-paymentmethod-to-paymenthistory.js');"
    );
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query(
      "DELETE FROM \"SequelizeMeta\" WHERE name = '20250724100000-add-transactionid-paymentmethod-to-paymenthistory.js';"
    );
  }
};
