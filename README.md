# html-tag-extractor
This extracts unique tags from any html files inside a directory

# Usage:
First run npm install to download get the pacakges from npm
Second go into config.yml and configure for your use case

The options are:
path: This is the directory we will walk
ignoreDirectories: Directories with this name will be ignored
tag: This is the tag <*></*> That we are searching for
delimiter: This string will be in between each html element
fileExtensionsToScan: This is an array of file extensions we want to scan ['.html', '.js']

# Example
config.yml:
path: "."
ignoreDirectories: ["node_modules"]
tag: "button"
delimiter: "<br>"
fileExtensionsToScan: [".html"]

Run in terminal:
node index.js

This code would walk through the /Users/Desktop/website directory and extract any <button></button> button elements from html files

# Why?

This will get all the unique tags like buttons or icons and you can see if across all html pages if your website UI is consistent
