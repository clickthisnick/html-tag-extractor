const walk = require('walk'),
    fs = require('fs'),
    _ = require('lodash'),
    YAML = require('yamljs'),
    cfg = YAML.load('config.yml');

let toastMap = {};
let options = {
    // These directories will be ignored
    filters: cfg.ignoreDirectories,
    listeners: {
        file: function(root, fileStats, next) {
            const fileExtension = _.last(fileStats.name.split('.'));

            if (_.includes(cfg.fileExtensionsToScan, fileExtension)) {
                fs.readFile(`${root}/${fileStats.name}`, (err, data) => {
                    const stringData = data.toString('utf8');

                    const lines = stringData.split('\n');
                    let itemFound = false;

                    _.forEach(lines, (line) => {
                        let wantedString;

                        // This only grabs stuff thats on the same line
                        if (_.includes(line, cfg.left) && !itemFound) {
                            itemFound = true;
                            line = line.split(cfg.left)[1]
                        }

                        if (_.includes(line, cfg.right) && itemFound) {
                            wantedString = line.split(cfg.right)[0]
                            itemFound = false;
                            if (wantedString in toastMap) {
                                toastMap[wantedString].push(fileStats.name)
                            } else {
                                toastMap[wantedString] = [fileStats.name]
                            }
                        }
                    })
                });
            }
            next();
        },
        end: function() {
            _.forEach(Object.keys(toastMap), (key) => {
                console.log(`Toast Message: ${key}`)
                console.log(`File Locations: ${toastMap[key]}`);
                console.log('\n')
            })
        },
        errors: function(root, nodeStatsArray, next) {
            next();
        }
    }
};

// Instantiate the walker to walk the directory
walk.walk(cfg.inputDirectory, options);
