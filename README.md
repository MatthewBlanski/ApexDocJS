# ApexDocJS
ApexDocJs is a node js app that you can use to document your Salesforce Apex classes. You tell ApexDoc where your local repo is and it will generate a set of static HTML pages that fully document each class, including its properties and methods. Each static HTML page will include an expandable menu on its left hand side, that shows a 2-level tree structure of all of your classes. An apexdoc JSON file at the root directory of the repo allows you to control many aspects of ApexDocJS.

# Credits
ApexDoc was originally created by [Aslam Bari](http://techsahre.blogspot.com/2011/01/apexdoc-salesforce-code-documentation.html). It was then taken and extended by David Habib, at Groundwire, in 2011. It has subsequently been enhanced by David Habib of the [Salesforce Foundation](https://github.com/SalesforceFoundation/ApexDoc) in late 2014 for use with [Nonprofit Success Pack](https://github.com/SalesforceFoundation/NPSP). Matthew Blanski of Salesforce then ported it over to Node.js as ApexDocJS.

# Configuration
## Command Line Parameter
The only parameter that ApexDocJs takes from the command line is the path to the local repo.

|parameter|description|
|---------|-----------|
|source_directory|The folder location which contains the root directory for your git repo|

For example
```node index.js /path/to/my/repo```

# ApexDoc Json
If your repo has a file named ```apexdoc.json``` in its root directory, you are able to provide additional configuration. An example file with its default values is as follows:
```
{
    "accessModifiers":["global","public","webService"],
    "bannerFilePath":"",
    "homeFilePath":"",
    "mainBranch":"main",
    "resourcesFolderPath":"apexdocresources",
    "targetDirectory":"ApexDocContent"
}
```

The parameters for the JSON file are as follows:

|parameter|description|
|---------|-----------|
|accessModifiers|A list of access modifiers to document. Optional.|
|bannerFilePath|The full path to an html file that contains the content for the banner section of each generated page.  Optional.|
|homeFilePath|The full path to an html file that contains the contents for the home page's content area. Optional.|
|mainBranch|The main branch for your git repository. Optional.|
|resourcesFolderPath|The full path to the folder that contains supporting javascript and images to copy over. Optional.|
|targetDirectory|The folder location in the repo where documentation will be generated to. Optional.|

# Usage
Pull down the repo to your local machine. Run node.js against index.js, adding your repo's file path as an argument

For example
```node index.js /path/to/my/repo```

# Documenting Class Files
ApexDocJS scans each class file, and looks for comment blocks with special keywords to identify the documentation to include for a given class, property, or method. The comment blocks must always begin with /** (or additional *'s) and can cover multiple lines. Each line must start with * (or whitespace and then *). The comment block ends with */. Special tokens are called out with @token.

## Class Comments
Located in the lines above the class declaration. The special tokens are all optional.

|token|description|
|-----|-----------|
|@author|the author of the class|
|@date|the date the class was first implemented|
|@group|a group to display this class under, in the menu hierarchy|
|@group-content|a relative path to a static html file that provides content about the group|
|@description|one or more lines that provide an overview of the class|

Example
```
/**
* @author Salesforce.com Foundation
* @date 2014
*
* @group Accounts
* @group-content ../../ApexDocContent/Accounts.htm
*
* @description Trigger Handler on Accounts that handles ensuring the correct system flags are set on
* our special accounts (Household, One-to-One), and also detects changes on Household Account that requires
* name updating.
*/
public with sharing class ACCT_Accounts_TDTM extends TDTM_Runnable {
```

## Property Comments
Located in the lines above a property. The special tokens are all optional.

|token|description|
|-----|-----------|
|@description|one or more lines that describe the property|

Example
```
    /*******************************************************************************************************
    * @description specifies whether state and country picklists are enabled in this org.
    * returns true if enabled.
    */
    public static Boolean isStateCountryPicklistsEnabled {
        get {
```
## Method Comments
In order for ApexDoc to identify class methods, the method line must contain an explicit scope (global, public, private, testMethod, webService). The comment block is located in the lines above a method. The special tokens are all optional.

|token|description|
|-----|-----------|
|@description|one or more lines that provide an overview of the method|
|@param|param name	a description of what the parameter does|
|@return|a description of the return value from the method|
|@example|Example code usage. This will be wrapped in tags to preserve whitespace|

Example
```
    /*******************************************************************************************************
    * @description Returns field describe data
    * @param objectName the name of the object to look up
    * @param fieldName the name of the field to look up
    * @return the describe field result for the given field
    * @example
    * Account a = new Account();
    */
    public static Schema.DescribeFieldResult getFieldDescribe(String objectName, String fieldName) {
```