import { Client, TextChannel, EmbedBuilder, Message, VoiceChannel } from 'discord.js';
import { joinVoiceChannel, createAudioPlayer, createAudioResource, getVoiceConnection, VoiceConnection, AudioPlayerStatus } from '@discordjs/voice';
import ytdl from "@distube/ytdl-core";
import ffmpegPath from 'ffmpeg-static';
import { spawn, ChildProcessWithoutNullStreams } from 'child_process';

import { GUILD_ID } from "../config/config";
import { timeStamp } from "../util/time";

const MUSIC_CHANNEL_ID = "1302975766253797396";

interface musicQueueInterface {
  url: string;
  info: ytdl.MoreVideoDetails;
  author: string;
}

let musicQueue: musicQueueInterface[] = [];
let isMusicPlaying: boolean = false;
let dashboardMessage: Message;
let lastMessageTime: number = 0;
let didntPlayStack: number = 0;

// 대시보드 버튼 선언
const dashboardButton = {
  type: 1, // ActionRow
  components: [
    {
      type: 2,
      style: 1,
      label: "▶▶",
      custom_id: "skip_music"
    }
  ]
};

const getTimeString = (secondsRaw: string | number) => {
  const seconds = Number(secondsRaw);
  try {
    if (seconds >= 3600) {
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      const secondsLeft = seconds % 60;
      return `${hours}시간 ${minutes}분 ${secondsLeft}초`;
    } else if (seconds >= 60) {
      const minutes = Math.floor(seconds / 60);
      const secondsLeft = seconds % 60;
      return `${minutes}분 ${secondsLeft}초`;
    } else {
      return `${seconds}초`;
    }
  } catch(error) {
    console.error(error);
    return `${secondsRaw}초`;
  }
}

export default (client: Client) => {

  /**
   * 대시보드 메세지 빼고 전부 삭제
   */
  const deleteMsgWithOutDashboard = async () => {
    const channel = await client.channels.fetch(MUSIC_CHANNEL_ID);
    if (!channel) return;
    if (!(channel instanceof TextChannel)) return;
    const messagesToDelete = channel.messages.cache.filter(msg => msg.id !== dashboardMessage.id);
    await channel.bulkDelete(messagesToDelete);
  }

  /**
   * 봇이 켜졌을 때 실행될 코드
   */
  client.on("ready", async () => {
    try {
      // 음악 입력채널은 그냥 하드코딩으로 박아두기
      const channel = await client.channels.fetch(MUSIC_CHANNEL_ID);
      if (!channel) return;
      if (!(channel instanceof TextChannel)) return;

      const messages = await channel.messages.fetch({ limit: 100 });
      await channel.bulkDelete(messages);
      musicQueue = [];
      isMusicPlaying = false;

      const embed = new EmbedBuilder()
      .setTitle("<a:mms:1203330071667019776> 재생중인 음악이 없습니다.")
      .setDescription(
        "밍몽수용소의 유틸리티 봇인 **밍밍박사**입니다!\n여기서는 고음질의 음악을 재생해 드릴 수 있어요.\n유튜브 • 유튜브 뮤직 링크를 입력해보세요!\n\n저에게 문제가 발생했다면 <@269157371564130306>에게 알려주세요."
      )
      .setColor("#A668E0")
      .setFooter({
        text: "밍밍박사",
      })
      .setTimestamp();

      dashboardMessage = await channel.send({ embeds: [embed] });

      // 메세지 삭제, 접속해제 사이클
      (async () => {
        while (true) {
          // 접속 해제 사이클
          if (isMusicPlaying) {
            didntPlayStack = 0;
          } else {
            didntPlayStack++;
          }
          if (didntPlayStack >= 5) {
            try {
              const channel = await client.channels.fetch("1302975766253797396");
              if (!channel) return;
              if (!(channel instanceof TextChannel)) return;
              musicQueue = [];
              didntPlayStack = 0;
              deleteMsgWithOutDashboard();
              updateDashboard();
              const connection = getVoiceConnection(GUILD_ID);
              if (connection) {
                connection.disconnect();
                channel.send({
                  content: "5분 이상 아무런 음악도 재생하지 않아서 먼저 들어가볼께요! 필요하면 또 불러주세요. <a:1563pepekek:1144350182935371847>",
                });
              }
        } catch(error) {
              console.error(error);
            }
          }

          // 메세지 삭제 사이클
          const currentTime = Date.now();
          if (currentTime - lastMessageTime > 60000) {
            deleteMsgWithOutDashboard();
            lastMessageTime = currentTime;
          }
          await new Promise(resolve => setTimeout(resolve, 60000));
        }
      })();
    } catch(error) {
      console.error(error);
    }
  });

  /**
   * 메세지가 생성됐을 때 실행될 코드
   */
  client.on("messageCreate", async (message) => {
    try {
      const urlPattern = /^(https?|ftp):\/\/(-\.)?([^\s\/?\.#-]+\.?)+(\/[^\s]*)?$/i;
      if (message.author.bot) return; // 봇이 입력한 메세지는 무시
      if (!(message.channel instanceof TextChannel)) return;
      if (message.channel.id !== MUSIC_CHANNEL_ID) return; // 입력채널 필터링
      // if (message.channel.id !== MUSIC_CHANNEL_ID && message.channel.id !== "1327091415250894919") return;
      lastMessageTime = Date.now();

      // 예외처리) URL 형식이 아님
      if (!urlPattern.test(message.content)) {
        message.reply({
          content: "저는 유튜브와 유튜브 뮤직 링크만 알아들을 수 있어요. 여기서 잡담을 나누지 말아주세요! <a:pepe_diamondsword_en:1144350198030663740>",
          allowedMentions: { repliedUser: false }
        });
        return;
      }

      // 예외처리) 유튜브 관련 URL이 아님
      if (!ytdl.validateURL(message.content)) {
        message.reply({
          content: "제가 인식할 수 있는 유튜브 링크가 아니에요! 링크가 정상적인지 확인해봐요. <:pepe_cry:1056632607284137984>",
          allowedMentions: { repliedUser: false }
        });
        return;
      }

      // 분기처리) 음성채널 연결 상태 확인
      let connection = getVoiceConnection(message.guild!.id);
      if (!connection) {
        if (!message.member?.voice.channel) {
          message.reply({
            content: "음성채널에 접속해 있으셔야 제가 찾아 들어가죠! 접속한 다음 다시 말씀해주세요. <:pepe_lookat:1297462230232858656>",
            allowedMentions: { repliedUser: false }
          });
          return;
        }
      }
      // 일단 음성채널 접속 시도, 이미 접속해 있다면 이 단락은 지나쳐가질 것.
      // TODO: 개선점을 찾을 것
      connection = joinVoiceChannel({
        channelId: message.member!.voice.channel!.id,
        guildId: message.guild!.id,
        adapterCreator: message.guild!.voiceAdapterCreator,
      });

      // 음악 재생 대기열 추가
      const musicInfo = await ytdl.getInfo(message.content, { lang: "ko" });
      const musicDetails = musicInfo.videoDetails;
      message.reply({
        content: `좋아요! 말씀하신 링크의 음악을 대기열에 추가해드렸어요. <:happy_pepe:1144350228435185684>\n추가된 음악은 [**${musicDetails.author.name}**](<${musicDetails.author.channel_url}>) 님이 업로드한 [**${musicDetails.title}**](<${musicDetails.video_url}>) 입니다.`,
        allowedMentions: { repliedUser: false }
      });
      musicQueue.push({
        url: message.content,
        info: musicDetails,
        author: message.author.id
      });
      if (!isMusicPlaying) playMusic(connection!);
      updateDashboard();
    } catch(error) {
      console.error(error);
      message.reply({
        content: "저에게 문제가 생긴 것 같아요... <@269157371564130306>는 빨리 로그를 확인해주세요.",
        allowedMentions: { repliedUser: false }
      });
    }
  });

  /**
   * 음악 재생 함수
   * @param connection 음성 연결 상태
   */
  const playMusic = async (connection: VoiceConnection) => {
    try {
      if (musicQueue.length <= 0) {
        isMusicPlaying = false;
        const player = createAudioPlayer();
        connection.subscribe(player);
        player.stop();
        updateDashboard();
        return;
      }

      const channel = await client.channels.fetch("1302975766253797396");
      if (!channel) return;
      if (!(channel instanceof TextChannel)) return;
      const dashboard = await channel.messages.fetch(dashboardMessage.id);
      if (!dashboard) return;

      // ytdl-core로 유튜브 스트림을 가져오고
      const stream = ytdl(musicQueue[0].url, {
        filter: "audioonly",
        quality: "highestaudio",  // 기본적으로 최고 품질로 설정
      });

      // ffmpeg를 사용하여 오디오 품질을 향상
      if (!ffmpegPath) throw new Error("ffmpeg-static 찾을 수 없음");
      const ffmpeg: ChildProcessWithoutNullStreams = spawn(ffmpegPath, [
        '-i', 'pipe:0',            // 입력을 파이프로 받기
        '-vn',                     // 비디오 스트림을 제외
        '-acodec', 'libopus',      // opu 코덱 사용
        '-ab', '320k',             // 오디오 비트레이트 320kbps로 설정
        '-f', 'ogg',               // ogg 포맷으로 변환
        'pipe:1'                   // 출력을 파이프로 내보내기
      ]);

      // ffmpeg와 스트림을 연결
      stream.pipe(ffmpeg.stdin);

      // ffmpeg의 출력은 오디오 리소스로 변환하여 플레이어로 전달
      const resource = createAudioResource(ffmpeg.stdout);
      const player = createAudioPlayer();
      player.play(resource);
      connection.subscribe(player);
      isMusicPlaying = true;
      updateDashboard();

      // 음악 재생이 끝났을 때 다음 음악 재생
      player.once(AudioPlayerStatus.Idle, () => {
        musicQueue.shift(); // 재생이 끝난 음악 제거
        if (musicQueue.length > 0) {
          playMusic(connection); // 다음 음악 재생  
        } else {
          isMusicPlaying = false;
          updateDashboard();
        }
      });
    } catch (err) {
      console.log(`${timeStamp()} 음악 재생중 문제 발생:`)
      console.log(err)
    }
  };

  /**
   * 대시보드 업데이트 함수
   */
  const updateDashboard = async () => {
    const channel = await client.channels.fetch("1302975766253797396");
    if (!channel) return;
    if (!(channel instanceof TextChannel)) return;
    const dashboard = await channel.messages.fetch(dashboardMessage.id);
    if (!dashboard) return;

    try {
      if (isMusicPlaying) {

        let queueLabel = "";
        if (musicQueue.length > 1) {
          musicQueue.forEach((elem, index) => {
            if (index === 0) return;
            queueLabel += `> * [${elem.info.title}](${elem.url}) - <@${elem.author}>\n`;
          });
        } else {
          queueLabel += `> 대기열이 비어있습니다.`;
        }

        // 대시보드 업데이트
        const embed = new EmbedBuilder()
        .setTitle("<a:mms:1203330071667019776> 현재 재생중입니다")
        .setDescription(
        `> [**${musicQueue[0].info.title}**](${musicQueue[0].url})\n> [${musicQueue[0].info.author.name}](${musicQueue[0].info.author.channel_url}) **|** \`${getTimeString(musicQueue[0].info.lengthSeconds)}\` **|** <@${musicQueue[0].author}>`
        )
        .setColor("#A668E0")
        .setImage(musicQueue[0].info.thumbnails[3].url)
        .addFields({ name: ":page_with_curl: 대기열", value: `${queueLabel}` })
        .setFooter({
          text: "밍밍박사",
        })
        .setTimestamp();
        dashboard.edit({
          embeds: [embed],
          components: [dashboardButton]
        });
      } else {
        // 대시보드 업데이트
        const embed = new EmbedBuilder()
        .setTitle("<a:mms:1203330071667019776> 아직 재생중인 음악이 없습니다")
        .setDescription(
          "밍몽수용소의 유틸리티 봇인 **밍밍박사**입니다!\n여기서는 고음질의 음악을 재생해 드릴 수 있어요.\n유튜브 • 유튜브 뮤직 링크를 입력해보세요!\n\n저에게 문제가 발생했다면 <@269157371564130306>에게 알려주세요."
        )
        .setColor("#A668E0")
        .setFooter({
          text: "밍밍박사",
        })
        .setTimestamp();
        dashboard.edit({
          embeds: [embed],
          components: []
        });
      }
    } catch (err) {
      console.error(err);
      channel.send({
        content: "저에게 문제가 생긴 것 같아요... <@269157371564130306>는 빨리 로그를 확인해주세요."
      });
    }
  }

  // 버튼 클릭 이벤트 핸들러
  client.on('interactionCreate', async (interaction) => {
    if (!interaction.isButton()) return; // 버튼 클릭이 아닐 경우 무시

    if (interaction.customId === 'skip_music') {
      if (isMusicPlaying) {
        const connection = getVoiceConnection(interaction.guild!.id);
        if (!connection) return;
        // TODO: 현재 재생중인 음악 중지
        musicQueue.shift();
        playMusic(connection);
      interaction.reply({ content: "다음 음악으로 넘어갔습니다.", ephemeral: true });
      }
    }
  });
}