import { type Collection, MongoClient, ServerApiVersion } from 'mongodb';
import type { UserData } from '../types/db';
import { DBNotInitialized, DBWriteError } from './error';

export class MondoDBClient {
	client: MongoClient;
	users?: Collection<UserData>;
	constructor() {
		const uri = process.env.MONGODB_URI;
		if (!uri) {
			console.error('Failed to get database uri.');
			process.exit(1);
		}
		this.client = new MongoClient(uri, {
			serverApi: {
				version: ServerApiVersion.v1,
				strict: true,
				deprecationErrors: true,
			},
		});
	}

	init = async () => {
		await this.client.connect();
		this.users = this.client.db('lol-discord').collection('riot-accounts');
	};

	findUserByDiscordId = async (discordId: string) => {
		if (!this.users) throw new DBNotInitialized();
		const doc = await this.users.findOne({ discordId });
		return doc;
	};

	upsertUser = async (data: UserData) => {
		if (!this.users) throw new DBNotInitialized();
		const doc = await this.findUserByDiscordId(data.discordId);
		if (doc) {
			const res = await this.users.updateOne({ discordId: data.discordId }, { $set: data });
			if (!res.acknowledged) {
				throw new DBWriteError(`Failed to write user data. ID: ${data.discordId}`);
			}
		} else {
			const res = await this.users.insertOne(data);
			if (!res.acknowledged) {
				throw new DBWriteError(`Failed to write user data. ID: ${data.discordId}`);
			}
		}
	};
}
