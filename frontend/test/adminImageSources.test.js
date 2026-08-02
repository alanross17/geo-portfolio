import test from "node:test"
import assert from "node:assert/strict"
import { adminImageSources } from "../src/components/adminImageSources.js"

const image = {
  placeholder: "/images/one/generation-one/placeholder.jpg",
  sources: {
    jpeg: ["thumb", "small", "medium", "large"].map((variant, index) => ({ variant, width: 320 * (index + 1), url: `/images/one/generation-one/${variant}.jpg` })),
    webp: ["thumb", "small", "medium", "large"].map((variant, index) => ({ variant, width: 320 * (index + 1), url: `/images/one/generation-one/${variant}.webp` })),
  },
}

test("admin grid selects only thumb WebP and JPEG sources", () => {
  const sources = adminImageSources(image, "thumb")
  assert.equal(sources.webp.url, "/images/one/generation-one/thumb.webp")
  assert.equal(sources.jpeg.url, "/images/one/generation-one/thumb.jpg")
  assert.equal(sources.placeholder, "/images/one/generation-one/placeholder.jpg")
  assert.doesNotMatch(JSON.stringify(sources), /large|original/)
})

test("admin preview uses the bounded requested variant", () => {
  const sources = adminImageSources(image, "medium")
  assert.equal(sources.webp.variant, "medium")
  assert.equal(sources.jpeg.variant, "medium")
})

test("missing thumbnail sources produce an empty graceful fallback", () => {
  assert.deepEqual(adminImageSources({ sources: {} }, "thumb"), { webp: null, jpeg: null, placeholder: "" })
})