const {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  PermissionsBitField,
} = require("discord.js");
const dotenv = require("dotenv");
const fs = require("fs");

dotenv.config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

const PREFIX = ">";
const CONFIG_FILE = "./config.json";

// Load config
let config = {};
if (fs.existsSync(CONFIG_FILE)) {
  config = JSON.parse(fs.readFileSync(CONFIG_FILE, "utf8"));
} else {
  fs.writeFileSync(CONFIG_FILE, JSON.stringify({}, null, 2));
}

// Save config function
function saveConfig() {
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
}

// Bot Ready
client.once("ready", () => {
  console.log(`✅ Bot is online as ${client.user.tag}`);
});

// Welcome Event
client.on("guildMemberAdd", (member) => {
  const guildId = member.guild.id;
  const welcomeChannelId = config[guildId]?.welcomeChannelId;

  if (!welcomeChannelId) return;

  const welcomeChannel = member.guild.channels.cache.get(welcomeChannelId);
  if (!welcomeChannel) return;

  const embed = new EmbedBuilder()
    .setColor(0x00ff88)
    .setTitle("🎉 Welcome!")
    .setDescription(
      `Hey ${member} (${member.user.tag}), welcome to **${member.guild.name}**! 👋`,
    )
    .setThumbnail(member.user.displayAvatarURL({ size: 512 }))
    .addFields({
      name: "Total Members",
      value: `${member.guild.memberCount}`,
      inline: true,
    })
    .setTimestamp();

  welcomeChannel.send({ embeds: [embed] });
});

// Command Handler
client.on("messageCreate", (message) => {
  if (!message.content.startsWith(PREFIX) || message.author.bot) return;

  const args = message.content.slice(PREFIX.length).trim().split(/ +/);
  const command = args.shift().toLowerCase();
  const guildId = message.guild.id;

  // Help Command
  if (command === "help") {
    const embed = new EmbedBuilder()
      .setColor(0x7289da)
      .setTitle("📜 Bot Commands")
      .addFields(
        { name: ">help", value: "Shows this help menu" },
        { name: ">links", value: "Shows useful links" },
        {
          name: ">setwelcome <#channel>",
          value: "Sets the welcome channel (Admin only)",
        },
      )
      .setTimestamp();

    message.channel.send({ embeds: [embed] });
  }

  // Links Command
  else if (command === "links") {
    const embed = new EmbedBuilder()
      .setColor(0x00aaff)
      .setTitle("🔗 Useful Links")
      .setDescription("Here are some important links:")
      .addFields(
        {
          name: "Website",
          value: "[Visit](https://example.com)",
          inline: true,
        },
        {
          name: "Invite",
          value: "[Join](https://discord.gg/example)",
          inline: true,
        },
      )
      .setTimestamp();

    message.channel.send({ embeds: [embed] });
  }

  // Set Welcome Channel Command
  else if (command === "setwelcome") {
    if (
      !message.member.permissions.has(PermissionsBitField.Flags.Administrator)
    ) {
      return message.reply(
        "❌ You need **Administrator** permission to use this command.",
      );
    }

    const channel =
      message.mentions.channels.first() ||
      message.guild.channels.cache.get(args[0]);

    if (!channel) {
      return message.reply(
        "❌ Please mention a channel or provide a valid channel ID.\nExample: `>setwelcome #welcome`",
      );
    }

    if (!config[guildId]) config[guildId] = {};
    config[guildId].welcomeChannelId = channel.id;
    saveConfig();

    const embed = new EmbedBuilder()
      .setColor(0x00ff00)
      .setTitle("✅ Success")
      .setDescription(`Welcome channel has been set to ${channel}`);

    message.channel.send({ embeds: [embed] });
  }
});

client.login(process.env.TOKEN);
