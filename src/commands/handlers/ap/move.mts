import { ApplicationCommandOptionTypes, ApplicationCommandTypes } from "https://deno.land/x/discordeno@18.0.1/mod.ts"
import { CMD } from "../../cmds-handler.mts"
import { msgFail, msgSuccess } from "../../cmds-helpers.mts";

export const cmd: CMD = {
	AppCmdOption: {
		name: "move",
		description: "Move your tank. Takes 1 AP!",
		type: ApplicationCommandOptionTypes.SubCommand,
        options: [{
            name: "x",
            description: "relative X change: -x is left, +x is right",
            type: ApplicationCommandOptionTypes.Integer,
            minValue: -3,
            maxValue: +3,
            required: true,
        },{
            name: "y",
            description: "relative Y change: -y is up, +y is down",
            type: ApplicationCommandOptionTypes.Integer,
            minValue: -3,
            maxValue: +3,
            required: true,
        }]
	},

	[ApplicationCommandTypes.ChatInput]: async (intr)=>{
        const errMsg = await intr.db.moveTank(intr.interaction.user.id, intr.options.x as number, intr.options.y as number)
        await intr.reply(
            errMsg ?
            msgFail(errMsg):
            msgSuccess('Tank has been moved!')
        )
	}
}