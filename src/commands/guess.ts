import { MessageActionRow, MessageButton } from "discord.js"
import { MessageButtonStyles } from "discord.js/typings/enums"
import { Command, Execution } from "../@types/commands"
import * as words from '../sgb-words.json'
import * as checkWord from 'check-word'
import { SlashCommandBuilder } from "@discordjs/builders"

const dictionary = checkWord('en')

class GameState {
  boardState: string[]
  rows: MessageActionRow[]
  evaluations: ('🟩' | '🟨' | '⬛')[][]
  gameStatus: 'ongoing' | 'won' | 'lost'
  rowIndex: number
  solution: string

  constructor(_solution: string) {
    this.boardState = []
    this.rows = []
    this.evaluations = []
    this.gameStatus = 'ongoing'
    this.rowIndex = 0
    this.solution = _solution
  }

  guess = (guess: string) => {
    this.boardState.push(guess)

    if (guess === this.solution) {
      this.gameStatus = 'won'
    }

    const tiles = guess.split('').map(letter => new MessageButton().setLabel(letter.toUpperCase()))
    const evaluation: ('🟩' | '🟨' | '⬛')[] = []

    let solution = this.solution.split('')
    let chars = guess.split('')
    chars.forEach((letter, i) => {
      if (letter === solution[i]) {
        solution[i] = ''
        chars[i] = ' '
        evaluation[i] = '🟩'
        tiles[i].setStyle(MessageButtonStyles.SUCCESS).setCustomId(i.toString())
      }
    })

    chars.forEach((letter, i) => {
      if (solution.includes(letter)) {
        solution[i] = ''
        chars[i] = ' '
        evaluation[i] = '🟨'
        tiles[i].setStyle(MessageButtonStyles.PRIMARY).setCustomId(i.toString())
      } else if (chars[i] !== ' ') {
        evaluation[i] = '⬛'
        tiles[i].setStyle(MessageButtonStyles.SECONDARY).setCustomId(i.toString())
      }
    })

    this.rows.push(new MessageActionRow().setComponents(tiles))
    this.evaluations.push(evaluation)
    this.rowIndex++
  }
}

class Guild {
  todaysWord: string
  games: Map<string, GameState>

  constructor() {
    this.newWord()
  }

  newGame = (userId: string) => this.games.set(userId, new GameState(this.todaysWord))

  newWord = () => {
    this.todaysWord = words[Math.floor(Math.random() * words.length)]
    this.games = new Map()
  }
}

const guilds = new Map<string, Guild>()

const execute: Execution = async interaction => {
  const guess = interaction.options.get('guess').value

  // guess constraints:
  // must be a string
  if (typeof guess !== 'string')
    return await interaction.reply({ content: 'Not a word', ephemeral: true })
  // must be 5 letters long
  if (guess.length !== 5)
    return await interaction.reply({ content: 'Word should be 5 letters long', ephemeral: true })
  // must be a word in the dictionary (might be worth looking into the reliability of this)
  if (!dictionary.check(guess.toLowerCase()))
    return await interaction.reply({ content: 'Not in word list', ephemeral: true })

  // if the guild has not yet started playing, it is created here
  if (!guilds.has(interaction.guild.id))
    guilds.set(interaction.guild.id, new Guild())
  const guild = guilds.get(interaction.guild.id)

  // if the user has not yet started playing in this guild, their game state is created here
  if (!guild.games.has(interaction.user.id))
    guild.newGame(interaction.user.id)
  const game = guild.games.get(interaction.user.id)

  switch (game.gameStatus) { // I'll put nicer messages here later dw
    case 'won':
      return await interaction.reply({ content: 'You already won', ephemeral: true })
    case 'lost':
      return await interaction.reply({ content: 'You already lost', ephemeral: true })
    default:
      game.guess(guess) // wonder if this should return stuff that we can use, rather than having to grab it from the game object afterwards? It could even just return the game.rows?
      return await interaction.reply({ content: '_ _', ephemeral: true, components: [game.rows[game.rowIndex - 1]] })
  }
}

const command: Command = new Command(
  new SlashCommandBuilder()
    .setName('guess')
    .setDescription('Guess a word')
    .addStringOption(option => option.setName('guess').setDescription('Your 5-letter guess').setRequired(true)),
  execute
)

export default command