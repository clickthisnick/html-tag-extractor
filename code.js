const walk = require('walk'),
    fs = require('fs'),
    _ = require('lodash'),
    YAML = require('yamljs'),
    cfg = YAML.load('config.yml');
    htmlparser = require('htmlparser');

// The list of elements
let elements = [];

function walkThroughChildren(element) {
    // Push unique element html to our elements array
    if (element.name === cfg.tag) {
        const rawElementHtml = `<${element.raw}></${element.name}>`
        elements.push(rawElementHtml);
    }

    // Keep walking through the elements children
    _.forEach(element.children, (child) => walkThroughChildren(child));
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
                            _.forEach(dom, (element) => walkThroughChildren(element));
                        }),
                        parser = new htmlparser.Parser(handler);

                    parser.parseComplete(rawHtml);
                });
            }
            next();
        },
        end: function() {
            console.log(_.join(_.uniq(elements), cfg.delimiter));
        },
        errors: function(root, nodeStatsArray, next) {
            next();
        }
    }
};

// Instantiate the walker to walk the directory
walk.walk(cfg.path, options);
