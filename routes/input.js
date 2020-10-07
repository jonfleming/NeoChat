const sentenceClassifier = require('../modules/sentenceClassifier.js');
const neo4j = require('../modules/neo4j');

const express = require('express');
const router = express.Router();
const title = 'Browser Chat';
let message;
let reply;

/* GET home page. */
router.get('/', function (req, res, next) {
	console.log(`request: ${req.url}`);
  processInput(res, req);
});

const database = new neo4j('wordnetconceptnet');
let limit = 5;

async function run(sentence) {	
  const parsedInput = new sentenceClassifier(sentence, database, limit);
  message = '';
  reply = [];

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
}

async function saveFact(parsedInput) {
	const { noun, indefiniteArticle, determiner } = await parsedInput.handler();
	const word = new sentenceClassifier(noun, database, limit);
	word.handler = parsedInput.questionHandler;

	message = 'Your fact has been added';
	getWhatIs(word);
}

async function getWhatIs(parsedInput) {
	const { noun, query, indefiniteArticle } = await parsedInput.handler();
	
	try {
		const records = await database.runQuery(query);

		if (records.length === 0) {
			message = `I don't know what a ${noun} is.`;
			return;
		}

		let i = 1;
		records.forEach((record) => {
			const definition = record._fields[0].properties.definition;
			const hasDeterminer = definition.startsWith('a') | definition.startsWith('the');
			const prefix = hasDeterminer ? `${indefiniteArticle}${noun} is` : `${indefiniteArticle}${noun} is a`;
			reply.push(`${prefix} ${definition}`);
		});

	} catch (err) {
		console.log(err);
	}
}

async function processInput(res, req) {
  const sentence = req.query['text'];

	switch (sentence.slice(0,5)) {
		case 'limit':
			if (sentence.startsWith('limit ')) {
				limit = parseInt(sentence.slice(-2));
        message = `limit set to ${limit}`;
			}
			break;
		case '':
      message = 'Empty request';
			break;
    default:
      await run(sentence);
      break;
  }
  
  res.	json({message, reply});
}

async function exit() {
	console.log('Closing session.');
	await database.close()
  console.log('Done.');
  message = 'Done.';
}

module.exports = router;