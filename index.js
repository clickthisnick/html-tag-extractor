const walk = require('walk'),
    fs = require('fs'),
    _ = require('lodash'),
    YAML = require('yamljs'),
    cfg = YAML.load('config.yml');
    htmlparser = require('htmlparser');

// The list of elements
let elements = [],
    elementsInfo = [],
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
            attributes = _.keys(element.attribs),
            validAttributes = [];

        if (!cfg.attributeSortingMatter) {
            attributes = attributes.sort();
        }

        _.forEach(attributes, (attribute) => {
            let attributeValues = element.attribs[attribute].split(' ');

            if (!cfg.attributeSortingMatter) {
                attributeValues = _.join(attributeValues.sort(), ' ');
            }

            // Blacklist
            if (blackList && !_.includes(cfg.blackListAttributes, attribute)) {
                validAttributes.push(attribute);
                elementHtml += `${attribute}='${attributeValues}'`;
            }

            // Whitelist
            if (whiteList && _.includes(cfg.whiteListAttributes, attribute)) {
                validAttributes.push(attribute);
                elementHtml += `${attribute}='${attributeValues}'`;
            }
        })

        // Closing the dom element
        elementHtml += `>${cfg.nestedElement}</${element.name}>`

        // Pushing unique elements into our elements array
        if (!_.includes(elements, elementHtml)) {
            let elementInfoText = '';

            // Showing the attribute that make up the element
            if (cfg.showAttrbutes && validAttributes.length > 0) {

                elementInfoText += cfg.showAttributesWrapping[0];

                // Showing only the valid attributes
                _.forEach(validAttributes, (attribute, idx) => {
                    elementInfoText += `${attribute}=`;
                    elementInfoText += `'${element.attribs[attribute]}'`;
                    if (idx !== validAttributes.length -1) {
                        elementInfoText += cfg.showAttributesDelimter
                    }
                })

                elementInfoText += cfg.showAttributesWrapping[1];
            }

            // Adding the file path if needed
            if (cfg.showFilePath) {
                elementInfoText += cfg.showFilePathWrapping[0];
                elementInfoText += filepath;
                elementInfoText += cfg.showFilePathWrapping[1];
            }

            // The elements array contains unique elements
            elements.push(elementHtml);

            // The element info array contains extra info about the element
            elementsInfo.push(elementInfoText);
        }
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
            let htmlElementWithInfoArray = [];

            _.forEach(elements ,(element, idx) => {
                htmlElementWithInfoArray.push(`${element}${elementsInfo[idx]}`);
            })

            const htmlOfElements = _.join(htmlElementWithInfoArray, cfg.delimiter)
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
