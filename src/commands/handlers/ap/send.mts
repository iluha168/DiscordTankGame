import { ApplicationCommandOptionTypes, ApplicationCommandTypes } from "https://deno.land/x/discordeno@18.0.1/mod.ts"
import { CMD } from "../../cmds-handler.mts"
import { msgFail, msgSuccess } from "../../cmds-helpers.mts";

export const cmd: CMD = {
	AppCmdOption: {
		name: "send",
		type: ApplicationCommandOptionTypes.SubCommand,
		description: "Send 1 AP to another tank.",
		options: [{
			type: ApplicationCommandOptionTypes.User,
			name: "player",
			description: "The user you want to give 1 AP to.",
			required: true,
		}]
	},

	[ApplicationCommandTypes.ChatInput]: async (intr)=>{
        const errMsg = await intr.db.sendAPTank(intr.interaction.user.id, intr.options.player as bigint)
        await intr.reply(
            errMsg ?
            msgFail(errMsg):
            msgSuccess(`Sent 1 AP to <@${intr.options.player}>.`)
        )
	}
}