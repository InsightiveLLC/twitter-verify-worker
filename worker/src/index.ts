import 'dotenv-flow/config'
import path from 'path'
import fs from 'fs'
import { green, red } from 'colorette'
import Discord from 'discord.js'

const client = new Discord.Client({
	intents: ['GUILDS', 'GUILD_MESSAGES', 'GUILD_MEMBERS'],
	partials: ['CHANNEL', 'MESSAGE', 'GUILD_MEMBER'],
})

// Features
fs.readdir(path.join(__dirname, 'features'), (err, files) => {
	let initFunctions: Promise<boolean>[] = []
	let startFunctions: any[] = []

	files.forEach(async (file) => {
		if (!file.endsWith('.ts') && !file.endsWith('.js')) return
		const feature = require(path.join(__dirname, 'features', file))

		if (feature.init) {
			initFunctions.push(
				new Promise(async (resolve, reject) => {
					await feature.init(client)
					resolve(true)
				}),
			)
		}

		if (feature.start) {
			startFunctions.push(feature.start)
		}
	})

	Promise.all(initFunctions).then(() => {
		startFunctions.forEach((f: any) => {
			f(client)
		})
	})
})

client
	.login(process.env.DISCORD_BOT_TOKEN)
	.then(() => {
		console.log(green('✅ Client Connected'))
	})
	.catch((err) => {
		console.log(red('⭕ Client Connection Error:\n' + err))
	})
