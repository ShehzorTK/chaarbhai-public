export const browserData = data => `window.CB_REVIEW_DATA=${JSON.stringify(data)};\n`;
export function updateHtml(html, data) {
  const g = data.google, m = data.meta;
  const description = `What couples say about Chaar Bhai: ${g.rating.toFixed(1)} out of 5 from ${g.count} Google reviews and ${m.recommend}% recommend from ${m.count} Facebook reviews, copied across as written.`;
  html = html.replace(/<meta data-review-description\b[^>]*>/g, tag => tag.replace(/content="[^"]*"/, `content="${description}"`));
  return html.replace(/<a data-proof="(google|meta)"[\s\S]*?<\/a>/g, (tag, platform) => {
    const google = platform === 'google', d = google ? g : m;
    const score = google ? g.rating.toFixed(1) : `${m.recommend}%`;
    const label = google ? `Rated ${score} out of 5 from ${g.count} reviews on Google. Read them on Google.` : `${m.recommend}% recommend, from ${m.count} reviews on Facebook. Read them on Facebook.`;
    tag = tag.replace(/aria-label="[^"]*"/, `aria-label="${label}"`)
      .replace(/(<span class="tb-score"><b>)[^<]*/, `$1${score}`)
      .replace(/Based on \d+ reviews/, `Based on ${d.count} reviews`);
    if (google) tag = tag.replace(/aria-label="[\d.]+ out of 5 stars"/, `aria-label="${score} out of 5 stars"`)
      .replace(/(class="stars-fill" style="width:)[\d.]+%/, `$1${g.rating / 5 * 100}%`);
    return tag;
  });
}
