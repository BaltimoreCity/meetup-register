# meetup-register

This repo is used to register a meetup from meetup.com and have it converted into a data format that is pushed into the baltimore tech portal

Setup

1. `npm install`
2. Insert your github token in **index.js** `const GITHUB_TOKEN = "{insert your token here}";`
3. Change target repository in **index.js** `const GITHUB_REPO = "{:owner/:repo}";`

Execute

> npm run exec
