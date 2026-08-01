/**
 * @typedef {object} ImageSource
 * @property {string} url
 * @property {number} width
 * @property {number} height
 * @property {string} variant
 */

/**
 * Gameplay-only image shape returned by session and guess responses.
 * @typedef {object} GameImage
 * @property {string} id
 * @property {number=} width
 * @property {number=} height
 * @property {number=} aspectRatio
 * @property {string|null=} placeholder
 * @property {string|null=} fallbackUrl
 * @property {string|null=} url
 * @property {{jpeg?: ImageSource[], webp?: ImageSource[]}=} sources
 */

const isValidSource = (source) =>
  Boolean(
    source &&
      typeof source.url === "string" &&
      source.url.trim() &&
      Number.isFinite(source.width) &&
      source.width > 0
  )

export const validSources = (sources) =>
  [
    // Manifests are ordered from smallest to largest canonical variant. If an
    // old or malformed manifest repeats a width, the last candidate wins.
    ...new Map(
      (Array.isArray(sources) ? sources : [])
        .filter(isValidSource)
        .map((source) => [source.width, source])
    ).values(),
  ].sort((a, b) => a.width - b.width)

export const buildSrcSet = (sources) =>
  validSources(sources)
    .map(({ url, width }) => `${url} ${width}w`)
    .join(", ")

export const getFallbackUrl = (image) => {
  if (typeof image?.fallbackUrl === "string" && image.fallbackUrl) {
    return image.fallbackUrl
  }
  if (typeof image?.url === "string" && image.url) return image.url

  return validSources(image?.sources?.jpeg).at(-1)?.url || ""
}

export const getImageIdentity = (image) =>
  image?.id || getFallbackUrl(image) || image?.placeholder || "game-image"