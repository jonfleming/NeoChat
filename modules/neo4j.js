const neo4jDriver = require('neo4j-driver');
const username = process.env.username;
const password = process.env.password;
const uri = 'neo4j://localhost:7687';

class neo4j {

    constructor(database) {
        this.driver = neo4jDriver.driver(uri, neo4jDriver.auth.basic(username, password));
        this.session = this.driver.session({database: database});
    }

    async runQuery(query) {
        try {
            const result = await this.session.run(query);
            const records = result.records;            
            return records;
        } catch (err) {
            throw new Error(err);
        }
    }

    async close() {
        await this.session.close();
        await this.driver.close();
    }
}

module.exports = neo4j;
