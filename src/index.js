const ApexDoc = require('./apexDoc');
const ApexDocsJsonParser = require('./config/apexDocsJsonParser');

if(!process.argv[2]) {
    console.log('You have to provide a path to the repo!')
}
const apexDocsJsonParser = new ApexDocsJsonParser(process.argv[2]);
const apexDocEngine = new ApexDoc(apexDocsJsonParser);
apexDocEngine.runApexDocs();