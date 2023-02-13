const { Client, Events, SlashCommandBuilder, REST, Routes, ChatInputCommandInteraction, EmbedBuilder } = require('discord.js');
const client = new Client({ intents: [131071] })
client.login(`토큰`);
const { connect, model, Schema } = require('mongoose')
client.on('ready', async () => console.log(client.user.tag))
process.on('unhandledRejection', error => { console.error(error) });
process.on('uncaughtException', error => { console.error(error) });

client.on(Events.ClientReady, async () => {
    const commands = [
        new SlashCommandBuilder()
            .setDMPermission(false)
            .setName(`계정`)
            .setDescription(`계정을 뚝딱뚝딱`)
            .addSubcommand(op => op
                .setName(`생성`)
                .setDescription(`계정을 생성합니다.`)
            )
            .addSubcommand(op => op
                .setName(`삭제`)
                .setDescription(`계정을 삭제합니다.`)
            )
            .addSubcommandGroup(op => op
                .setName(`정보`)
                .setDescription(`계정정보`)
                .addSubcommand(op => op
                    .setName(`불러오기`)
                    .setDescription(`계정정보를 불러옵니다.`)
                )
            )
            .addSubcommandGroup(op => op
                .setName(`주식`)
                .setDescription(`계정의 주식을 관리함.`)
                .addSubcommand(op => op
                    .setName(`개수추가`)
                    .setDescription(`계정주식을 추가합니다.`)
                    .addStringOption(op => op
                        .setName(`주식`)
                        .setDescription(`주식을 선택해주세요.`)
                        .setChoices(
                            { name: `Sam`, value: `Sam` },
                            { name: `Su`, value: `Su` },
                        )
                        .setRequired(true)
                    )
                    .addIntegerOption(op => op
                        .setName(`주`)
                        .setDescription(`추가할 주식주을 입력해주세요.`)
                        .setRequired(true)
                    )
                )
            ),
    ].map(command => command.toJSON());
    const rest = new REST({ version: '10' }).setToken(`토큰`);
    rest.put(Routes.applicationCommands(client.user?.id), { body: commands }).catch(err => console.error(err));
})
connect(`몽고DB LINK`, { useNewUrlParser: true, useUnifiedTopology: true })

const UserDB = model(`UserDB`, new Schema({
    userid: { type: String },
    tag: { type: String },
    Stock: {
        Sam: { type: Number, default: 0 },
        Su: { type: Number, default: 0 },
    },
    endtime: { type: String },
}))

client.on(Events.InteractionCreate, async (interaction = ChatInputCommandInteraction) => {
    await interaction.reply({
        embeds: [
            new EmbedBuilder()
                .setDescription(`</${interaction.commandName}:${interaction.commandId}> 명령어를 불러오고 있습니다.`)
        ]
    })
    const DB = await UserDB.findOne({ userid: interaction.user.id })
    const subcmd = await interaction.options.getSubcommand(required = false);
    const subgroup = await interaction.options.getSubcommandGroup(required = false);
    const time = Math.round(new Date().getTime() / 1000)
    if (subcmd == `생성`) {
        if (DB) return await interaction.editReply({
            embeds: [
                new EmbedBuilder()
                    .setDescription(`${interaction.user}님은 이미 계정을 생성하셨습니다.`)
            ]
        })
        new UserDB({ userid: interaction.user.id, tag: interaction.user.tag, Stock: { Sam: 0, Su: 0 }, endtime: String(time) }).save()
        await interaction.editReply({
            embeds: [
                new EmbedBuilder()
                    .setDescription(`계정을 생성했습니다.`)
            ]
        })
    } else if (subcmd == `삭제`) {
        if (!DB) return await interaction.editReply({
            embeds: [
                new EmbedBuilder()
                    .setDescription(`${interaction.user}님은 계정을 생성하지 않으셨습니다.`)
            ]
        })
        await UserDB.findOneAndRemove({ userid: interaction.user.id })
        await interaction.editReply({
            embeds: [
                new EmbedBuilder()
                    .setDescription(`계정을 삭제했습니다.`)
            ]
        })
    } else if (subgroup == `정보`) {
        if (subcmd == `불러오기`) {
            if (!DB) return await interaction.editReply({
                embeds: [
                    new EmbedBuilder()
                        .setDescription(`${interaction.user}님은 계정을 생성하지 않으셨습니다.`)
                ]
            })
            await UserDB.findOneAndUpdate({ userid: interaction.user.id }, { userid: interaction.user.id, tag: interaction.user.tag, Stock: { Sam: DB.Stock.Sam, Su: DB.Stock.Su }, endtime: DB.endtime })
            await interaction.editReply({
                embeds: [
                    new EmbedBuilder()
                        .setDescription(`계정정보입니다.`)
                        .setFields(
                            { name: `계정정보`, value: `${DB.tag} | ${DB.userid}` },
                            { name: `보유주식`, value: `Sam : ${DB.Stock.Sam} | Su : ${DB.Stock.Su}` },
                            { name: `마지막 요청 시간`, value: `<t:${DB.endtime}:R>` },
                        )
                ]
            })
        }
    } else if (subgroup == `주식`) {
        if (subcmd == `개수추가`) {
            if (!DB) return await interaction.editReply({
                embeds: [
                    new EmbedBuilder()
                        .setDescription(`${interaction.user}님은 계정을 생성하지 않으셨습니다.`)
                ]
            })
            const str = await interaction.options.getString(`주식`);
            const num = await interaction.options.getInteger(`주`);
            if (str == `Sam`) await UserDB.findOneAndUpdate({ userid: interaction.user.id }, { userid: interaction.user.id, tag: interaction.user.tag, Stock: { Sam: DB.Stock.Sam + num, Su: DB.Stock.Su }, endtime: String(time) })
            if (str == `Su`) await UserDB.findOneAndUpdate({ userid: interaction.user.id }, { userid: interaction.user.id, tag: interaction.user.tag, Stock: { Sam: DB.Stock.Sam, Su: DB.Stock.Su + num }, endtime: String(time) })
            await interaction.editReply({
                embeds: [
                    new EmbedBuilder()
                        .setDescription(`${str} 주식에 ${num} 주를 추가했습니다.`)
                ]
            })
        }
    }
})
