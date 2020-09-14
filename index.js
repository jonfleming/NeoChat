const readline = require('readline');
const sentenceClassifier = require('./modules/sentenceClassifier.js');
const neo4j = require('./modules/neo4j');

const input = readline.createInterface({input:process.stdin, output:process.stdout, prompt: 'neo> '});
const database = new neo4j('wordnetconceptnet');
let limit = 5;

async function run(sentence) {	
	const parsedInput = new sentenceClassifier(sentence, database, limit);

	if (parsedInput.sentenceType === 'unknown')
		return;

	const {noun, query, indefiniteArticle} = await parsedInput.handler();

	try {
		const records = await database.runQuery(query);

		if (records.length === 0) {
			console.log(`I don't know what a ${noun} is.`);
			return;
		}

		records.forEach((record) => {
			const definition = record._fields[0].properties.definition;
			const hasDeterminer = definition.startsWith('a') | definition.startsWith('the');
			const prefix = hasDeterminer ? `${indefiniteArticle}${noun} is` : `${indefiniteArticle}${noun} is a`;
			console.log(`${prefix} ${definition}`);
		});

	} catch (err) {
		console.error(err);
	}

	input.prompt();
}

input.on('line', (sentence) => {
	switch (sentence.slice(0,4)) {
		case 'exit':
			console.log('Closing input.');
			input.close();
			return;
		case 'limi':
			if (sentence.startsWith('limit ')) {
				limit = parseInt(sentence.slice(-2));
				console.log(`limit set to ${limit}`);
				input.prompt();
			}
			break;
		default:
			run(sentence);
	}
});

input.on("close", async () => {
	console.log("Closing session.");
	await database.close()
	console.log("Done.");
});

console.log("Type 'exit' to exit.");
input.prompt();
