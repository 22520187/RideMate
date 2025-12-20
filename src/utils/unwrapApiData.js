export function unwrapApiData(response) {
  if (!response) return response;
  const root = response.data;

  // Primitive / null payloads
  if (!root || typeof root !== "object") return root;
  const hasData = Object.prototype.hasOwnProperty.call(root, "data");
  const looksLikeApiResponse =
    hasData &&
    (Object.prototype.hasOwnProperty.call(root, "statusCode") ||
      Object.prototype.hasOwnProperty.call(root, "message"));

  return looksLikeApiResponse ? root.data : root;
}