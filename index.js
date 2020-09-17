const express = require('express');
const app = express();
const readline = require('readline');
const sentenceClassifier = require('./modules/sentenceClassifier.js');
const neo4j = require('./modules/neo4j');

const input = readline.createInterface({input:process.stdin, output:process.stdout, prompt: 'neo> '});
const database = new neo4j('wordnetconceptnet');
let limit = 5;

async function run(sentence) {	
	const parsedInput = new sentenceClassifier(sentence, database, limit);

	switch (parsedInput.sentenceType) {
		case 'unknown':
			parsedInput.handler = parsedInput.questionHandler;
			await getWhatIs(parsedInput);
			break;
		case 'whatIs':
			await getWhatIs(parsedInput);
			break;
		case 'isA':
			await saveFact(parsedInput);
			break;
		default:
			break;
	}

	input.prompt();
}

async function saveFact(parsedInput) {
	const { noun, indefiniteArticle, determiner } = await parsedInput.handler();
	const word = new sentenceClassifier(noun, database, limit);
	word.handler = parsedInput.questionHandler;

	console.log('Your fact has been added');
	getWhatIs(word);
}

async function getWhatIs(parsedInput) {
	const {noun, query, indefiniteArticle} = await parsedInput.handler();

	try {
		const records = await database.runQuery(query);

		if (records.length === 0) {
			console.log(`I don't know what a ${noun} is.`);
			return;
		}

		let i = 1;
		records.forEach((record) => {
			const definition = record._fields[0].properties.definition;
			const hasDeterminer = definition.startsWith('a') | definition.startsWith('the');
			const prefix = hasDeterminer ? `${indefiniteArticle}${noun} is` : `${indefiniteArticle}${noun} is a`;
			console.log(`${i++} ${prefix} ${definition}`);
		});

	} catch (err) {
		console.error(err);
	}
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
		case '':
			input.prompt();
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
