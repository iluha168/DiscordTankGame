import { createCommandGroup, routeCommandGroup, updateGlobalApplicationCommands } from "./commands/cmds-handler.mts"
import { GatewayIntents, createBot, startBot } from "https://deno.land/x/discordeno@18.0.1/mod.ts"
import { InteractionWrapper } from "./commands/cmds-helpers.mts"
import env from "./env.mts"

const [cmdIndex, descriptors] = await createCommandGroup('./src/commands/handlers/','./handlers/')

await startBot(createBot({
    token: env.DISCORD_BOT_TOKEN,
    intents: GatewayIntents.Guilds,
    events: {
        ready: async (bot) => {
            console.log('Logged in', descriptors)
            await updateGlobalApplicationCommands(bot, descriptors)
        },

        interactionCreate: (bot, intr) => {
            const wrap = new InteractionWrapper(bot, intr)
            routeCommandGroup(cmdIndex, wrap)
        }
    }
}))