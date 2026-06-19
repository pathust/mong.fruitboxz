import { CreateInventoryLevelInput, ExecArgs } from "@medusajs/framework/types";
import {
  ContainerRegistrationKeys,
  Modules,
  ProductStatus,
} from "@medusajs/framework/utils";
import {
  createWorkflow,
  transform,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";
import {
  createApiKeysWorkflow,
  createInventoryLevelsWorkflow,
  createProductCategoriesWorkflow,
  createProductsWorkflow,
  createRegionsWorkflow,
  createSalesChannelsWorkflow,
  createShippingOptionsWorkflow,
  createShippingProfilesWorkflow,
  createStockLocationsWorkflow,
  createTaxRegionsWorkflow,
  linkSalesChannelsToApiKeyWorkflow,
  linkSalesChannelsToStockLocationWorkflow,
  updateStoresStep,
  updateStoresWorkflow,
} from "@medusajs/medusa/core-flows";
import fs from "fs";
import path from "path";
import { ApiKey } from "../../.medusa/types/query-entry-points";
import { resolveLocalProductImages } from "../lib/product-images";

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

const updateStoreCurrencies = createWorkflow(
  "update-store-currencies",
  (input: {
    supported_currencies: { currency_code: string; is_default?: boolean }[];
    store_id: string;
  }) => {
    const normalizedInput = transform({ input }, (data) => {
      return {
        selector: { id: data.input.store_id },
        update: {
          supported_currencies: data.input.supported_currencies.map(
            (currency) => {
              return {
                currency_code: currency.currency_code,
                is_default: currency.is_default ?? false,
              };
            }
          ),
        },
      };
    });
    const stores = updateStoresStep(normalizedInput);
    return new WorkflowResponse(stores);
  }
);

const dataDir = path.resolve(process.cwd(), "../storefront/src/data");
let categories: any[] = [];
let products: any[] = [];

try {
  categories = JSON.parse(fs.readFileSync(path.join(dataDir, "categories.json"), "utf8"));
  products = JSON.parse(fs.readFileSync(path.join(dataDir, "products.json"), "utf8"));
} catch (err) {
  console.warn("Could not read dynamic data files, using empty arrays.", err);
}

export default async function seedDemoData({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const link = container.resolve(ContainerRegistrationKeys.LINK);
  const query = container.resolve(ContainerRegistrationKeys.QUERY);
  const fulfillmentModuleService = container.resolve(Modules.FULFILLMENT);
  const salesChannelModuleService = container.resolve(Modules.SALES_CHANNEL);
  const storeModuleService = container.resolve(Modules.STORE);

  const countries = ["gb", "de", "dk", "se", "fr", "es", "it"];

  logger.info("Seeding store data...");
  const [store] = await storeModuleService.listStores();
  let defaultSalesChannel = await salesChannelModuleService.listSalesChannels({
    name: "Default Sales Channel",
  });

  if (!defaultSalesChannel.length) {
    const { result: salesChannelResult } = await createSalesChannelsWorkflow(
      container
    ).run({
      input: {
        salesChannelsData: [
          { name: "Default Sales Channel" },
        ],
      },
    });
    defaultSalesChannel = salesChannelResult;
  }

  await updateStoreCurrencies(container).run({
    input: {
      store_id: store.id,
      supported_currencies: [
        { currency_code: "vnd", is_default: true },
        { currency_code: "usd" },
      ],
    },
  });

  await updateStoresWorkflow(container).run({
    input: {
      selector: { id: store.id },
      update: {
        default_sales_channel_id: defaultSalesChannel[0].id,
      },
    },
  });

  logger.info("Seeding region data...");
  let region
  try {
    const result = await createRegionsWorkflow(container).run({
      input: {
        regions: [{
          name: "Europe",
          currency_code: "eur",
          countries,
          payment_providers: ["pp_system_default"],
        }],
      },
    })
    region = result.result[0]
    logger.info("  Created region: Europe")
  } catch (e: unknown) {
    logger.info(`  Region already exists, skipping`)
    const { data: regions } = await query.graph({ entity: "region", fields: ["id"] })
    region = { id: regions[0].id }
  }

  logger.info("Seeding tax regions...");
  try {
    await createTaxRegionsWorkflow(container).run({
      input: countries.map((country_code) => ({
        country_code,
        provider_id: "tp_system",
      })),
    });
  } catch (e: unknown) {
    logger.info("  Tax regions already exist, skipping");
  }

  logger.info("Seeding stock location data...");
  let stockLocation;
  try {
    const { result: stockLocationResult } = await createStockLocationsWorkflow(container).run({
      input: {
        locations: [{
          name: "European Warehouse",
          address: { city: "Copenhagen", country_code: "DK", address_1: "" },
        }],
      },
    });
    stockLocation = stockLocationResult[0];
  } catch (e: unknown) {
    logger.info("  Stock location already exists, skipping");
    const { data: locations } = await query.graph({ entity: "stock_location", fields: ["id"] })
    stockLocation = locations[0]
  }

  await updateStoresWorkflow(container).run({
    input: {
      selector: { id: store.id },
      update: { default_location_id: stockLocation.id },
    },
  });

  await link.create({
    [Modules.STOCK_LOCATION]: { stock_location_id: stockLocation.id },
    [Modules.FULFILLMENT]: { fulfillment_provider_id: "manual_manual" },
  });

  logger.info("Seeding fulfillment data...");
  const shippingProfiles = await fulfillmentModuleService.listShippingProfiles({
    type: "default",
  });
  let shippingProfile = shippingProfiles.length ? shippingProfiles[0] : null;

  if (!shippingProfile) {
    const { result: shippingProfileResult } = await createShippingProfilesWorkflow(container).run({
      input: { data: [{ name: "Default Shipping Profile", type: "default" }] },
    });
    shippingProfile = shippingProfileResult[0];
  }

  let fulfillmentSet;
  try {
    fulfillmentSet = await fulfillmentModuleService.createFulfillmentSets({
      name: "European Warehouse delivery",
      type: "shipping",
      service_zones: [{
        name: "Europe",
        geo_zones: countries.map(code => ({ country_code: code, type: "country" as const })),
      }],
    });
  } catch (e) {
    logger.info("  Fulfillment set already exists, skipping");
    const sets = await fulfillmentModuleService.listFulfillmentSets({ name: "European Warehouse delivery" });
    fulfillmentSet = sets[0];
  }

  await link.create({
    [Modules.STOCK_LOCATION]: { stock_location_id: stockLocation.id },
    [Modules.FULFILLMENT]: { fulfillment_set_id: fulfillmentSet.id },
  });

  await createShippingOptionsWorkflow(container).run({
    input: [
      {
        name: "Standard Shipping",
        price_type: "flat",
        provider_id: "manual_manual",
        service_zone_id: fulfillmentSet.service_zones[0].id,
        shipping_profile_id: shippingProfile.id,
        type: { label: "Standard", description: "Ship in 2-3 days.", code: "standard" },
        prices: [
          { currency_code: "usd", amount: 10 },
          { currency_code: "eur", amount: 10 },
          { region_id: region.id, amount: 10 },
        ],
        rules: [
          { attribute: "enabled_in_store", value: "true", operator: "eq" },
          { attribute: "is_return", value: "false", operator: "eq" },
        ],
      },
    ],
  });

  await linkSalesChannelsToStockLocationWorkflow(container).run({
    input: { id: stockLocation.id, add: [defaultSalesChannel[0].id] },
  });

  logger.info("Seeding publishable API key data...");
  let publishableApiKey: ApiKey | null = null;
  const { data } = await query.graph({
    entity: "api_key",
    fields: ["id"],
    filters: { type: "publishable" },
  });
  publishableApiKey = data?.[0];

  if (!publishableApiKey) {
    const { result: [publishableApiKeyResult] } = await createApiKeysWorkflow(container).run({
      input: { api_keys: [{ title: "Webshop", type: "publishable", created_by: "" }] },
    });
    publishableApiKey = publishableApiKeyResult as ApiKey;
  }

  await linkSalesChannelsToApiKeyWorkflow(container).run({
    input: { id: publishableApiKey.id, add: [defaultSalesChannel[0].id] },
  });

  logger.info("Seeding product data...");
  const { result: categoryResult } = await createProductCategoriesWorkflow(container).run({
    input: {
      product_categories: categories.map(cat => ({
        name: cat.name || cat.slug,
        handle: cat.slug,
        is_active: true,
      })),
    },
  });

  const parsedProducts = products.map((p, idx) => {
    const cleanTitle = p.title.split("-")[0].replace(/(Box|Hộp)\s+/g, "").trim().substring(0, 100) || `Product ${idx}`;
    const sourceCat = categories.find((c: any) => c.name === p.category);
    const catSlug = sourceCat ? sourceCat.slug : null;
    const category = categoryResult.find(c => c.handle === catSlug) || categoryResult[0];

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

    const imagesToAssign = resolveLocalProductImages(p).map((url) => ({ url }));

function slugify(str: string) {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

    return {
      title: cleanTitle,
      handle: p.handle || slugify(cleanTitle) || `handle-${idx}`,
      description: cleanTitle,
      weight: 500,
      status: ProductStatus.PUBLISHED,
      shipping_profile_id: shippingProfile.id,
      thumbnail: imagesToAssign[0]?.url,
      images: imagesToAssign,
      category_ids: category ? [category.id] : [],
      options: [{ title: "Size", values: mappedVariants.map((v: any) => v.title) }],
      variants: mappedVariants,
      sales_channels: [{ id: defaultSalesChannel[0].id }],
    };
  });

  // Create products in chunks
  const productChunkSize = 20;
  for (let i = 0; i < parsedProducts.length; i += productChunkSize) {
    const chunk = parsedProducts.slice(i, i + productChunkSize);
    logger.info(`Creating products chunk ${i / productChunkSize + 1} of ${Math.ceil(parsedProducts.length / productChunkSize)}...`);
    try {
      await withTimeout(
        createProductsWorkflow(container).run({ input: { products: chunk } }),
        30000,
        "createProductsWorkflow chunk timeout"
      );
    } catch (e: unknown) {
      logger.error(`Failed to create products chunk: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  logger.info("Seeding RBAC (roles, permissions, users)...");
  const rbacService = container.resolve("rbac") as any
  const authModuleService = container.resolve("auth") as any

  // Create permissions
  const permissionData = [
    { name: "users.list", description: "List users" },
    { name: "users.create", description: "Create users" },
    { name: "users.edit", description: "Edit users" },
    { name: "users.delete", description: "Delete users" },
    { name: "roles.list", description: "List roles" },
    { name: "roles.create", description: "Create roles" },
    { name: "roles.edit", description: "Edit roles" },
    { name: "roles.delete", description: "Delete roles" },
    { name: "permissions.list", description: "List permissions" },
    { name: "permissions.create", description: "Create permissions" },
    { name: "permissions.edit", description: "Edit permissions" },
    { name: "permissions.delete", description: "Delete permissions" },
    { name: "orders.read", description: "View orders" },
    { name: "orders.edit", description: "Edit orders" },
    { name: "orders.create", description: "Create orders" },
    { name: "orders.delete", description: "Delete orders" },
    { name: "products.read", description: "View products" },
    { name: "products.edit", description: "Edit products" },
    { name: "products.create", description: "Create products" },
    { name: "products.delete", description: "Delete products" },
    { name: "inventory.read", description: "View inventory" },
    { name: "inventory.edit", description: "Edit inventory" },
    { name: "customers.read", description: "View customers" },
    { name: "customers.edit", description: "Edit customers" },
    { name: "settings.read", description: "View settings" },
    { name: "settings.edit", description: "Edit settings" },
  ]
  const permissions = await rbacService.createPermissions(permissionData)
  const permMap: Record<string, string> = {}
  for (const p of permissions) {
    permMap[p.name] = p.id
  }

  // Create roles with permissions
  const roles = await rbacService.createRoles([
    {
      name: "Super Admin",
      description: "Full access to all features",
      is_default: false,
      permissions: Object.values(permMap),
    },
    {
      name: "Manager",
      description: "Can manage orders, products, inventory, customers",
      is_default: true,
      permissions: [
        permMap["orders.read"], permMap["orders.edit"], permMap["orders.create"],
        permMap["products.read"], permMap["products.edit"], permMap["products.create"],
        permMap["inventory.read"], permMap["inventory.edit"],
        permMap["customers.read"], permMap["customers.edit"],
      ],
    },
    {
      name: "Staff",
      description: "Can view orders and manage basic operations",
      permissions: [
        permMap["orders.read"], permMap["orders.edit"], permMap["orders.create"],
        permMap["products.read"],
        permMap["inventory.read"],
        permMap["customers.read"],
      ],
    },
  ])

  // Create users
  const userService = container.resolve("user") as any
  const users = await Promise.all([
    userService.createUsers({ email: "admin@mongfruitbox.com", first_name: "Admin", last_name: "" }),
    userService.createUsers({ email: "pat@mongfruitbox.com", first_name: "Pat", last_name: "" }),
    userService.createUsers({ email: "pad@mongfruitbox.com", first_name: "Pad", last_name: "" }),
  ])

  // Register auth identities and assign roles
  const userPasswords = [
    { email: "admin@mongfruitbox.com", password: "admin123", roleIdx: 0 },
    { email: "pat@mongfruitbox.com", password: "pat123", roleIdx: 1 },
    { email: "pad@mongfruitbox.com", password: "pad123", roleIdx: 2 },
  ]

  for (let i = 0; i < users.length; i++) {
    const user = users[i]
    const { email, password, roleIdx } = userPasswords[i]

    // Register auth identity (creates provider identity with hashed password)
    let authResult
    try {
      authResult = await authModuleService.register("emailpass", {
        body: { email, password },
      })
    } catch (err: unknown) {
      logger.warn(`  Auth registration for ${email}: ${err instanceof Error ? err.message : String(err)}`)
    }

    // Assign role via metadata
    await userService.updateUsers({
      id: user.id,
      metadata: { roles: [roles[roleIdx].id] },
    })

    logger.info(`  Created user: ${email} (${users[i].first_name}) with role: ${roles[roleIdx].name}`)
  }

  logger.info("Seeding inventory levels.");
  const { data: inventoryItems } = await query.graph({
    entity: "inventory_item",
    fields: ["id"],
  });
  const inventoryLevels: CreateInventoryLevelInput[] = inventoryItems.map(item => ({
    location_id: stockLocation.id,
    stocked_quantity: 1000,
    inventory_item_id: item.id,
  }));
  await createInventoryLevelsWorkflow(container).run({
    input: { inventory_levels: inventoryLevels },
  });

  logger.info("Finished seeding.");
}
