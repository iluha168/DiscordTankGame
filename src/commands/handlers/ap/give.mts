import { ApplicationCommandOptionTypes, ApplicationCommandTypes } from "https://deno.land/x/discordeno@18.0.1/mod.ts"
import { CMD } from "../../cmds-handler.mts"
import { msgFail, msgSuccess } from "../../cmds-helpers.mts";

export const cmd: CMD = {
	AppCmdOption: {
		name: "give",
		description: "[ADMIN] Give tanks on board some AP",
		type: ApplicationCommandOptionTypes.SubCommand,
        options: [{
			type: ApplicationCommandOptionTypes.Integer,
			name: "amount",
			description: "Amount of AP you want to give",
			required: true
		},{
            type: ApplicationCommandOptionTypes.User,
            name: "tank",
            description: "Who do you want to give AP specifically? (Everyone if not specified)",
            required: false
        }]
	},
    adminOnly: true,

	[ApplicationCommandTypes.ChatInput]: async (intr)=>{
        const errMsg = await intr.db.giveAP((intr.options.tank??null) as string|null, intr.options.amount as number)
        await intr.reply(
            errMsg ?
            msgFail(errMsg):
            msgSuccess('Successfully gave AP.')
        )
	}
}