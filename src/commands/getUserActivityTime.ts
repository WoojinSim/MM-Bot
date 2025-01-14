import { SlashCommandBuilder } from "@discordjs/builders";
import { CommandInteraction, CommandInteractionOptionResolver, EmbedBuilder, TextChannel, ChannelType } from "discord.js";
import { getUserActivity } from "../database/database";

export const data = new SlashCommandBuilder()
  .setName("마지막활동")
  .setDescription("입력한 유저의 마지막 활동 시간을 조회합니다.")
  .addUserOption((option) => option.setName("대상").setDescription("조회할 대상을 입력해주세요.").setRequired(true));
export async function execute(interaction: CommandInteraction) {
  const options = interaction.options as CommandInteractionOptionResolver;
  const targetUser = options.getUser("대상");

  // 대상을 못 불러올 때
  if (!targetUser) {
    await interaction.reply({ content: `문제가 있는 것 같아요... 유저의 ID값을 불러올 수 없어요.`, ephemeral: true });
    return;
  }

  // DB에 데이터가 없을 때
  const resultData = getUserActivity(targetUser.id);
  if (!resultData) {
    await interaction.reply({
      content: `문제가 있는 것 같아요... 제가 감시하기 전부터 활동을 안 하던 사용자에요.`,
      ephemeral: true,
    });
    return;
  }
  const avatarURL = targetUser.displayAvatarURL({ size: 256 });
  if (resultData.lastChannelID) {
    const embed = new EmbedBuilder()
      .setAuthor({
        name: `${targetUser.displayName} (${targetUser.tag})`,
        iconURL: avatarURL,
      })
      .setTitle("마지막 활동 시간 조회")
      .setDescription(`해당 사용자는 <t:${Math.floor(resultData.lastActivity / 1000)}:R> 마지막으로 활동했어요`)
      .addFields({
        name: "활동위치",
        value: `${
          resultData.lastContentID
            ? `https://discord.com/channels/705326062279589928/${resultData.lastChannelID}/${resultData.lastContentID}`
            : `https://discord.com/channels/705326062279589928/${resultData.lastChannelID}`
        }`,
      })
      .setColor("#A668E0")
      .setFooter({
        text: "밍밍박사",
      })
      .setTimestamp();
    await interaction.reply({ embeds: [embed] });
  } else {
    const embed = new EmbedBuilder()
      .setAuthor({
        name: `${targetUser.displayName} (${targetUser.tag})`,
        iconURL: avatarURL,
      })
      .setTitle("마지막 활동 시간 조회")
      .setDescription(`해당 사용자는 <t:${Math.floor(resultData.lastActivity / 1000)}:R> 마지막으로 활동했어요`)
      .addFields({
        name: "활동위치",
        value: `위치기록기능 추가 이전에 활동함`,
      })
      .setColor("#A668E0")
      .setFooter({
        text: "밍밍박사",
      })
      .setTimestamp();
    await interaction.reply({ embeds: [embed] });
  }

  return;
}
