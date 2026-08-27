import { CreateInventoryLevelInput, ExecArgs } from "@medusajs/framework/types";
import { ContainerRegistrationKeys, Modules, ProductStatus } from "@medusajs/framework/utils";
import {
  createInventoryLevelsWorkflow,
  createProductCategoriesWorkflow,
  createProductsWorkflow,
  createShippingProfilesWorkflow,
} from "@medusajs/medusa/core-flows";
import fs from "fs";
import path from "path";
import { resolveLocalProductImages } from "../lib/product-images";

const dataDir = path.resolve(process.cwd(), "../frontend/src/data");
const categories: Record<string, any>[] = JSON.parse(
  fs.readFileSync(path.join(dataDir, "categories.json"), "utf8")
);
const products: Record<string, any>[] = JSON.parse(
  fs.readFileSync(path.join(dataDir, "products.json"), "utf8")
);

const DIACRITICS_REGEX = new RegExp("[\\u0300-\\u036f]", "g");

function slugify(str: string) {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(DIACRITICS_REGEX, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default async function seedProducts({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const query = container.resolve(ContainerRegistrationKeys.QUERY);
  const salesChannelModuleService = container.resolve(Modules.SALES_CHANNEL) as Record<string, any>;
  const fulfillmentModuleService = container.resolve(Modules.FULFILLMENT) as Record<string, any>;
  const stockLocationModuleService = container.resolve(Modules.STOCK_LOCATION) as Record<string, any>;

  const defaultSalesChannel = await salesChannelModuleService.listSalesChannels({ name: "Default Sales Channel" });
  if (!defaultSalesChannel.length) {
    throw new Error("Default sales channel not found. Run `npm run seed` first.");
  }

  const stockLocations = await stockLocationModuleService.listStockLocations({});
  if (!stockLocations.length) {
    throw new Error("No stock location found. Run `npm run seed` first.");
  }
  const stockLocation = stockLocations[0];

  const shippingProfiles = await fulfillmentModuleService.listShippingProfiles({ type: "default" });
  let shippingProfile = shippingProfiles.length ? shippingProfiles[0] : null;
  if (!shippingProfile) {
    const { result } = await createShippingProfilesWorkflow(container).run({
      input: { data: [{ name: "Default Shipping Profile", type: "default" }] },
    });
    shippingProfile = result[0];
  }

  const { data: allCategories } = await query.graph({
    entity: "product_category",
    fields: ["id", "handle"],
  });
  const existingHandles = new Set(allCategories.map((c: Record<string, any>) => c.handle));
  const newCategories = categories.filter((c) => !existingHandles.has(c.slug));

  logger.info(`Seeding ${newCategories.length} product categories...`);
  let categoryResult = allCategories;
  if (newCategories.length) {
    const { result } = await createProductCategoriesWorkflow(container).run({
      input: {
        product_categories: newCategories.map((cat) => ({
          name: cat.name || cat.slug,
          handle: cat.slug,
          is_active: true,
        })),
      },
    });
    categoryResult = [...allCategories, ...result];
  }

  const { data: allProducts } = await query.graph({
    entity: "product",
    fields: ["id", "handle"],
  });
  const existingProductHandles = new Set(allProducts.map((p: Record<string, any>) => p.handle));

  const parsedProducts = products
    .map((p, idx) => {
      const cleanTitle = p.title.split("-")[0].replace(/(Box|Hộp)\s+/g, "").trim().substring(0, 100) || `Product ${idx}`;
      const handle = p.handle || slugify(cleanTitle) || `handle-${idx}`;
      return { p, idx, cleanTitle, handle };
    })
    .filter(({ handle }) => !existingProductHandles.has(handle))
    .map(({ p, idx, cleanTitle, handle }) => {
      const sourceCat = categories.find((c) => c.name === p.category);
      const catSlug = sourceCat ? sourceCat.slug : null;
      const category = categoryResult.find((c: Record<string, any>) => c.handle === catSlug) || categoryResult[0];

      const seenLabels = new Set();
      const mappedVariants = (p.variants || [])
        .filter((v: Record<string, any>) => {
          const label = v.label || "Standard";
          if (seenLabels.has(label)) return false;
          seenLabels.add(label);
          return true;
        })
        .map((v: Record<string, any>, vIdx: number) => {
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

      const imagesToAssign = resolveLocalProductImages(p).map((url) => ({ url }));

      return {
        title: cleanTitle,
        handle,
        description: cleanTitle,
        weight: 500,
        status: ProductStatus.PUBLISHED,
        shipping_profile_id: shippingProfile.id,
        thumbnail: imagesToAssign[0]?.url,
        images: imagesToAssign,
        category_ids: category ? [category.id] : [],
        options: [{ title: "Size", values: mappedVariants.map((v: Record<string, any>) => v.title) }],
        variants: mappedVariants,
        sales_channels: [{ id: defaultSalesChannel[0].id }],
      };
    });

  logger.info(`Seeding ${parsedProducts.length} products...`);
  const productChunkSize = 20;
  for (let i = 0; i < parsedProducts.length; i += productChunkSize) {
    const chunk = parsedProducts.slice(i, i + productChunkSize);
    logger.info(`Creating products chunk ${i / productChunkSize + 1} of ${Math.ceil(parsedProducts.length / productChunkSize)}...`);
    try {
      await createProductsWorkflow(container).run({ input: { products: chunk } });
    } catch (e: unknown) {
      logger.error(`Failed to create products chunk: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  logger.info("Seeding inventory levels for new products...");
  const { data: inventoryItems } = await query.graph({
    entity: "inventory_item",
    fields: ["id", "location_levels.location_id"],
  });
  const missingLevels = inventoryItems.filter(
    (item: Record<string, any>) =>
      !(item.location_levels || []).some((l: Record<string, any>) => l.location_id === stockLocation.id)
  );
  if (missingLevels.length) {
    const inventoryLevels: CreateInventoryLevelInput[] = missingLevels.map((item: Record<string, any>) => ({
      location_id: stockLocation.id,
      stocked_quantity: 1000,
      inventory_item_id: item.id,
    }));
    await createInventoryLevelsWorkflow(container).run({
      input: { inventory_levels: inventoryLevels },
    });
  }

  logger.info("Finished seeding products.");
}
