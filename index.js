require("dotenv").config();
const fs = require("fs");
const path = require("path");
const { Client, GatewayIntentBits, Partials, Events, EmbedBuilder, AttachmentBuilder } = require("discord.js");
const Canvas = require("canvas");
const http = require("http");

const PORT = process.env.PORT || 3000; // Render sets this automatically

http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("Bot is running!");
}).listen(PORT, () => {
  console.log(`🌐 Server is listening on port ${PORT} (for Render)`);
});

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.GuildMembers,
  ],
  partials: [Partials.Message, Partials.Channel, Partials.Reaction, Partials.GuildMember],
});

const roleMap = {
  "🧠": "1389934823551799388",
  "💻": "1389934863745945680",
  "🎨": "1389934910877470800",
  "🗞️": "1389934945396592741",

};

const dataPath = path.join(__dirname, "reactionData.json");
if (!fs.existsSync(dataPath)) {
  fs.writeFileSync(dataPath, JSON.stringify({ messageId: null }, null, 2));
}

function drawRoundedRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}
// === Bot Ready ===
client.once("ready", async () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
  const channel = client.channels.cache.get("1358086341694586991");
  if (!channel) return console.error("❌ Channel not found.");

  const data = JSON.parse(fs.readFileSync(dataPath, "utf8"));

  if (!data.messageId) {
    await channel.send({ content: `@everyone Choose your team roles below!` });

    const embed = new EmbedBuilder()
      .setColor("#8E5CB7")
      .setTitle("✨ Choose Your Squad")
      .setDescription(`
React to get your roles based on your interests:

🧠 — **Strategy**  
💻 — **Tech Team**  
🎨 — **Creative Team**  
🗞️ — **Media Team**  

_You can pick multiple roles 💫_
      `)
      .setFooter({ text: "Team Purple • Purple Movement 💜" });

    const msg = await channel.send({ embeds: [embed] });
    for (const emoji of Object.keys(roleMap)) {
      await msg.react(emoji);
    }

    fs.writeFileSync(dataPath, JSON.stringify({ messageId: msg.id }, null, 2));
    console.log("📌 Reaction role panel sent & saved.");
  } else {
    console.log("ℹ️ Reaction panel already exists. Skipping...");
  }
});

// === Handle Reaction Add ===
client.on(Events.MessageReactionAdd, async (reaction, user) => {
  if (reaction.partial) await reaction.fetch();
  if (user.bot) return;

  const emoji = reaction.emoji.name;

  // ❌ Remove invalid emoji
  if (!roleMap[emoji]) {
    try {
      await reaction.users.remove(user.id);
      console.log(`🚫 Removed invalid emoji (${emoji}) from ${user.tag}`);
    } catch (err) {
      console.error("⚠️ Couldn't remove emoji:", err);
    }
    return;
  }

  // ✅ Assign role
  const roleId = roleMap[emoji];
  const member = await reaction.message.guild.members.fetch(user.id);
  if (member) {
    try {
      await member.roles.add(roleId);
      console.log(`✅ Added ${emoji} to ${user.tag}`);
    } catch (err) {
      console.error("❌ Failed to add role:", err);
    }
  }
});

// === Handle Reaction Remove ===
client.on(Events.MessageReactionRemove, async (reaction, user) => {
  if (reaction.partial) await reaction.fetch();
  if (user.bot) return;

  const emoji = reaction.emoji.name;
  const roleId = roleMap[emoji];
  if (!roleId) return;

  const member = await reaction.message.guild.members.fetch(user.id);
  if (member) {
    try {
      await member.roles.remove(roleId);
      console.log(`🚫 Removed ${emoji} from ${user.tag}`);
    } catch (err) {
      console.error("❌ Failed to remove role:", err);
    }
  }
});

client.on(Events.GuildMemberAdd, async (member) => {
// PURPLER role ID
  const welcomeRoleId = "1389650556288499855"; 

  const role = member.guild.roles.cache.get(welcomeRoleId);
  if (!role) {
    console.warn("⚠️ Purpler role not found!");
    return;
  }

  try {
    await member.roles.add(role);
    console.log(`✅ Gave welcome role to ${member.user.tag}`);
  } catch (error) {
    console.error("❌ Failed to assign welcome role:", error);
  }


  //  Create welcome image
  const channel = member.guild.systemChannel; 
  if (!channel) return;

  const canvas = Canvas.createCanvas(960, 540);
  const ctx = canvas.getContext("2d");

 
  ctx.save();
  drawRoundedRect(ctx, 0, 0, canvas.width, canvas.height, 40);
  ctx.clip();

  const background = await Canvas.loadImage(path.join(__dirname, "background.jpeg"));
  ctx.drawImage(background, 0, 0, canvas.width, canvas.height);
  ctx.restore();

  // Avatar
  const avatar = await Canvas.loadImage(
    member.user.displayAvatarURL({ extension: "png", size: 256 })
  );

  const avatarX = 100;
  const avatarY = 120;
  const avatarSize = 250;

  ctx.save();
  ctx.beginPath();
  ctx.arc(
    avatarX + avatarSize / 2,
    avatarY + avatarSize / 2,
    avatarSize / 2,
    0,
    Math.PI * 2
  );
  ctx.closePath();
  ctx.clip();
  ctx.drawImage(avatar, avatarX, avatarY, avatarSize, avatarSize);
  ctx.restore();

  // Text
  ctx.shadowColor = "black";
  ctx.shadowBlur = 10;

  ctx.font = "32px ";
  ctx.fillStyle = "#D9D9D9";
  ctx.fillText("WELCOME", 420, 180);

  ctx.font = "bold 50px ";
  ctx.fillStyle = "#FFFFFF";
  ctx.fillText(`${member.displayName}`, 420, 240);

  ctx.font = "bold 30px ";
  ctx.fillStyle = "#540FAE";
  ctx.fillText("PURPLER", 420, 300);

  // Send image
  const attachment = new AttachmentBuilder(canvas.toBuffer("image/png"), {
    name: "welcome.png",
  });

  channel.send({
    content: `Hey <@${member.id}> ! Welcome to the Purple Movement 💜`,
    files: [attachment],
  });
});

client.login(process.env.DISCORD_TOKEN);
