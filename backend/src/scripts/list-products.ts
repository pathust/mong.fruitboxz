import { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

export default async function listProducts({ container }: ExecArgs) {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const { data } = await query.graph({
    entity: "product",
    fields: ["id", "handle", "title", "thumbnail"],
    pagination: { take: 50 },
  })
  for (const p of data) {
    console.log(`${p.title} | ${p.handle} | ${p.thumbnail || "N/A"}`)
  }
  console.log(`Total: ${data.length} products`)
}
