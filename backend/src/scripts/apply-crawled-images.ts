import { ExecArgs } from "@medusajs/framework/types";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";
import fs from "fs";
import path from "path";

export default async function applyCrawledImages({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const query = container.resolve(ContainerRegistrationKeys.QUERY);
  const productModuleService = container.resolve(Modules.PRODUCT);

  const imagesFile = path.resolve(process.cwd(), "../scraped_images.json");
  if (!fs.existsSync(imagesFile)) {
    logger.error(`File không tồn tại: ${imagesFile}`);
    return;
  }

  const scrapedImages: Record<string, string> = JSON.parse(fs.readFileSync(imagesFile, "utf8"));

  const handles = Object.keys(scrapedImages);
  if (handles.length === 0) {
    logger.info("Không có ảnh nào được crawl.");
    return;
  }

  const { data: products } = await query.graph({
    entity: "product",
    fields: ["id", "handle", "title"],
    filters: { handle: handles }
  });

  let updated = 0;
  for (const product of products) {
    const imageUrl = scrapedImages[product.handle];
    if (imageUrl) {
      await productModuleService.updateProducts(product.id, {
        thumbnail: imageUrl,
        images: [{ url: imageUrl }]
      });
      logger.info(`Đã cập nhật ảnh cho: ${product.title}`);
      updated++;
    }
  }

  logger.info(`Hoàn tất! Cập nhật thành công ${updated}/${products.length} sản phẩm.`);
}
