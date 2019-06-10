// must replace:
//    {YOUR-ACCESS-TOKEN} with your GitHub API access token
//    {YOUR-ORG-NAME} with the GitHub organization to query
// Courtesy of @kukicado
// Running via Webtask.io

let express    = require('express');
let Webtask    = require('webtask-tools');
let axios = require('axios');

const accessToken = 'YOUR-ACCESS-TOKEN'; //eg. 32kdajskdgjksak432
const orgName = 'YOUR-ORG-NAME'; //eg. auth0-community

var app = express();

app.set('json spaces', 2); 

app.get('/', function (req, res) {
  let repoCollabs = [];
  let urls = [];

  axios.get(`https://api.github.com/orgs/${orgName}/repos?access_token=${accessToken}`).then((data) => {
    let repos = data.data;

    repos.forEach((repo) => {
      let url = `${repo.contributors_url}?access_token=${accessToken}`;
      urls.push(axios.get(url).catch((err)=>{console.log(err)}));
    });


    axios.all(urls).then(axios.spread((...args) => {
        for (let i = 0; i < args.length; i++) {
            let title = args[i].config.url
            title = title.replace(`https://api.github.com/repos/${orgName}/`, '');
            title = title.replace(`/contributors?access_token=${accessToken}`, '')

            let collaborators = []
            let raw = args[i].data;

            for(let j = 0; j < raw.length; j++){
                collaborators.push(raw[j].html_url);
            }

            let repo = {
                repo: title,
                collaborators: collaborators
            }
            repoCollabs.push(repo);
        }
        res.json(repoCollabs);
    }))
  }).catch((err)=>{
    console.log(err);
  });
});

module.exports = Webtask.fromExpress(app);
