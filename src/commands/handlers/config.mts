import { ApplicationCommandOptionTypes, ApplicationCommandTypes, BigString } from "https://deno.land/x/discordeno@18.0.1/mod.ts"
import { CMD } from "../cmds-handler.mts"

function roleMention(role: BigString|null): string{
	return role?`<@&${role}>`:'Not set'
}

export const cmd: CMD = {
	AppCmdObject: {
		name: "config",
		description: "[ADMIN] Configure board and roles",
		type: ApplicationCommandTypes.ChatInput,
		options: [
			{
				type: ApplicationCommandOptionTypes.Boolean,
				name: "locked",
				description: "Can players join/leave?",
			},{
				type: ApplicationCommandOptionTypes.Integer,
				name: "maxap",
				description: "Max AP each tank can hold",
				minValue: 1,
			},{
				type: ApplicationCommandOptionTypes.Role,
				name: "rolealive",
				description: "The role assigned to every alive tank"
			},{
				type: ApplicationCommandOptionTypes.Role,
				name: "roledead",
				description: "The role assigned to every dead tank"
			},{
				type: ApplicationCommandOptionTypes.Role,
				name: "rolewin",
				description: "The role assigned to winner of the game"
			},{
				type: ApplicationCommandOptionTypes.Role,
				name: "roleallowed",
				description: "The whitelist role"
			},{
				type: ApplicationCommandOptionTypes.Role,
				name: "roleadmin",
				description: "User with this role can configure the game"
			},{
				type: ApplicationCommandOptionTypes.Integer,
				name: "w",
				description: "Width of the game board",
				minValue: 1,
				maxValue: 255,
			},{
				type: ApplicationCommandOptionTypes.Integer,
				name: "h",
				description: "Height of the game board",
				minValue: 1,
				maxValue: 255,
			},
		]
	},
	adminOnly: true,

	[ApplicationCommandTypes.ChatInput]: async (intr)=>{
		if(Object.values(intr.options).length)
			await intr.db.configure(intr.options)
		const cfg = await intr.db.config
		if(!cfg) return await intr.reply({
			embeds: [{
				description: 'There is no board to configure.',
				color: 0xFF0000,
			}]
		})
		await intr.reply({
			embeds: [{
				title: "Configuration",
				color: 0x5522FF,
				fields: [
					{name: "Is locked"     ,value: cfg.locked?'Yes':'No'       , inline: true},
					{name: "AP max"        ,value: cfg.maxAP.toString()        , inline: true},
					{name: "Alive role"    ,value: roleMention(cfg.rolealive  ), inline: true},
					{name: "Dead role"     ,value: roleMention(cfg.roledead   ), inline: true},
					{name: "Winner role"   ,value: roleMention(cfg.rolewin    ), inline: true},
					{name: "Whitelist role",value: roleMention(cfg.roleallowed), inline: true},
					{name: "Admin role"    ,value: roleMention(cfg.roleadmin  ), inline: true},
					{name: "Board size"    ,value: cfg.w+'x'+cfg.h             , inline: true},
				]
			}]
		})
	}
}