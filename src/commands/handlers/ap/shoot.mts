import { ApplicationCommandOptionTypes, ApplicationCommandTypes, BigString } from "https://deno.land/x/discordeno@18.0.1/mod.ts"
import { CMD } from "../../cmds-handler.mts"
import { msgFail, msgSuccess } from "../../cmds-helpers.mts";

export const cmd: CMD = {
	AppCmdOption: {
		name: "shoot",
		type: ApplicationCommandOptionTypes.SubCommand,
		description: "Shoot another tank.",
		options: [{
			type: ApplicationCommandOptionTypes.User,
			name: "player",
			description: "The user you want to shoot.",
			required: true,
		}]
	},

	[ApplicationCommandTypes.ChatInput]: async (intr)=>{
        const shooterID = intr.interaction.user.id
        const targetID = intr.options.player as BigString
        const [errMsg, shootResult] = await intr.db.shootTank(shooterID, targetID)
        if(!errMsg && shootResult > 0){
            const roleIDs = (await intr.db.roleStatuses)!
            await intr.roleAdd(targetID, roleIDs.roledead, "Died in tank game.")
            await intr.roleRemove(targetID, roleIDs.rolealive, "Died in tank game.")
            if(shootResult === 2)
                await intr.roleAdd(shooterID, roleIDs.rolewin, "Won tank game!")
        }
        await intr.reply(
            errMsg ?
            msgFail(errMsg):
            msgSuccess([
                `<@${shooterID}> has shot <@${targetID}>!`,
                `<@${shooterID}> has killed <@${targetID}>!`,
                `<@${shooterID}> is the last tank standing, and wins the game!`,
            ][shootResult])
        )
	}
}