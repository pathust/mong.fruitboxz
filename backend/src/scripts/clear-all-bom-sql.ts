import { MedusaContainer } from "@medusajs/framework/types"

export default async function run({ container }: { container: MedusaContainer }) {
  const pgConnection = container.resolve("pgConnection")
  
  const res = await pgConnection.raw("SELECT table_name FROM information_schema.tables WHERE table_name LIKE '%variant%inventory%'")
  console.log(res.rows)
  
  if (res.rows.length > 0) {
      const tableName = res.rows[0].table_name
      const countRes = await pgConnection.raw(`SELECT COUNT(*) as c FROM ${tableName}`)
      console.log(`Current links in ${tableName}:`, countRes.rows[0].c)
      
      await pgConnection.raw(`DELETE FROM ${tableName}`)
      console.log(`Deleted all links from ${tableName}`)
  } else {
      console.log("No table found")
  }
}
