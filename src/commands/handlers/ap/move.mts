import { ApplicationCommandOptionTypes, ApplicationCommandTypes } from "https://deno.land/x/discordeno@18.0.1/mod.ts"
import { CMD } from "../../cmds-handler.mts"
import { msgFail, msgSuccess } from "../../cmds-helpers.mts";

export const cmd: CMD = {
	AppCmdOption: {
		name: "move",
		description: "Move your tank. Takes 1 AP!",
		type: ApplicationCommandOptionTypes.SubCommand,
        options: [{
            name: "left",
            description: "How many squares to go to the left? Negative numbers allowed!",
            type: ApplicationCommandOptionTypes.Integer,
            minValue: -3,
            maxValue: +3,
            required: true,
        },{
            name: "down",
            description: "How many squares to go down? Negative numbers allowed!",
            type: ApplicationCommandOptionTypes.Integer,
            minValue: -3,
            maxValue: +3,
            required: true,
        }]
	},

	[ApplicationCommandTypes.ChatInput]: async (intr)=>{
        const errMsg = await intr.db.moveTank(intr.interaction.user.id, intr.options.left as number, intr.options.up as number)
        await intr.reply(
            errMsg ?
            msgFail(errMsg):
            msgSuccess('Tank has been moved!')
        )
	}
}