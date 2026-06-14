import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

const ingredientLibrary: Record<string, string[]> = {
  default: ["Trai cay tuoi theo mua", "Muoi hong", "Sot chanh day nhe"],
  "hop-trai-cay-cat-san": ["Tao", "Nho", "Cam", "Dua", "Dua luoi"],
  "hoa-qua-dam": ["Trai cay tuoi", "Sua chua", "Yen mach", "Hat chia"],
  "sua-chua-hy-lap": ["Sua chua Hy Lap", "Trai cay", "Mat ong"],
  "nuoc-ep-trai-cay": ["Nuoc ep nguyen chat", "Khong duong tinh luyen"],
}

function normalize(raw?: string): string {
  return (raw || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
}

function inferIngredients(handle: string): string[] {
  const h = normalize(handle)
  if (h.includes("cat-san") || h.includes("4-ngan") || h.includes("6-ngan") || h.includes("9-ngan")) {
    return ingredientLibrary["hop-trai-cay-cat-san"]
  }
  if (h.includes("dam")) return ingredientLibrary["hoa-qua-dam"]
  if (h.includes("sua-chua")) return ingredientLibrary["sua-chua-hy-lap"]
  if (h.includes("nuoc-ep")) return ingredientLibrary["nuoc-ep-trai-cay"]
  return ingredientLibrary.default
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const handle = (req.params.handle || "").toString()
  if (!handle) return res.status(400).json({ message: "Missing product handle" })

  const ingredients = inferIngredients(handle)
  res.json({ handle, ingredients })
}
