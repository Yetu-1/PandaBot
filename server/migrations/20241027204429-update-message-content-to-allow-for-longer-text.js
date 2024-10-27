"use strict";

/** @type {import('sequelize-cli').Migration} */

//update message content to allow for longer text
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.changeColumn("discord_ai_messages", "content", {
      type: Sequelize.TEXT,
      allowNull: false,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.changeColumn("discord_ai_messages", "content", {
      type: Sequelize.STRING,
      allowNull: false,
    });
  },
};
