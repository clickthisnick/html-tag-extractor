const walk = require('walk'),
    fs = require('fs'),
    _ = require('lodash'),
    YAML = require('yamljs'),
    cfg = YAML.load('config.yml');
    htmlparser = require('htmlparser');

// The list of elements
let elements = [],
    blackList = false,
    whiteList = false;

if (cfg.blackListAttributes.length > 0) {
    blackList = true
}

if (cfg.whiteListAttributes.length > 0) {
    whiteList = true;
}

if (blackList && whiteList) {
    throw new Error('Please specify either a blacklist or whitelist, not both');
}

function walkThroughChildren(element, filepath) {
    // Push unique element html to our elements array
    if (element.name === cfg.tag) {
        let elementHtml = `<${element.name} `,
            validAttributes = [];

        _.forEach(_.keys(element.attribs), (attribute) => {

            // Blacklist
            if (blackList && !_.includes(cfg.blackListAttributes, attribute)) {
                validAttributes.push(attribute);
                elementHtml += `${attribute}='${element.attribs[attribute]}'`;
            }

            // Whitelist
            if (whiteList && _.includes(cfg.whiteListAttributes, attribute)) {
                validAttributes.push(attribute);
                elementHtml += `${attribute}='${element.attribs[attribute]}'`;
            }
        })
        // Closing the dom element
        elementHtml += `></${element.name}>`

        // Showing the attribute that make up the element
        if (cfg.showAttrbutes && validAttributes.length > 0) {

            elementHtml += cfg.showAttributesWrapping[0];

            // Showing only the valid attributes
            _.forEach(validAttributes, (attribute, idx) => {
                elementHtml += `${attribute}=`;
                elementHtml += `'${element.attribs[attribute]}'`;
                if (idx !== validAttributes.length -1) {
                    elementHtml += cfg.showAttributesDelimter
                }
            })

            elementHtml += cfg.showAttributesWrapping[1];
        }

        // Adding the file path if needed
        if (cfg.showFilePath) {
            elementHtml += cfg.showFilePathWrapping[0];
            elementHtml += filepath;
            elementHtml += cfg.showFilePathWrapping[1];
        }

        // Pushing element into our elements array
        elements.push(elementHtml);
    }

    // Keep walking through the elements children
    _.forEach(element.children, (child) => walkThroughChildren(child, filepath));
}

let options = {
    // These directories will be ignored
    filters: cfg.ignoreDirectories,
    listeners: {
        file: function(root, fileStats, next) {
            if (_.includes(fileStats.name, cfg.fileExtensionsToScan)) {
                fs.readFile(`${root}/${fileStats.name}`, (err, data) => {
                    const rawHtml = data.toString('utf8'),
                        handler = new htmlparser.DefaultHandler((error, dom) => {
                            _.forEach(dom, (element) => walkThroughChildren(element, `${root}/${fileStats.name}`));
                        }),
                        parser = new htmlparser.Parser(handler);

                    parser.parseComplete(rawHtml);
                });
            }
            next();
        },
        end: function() {
            const htmlOfElements = _.join(_.uniq(elements), cfg.delimiter)
            fs.writeFile(cfg.outputFile, htmlOfElements, (err) => {
                if(err) {
                    return console.log(err);
                }

                console.log("The file was saved!");
            }); ;
        },
        errors: function(root, nodeStatsArray, next) {
            next();
        }
    }
};

// Instantiate the walker to walk the directory
walk.walk(cfg.inputDirectory, options);
