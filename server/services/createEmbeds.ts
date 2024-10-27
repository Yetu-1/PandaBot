import { EmbedBuilder } from "discord.js";

const fileds_per_embed = 3;
const questions_per_embed = 9;
const questions_per_field = 3;

export function createReportEmbeds(questions : any[], user_answers : any[], user_score : number) : EmbedBuilder[] {
    const length = questions.length;
    const total_no_of_embeds = Math.ceil(length / questions_per_embed);  // round up
    // console.log("Total no of Embeds: ", total_no_of_embeds);
    let total_no_of_fields = Math.ceil(length / questions_per_field); 
    // console.log("Total no of Fields: ", total_no_of_fields);
    let current_question : number = 0;
    let embeds : EmbedBuilder[] = [];
    const heading = new EmbedBuilder()
    .setColor(0x3498db)
    .setTitle("Thats a wrap!")
    .setDescription(`**Score: ${user_score}/${questions.length}**.\n\n**Review Questions**`)
    embeds.push(heading);
  
    for(let i = 0; i < total_no_of_embeds; i++) {
      const embed = new EmbedBuilder();
      for(let j = 0; j < fileds_per_embed && total_no_of_fields > 0; j++) {
        // Slice the array into a subarray of a set of 4 questions and add them to a field
        let curr_set : string = questions.slice(current_question, current_question+questions_per_field).map((question : any, index : number) => {
          const question_number = current_question + index + 1;
          return (
            `(${question_number}) ${question.question}\n` + 
            question.options.map((option : string, index:number) => {
              const opt_text = ` (${index+1}) ${option} `;
              // filter the array for the user's answer that corresponds to the current question
              const user_answer = user_answers.filter((answer : any) => (question_number) == answer.number);
              let suffix = ''
              // check if the current option is the correct answer and add the check to indicate that
              if(index+1 == question.answer )
                suffix = '✅';
              
              else if(index+1 == user_answer[0].answer && index+1 != question.answer) // if the current option is the user's answer and also the current option
                suffix = '❌';
              return ( opt_text + suffix)
            })
            .join('\n')
          )
        }).join('\n\n')
  
        curr_set = `\`\`\`\n${curr_set}\n\`\`\`` // put the current set of questions in a code block
        // add field containing 4 questions to the embed
        embed.addFields(
          {
              name: " ",
              value: curr_set
          }
        )
        current_question += questions_per_field;
        total_no_of_fields--;
      }
      // add the embed to the list of embeds
      embeds.push(embed);
    }
  
    return embeds;
}

export function createRevisionEmbeds(questions : any[]): EmbedBuilder[] {
    const length = questions.length;
    const total_no_of_embeds = Math.ceil(length / questions_per_embed);  // round up
    // console.log("Total no of Embeds: ", total_no_of_embeds);
    let total_no_of_fields = Math.ceil(length / questions_per_field); 
    // console.log("Total no of Fields: ", total_no_of_fields);
    let current_question : number = 0;
    let embeds : EmbedBuilder[] = [];
    const heading = new EmbedBuilder()
    .setColor(0x3498db)
    .setTitle("Revise Quiz Questions!")
    .setDescription('**Tap on answers to reveal**')
    embeds.push(heading);
  
    for(let i = 0; i < total_no_of_embeds; i++) {
      const embed = new EmbedBuilder();
      for(let j = 0; j < fileds_per_embed && total_no_of_fields > 0; j++) {
        // Slice the array into a subarray of a set of 4 questions and add them to a field
        let curr_set : string = questions.slice(current_question, current_question+questions_per_field).map((question : any, index : number) => {
          const question_number = current_question + index + 1;
          let answer = '';
          return (
            `\`\`\`\n(${question_number}) ${question.question}\n` + 
            question.options.map((option : string, index:number) => {
              const opt_text = ` (${index+1}) ${option} `;
                if(index+1 == question.answer )
                  answer = option;
                return opt_text;
            })
            .join('\n')
            + `\n\`\`\`\nAnswer: ||${answer}||`
          )
        }).join('\n\n')
  
        curr_set = `${curr_set}` // put the current set of questions in a code block
        // add field containing 4 questions to the embed
        embed.addFields(
          {
              name: " ",
              value: curr_set
          }
        )
        current_question += questions_per_field;
        total_no_of_fields--;
      }
      // add the embed to the list of embeds
      embeds.push(embed);
    }
  
    return embeds;  
}
