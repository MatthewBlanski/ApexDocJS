const ApexDoc = require('./apexDoc.js');

//TODO - implement process.argv.slice
const apexDocEngine = new ApexDoc('/Users/mblanski/Documents/Projects/Summit-Events-App',
    'ApexDocsContent',
    '',
    './src',
    ['global','public','webService']
);
apexDocEngine.runApexDocs();