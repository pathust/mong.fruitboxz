import { Client } from "pg";
import { resolve } from "path";
import { config } from "dotenv";

config({ path: resolve(process.cwd(), ".env") });

function parseVariantQuantity(variantTitle: string, productTitle: string): { quantity: number; unit: string } {
  const match = variantTitle.match(/(\d+)gr/i);
  if (match) {
    return { quantity: parseInt(match[1]), unit: 'Gram' };
  }
  
  const productMatch = productTitle.match(/(\d+)gr/i);
  if (productMatch) {
    return { quantity: parseInt(productMatch[1]), unit: 'Gram' };
  }
  
  if (productTitle.match(/1kg/i) || variantTitle.match(/1kg/i)) {
    return { quantity: 1000, unit: 'Gram' };
  }

  if (productTitle.match(/1,5kg/i) || variantTitle.match(/1,5kg/i)) {
    return { quantity: 1500, unit: 'Gram' };
  }

  if (productTitle.match(/nước ép|sữa chua|giỏ|hộp quà|quà|set/i)) {
    return { quantity: 1, unit: 'Phần' };
  }
  
  return { quantity: 500, unit: 'Gram' };
}

function getBaseIngredients(productTitle: string): { name: string, unit: string, isMain: boolean }[] {
  const ingredients: { name: string, unit: string, isMain: boolean }[] = [];
  
  let baseName = productTitle.split('(')[0].trim();
  baseName = baseName.replace(/hộp \d+(gr|kg)/i, '').trim();
  baseName = baseName.replace(/ \d+(gr|kg)/i, '').trim();
  baseName = baseName.replace(/Hết hàng.*/i, '').trim();
  baseName = baseName.replace(/ \+ /g, ' và ').trim();
  baseName = baseName.replace(/ - /g, ' ').trim();

  if (baseName.match(/nước ép/i)) {
    const fruit = baseName.replace(/nước ép/i, '').replace(/300ml/i, '').trim();
    ingredients.push({ name: fruit || 'Trái cây tươi', unit: 'Gram', isMain: true });
    ingredients.push({ name: 'Chai nhựa PET 300ml', unit: 'Cái', isMain: false });
    return ingredients;
  }
  
  if (baseName.match(/sữa chua hy lạp/i)) {
    ingredients.push({ name: 'Sữa chua Hy Lạp', unit: 'Hũ', isMain: true });
    const fruitMatch = productTitle.match(/\((.*?)\)/);
    if (fruitMatch && !fruitMatch[1].match(/kèm/i)) {
      const fruits = fruitMatch[1].split('+').map(f => f.trim());
      for (const f of fruits) {
        ingredients.push({ name: f, unit: 'Gram', isMain: false });
      }
    } else {
        ingredients.push({ name: 'Trái cây tươi mix', unit: 'Gram', isMain: false });
    }
    return ingredients;
  }

  ingredients.push({ name: baseName, unit: 'Gram', isMain: true });

  const lowerTitle = productTitle.toLowerCase();
  
  if (lowerTitle.includes('kèm sốt') || lowerTitle.includes('kèm sữa') || lowerTitle.includes('muối omai')) {
    ingredients.push({ name: 'Sốt chấm đặc biệt', unit: 'Phần', isMain: false });
    ingredients.push({ name: 'Muối ô mai', unit: 'Phần', isMain: false });
  }
  if (lowerTitle.includes('bò khô')) {
    ingredients.push({ name: 'Bò khô', unit: 'Phần', isMain: false });
  }
  if (lowerTitle.includes('kẹp sữa chua')) {
    ingredients.push({ name: 'Sữa chua sấy lạnh', unit: 'Viên', isMain: false });
  }
  if (lowerTitle.includes('socola')) {
    ingredients.push({ name: 'Sốt Socola', unit: 'Phần', isMain: false });
  }
  
  if (lowerTitle.includes('dầm') || lowerTitle.includes('hộp') || lowerTitle.includes('cắt sẵn') || lowerTitle.includes('mix')) {
    if (!baseName.match(/quà|giỏ/i)) {
        ingredients.push({ name: 'Khay nhựa PET đựng trái cây', unit: 'Cái', isMain: false });
        ingredients.push({ name: 'Nĩa nhựa', unit: 'Cái', isMain: false });
    }
  }

  return ingredients;
}

async function run() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  await client.connect();
  console.log("Database connected.");

  const res = await client.query(`
    SELECT p.id as product_id, p.title as product_title, v.id as variant_id, v.title as variant_title 
    FROM product p 
    JOIN product_variant v ON p.id = v.product_id
  `);
  
  const products = res.rows;
  console.log("Found " + products.length + " product variants.");

  await client.query("TRUNCATE TABLE recipe_item RESTART IDENTITY CASCADE;");
  await client.query("TRUNCATE TABLE ingredient CASCADE;");

  const createdIngredients = new Map<string, string>();

  for (const p of products) {
    const ingList = getBaseIngredients(p.product_title);
    const qtyData = parseVariantQuantity(p.variant_title, p.product_title);

    for (const ing of ingList) {
      let ingId = createdIngredients.get(ing.name);
      
      if (!ingId) {
        const existing = await client.query("SELECT id FROM ingredient WHERE name = $1 LIMIT 1", [ing.name]);
        if (existing.rows.length > 0) {
          ingId = existing.rows[0].id;
        } else {
          const newId = 'ing_' + Math.random().toString(36).substring(2, 10);
          await client.query(`
            INSERT INTO ingredient (id, name, sku, stock_quantity, unit, cost_price, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
            RETURNING id
          `, [newId, ing.name, 'SKU-' + newId, 50000, ing.unit, 0]);
          ingId = newId;
        }
        createdIngredients.set(ing.name, ingId);
      }

      let finalQty = 1;
      if (ing.isMain && ing.unit === 'Gram') {
        finalQty = qtyData.quantity;
      }

      const recId = 'rec_' + Math.random().toString(36).substring(2, 10);
      await client.query(`
        INSERT INTO recipe_item (id, variant_id, ingredient_id, quantity, created_at, updated_at)
        VALUES ($1, $2, $3, $4, NOW(), NOW())
      `, [recId, p.variant_id, ingId, finalQty]);
    }
  }

  console.log("Migration completed successfully! Created " + createdIngredients.size + " unique ingredients.");
  await client.end();
}

run().catch(console.error);
