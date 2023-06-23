import { ApplicationCommandTypes } from "https://deno.land/x/discordeno@18.0.1/mod.ts"
import { CMD, createCommandSubGroup, routeCommandSubGroup } from "../cmds-handler.mts"

const [cmdIndex, options] = await createCommandSubGroup('./src/commands/handlers/ap','./handlers/ap/')

export const cmd: CMD = {
	AppCmdObject: {
		name: "ap",
		type: ApplicationCommandTypes.ChatInput,
		description: "AP manipulation commands",
		options
	},

	[ApplicationCommandTypes.ChatInput]: (intr)=>{
		return routeCommandSubGroup(cmdIndex, intr)
	}
}