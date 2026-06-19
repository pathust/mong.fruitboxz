import type SiteModuleService from "../modules/site/service"
import type RbacModuleService from "../modules/rbac/service"

export type ServiceScope = {
  resolve<T>(name: string): T
}

export const resolveSiteService = (scope: ServiceScope) => scope.resolve<SiteModuleService>("site")
export const resolveRbacService = (scope: ServiceScope) => scope.resolve<RbacModuleService>("rbac")
