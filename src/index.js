const ApexDoc = require('./apexDoc');
const ApexDocsJsonParser = require('./apexDocsJsonParser');

const apexDocsJsonParser = new ApexDocsJsonParser('/Users/mblanski/Documents/Projects/NPSP');
const apexDocEngine = new ApexDoc(apexDocsJsonParser);
apexDocEngine.runApexDocs();