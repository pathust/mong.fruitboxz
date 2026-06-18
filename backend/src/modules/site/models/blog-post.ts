import { model } from "@medusajs/framework/utils"
import BlogCategory from "./blog-category"

const BlogPost = model.define("site_blog_post", {
  id: model.id().primaryKey(),
  title: model.text(),
  slug: model.text(),
  excerpt: model.text().nullable(),
  content: model.text().nullable(),
  image: model.text().nullable(),
  author: model.text().nullable(),
  category: model.belongsTo(() => BlogCategory).nullable(),
  published: model.boolean().default(true),
  published_at: model.dateTime().nullable(),
})

export default BlogPost
