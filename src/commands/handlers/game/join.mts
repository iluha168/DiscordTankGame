import { ApplicationCommandOptionTypes, ApplicationCommandTypes, getMember } from "https://deno.land/x/discordeno@18.0.1/mod.ts"
import { CMD } from "../../cmds-handler.mts"
import { msgFail, msgSuccess } from "../../cmds-helpers.mts";

export const cmd: CMD = {
	AppCmdOption: {
		name: "join",
		description: "Join the game",
		type: ApplicationCommandOptionTypes.SubCommand
	},

	[ApplicationCommandTypes.ChatInput]: async (intr)=>{
        const roleIDs = await intr.db.roleStatuses;
        if(!roleIDs) return intr.reply(msgFail('The board does not exist.'))
        const member = await getMember(intr.bot, intr.interaction.guildId!, intr.interaction.user.id)
        console.log(member.roles.concat(intr.interaction.guildId!))
        if(!member.roles.concat(intr.interaction.guildId!)
            .find(id => id === BigInt(roleIDs.roleallowed??0))
        ) return intr.reply(msgFail('Not whitelisted.'))

        const errMsg = await intr.db.addTank(member.id)
        if(!errMsg){
            await intr.roleAdd   (member.id, roleIDs.rolealive, "Joined tank game")
            await intr.roleRemove(member.id, roleIDs.roledead , "Joined tank game")
            await intr.roleRemove(member.id, roleIDs.rolewin  , "Joined tank game")
        }
        await intr.reply(
            errMsg?
            msgFail(errMsg):
            msgSuccess('Joined successfully!')
        )
	}
}