const argv = require('yargs').argv,
    walk = require('walk'),
    fs = require('fs'),
    _ = require('lodash'),
    htmlparser = require('htmlparser');

// Ask the user to specify the path to start walking the code
if (_.isNil(argv.path)) {
    throw new Error('Could not find --path=');
}

// Ask the user to specify an elment tag, like button for <button></button>
if (_.isNil(argv.tag)) {
    throw new Error('Could not find --tag=');
}

// Add an options args for delimiter (join by) and if you want text between the <></> tags

// The list of elements
let elements = [];

function walkThroughChildren(element) {
    if (element.name === argv.tag) {
        elements.push(element);
    }

    // Keep walking through the elements children
    if (!_.isNil(element.children)) {
        _.forEach(element.children, (child) => {
            walkThroughChildren(child);
        });
    }
}

function generateElements() {
    let uniqueElementsHtmlArray = [];

    _.forEach(elements, (element) => {
        let elementHtml = `<${element.name}`;

        // Add a space if element has attributes
        if (!_.isNil(element.attribs)) {
            elementHtml += ' ';
        }

        _.forEach(_.keys(element.attribs), (attribute, idx) => {
            elementHtml += `${attribute}='${element.attribs[attribute]}'`;

            // If the attribute is the last attribute do not add an extra space
            if (!idx === _.keys(element.attribs).length) {
                elementHtml += ' ';
            }
        });
        elementHtml += `></${element.name}>`;
        if (!_.includes(uniqueElementsHtmlArray, elementHtml)) {
            uniqueElementsHtmlArray.push(elementHtml);
        }
    });
    return _.join(uniqueElementsHtmlArray, '');
}

let options = {
    listeners: {
        file: function(root, fileStats, next) {
            // Just printing this out so I can see the script is still working
            console.log(fileStats.name);
            if (_.endsWith(fileStats.name, '.html')) {
                fs.readFile(`${root}/${fileStats.name}`, (err, data) => {
                    const rawHtml = data.toString('utf8'),
                        handler = new htmlparser.DefaultHandler(function(error, dom) {
                            if (!error) {
                                _.forEach(dom, (element) => walkThroughChildren(element));
                            }
                        }),
                        parser = new htmlparser.Parser(handler);

                    parser.parseComplete(rawHtml);
                });
            }
            next();
        },
        end: function() {
            console.log(generateElements());
        },
        errors: function(root, nodeStatsArray, next) {
            next();
        }
    }
};

// Instantiate the walker to walk the directory
walk.walk(argv.path, options);
