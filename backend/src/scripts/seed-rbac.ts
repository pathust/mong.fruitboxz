import { ExecArgs } from "@medusajs/framework/types";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";

export default async function seedRBAC({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const query = container.resolve(ContainerRegistrationKeys.QUERY);
  const rbacService = container.resolve("rbac") as any
  const userService = container.resolve("user") as any
  const authModuleService = container.resolve("auth") as any

  logger.info("Seeding RBAC (roles, permissions, users)...");

  // create permissions
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
    { name: "orders.view", description: "View orders" },
    { name: "orders.edit", description: "Edit orders" },
    { name: "orders.create", description: "Create orders" },
    { name: "orders.delete", description: "Delete orders" },
    { name: "products.view", description: "View products" },
    { name: "products.edit", description: "Edit products" },
    { name: "products.create", description: "Create products" },
    { name: "products.delete", description: "Delete products" },
    { name: "inventory.view", description: "View inventory" },
    { name: "inventory.edit", description: "Edit inventory" },
    { name: "customers.view", description: "View customers" },
    { name: "customers.edit", description: "Edit customers" },
    { name: "settings.view", description: "View settings" },
    { name: "settings.edit", description: "Edit settings" },
  ]
  let permissions
  try {
    permissions = await rbacService.createPermissions(permissionData)
  } catch (e: any) {
    logger.info("  Permissions already exist, fetching existing")
    const { data } = await container.resolve(ContainerRegistrationKeys.QUERY).graph({
      entity: "permission",
      fields: ["id", "name"],
    })
    permissions = data
  }
  const permMap: Record<string, string> = {}
  for (const p of permissions) {
    permMap[p.name] = p.id
  }

  // create roles
  let roles
  try {
    roles = await rbacService.createRoles([
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
          permMap["orders.view"], permMap["orders.edit"], permMap["orders.create"],
          permMap["products.view"], permMap["products.edit"], permMap["products.create"],
          permMap["inventory.view"], permMap["inventory.edit"],
          permMap["customers.view"], permMap["customers.edit"],
        ],
      },
      {
        name: "Staff",
        description: "Can view orders and manage basic operations",
        permissions: [
          permMap["orders.view"], permMap["orders.edit"], permMap["orders.create"],
          permMap["products.view"],
          permMap["inventory.view"],
          permMap["customers.view"],
        ],
      },
    ])
  } catch (e: any) {
    logger.info("  Roles already exist, fetching existing")
    const { data } = await container.resolve(ContainerRegistrationKeys.QUERY).graph({
      entity: "role",
      fields: ["id", "name"],
    })
    roles = data
  }

  // create users
  const userCreds = [
    { email: "admin@mongfruitbox.com", password: "admin123", first_name: "Admin", last_name: "", roleIdx: 0 },
    { email: "pat@mongfruitbox.com", password: "pat123", first_name: "Pat", last_name: "", roleIdx: 1 },
    { email: "pad@mongfruitbox.com", password: "pad123", first_name: "Pad", last_name: "", roleIdx: 2 },
  ]

  for (const uc of userCreds) {
    let user
    // get or create user
    try {
      user = await userService.createUsers({
        email: uc.email,
        first_name: uc.first_name,
        last_name: uc.last_name,
      })
    } catch (e: any) {
      logger.info(`  User ${uc.email} already exists, fetching`)
      const { data } = await container.resolve(ContainerRegistrationKeys.QUERY).graph({
        entity: "user",
        fields: ["id", "email"],
        filters: { email: uc.email },
      })
      user = data?.[0]
    }

    if (user) {
      // assign role
      await userService.updateUsers({
        id: user.id,
        metadata: { roles: [roles[uc.roleIdx].id] },
      })

      // register auth identity (creates auth_identity + provider_identity with hashed password)
      let authIdentity
      try {
        const result = await authModuleService.register("emailpass", {
          body: { email: uc.email, password: uc.password },
        })
        authIdentity = result.authIdentity
      } catch (e: any) {
        logger.info(`  Auth for ${uc.email} already registered, will update link`)
      }

      // if register returned no identity, retrieve existing one
      if (!authIdentity) {
        try {
          const { data: existingPIs } = await query.graph({
            entity: "provider_identity",
            fields: ["id", "entity_id", "auth_identity.id", "auth_identity.app_metadata"],
            filters: { entity_id: uc.email },
          })
          if (existingPIs?.length) {
            authIdentity = existingPIs[0].auth_identity
          }
        } catch (err: any) {
          logger.warn(`  Could not find existing provider identity for ${uc.email}`)
        }
      }

      // link auth identity to user via app_metadata
      if (authIdentity) {
        await authModuleService.updateAuthIdentities({
          id: authIdentity.id,
          app_metadata: { user_id: user.id },
        })
      }

      logger.info(`  User: ${uc.email} -> ${roles[uc.roleIdx].name}`)
    }
  }

  logger.info("RBAC seeding complete.")
}
