import { model } from "@medusajs/framework/utils"
import BlogPost from "./blog-post"

const BlogCategory = model.define("site_blog_category", {
  id: model.id().primaryKey(),
  name: model.text(),
  slug: model.text(),
  description: model.text().nullable(),
  posts: model.hasMany(() => BlogPost, { mappedBy: "category" }),
})

export default BlogCategory
