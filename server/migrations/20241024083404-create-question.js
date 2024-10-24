'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Questions', {
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
      number: {
        type: Sequelize.INTEGER
      },
      question: {
        type: Sequelize.TEXT
      },
      options: {
        type: Sequelize.ARRAY(Sequelize.TEXT),
      },
      answer: {
        type: Sequelize.INTEGER
      }
    });
    // Adding a constraint
    await queryInterface.addConstraint('Questions', {
      fields: ['quiz_id', 'number'],
      type: 'unique',
      name: 'unique_quiz_question_number',
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Questions');
  }
};