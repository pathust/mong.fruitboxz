import { ExecArgs } from "@medusajs/framework/types";

export default async function syncRbac({ container }: ExecArgs) {
  const logger = container.resolve("logger") as any;
  const rbacService = container.resolve("rbac") as any;
  
  const groups = [
    "users", "roles", "permissions", "orders", "products", "categories", "customers", 
    "promotions", "inventory", "ingredients", "banners", "media", "blog", 
    "blog-categories", "finance", "content", "chatbot", "search", "settings"
  ];
  const actions = ["read", "create", "edit", "delete"];
  
  const newPermissionData = [];
  for (const g of groups) {
    for (const a of actions) {
      const descAction = {"read": "View", "create": "Create", "edit": "Edit", "delete": "Delete"}[a];
      newPermissionData.push({ name: `${g}.${a}`, description: `${descAction} ${g}` });
    }
  }

  // List existing permissions to find what's missing
  const existingPermissions = await rbacService.listPermissions({}, { take: 1000 });
  const existingNames = new Set(existingPermissions.map((p: any) => p.name));
  
  const toCreate = newPermissionData.filter(p => !existingNames.has(p.name));
  
  if (toCreate.length > 0) {
    logger.info(`Creating ${toCreate.length} missing permissions...`);
    await rbacService.createPermissions(toCreate);
  } else {
    logger.info("No missing permissions to create.");
  }
  
  // Re-fetch all to get their IDs
  const allPermissions = await rbacService.listPermissions({}, { take: 1000 });
  const allPermIds = allPermissions.filter((p: any) => !p.name.startsWith("reviews.")).map((p: any) => p.id);
  
  // Find "Super Admin" role and update it to have ALL permissions
  const roles = await rbacService.listRoles({});
  const adminRole = roles.find((r: any) => r.name === "Super Admin" || r.id === "role_admin");
  
  if (adminRole) {
    logger.info(`Updating Super Admin role to have all ${allPermIds.length} permissions...`);
    await rbacService.updateRoles({
      id: adminRole.id,
      permissions: allPermIds
    });
  }

  // Find "Manager" role and give it the new permissions (promotions, finance, ingredients)
  const managerRole = roles.find((r: any) => r.name === "Quản lý Cửa hàng" || r.name === "Manager" || r.id === "role_manager");
  if (managerRole) {
      // get existing permissions, and add the new ones
      const newNamesToGive = [
          "finance.read", "finance.edit", "finance.create", 
          "promotions.read", "promotions.edit", "promotions.create", 
          "ingredients.read", "ingredients.edit", "ingredients.create"
      ];
      const newIdsToGive = allPermissions.filter((p: any) => newNamesToGive.includes(p.name)).map((p: any) => p.id);
      
      const currentPermIds = managerRole.permissions || [];
      const updatedPermIds = Array.from(new Set([...currentPermIds, ...newIdsToGive]));
      
      logger.info(`Updating Manager role permissions from ${currentPermIds.length} to ${updatedPermIds.length}...`);
      await rbacService.updateRoles({
          id: managerRole.id,
          permissions: updatedPermIds
      });
  }

  // Delete reviews.* permissions if they exist
  const toDelete = existingPermissions.filter((p: any) => p.name.startsWith("reviews."));
  if (toDelete.length > 0) {
    logger.info(`Deleting ${toDelete.length} outdated reviews.* permissions...`);
    await rbacService.deletePermissions(toDelete.map((p: any) => p.id));
  }
  
  logger.info("RBAC sync completed successfully.");
}
