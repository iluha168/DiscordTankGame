import { editOriginalInteractionResponse } from "https://deno.land/x/discordeno@18.0.1/helpers/interactions/responses/editOriginalInteractionResponse.ts";
import { BigString, BitwisePermissionFlags, Bot, Interaction, InteractionCallbackData, InteractionResponse, InteractionResponseTypes, addRole, removeRole, sendInteractionResponse } from "https://deno.land/x/discordeno@18.0.1/mod.ts";
import { DBBoard } from "../DB/db.mts";

export function msgFail(description: string){
    return {
        embeds: [{
            description,
            color: 0xFF0000
        }]
    }
}
export function msgSuccess(description: string){
    return {
        embeds: [{
            description,
            color: 0x00FF00
        }]
    }
}


export class InteractionWrapper {
    static NoGuildError = new Error('Interaction called outside a guild')

    bot: Bot
    interaction: Interaction
    db: DBBoard
    options: Record<string,unknown>
    constructor(bot: Bot, intr: Interaction){
        this.bot = bot
        this.interaction = intr
        this.db = new DBBoard(this)
        const optionsToParse =
            intr.data?.options?.[0]?.options ?? intr.data?.options
        this.options = Object.fromEntries(optionsToParse?.map(opt => [opt.name, opt.value]) ?? [])
    }

    #respond(resp: InteractionResponse){
        return sendInteractionResponse(this.bot, this.interaction.id, this.interaction.token, resp)
    }

    defer(){
        return this.#respond({
            type: InteractionResponseTypes.DeferredChannelMessageWithSource
        })
    }

    reply(msg: InteractionCallbackData){
        return this.#respond({
            type: InteractionResponseTypes.ChannelMessageWithSource,
            data: msg
        })
    }

    edit(msg: InteractionCallbackData){
        return editOriginalInteractionResponse(this.bot, this.interaction.token, msg)
    }

    async isRequestedByAdmin(): Promise<boolean>{
        if(!this.interaction.member) throw InteractionWrapper.NoGuildError
        if(this.interaction.member.permissions??0n & BigInt(BitwisePermissionFlags.ADMINISTRATOR)) return true
        const roleAdmin = BigInt(await this.db.roleAdmin ?? -1)
        if(this.interaction.member.roles.find(id => id === roleAdmin)) return true
        return false
    }

    async roleAdd(user: BigString, role: BigString | null, reason: string){
        if(!role) return
        return await addRole(this.bot, this.interaction.guildId!, user, role, reason)
            .catch(()=>{})
    }
    async roleRemove(user: BigString, role: BigString | null, reason: string){
        if(!role) return
        return await removeRole(this.bot, this.interaction.guildId!, user, role, reason)
            .catch(()=>{})
    }
}