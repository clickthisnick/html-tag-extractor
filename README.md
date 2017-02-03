# html-tag-extractor
This extracts unique tags from any html files inside a directory

# Usage:
node code.js --path=[pathToFolder] --tag=[theTagToExtract]

# Example:
node code.js --path=/Users/Desktop/website --tag=button

This code would walk through the /Users/Desktop/website directory and extract any <button></button> button elements from html files

# Why?

This will get all the unique tags like buttons or icons and you can see if across all html pages if your website UI is consistent
