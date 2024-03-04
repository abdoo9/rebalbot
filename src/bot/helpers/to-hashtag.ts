export function toHashtag(text: string) {
  const alphanumericText = text.replaceAll(/\W/g, " "); // Replace non-alphanumeric characters with space
  const underscoreText = alphanumericText.replaceAll(/\s+/g, "_"); // Replace spaces with underscore
  const hashtag = `#${underscoreText}`;
  return hashtag;
}
