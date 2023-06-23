import { ApplicationCommandOptionTypes, ApplicationCommandTypes } from "https://deno.land/x/discordeno@18.0.1/mod.ts"
import { CMD } from "../../cmds-handler.mts"
import { msgFail, msgSuccess } from "../../cmds-helpers.mts"

export const cmd: CMD = {
	AppCmdOption: {
        name: 'clear',
        description: '[ADMIN] Clear game',
        type: ApplicationCommandOptionTypes.SubCommand,
        options: [{
            name: 'removewin',
            description: 'Do i need to remove the win role from the winner?',
            type: ApplicationCommandOptionTypes.Boolean,
            required: true
        }]
    },
    adminOnly: true,

	[ApplicationCommandTypes.ChatInput]: async (intr)=>{
        await intr.defer()
        const roleIDs = await intr.db.roleStatuses as Record<string,bigint|null>
        if(roleIDs){
            if(intr.options.removewin)
                roleIDs.rolewin = null
            //remove roles from users
            await intr.db.allTanks(async ({userID}) => {
                for(const roleID of Object.values(roleIDs).filter(n=>n))
                    await intr.roleRemove(userID, roleID, "The board is being cleared")
            })
            //remove board from DB
            await intr.db.clear()
            await intr.edit(msgSuccess('Board has been cleared.'))
        } else await intr.edit(msgFail('Board is already empty.'))
	}
}