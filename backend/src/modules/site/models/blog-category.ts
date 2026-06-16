import { model } from "@medusajs/framework/utils"

const BlogCategory = model.define("site_blog_category", {
  id: model.id().primaryKey(),
  name: model.text(),
  slug: model.text(),
  description: model.text().nullable(),
})

export default BlogCategory
