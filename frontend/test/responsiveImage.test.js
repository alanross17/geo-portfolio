import test from "node:test"
import assert from "node:assert/strict"
import { buildSrcSet, getFallbackUrl, getImageIdentity, validSources } from "../src/components/responsiveImage.js"

test("builds sorted width-descriptor source sets", () => {
  const sources = [
    { url: "/large.webp", width: 1920 },
    { url: "/small.webp", width: 640 },
    { url: "/medium.webp", width: 1280 },
  ]

  assert.equal(
    buildSrcSet(sources),
    "/small.webp 640w, /medium.webp 1280w, /large.webp 1920w"
  )
})

test("ignores malformed entries and empty source collections", () => {
  const malformed = [null, {}, { url: "", width: 320 }, { url: "/bad", width: 0 }]
  assert.deepEqual(validSources(malformed), [])
  assert.equal(buildSrcSet(malformed), "")
  assert.equal(buildSrcSet(undefined), "")
})

test("deduplicates width descriptors and lets the last candidate win", () => {
  const sources = [
    { url: "/thumb.jpg", width: 200, variant: "thumb" },
    { url: "/small.jpg", width: 200, variant: "small" },
    { url: "/medium.jpg", width: 640, variant: "medium" },
  ]

  assert.deepEqual(validSources(sources), [sources[1], sources[2]])
  assert.equal(buildSrcSet(sources), "/small.jpg 200w, /medium.jpg 640w")
})

test("prefers fallbackUrl, then the legacy URL", () => {
  assert.equal(getFallbackUrl({ fallbackUrl: "/fallback.jpg", url: "/legacy.jpg" }), "/fallback.jpg")
  assert.equal(getFallbackUrl({ url: "/legacy.jpg" }), "/legacy.jpg")
})

test("uses the largest valid JPEG when explicit fallbacks are absent", () => {
  const image = { sources: { jpeg: [{ url: "/small.jpg", width: 640 }, { url: "/large.jpg", width: 1920 }] } }
  assert.equal(getFallbackUrl(image), "/large.jpg")
})

test("identity follows the image id so round changes reset presentation state", () => {
  assert.equal(getImageIdentity({ id: "round-two", url: "/same.jpg" }), "round-two")
})