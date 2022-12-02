import { Client, TextChannel } from 'discord.js'
import { io } from 'socket.io-client'
import { red, yellow, green } from 'colorette'
import axios from 'axios'

const SOCKET_IO_URL = process.env.API_URL as string
const SOCKET_IO_PATH = '/socket.io'
let socket: any

async function setupSocket() {
	await axios.get(SOCKET_IO_URL + SOCKET_IO_PATH).catch(() => {})

	if (socket) {
		socket.close()
	}

	const s = io(SOCKET_IO_URL, {
		path: SOCKET_IO_PATH,
		autoConnect: true,
	})

	s.on('connect', () => {
		console.log(green(`Connected to Socket.io`))
	})
	s.on('disconnect', () => {
		console.log(yellow(`Disconncted from Socket.io`))
	})
	s.on('error', (error) => {
		console.log(red(`Socket.io Error: ${error}`))
	})

	socket = s
}

export async function init(client: Client) {
	await setupSocket()

	setInterval(async () => {
		await axios.get(SOCKET_IO_URL + SOCKET_IO_PATH).catch(() => {})
	}, 1000 * 10)

	socket.on(
		'discord-verify',
		async (userTag: string, callback: (res: any) => void) => {
			const [username, discriminator] = userTag.split('#')
			if (!username) {
				return callback(false)
			}

			let guild = await client.guilds
				.fetch(process.env.DISCORD_MAIN_SERVER_ID as string)
				.catch(() => {})
			if (!guild) {
				return callback(false)
			}

			let fetchedMembers = await guild.members
				.fetch({ query: username, time: 2000 })
				.catch(() => {})
			if (!fetchedMembers) {
				return callback(false)
			}

			fetchedMembers.forEach((member) => {
				if (member.user.bot) return

				if (member.user.username == username) {
					if (discriminator) {
						if (member.user.discriminator == discriminator) {
							return callback(true)
						} else {
							return callback(false)
						}
					}
					return callback(true)
				}
			})

			return callback(false)
		},
	)
}
