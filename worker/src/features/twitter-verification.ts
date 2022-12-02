import TwitterApi from 'twitter-api-v2'
import axios from 'axios'

export async function start() {
	axios.defaults.baseURL =
		(process.env.API_URL as string) + '/api/verification/twitter/'

	axios.defaults.headers.common['Authorization'] = process.env
		.API_KEY as string

	const twitterTrackers = await axios
		.get('/get-trackers', {
			headers: {
				Authorization: process.env.API_KEY as string,
			},
		})
		.then((res) => res.data)
		.catch(console.warn)

	if (!twitterTrackers) {
		console.warn('An error occured while getting Twitter Trackers')
		return
	}

	console.log('Twitter Trackers Fetched:', twitterTrackers)

	for (const tracker of twitterTrackers) {
		const twitterClient = new TwitterApi(tracker.token as string)
		if (!twitterClient) {
			console.warn('twitter client invalid - ', tracker.user)
			continue
		}

		tracker.userId = await twitterClient.v2
			.userByUsername(tracker.user)
			.then((res) => res.data.id)
			.catch(() => {})

		if (!tracker.userId) {
			continue
		}

		const cache = new Set()
		let firstRun = true

		setInterval(async () => {
			const followers = await twitterClient.v2
				.followers(tracker.userId, {
					max_results: 1000,
				})
				.then((res) => res.data)
				.catch((err) => {
					return
				})

			if (!followers) {
				console.log(`rate limited - ${tracker.user}`)
				return
			}

			let filteredFollowers: any = followers.filter(
				(follower) => !cache.has(follower.username),
			)
			filteredFollowers = filteredFollowers.map((follower: any) => {
				cache.add(follower.username)
				return follower.username
			})

			if (filteredFollowers.length <= 0) {
				console.log(`no new followers - ${tracker.user}`)
				return
			}

			if (firstRun) {
				console.log('Tracker initiated - ' + tracker.user)
				firstRun = false
			} else {
				axios({
					method: 'post',
					url: '/',
					params: {
						following: tracker.user,
					},
					headers: {
						Authorization: process.env.API_KEY as string,
					},
					data: filteredFollowers,
				}).catch(console.warn)

				console.log(`Ran for - ${tracker.user}`)
			}
		}, 1000 * 60 * 2)
	}
}
