import IngredientsModule from "../modules/ingredients"
import InventoryModule from "@medusajs/inventory"
import { defineLink } from "@medusajs/framework/utils"

export default defineLink(
  {
    linkable: IngredientsModule.linkable.ingredient,
    isList: false,
  },
  {
    linkable: InventoryModule.linkable.inventoryItem,
    isList: false,
  }
)
