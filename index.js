const request = require("request-promise");
const moment = require("moment");
const YAML = require("yamljs");
const { stripHtmlTags, getPath } = require("./utils");
const eventLinks = require("./links.json");

const MEETUP_API_ROOT = "https://api.meetup.com";
const GITHUB_API_ROOT = "https://api.github.com";
const GITHUB_REPO = "";
const GITHUB_TOKEN = "";

// create/update data file in github repo
async function createEventFileInRepo(path, data) {
  const url = `${GITHUB_API_ROOT}/repos/${GITHUB_REPO}/contents/${path}`;

  const sha = await getFileSha(path);

  return request(url, {
    headers: {
      "User-Agent": "meetup-register-put",
      Accept: "application/vnd.github.v3+json",
      Authorization: `token ${GITHUB_TOKEN}`
    },
    method: "PUT",
    json: true,
    body: {
      message: "[Lambda] create event file",
      content: Buffer.from(YAML.stringify(data)).toString("base64"),
      sha
    }
  })
    .then(data => console.log(`update ${data.content.name} success`))
    .catch(err => console.error(err.message));
}

// get file sha through github api [GET]
function getFileSha(path) {
  const url = `${GITHUB_API_ROOT}/repos/${GITHUB_REPO}/contents/${path}`;

  return request(url, {
    headers: {
      "User-Agent": "meetup-register-get",
      Accept: "application/vnd.github.v3+json",
      Authorization: `token ${GITHUB_TOKEN}`
    },
    json: true
  })
    .then(data => data.sha)
    .catch(err => null);
}

// get event info through meetup api
async function getEvent(link) {
  const path = getPath(link);
  if (path) {
    const success = async body => {
      const event = JSON.parse(body);
      if (event) {
        const eventStart = moment.utc(event.time);
        const eventEnd = moment.utc(event.time).add(event.duration);
        // outputPath format `_data/events/{year}/{month}/{id}.yml`
        const outputPath = `_data/events/${eventStart.year()}/${eventStart.month() +
          1}/${event.id}.yml`;

        const data = {
          start: eventStart.format(),
          end: eventEnd.format(),
          location: event.venue.name || "",
          title: event.name,
          type: "meetup",
          summary: stripHtmlTags(event.description),
          link: event.link
        };

        await createEventFileInRepo(outputPath, data);
      }
    };

    await request(MEETUP_API_ROOT + "/" + path)
      .then(success)
      .catch(err => console.log(err));
  }
}

async function run() {
  for (const link of eventLinks) {
    await getEvent(link);
  }
}

run();
