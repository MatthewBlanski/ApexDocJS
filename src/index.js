const ApexDoc = require('./apexDoc.js');

//TODO - implement process.argv.slice
const apexDocEngine = new ApexDoc('/Users/mblanski/Documents/Projects/NPSP',
    'ApexDoc',
    '',
    './src',
    ['global','public','webService'],
    'https://github.com/SalesforceFoundation/NPSP/tree/master/'
);
apexDocEngine.runApexDocs();