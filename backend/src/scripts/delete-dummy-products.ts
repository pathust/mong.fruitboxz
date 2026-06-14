import { ExecArgs } from "@medusajs/framework/types";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";
import { deleteProductsWorkflow } from "@medusajs/medusa/core-flows";

export default async function deleteDummyProducts({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const query = container.resolve(ContainerRegistrationKeys.QUERY);

  logger.info("Starting deletion of dummy products...");

  // Fetch all db products
  const { data: dbProducts } = await query.graph({ entity: "product", fields: ["id", "handle"] });

  const idsToDelete = dbProducts
    .filter(p => /^handle-\d+$/.test(p.handle) || /^product-\d+$/.test(p.handle))
    .map(p => p.id);

  if (idsToDelete.length > 0) {
    logger.info(`Found ${idsToDelete.length} dummy products to delete.`);

    // Core flows deleteProductsWorkflow accepts an array of product IDs
    await deleteProductsWorkflow(container).run({
      input: { ids: idsToDelete },
    });

    logger.info("Dummy products deleted successfully.");
  } else {
    logger.info("No dummy products found.");
  }
}
