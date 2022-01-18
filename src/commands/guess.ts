import { SlashCommandBuilder } from '@discordjs/builders';
import * as checkWord from 'check-word';
import { Command } from '../@types/commands';

const dictionary = checkWord('en')

const word = 'seven'

const constraintsHit = (guess: string) : string | undefined => {
  if (guess.length !== 5) {
    return 'Word should be 5 letters long';
  }

  if (!guess.match(/[a-z]{5}/)) {
    return 'Not a word';
  }

  //TODO: look into reliability
  if (!dictionary.check(guess.toLowerCase())) {
    return 'Not in word list';
  }

  if (guess === word) {
    return 'Correct!';
  }

  return undefined;
}

const command: Command = new Command(
  //TODO: get command to show guess parameter
  new SlashCommandBuilder()
    .setName('guess')
    .setDescription('Make a guess')
    .addStringOption(option => option.setName('guess').setDescription('Your 5-letter guess').setRequired(true)),

  // may want to extract this into a separate function since it might get quite big
  async interaction => {
    let guess: string = interaction.options.get('guess').value as string;

    if (constraintsHit(guess)) {
      return await interaction.reply({content: constraintsHit(guess), ephemeral: true});
    }

    const letters = word.split('') // we split it so we can remove letters as we go (so extra letters in the guess don't count already counted letters)
    const response = guess.split('').reduce((acc, letter, i) => {
      if (letters[i] === letter) {
        letters[i] = ''
        return acc + '🟩' // for now we copy Wordle's style of green square, yellow square, black square...
        // Potentially we could use the canvas to draw the guessed word on top of coloured squares? https://discordjs.guide/popular-topics/canvas.html#adding-in-text
      }
      if (letters.includes(letter)) {
        letters[letters.indexOf(letter)] = ''
        return acc + '🟨'
      }
      return acc + '⬛'
    }, '')

    // gross response right now, can come up with better :)
    return await interaction.reply({ content: `${guess.toUpperCase()}\n${response}`, ephemeral: true })
  }
)

export default command