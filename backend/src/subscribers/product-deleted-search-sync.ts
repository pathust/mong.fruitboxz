import { removeProductDocument } from "../lib/search"

export default async function productDeletedSearchSync({ event }: any) {
  const productId = event.data.id
  if (!productId) return
  await removeProductDocument(productId).catch(() => null)
}

export const config = {
  event: "product.deleted",
}
