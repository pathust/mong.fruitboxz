import { Module } from "@medusajs/framework/utils"
import VotingService from "./service"

export default Module("voting", {
  service: VotingService,
})
