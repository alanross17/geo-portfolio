import { validSources } from "./responsiveImage.js"

const VARIANT_ORDER = ["placeholder", "thumb", "small", "medium", "large", "xlarge"]

export const sourceForVariant = (image, format, variant) =>
  validSources(image?.sources?.[format]).find((source) => source.variant === variant) || null

export const adminImageSources = (image, requestedVariant) => {
  const requestedIndex = VARIANT_ORDER.indexOf(requestedVariant)
  const allowedVariants = requestedVariant === "thumb"
    ? ["thumb"]
    : VARIANT_ORDER.slice(1, Math.max(requestedIndex, 1) + 1).reverse()

  const findBest = (format) => {
    for (const variant of allowedVariants) {
      const source = sourceForVariant(image, format, variant)
      if (source) return source
    }
    return null
  }

  return {
    webp: findBest("webp"),
    jpeg: findBest("jpeg"),
    placeholder: typeof image?.placeholder === "string" ? image.placeholder : "",
  }
}