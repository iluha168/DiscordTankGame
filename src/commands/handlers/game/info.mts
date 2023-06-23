import { ApplicationCommandOptionTypes, ApplicationCommandTypes, BigString } from "https://deno.land/x/discordeno@18.0.1/mod.ts"
import { CMD } from "../../cmds-handler.mts"
import { msgFail } from "../../cmds-helpers.mts";

export const cmd: CMD = {
	AppCmdOption: {
		name: "info",
		description: "Show tank's statistics",
		type: ApplicationCommandOptionTypes.SubCommand,
        options: [
            {
                name: "tank",
                description: "Who's tank do you need? (Your tank by default)",
                type: ApplicationCommandOptionTypes.User
            }
        ]
	},

	[ApplicationCommandTypes.ChatInput]: async (intr)=>{
        const userID: BigString = intr.options.tank as string ?? intr.interaction.user.id
        const tank = await intr.db.getTank(userID)
        if(!tank) return intr.reply(msgFail("Hasn't joined the game yet."))

        await intr.reply({
            embeds: [{
                title: intr.interaction.member!.nick ?? intr.interaction.user.username,
                color: [0x444444,0xFF0000,0xFFFF00,0x00FF00][tank.HP],
                fields: Object.entries(tank).map(([k,v])=>({
                    name: k, value: v.toString(), inline: true
                }))
            }]
        })
	}
}