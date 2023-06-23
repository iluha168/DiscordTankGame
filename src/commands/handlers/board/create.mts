import { ApplicationCommandOptionTypes, ApplicationCommandTypes } from "https://deno.land/x/discordeno@18.0.1/mod.ts"
import { CMD } from "../../cmds-handler.mts"
import { msgSuccess, msgFail } from "../../cmds-helpers.mts"

export const cmd: CMD = {
	AppCmdOption: {
		name: "create",
		description: "Initialise the board",
		type: ApplicationCommandOptionTypes.SubCommand
	},

	[ApplicationCommandTypes.ChatInput]: async (intr)=>{
		const errMsg = await intr.db.create()
        await intr.reply(
            errMsg? 
            msgFail(errMsg):
            msgSuccess('Board has been created.')
        )
	}
}