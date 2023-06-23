import { ApplicationCommandOptionTypes, ApplicationCommandTypes } from "https://deno.land/x/discordeno@18.0.1/mod.ts"
import { CMD } from "../../cmds-handler.mts"
import { msgFail, msgSuccess } from "../../cmds-helpers.mts";

export const cmd: CMD = {
	AppCmdOption: {
		name: "leave",
		description: "Leave the game",
		type: ApplicationCommandOptionTypes.SubCommand
	},

	[ApplicationCommandTypes.ChatInput]: async (intr)=>{
        await intr.defer()
        const errMsg = await intr.db.removeTank(intr.interaction.user.id)
        if(!errMsg){
            const roleIDs = (await intr.db.roleStatuses)!
            for(const role of [roleIDs.rolealive, roleIDs.roledead])
                await intr.roleRemove(intr.interaction.user.id, role, "User has left the tank game")
        }
        await intr.edit(
            errMsg?
            msgFail(errMsg):
            msgSuccess('Left the game.')
        )
	}
}