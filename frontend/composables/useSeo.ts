import { useHead } from "#imports";
export function useSeo({ title, description, image, url, jsonld }: any) {
  useHead({
    title,
    meta: [
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:image", content: image },
      { property: "og:url", content: url },
    ],
    script: jsonld
      ? [
          {
            type: "application/ld+json",
            innerHTML: JSON.stringify(jsonld),
          },
        ]
      : [],
  });
}
