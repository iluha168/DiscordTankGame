import { ResultSetHeader, createConnection } from "npm:mysql2/promise"
import { BigString } from "https://deno.land/x/discordeno@18.0.1/mod.ts";
import { InteractionWrapper } from "../commands/cmds-helpers.mts";
import env from "../env.mts";

const mysql = await createConnection({
    host: 'localhost',
    user: env.MYSQL_USERNAME,
    password: env.MYSQL_PASSWORD,
    database: 'tankgame',
    port: 3306,
    supportBigNumbers: true,
    bigNumberStrings: true,
})

async function query(sql: string, args: unknown[]){
    console.log('[SQL FETCH ->]', sql, args)
    const [res] = await mysql.query(sql, args)
    console.log('[SQL FETCH <-]', res)
    return res
}
async function queryOneRow<T>(sql: string, args: unknown[]){
    return (await query(sql, args) as T[])[0] as T|undefined
}

// true if any row got affected
// false if no rows were affected
async function queryWithCheck(sql: string, args: unknown[]): Promise<boolean>{
    const res = await query(sql, args) as ResultSetHeader
    return Boolean(res.affectedRows)
}
async function CALL(sql: string, args: unknown[]){
    return await query(sql, args) as Record<string, string>[][]
}

async function CALLwithErrorCode(sql: string, args: unknown[]): Promise<string>{
    const [res] = await CALL(sql, args)
    const msg = procedureErrorCodes[Object.keys(res)[0]]
    return msg
}

const procedureErrorCodes: Record<string, string> = {
    0: "",
    1: "The board is locked.",
    2: "Already in the game.",
    3: "The board is full.",
    4: "Hasn't joined the game.",
    5: "Not enough HP.",
    6: "Not enough AP.",
    7: "Cannot move outside the board.",
    8: "Cannot move on top of another tank.",
    9: "The board already exists.",
   10: "The board does not exist.",
   11: "🤨",
   12: "The target is dead.",
   13: "The target is not in the range.",
   14: "The target is not in the game.",
   15: "The board is not locked.",
}

export interface DBTankInfo {
    userID: bigint, guildID: bigint
    X : number, Y : number
    AP: number, HP: number
}
export interface DBBoardInfo {
    guildID: bigint
    locked : boolean
    maxAP  : number
    rolealive  : string|null
    roledead   : string|null
    rolewin    : string|null
    roleallowed: string|null
    roleadmin  : string|null
    w: number
    h: number
}

export class DBBoard {
    guildID: bigint
    constructor(intr: InteractionWrapper){
        if(!intr.interaction.guildId) throw InteractionWrapper.NoGuildError
        this.guildID = intr.interaction.guildId
    }

    create(){
        return CALLwithErrorCode('CALL createBoard(?)', [this.guildID])
    }
    clear(){
        return queryWithCheck('DELETE FROM tank WHERE guildID=?', [this.guildID])
    }

    boardSize(){
        return queryOneRow<Pick<DBBoardInfo, "locked"|"w"|"h">>
        ('SELECT locked,w,h FROM board WHERE guildID=?', [this.guildID])
    }

    addTank(userID: bigint){
        return CALLwithErrorCode('CALL addTank(?,?)', [this.guildID, userID])
    }
    removeTank(userID: bigint){
        return CALLwithErrorCode('CALL removeTank(?,?)', [this.guildID, userID])
    }
    getTank(userID: BigString){
        return queryOneRow<Pick<DBTankInfo,"X"|"Y"|"AP"|"HP">>
        ('SELECT X,Y,AP,HP FROM tank WHERE guildID=? AND userID=?', [this.guildID, userID])
    }
    moveTank(userID: BigString, dX: number, dY: number): Promise<string>{
        return CALLwithErrorCode('CALL moveTank(?,?,?,?)', [this.guildID, userID, dX, dY])
    }
    sendAPTank(userIDFrom: BigString, userIDTo: BigString): Promise<string>{
        return CALLwithErrorCode('CALL sendAPTank(?,?,?)', [this.guildID, userIDFrom, userIDTo])
    }
    async shootTank(shooterID: BigString, targetID: BigString): Promise<[string, number]>{
        const [[err], res] = await CALL('CALL shootTank(?,?,?)', [this.guildID, shooterID, targetID])
        return [ // [0] - errMsg, [1] - shootResult
            procedureErrorCodes[Object.keys(err)[0]],
            res[0]? Number(Object.keys(res[0])[0]): -1
        ]
    }

    async allTanks(callback: (tank: DBTankInfo)=>Promise<unknown>){
        const tanks = await query('SELECT * FROM tank WHERE guildID=?', [this.guildID]) as DBTankInfo[]
        for(const tank of tanks) await callback(tank)
    }

    async configure(entries: Record<string,unknown>){
        return await queryWithCheck(
            'UPDATE board SET '+Object.keys(entries).map(k => k+'=?').join(',')+' WHERE guildID=?',
            Object.values(entries).concat(this.guildID)
        )
    }

    get config(){
        return queryOneRow<Omit<DBBoardInfo,"guilID">>
        ('SELECT locked,maxAP,rolealive,roledead,rolewin,roleallowed,roleadmin,w,h FROM board WHERE guildID=?', [this.guildID])
    }
    get roleAdmin(){
        return queryOneRow<Pick<DBBoardInfo,"roleadmin">>
        ('SELECT roleadmin FROM board WHERE guildID=?', [this.guildID])
            .then(r => r?.roleadmin)
    }
    get roleStatuses(){
        return queryOneRow<Pick<DBBoardInfo,"rolealive"|"roledead"|"rolewin"|"roleallowed">>
        ('SELECT rolealive,roledead,rolewin,roleallowed FROM board WHERE guildID=?', [this.guildID])
    }

    giveAP(userID: BigString|null, amount: number): Promise<string>{
        return CALLwithErrorCode('CALL giveAP(?,?,?)', [this.guildID, userID, amount])
    }
}