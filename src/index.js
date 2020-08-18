const ApexDoc = require('./apexDoc.js');

const apexDocEngine = new ApexDoc('/Users/mblanski/Documents/Projects/EDA/src',
    '/Users/mblanski/Documents/Projects/EDA/ApexDoc',
    '',
    '',
    ['global','public','webService'],
    [],
    'https://github.com/SalesforceFoundation/EDA/tree/master/src'
);
apexDocEngine.runApexDocs();