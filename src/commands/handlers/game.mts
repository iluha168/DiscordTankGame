import { ApplicationCommandTypes } from "https://deno.land/x/discordeno@18.0.1/mod.ts"
import { CMD, createCommandSubGroup, routeCommandSubGroup } from "../cmds-handler.mts"

const [cmdIndex, options] = await createCommandSubGroup('./src/commands/handlers/game','./handlers/game/')

export const cmd: CMD = {
	AppCmdObject: {
		name: "game",
		type: ApplicationCommandTypes.ChatInput,
		description: "A board game needs /game command!",
		options
	},

	[ApplicationCommandTypes.ChatInput]: (intr)=>{
		return routeCommandSubGroup(cmdIndex, intr)
	}
}