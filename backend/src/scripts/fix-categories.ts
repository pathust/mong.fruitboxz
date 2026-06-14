import { ExecArgs } from "@medusajs/framework/types";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";
import { updateProductsWorkflow } from "@medusajs/medusa/core-flows";
import fs from "fs";
import path from "path";

const dataDir = path.resolve(process.cwd(), "../frontend/src/data");

export default async function fixCategories({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const query = container.resolve(ContainerRegistrationKeys.QUERY);

  logger.info("Starting category fix...");

  const categories = JSON.parse(fs.readFileSync(path.join(dataDir, "categories.json"), "utf8"));

  // Fetch db categories
  const { data: dbCategories } = await query.graph({ entity: "product_category", fields: ["id", "handle", "name"] });

  // Fetch all db products
  const { data: dbProducts } = await query.graph({ entity: "product", fields: ["id", "handle"] });

  const productsToUpdate: any[] = [];

  for (const cat of categories) {
    const dbCat = dbCategories.find(c => c.handle === cat.slug);
    if (!dbCat) continue;

    const productIds = cat.productIds || [];
    for (const pid of productIds) {
      if (pid === "special-orders") continue;
      const dbProd = dbProducts.find(p => p.handle === pid);
      if (dbProd) {
        productsToUpdate.push({
          id: dbProd.id,
          category_ids: [dbCat.id]
        });
      }
    }
  }

  if (productsToUpdate.length > 0) {
    logger.info(`Updating categories for ${productsToUpdate.length} products...`);
    const chunkSize = 50;
    for (let i = 0; i < productsToUpdate.length; i += chunkSize) {
      const chunk = productsToUpdate.slice(i, i + chunkSize);
      logger.info(`Updating chunk ${Math.floor(i / chunkSize) + 1} of ${Math.ceil(productsToUpdate.length / chunkSize)}`);
      await updateProductsWorkflow(container).run({
        input: { products: chunk },
      });
    }
    logger.info("Category fix completed successfully.");
  } else {
    logger.info("No products to update.");
  }
}
