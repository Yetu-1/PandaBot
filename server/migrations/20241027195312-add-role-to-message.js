"use strict";

/** @type {import('sequelize-cli').Migration} */

//add role to messages table
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("discord_ai_messages", "role", {
      type: Sequelize.STRING,
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("discord_ai_messages", "role");
  },
};
