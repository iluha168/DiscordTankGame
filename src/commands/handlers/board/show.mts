import { ApplicationCommandOptionTypes, ApplicationCommandTypes, ImageSize, getAvatarURL, getMember } from "https://deno.land/x/discordeno@18.0.1/mod.ts"
import { createCanvas, loadImage } from "https://deno.land/x/canvas@v1.4.1/mod.ts"
import { CMD } from "../../cmds-handler.mts"
import { msgFail } from "../../cmds-helpers.mts"

const HEALTH_PALETTE = ["#444444","#ff0000","#ffff00","#00FF00"]
const SCALE: ImageSize = 32

export const cmd: CMD = {
	AppCmdOption: {
        name: 'show',
        description: 'Send image of the board',
        type: ApplicationCommandOptionTypes.SubCommand
    },

	[ApplicationCommandTypes.ChatInput]: async (intr)=>{
        await intr.defer()
        const size = await intr.db.boardSize()
        if(!size) return intr.edit(msgFail('There is no board to show.'))
        
        const cvs = createCanvas(size.w*SCALE,size.h*SCALE)
        cvs.loadFont(await Deno.readFile("assets/handwriting.ttf"), {family: "Handwriting"})
        const ctx = cvs.getContext('2d')
        //clear canvas
        ctx.fillStyle = "#2C7A1F"
        ctx.fillRect(0, 0, cvs.width, cvs.height)
        // draw grid
        ctx.strokeStyle = "#FFFFFF"
        ctx.beginPath()
        for (let i = SCALE; i < cvs.width; i += SCALE) {
            ctx.moveTo(i, 0)
            ctx.lineTo(i, cvs.height)
        }
        for (let i = SCALE; i < cvs.height; i += SCALE) {
            ctx.moveTo(0, i)
            ctx.lineTo(cvs.width, i)
        }
        ctx.stroke()
        //draw players
        await intr.db.allTanks(async tank => {
            const tankMember = await getMember(intr.bot, tank.guildID, tank.userID)
            const avatar = await loadImage(
                getAvatarURL(intr.bot, tank.userID, '0', {
                    avatar: tankMember.avatar ?? tankMember.user?.avatar,
                    size: SCALE,
                    format: "webp"
                })
            )
            
            ctx.globalCompositeOperation = tank.HP <= 0? "destination-out":"source-over"
            ctx.drawImage(avatar, tank.X*SCALE, tank.Y*SCALE)

            //health indicator
            ctx.fillStyle = HEALTH_PALETTE[tank.HP]
            ctx.strokeStyle = "#000"
            for(const end of [ctx.fill, ctx.stroke]){
                ctx.beginPath()
                ctx.arc(
                    tank.X*SCALE + SCALE*0.8,
                    tank.Y*SCALE + SCALE*0.8,
                    SCALE*0.1,
                    0, 2*Math.PI
                )
                end.bind(ctx)()
            }

            //ap
            if(tank.HP <= 0) return
            ctx.globalCompositeOperation='difference'
            ctx.fillStyle = 'white'
            ctx.font = SCALE*0.6+'px Handwriting';
            ctx.fillText(
                tank.AP.toString(),
                tank.X*SCALE,
                tank.Y*SCALE + SCALE
            )
        })
        await intr.edit({
            content: `The game is ${size.locked?'':'not '}locked.`,
            file: {
                blob: new Blob([cvs.toBuffer()]),
                name: 'h.png'
            }
        })
	}   
}