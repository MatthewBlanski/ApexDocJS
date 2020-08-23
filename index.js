const ApexDoc = require('./src/apexDoc.js');
const ApexDocJsonParser = require('./src/config/apexDocJsonParser.js');

if(!process.argv[2]) {
    console.log('You have to provide a path to the repo!')
}
const apexDocJsonParser = new ApexDocJsonParser(process.argv[2]);
const apexDocEngine = new ApexDoc(apexDocJsonParser);
apexDocEngine.runApexDoc();