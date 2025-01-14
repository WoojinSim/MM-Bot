import { Client, EmbedBuilder } from "discord.js";
import axios from "axios";
const cheerio = require("cheerio");

export default (client: Client) => {
  // 채팅 입력시 링크인지 확인
  client.on("messageCreate", (message) => {
    const urlPattern = /^(https?|ftp):\/\/(-\.)?([^\s\/?\.#-]+\.?)+(\/[^\s]*)?$/i;
    if (message.author.bot) return;
    if (!urlPattern.test(message.content)) return; // 입력된 메세지가 링크인지 확인
    const inputUrl = new URL(message.content);
    const splitHostUrl = inputUrl.hostname.split(".");
    if (splitHostUrl[1] !== "dcinside") return; // 입력된 메세지가 dcinside 링크인지 확인

    try {
      console.log(message.content);
      axios
        .get(message.content, {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36",
          },
        })
        .then((response: { data: any }) => {
          console.log(response.this.state.first);
          const $ = cheerio.load(response.data);
          const contentUrl = message.content;
          const titleHeadText = $(".title_headtext").text(); // 말머리
          const titleText = $(".title_subject").text(); // 제목
          // const firstImgSrc = $(".writing_view_box img").first().attr("src"); // 썸네일

          const viewCount = $(".gallview_head .fr .gall_count").text(); // 조회수
          const starCount = $(".gallview_head .fr .gall_reply_num").text(); // 추천수
          const commentCount = $(".gallview_head .fr .gall_comment").text(); // 댓글수

          const embed = new EmbedBuilder()
            .setAuthor({
              name: "디시인사이드",
            })
            .setTitle(`${titleHeadText} ${titleText}`)
            .setURL(contentUrl)
            .setColor("#3b4890")
            .addFields(
              { name: "조회", value: `${viewCount.split(" ")[1]}회`, inline: true },
              { name: "추천", value: `${starCount.split(" ")[1]}개`, inline: true },
              { name: "댓글", value: `${commentCount.split(" ")[1]}개`, inline: true }
            );
          message.reply({
            embeds: [embed],
            allowedMentions: {
              repliedUser: false,
            },
          });
        })
        .catch((error) => {
          message.channel.send(
            `${message.url}\n위 링크에 대한 미리보기를 제공해 드릴려고 했는데, 뭔가 문제가 생긴것 같아요.\n속이 좋지않아요... :pepe_break:`
          );
          console.error(error);
        });
    } catch (error) {
      console.error(error);
    }
  });
};
