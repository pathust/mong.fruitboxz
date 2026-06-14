import { ExecArgs } from "@medusajs/framework/types";
import { ContainerRegistrationKeys, Modules, ProductStatus } from "@medusajs/framework/utils";
import { createProductsWorkflow, createProductCategoriesWorkflow, uploadFilesWorkflow } from "@medusajs/medusa/core-flows";
import fs from "fs";
import path from "path";

const dataDir = path.resolve(process.cwd(), "../frontend/src/data");
const imageDir = path.resolve(process.cwd(), "../frontend/public");

const withTimeout = <T>(promise: Promise<T>, ms: number, message: string): Promise<T> => {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`Timeout: ${message}`)), ms);
    promise
      .then((res) => {
        clearTimeout(timer);
        resolve(res);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
};

export default async function importProducts({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const query = container.resolve(ContainerRegistrationKeys.QUERY);
  const fulfillmentModuleService = container.resolve(Modules.FULFILLMENT);
  const salesChannelModuleService = container.resolve(Modules.SALES_CHANNEL);

  logger.info("Starting product import...");

  const products = JSON.parse(fs.readFileSync(path.join(dataDir, "products.json"), "utf8"));
  const categories = JSON.parse(fs.readFileSync(path.join(dataDir, "categories.json"), "utf8"));

  const defaultSalesChannel = await salesChannelModuleService.listSalesChannels({ name: "Default Sales Channel" });
  if (!defaultSalesChannel.length) {
    logger.error("Default Sales Channel not found!");
    return;
  }

  const shippingProfiles = await fulfillmentModuleService.listShippingProfiles({ type: "default" });
  if (!shippingProfiles.length) {
    logger.error("Default shipping profile not found!");
    return;
  }
  const shippingProfile = shippingProfiles[0];

  // 1. Fetch DB categories
  let { data: dbCategories } = (await query.graph({ entity: "product_category", fields: ["id", "handle", "name"] })) as any;

  // Create missing categories
  const missingCategories = categories.filter((cat: any) => !dbCategories.find(c => c.handle === cat.slug));
  if (missingCategories.length > 0) {
    logger.info(`Creating ${missingCategories.length} missing categories...`);
    const { result } = await createProductCategoriesWorkflow(container).run({
      input: {
        product_categories: missingCategories.map((cat: any) => ({
          name: cat.name || cat.slug,
          handle: cat.slug,
          is_active: true,
        })),
      },
    });
    dbCategories = [...dbCategories, ...result];
  }

  // 2. Fetch existing products to avoid duplicates
  const { data: dbProducts } = await query.graph({ entity: "product", fields: ["id", "handle"] });
  const existingHandles = new Set(dbProducts.map(p => p.handle));

  // 3. We will just use the URLs directly from products.json
  const uploadedImageMap = new Map<string, string>();
  for (const p of products) {
    if (p.images) {
      for (const img of p.images) {
        if (typeof img === 'string') {
          uploadedImageMap.set(img, img);
        }
      }
    }
  }

  // 4. Prepare products
  const parsedProducts: any[] = [];

  for (let idx = 0; idx < products.length; idx++) {
    const p = products[idx];
    const handle = p.handle || p.id || `handle-${idx}`;
    if (existingHandles.has(handle)) continue;

    const cleanTitle = p.title.split("-")[0].replace(/(Box|Hộp)\s+/g, "").trim().substring(0, 100) || `Product ${idx}`;

    // Map category
    const sourceCat = categories.find((c: any) => c.name === p.category);
    const catSlug = sourceCat ? sourceCat.slug : null;
    const dbCategory = dbCategories.find(c => c.handle === catSlug) || dbCategories[0];

    // Deduplicate variants
    const seenLabels = new Set();
    const mappedVariants = (p.variants || []).filter((v: any) => {
      const label = v.label || "Standard";
      if (seenLabels.has(label)) return false;
      seenLabels.add(label);
      return true;
    }).map((v: any, vIdx: number) => {
      const price = v.price || 100000;
      return {
        title: v.label || "Standard",
        sku: `${p.id}-${vIdx}`,
        options: { Size: v.label || "Standard" },
        prices: [{ amount: price, currency_code: "vnd" }],
      };
    });

    if (mappedVariants.length === 0) {
      mappedVariants.push({
        title: "Standard",
        sku: p.id || `sku-${idx}`,
        options: { Size: "Standard" },
        prices: [{ amount: p.price || 100000, currency_code: "vnd" }],
      });
    }

    const imagesToAssign = p.images
      ?.map((img: string) => uploadedImageMap.get(img) ? { url: uploadedImageMap.get(img)! } : null)
      .filter(Boolean) || [];

    parsedProducts.push({
      title: cleanTitle,
      handle,
      description: cleanTitle, // Need more detailed description if available, p.title has lots of text, maybe we can use it
      weight: 500,
      status: ProductStatus.PUBLISHED,
      shipping_profile_id: shippingProfile.id,
      images: imagesToAssign,
      category_ids: dbCategory ? [dbCategory.id] : [],
      options: [{ title: "Size", values: mappedVariants.map((v: any) => v.title) }],
      variants: mappedVariants,
      sales_channels: [{ id: defaultSalesChannel[0].id }],
    });
  }

  // 5. Insert products in chunks
  const productChunkSize = 10;
  let successCount = 0;
  for (let i = 0; i < parsedProducts.length; i += productChunkSize) {
    const chunk = parsedProducts.slice(i, i + productChunkSize);
    logger.info(`Creating products chunk ${Math.floor(i / productChunkSize) + 1} of ${Math.ceil(parsedProducts.length / productChunkSize)}...`);
    try {
      await withTimeout(
        createProductsWorkflow(container).run({ input: { products: chunk } }),
        30000,
        "createProductsWorkflow chunk timeout"
      );
      successCount += chunk.length;
    } catch (e: any) {
      logger.error(`Failed to create products chunk: ${e.message}`);
    }
  }

  logger.info(`Finished importing ${successCount} products.`);
}
