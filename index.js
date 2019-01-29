const request = require("request-promise");
const moment = require("moment");
const YAML = require("yamljs");
const { stripHtmlTags, getPath } = require("./utils");
const dataUrls = require("./data/index.json");

const MEETUP_API_ROOT = "https://api.meetup.com";
const GITHUB_API_ROOT = "https://api.github.com";
const GITHUB_REPO = "";
const GITHUB_TOKEN = "";

// create/update data file in github repo
function createEventFileInRepo(path, data, sha = null) {
  const url = `${GITHUB_API_ROOT}/repos/${GITHUB_REPO}/contents/${path}`;
  const content = Buffer.from(YAML.stringify(data)).toString("base64");
  return request(url, {
    headers: {
      "User-Agent": "meetup-register-update",
      Accept: "application/vnd.github.v3+json",
      Authorization: `token ${GITHUB_TOKEN}`
    },
    method: "PUT",
    json: true,
    body: {
      message: "Update event data file",
      content,
      sha
    }
  })
    .then(data => [null, data])
    .catch(error => [error, null]);
}

// get file sha through github api [GET], required in order to update existing data files
function getFileSha(path) {
  const url = `${GITHUB_API_ROOT}/repos/${GITHUB_REPO}/contents/${path}`;

  return request(url, {
    headers: {
      "User-Agent": "meetup-register-sha",
      Accept: "application/vnd.github.v3+json",
      Authorization: `token ${GITHUB_TOKEN}`
    },
    json: true
  })
    .then(data => [null, data.sha])
    .catch(error => [error, null]);
}

// get event info through meetup api
function getEvent(url) {
  const path = getPath(url);
  return request(MEETUP_API_ROOT + "/" + path)
    .then(body => [null, JSON.parse(body)])
    .catch(error => [error, null]);
}

async function writeEventsFromUrls(urls) {
  for (const url of urls) {
    const [getEventError, data] = await getEvent(url);
    if (getEventError) {
      // write error to data/failure folder
      throw new Error(`Error in get event: ${getEventError}`);
    }

    if (data) {
      const eventStart = moment.utc(data.time),
        eventEnd = moment.utc(data.time).add(data.duration);
      const event = {
        start: eventStart.format(),
        end: eventEnd.format(),
        location: data.venue.name || "",
        title: data.name,
        type: "meetup",
        summary: stripHtmlTags(data.description),
        link: data.link
      };
      const path = `_data/events/${eventStart.year()}/${eventEnd.month() + 1}/${
        data.id
      }.yml`;

      // get sha
      const [shaRequestError, sha] = await getFileSha(path);

      if (shaRequestError) {
        throw new Error(`Error in sha request: ${shaRequestError}`);
      }

      // create/update file
      const [updateRequestError, response] = await createEventFileInRepo(
        path,
        event,
        sha
      );

      if (updateRequestError) {
        throw new Error(`Error in update request: ${updateRequestError}`);
      }

      if (response) {
        console.log(
          `Commit: ${response.commit.message}, sha: ${response.commit.sha}`
        );
      }
    }
  }
}

function start() {
  writeEventsFromUrls(dataUrls);
}

start();
