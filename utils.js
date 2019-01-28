module.exports.stripHtmlTags = function(str) {
  if (str === null || str === "") return false;
  else str = str.toString();
  return str.replace(/<[^>]*>/g, "");
};

module.exports.getPath = function(str) {
  const regex = /(?<=meetup\.com\/)(.*)/g;
  const match = str.match(regex) || [];

  return match ? match[0] : null;
};
