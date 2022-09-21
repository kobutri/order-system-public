import * as nodemailer from 'nodemailer';
import admin from 'firebase-admin';
import { private_key, client_email, project_id } from '$env/static/private';
import * as windows1252 from 'windows-1252';

let app: admin.app.App;

/** @type {import('./$types').RequestHandler} */
export async function POST(event) {
	if (!app) {
		app = admin.initializeApp({
			credential: admin.credential.cert({
				privateKey: private_key,
				clientEmail: client_email,
				projectId: project_id
			}),
			databaseURL:
				'https://wisag-outpost-order-system-default-rtdb.europe-west1.firebasedatabase.app'
		});
	}

	const data = (await event.request.json()) as {
		to: string;
		from: string;
		attachment: string;
		entryName: string;
		token: string;
	};
	try {
		await app.auth().verifyIdToken(data.token);
		// create reusable transporter object using the default SMTP transport
		const transporter = nodemailer.createTransport({
			service: 'hotmail',
			auth: {
				user: 'wisag-order-system@outlook.com', // generated ethereal user
				pass: 'pbwiiagzdsxdkrfr' // generated ethereal password
			}
		});

		const name = data.from.split('@')[0];

		const encoded = windows1252.encode(data.attachment);
		const uint8array = new Uint8Array([...encoded]);
		// send mail with defined transport object
		const info = await transporter.sendMail({
			from: `"${name}" wisag-order-system@outlook.com`,
			to: data.to.split(';'),
			subject: `${name} Bestellung ${data.entryName}`,
			html:
				'Hallo,<br/>es wurde eine eine neue Bestellung' +
				`von ${name} für den ${data.entryName} aufgegeben.`,
			attachments: [
				{
					content: Buffer.from(uint8array),
					filename: `${name}-${data.entryName}.csv`
				}
			]
		});
		console.log('Message sent: %s', info.messageId);
		// Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>
	} catch (e) {
		return new Response(JSON.stringify(e));
	}
	return new Response('success');
}
