const sentenceClassifier = require('../modules/sentenceClassifier.js');

// test('', () => {
//     expect().toBe();
// });
let classified;
let mockDatabase = {
    runQuery: () => { },
    runList: () => { }
};

beforeEach(() => { 
    const question = 'what is x';
    const anyLimit = 5;

    classified = new sentenceClassifier(question, mockDatabase, anyLimit);
});

test('a question creates parsedInput with type "whatIs"', () => {
    expect(classified.sentenceType).toBe('whatIs');
});

test('Returns indefinite article for first letter of word', () => {
    const aWord = 'car';
    const anWord = 'apple';
    expect(classified.getIndefiniteArticle(aWord[0])).toBe('a ');
    expect(classified.getIndefiniteArticle(anWord[0])).toBe('an ');
});

test('Returns 1 if phrase has a determiner', () => {
    const aPhrase = 'a car';
    const thePhrase = 'the car';
    expect(classified.hasDeterminer(aPhrase)).toBe(1);
    expect(classified.hasDeterminer(thePhrase)).toBe(1);
});

test('Returns 0 if phrase does not have a determiner', () => {
    const phrase = 'car';
    expect(classified.hasDeterminer(phrase)).toBe(0);
});

test('Strips determiner from phrase', () => {
    const phrase = 'a car';
    const expected = { determiner: 'a', noun: 'car' };

    expect(classified.stripDeterminer(phrase)).toEqual(expected);
});

test('Returns noun from phrase without a determiner', () => {
    const phrase = 'car';
    const expected = { determiner: null, noun: 'car' };
    
    expect(classified.stripDeterminer(phrase)).toEqual(expected);
});

test('questionHandler should return an object', () => {
    const result = classified.questionHandler();
    const expected = {
        noun: 'x',
        query: "MATCH (s:Lemma {name: 'x', pos:'n'})-[r]->(n:Synset) RETURN n AS node LIMIT 5 UNION ALL MATCH (s:Subject {id: 'x', pos:'n'}) RETURN s AS node LIMIT 5",
        indefiniteArticle: '',
        determiner: undefined
    };
    expect(result).toEqual(expected);
});

test('A statement creates parsedInput with type "isA"', () => {
    const statement = 'Bob is a man';
    const anyLimit = 5;

    classified = new sentenceClassifier(statement, mockDatabase, anyLimit);

    expect(classified.sentenceType).toBe('isA');
});

test('statementHandler should call database and return an object', async () => {
    const statement = 'Bob is a man';
    const anyLimit = 5;
    mockDatabase = {
        runQuery: () => {
            (new Promise((resolve, reject) => {
                resolve([{ _fields: ['01', '02'] }]);

            }))
        },
        runList: () => {
            (new Promise((resolve, reject) => {
                resolve({});
            }))
        }
    };
    const expected = { noun: 'Bob', indefiniteArticle: '', determiner: undefined }

    classified = new sentenceClassifier(statement, mockDatabase, anyLimit);
    const result = await classified.handler();

    expect(result).toEqual(expected);

});