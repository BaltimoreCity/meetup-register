const https = require("https");
const mkdirp = require("mkdirp");
const moment = require("moment");
const yaml = require("write-yaml");
const { strip_html_tags } = require("./utils");
const meetups = require("./links.json");

const API_ROOT = "https://api.meetup.com/";
const EVENTS_DATA_DIR = "_data/events";
const regex = /(?<=meetup\.com\/)(.*)/g;

function callApi(url) {
  https.get(url, res => {
    let data = "";
    res.on("data", chunk => (data += chunk));

    res.on("end", () => {
      const event = JSON.parse(data);
      // write data to event data file
      if (event) {
        const eventStart = moment.utc(event.time);
        const eventEnd = moment.utc(event.time).add(event.duration);
        const output_dir = `${EVENTS_DATA_DIR}/${eventStart.year()}/${eventStart.month() +
          1}`;

        mkdirp(output_dir, function(err) {
          if (err) console.error(err);
          else {
            const output = {
              start: eventStart.format(),
              end: eventEnd.format(),
              location: event.venue.name || "",
              title: event.name,
              type: "meetup",
              summary: strip_html_tags(event.description),
              link: event.link
            };

            // generate data file as yml
            yaml(`${output_dir}/${event.id}.yml`, output, function(err) {
              if (err) {
                console.error(err);
              }
            });
          }
        });
      }
    });
  });
}

meetups.forEach(e => {
  const match = e.match(regex) || [];

  if (match[0]) {
    callApi(API_ROOT + match[0]);
  }
});
