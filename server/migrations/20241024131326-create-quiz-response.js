'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('QuizResponses', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      quiz_id: {
        type: Sequelize.UUID,
        references: {
          model: 'Quizzes', // Ensure this matches your quizzes table name
          key: 'id', // Reference to the primary key in the quizzes table
        },
        onDelete: 'CASCADE',
      },
      user_id: {
        type: Sequelize.STRING(20)
      },
      username: {
        type: Sequelize.STRING(80)
      },
      number: {
        type: Sequelize.INTEGER
      },
      answer: {
        type: Sequelize.INTEGER
      }
    });
    // Adding a constraint
    await queryInterface.addConstraint('QuizResponses', {
      fields: ['quiz_id', 'number', 'user_id'],
      type: 'unique',
      name: 'unique_quiz_response',
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('QuizResponses');
  }
};