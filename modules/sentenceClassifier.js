class sentenceClassifier {
    
    constructor(sentence, database, limit) {
        let sentenceTypes = [
            {regex: '^what is', sentenctType: 'whatIs', handler: this.questionHandler},
            {regex: '^who is', sentenctType: 'whoIs', handler: this.questionHandler},
            {regex: '^where is', sentenctType: 'whereIs', handler: this.questionHandler},
            {regex: '^why is', sentenctType: 'whyIs', handler: this.questionHandler},
            {regex: '^how is', sentenctType: 'howIs', handler: this.questionHandler},
            {regex: 'is a', sentenctType: 'isA', handler: this.statementHandler},
        ];

        this.sentence = sentence;
        this.database = database;
        this.limit = limit;
        this.sentenceType = 'unknown';
        this.handler = {};

        sentenceTypes.find(x => {
            if(sentence.match(new RegExp(x.regex, 'i'))) {
                this.sentenceType = x.sentenctType;
                this.handler = x.handler;
                return true;
            }
        });
    } 
    
    getIndefiniteArticle(startsWith) {
        const n=(new Set(['a','e','i','o','u'])).has(startsWith) ? 'n' : '';
        return `a${n} `;
    }

    hasDeterminer(phrase) {
        return phrase.startsWith('an') | phrase.startsWith('a') | phrase.startsWith('the') |
        phrase.startsWith('An') | phrase.startsWith('A') | phrase.startsWith('The');

    }

    stripDeterminer(phrase) {
        let a = phrase.split(' ');
        let determiner = a.shift();
        let noun = a.join(' ');

        return {noun, determiner};
    }

    questionHandler() {     
        let noun = this.sentence.replace(/what is /i, '').replace(/what is /i, '').replace(/\?/, '');
        let determiner;
        let indefiniteArticle = '';
        let query;

        if (this.hasDeterminer(noun)) {
            ({noun, determiner} = this.stripDeterminer(noun));
            indefiniteArticle = this.getIndefiniteArticle(noun[0]);
        } 

        query = `MATCH (s:Lemma {name: '${noun}', pos:'n'})-[r]->(n:Synset)` +
        ` RETURN n AS node LIMIT $this.limit}` +
        ` UNION ALL MATCH (s:Subject {id: '${noun}', pos:'n'})` +
        ` RETURN s AS node LIMIT ${this.limit}`;
        
        return {noun, query, indefiniteArticle, determiner};
    }
    
    async statementHandler() {
        // Need to determine a strategy for adding new facts.  If a lemma already exists we
        // currently add it again with a new id,
        console.log('The sentence is a statement');
        let segments = this.sentence.split('is an');
        if (segments.length === 1) segments = this.sentence.split('is a');

        let noun = segments[0].trim();
        let indefiniteArticle = '';
        let determiner;
        let query;

        if (this.hasDeterminer(noun)) {
            ({noun, determiner} = this.stripDeterminer(noun));          
        }
          
        noun = noun.replace(/ /, '_');
        const predicate = segments[1].trim().replace(/\.$/, '');
        const article = this.getIndefiniteArticle(predicate[0]);
        const definition = `${article}${predicate}`;
        
        if (determiner) {
            const existingRecordsQuery = `match (s:Synset) where s.id starts with '${noun}.' return collect(right(s.id, 2));`;
            const records = await this.database.runQuery(existingRecordsQuery);
            const nextId = '.01';
            const ids = records[0]._fields[0].sort();

            if(ids.length > 0) {
                nextId = string(parseInt(ids[ids.length-1]) + 1).padStart(2,'0');
            }
            
            query = `CREATE (s:Synset {id: '${noun}.n.${nextId}', name: '${noun}', pos: 'n', definition: '${definition}', added:'true'}) RETURN s;`        
            indefiniteArticle = `${determiner} `;
        } else {
            query = `CREATE (s:Subject {id: '${noun}', pos: 'n', definition: '${definition}'}) RETURN s;`        
        }

        return {noun, query, indefiniteArticle, determiner};
    }
    
}

module.exports = sentenceClassifier;