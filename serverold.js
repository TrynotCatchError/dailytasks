const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const axios = require('axios');
const mysql = require('mysql2/promise');
const path = require('path');
const { timeStamp } = require('console');
const app = express();
const port = process.env.PORT || 3000;

const LINE_ACCESS_TOKEN = 'MlpEQ/yCJ4H+dwS+vexkiW2Vzjmjb6OX+4QtPlpQvDl6lWrH12ZHRq+nYag058mjeD3sxlT9wSl0SnEnoZ9z/oyuHze2++YIQwIGjFoNNUTmRqjL8+vYrgEA1pnEcRJrhgWZfNXKoJxIXtndSgWbNgdB04t89/1O/w1cDnyilFU=';

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// === MySQL Pool ===
// === MySQL Pool ===
const dbPool = mysql.createPool({
    host: process.env.DB_HOST || 'dev.karinssk.com',
    user: process.env.DB_USER || 'karinssk_dojobdb',
    password: process.env.DB_PASSWORD || 'Q#u8cWt9jz^hyH1q',
    database: process.env.DB || 'karinssk_dojobdb',
    port: process.env.DB_PORT || '3306',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  });
  







app.use(bodyParser.json());

// Health check endpoint
app.get('/', (req, res) => {
  res.status(200).send('LINE Webhook API is running');
});

app.get('/webhook', (req, res) => {
  res.status(200).send('LINE Webhook API is running');
});


const messageQueue = new Map(); // Map to store pending messages by user
const MESSAGE_WAIT_TIME = 5000; // 5 seconds wait time

app.post('/webhook', async (req, res) => {
  try {
    const events = req.body.events;
    console.log('Received webhook events:', JSON.stringify(events));

    // Process events immediately to acknowledge receipt
    res.status(200).send('OK');

    for (const event of events) {
      const userId = event.source?.userId || 'unknown';
      const timestamp = new Date(event.timestamp);

      // Get user profile for all events
      const userProfile = await getLineUserProfile(userId);
      
      if (event.type === 'message') {
        const msg = event.message;

        if (msg.type === 'text') {
          const text = msg.text;
          const isCommand = ['#create', '#update', '#delete', '#findmore', '#findall', '#newtask','#many','#hi'].some(cmd => 
            text.toLowerCase().startsWith(cmd)
          );
          
          if (isCommand) {
            // Process commands immediately
            await handleTextMessage(event.replyToken, userId, text, timestamp, userProfile);
          } else {
            // For non-command messages, add to queue and process after delay
            queueMessage(userId, 'text', event.replyToken, text, null, timestamp, userProfile);
          }
        } else if (msg.type === 'image') {
          // For images, download immediately but queue for processing
          const imageContent = await getLineContent(msg.id);
          const imagePath = await saveImageLocally(msg.id, imageContent);
          await storeImageMessage(userId, msg.id, timestamp);
          
          // Add to queue
          queueMessage(userId, 'image', event.replyToken, null, imagePath, timestamp, userProfile);
        }
      } else if (event.type === 'follow') {
        // Handle new user following the bot immediately
        await handleNewFollower(userId, userProfile);
        await replyToUser(event.replyToken, `Welcome ${userProfile.displayName}! You can use commands like #create, #update, or #delete to manage your projects and tasks.`);
      }
    }
  } catch (error) {
    console.error('Error processing webhook:', error);
  }
});

function queueMessage(userId, type, replyToken, text, imagePath, timestamp, userProfile) {
  // Check if user already has a queue
  if (!messageQueue.has(userId)) {
    messageQueue.set(userId, {
      replyToken: replyToken,
      messages: [],
      timer: null,
      userProfile: userProfile
    });
  }
  
  const userQueue = messageQueue.get(userId);
  
  // Update reply token to the most recent one
  userQueue.replyToken = replyToken;
  
  // Add message to queue
  userQueue.messages.push({
    type: type,
    text: text,
    imagePath: imagePath,
    timestamp: timestamp
  });
  
  // Clear existing timer if any
  if (userQueue.timer) {
    clearTimeout(userQueue.timer);
  }
  
  // Set new timer to process messages after delay
  userQueue.timer = setTimeout(() => {
    processQueuedMessages(userId);
  }, MESSAGE_WAIT_TIME);
}














// === Get LINE User Profile ===
async function getLineUserProfile(userId) {
  try {
    const response = await axios.get(`https://api.line.me/v2/bot/profile/${userId}`, {
      headers: {
        Authorization: `Bearer ${LINE_ACCESS_TOKEN}`
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error getting LINE user profile:', error.response?.data || error.message);
    return { displayName: 'Unknown User', userId: userId };
  }
}

// === Get LINE Content (for images) ===
async function getLineContent(messageId) {
  try {
    const response = await axios.get(`https://api-data.line.me/v2/bot/message/${messageId}/content`, {
      headers: {
        Authorization: `Bearer ${LINE_ACCESS_TOKEN}`
      },
      responseType: 'arraybuffer'
    });
    return response.data;
  } catch (error) {
    console.error('Error getting LINE content:', error.response?.data || error.message);
    throw error;
  }
}








// Function to get combined user information
async function getCombinedUserInfo(userId, userProfile) {
  try {
    // Get the rise_user_id from mapping
    const riseUserId = await getRiseUserIdFromLineId(userId);
    
    if (!riseUserId) {
      // If no mapping exists, just return LINE profile info
      return {
        displayName: userProfile.displayName,
        userId: userId,
        // Add other LINE profile fields as needed
      };
    }
    
    // Fetch the Rise user details
    const [riseUsers] = await dbPool.query(
      'SELECT * FROM user_mappings WHERE id = ? AND deleted = 0',
      [riseUserId]
    );
    
    if (riseUsers.length === 0) {
      // If Rise user not found, just return LINE profile info
      return {
        displayName: userProfile.displayName,
        userId: userId,
        // Add other LINE profile fields as needed
      };
    }
    
    const riseUser = riseUsers[0];
    
    // Combine information from both sources
    return {
      // LINE info
      lineDisplayName: userProfile.displayName,
      userId: userId,
      linePictureUrl: userProfile.pictureUrl,
      lineStatusMessage: userProfile.statusMessage,
      
      // Rise user info
      riseUserId: riseUser.id,
      firstName: riseUser.first_name,
      lastName: riseUser.last_name,
      email: riseUser.email,
      jobTitle: riseUser.job_title,
      
      // Combined fields
      fullName: `${riseUser.first_name} ${riseUser.last_name}`,
      combinedName: `${userProfile.displayName} (${riseUser.first_name} ${riseUser.last_name})`,
      
      // Add any other fields you need
    };
  } catch (error) {
    console.error('Error getting combined user info:', error);
    // Return basic info in case of error
    return {
      displayName: userProfile.displayName,
      userId: userId
    };
  }
}



















// === Save Image Locally ===
async function saveImageLocally(messageId, imageContent) {
    try {
      // Generate a timestamp that will be used in the database
      const timestamp = new Date().toISOString().replace(/:/g, '-');
      
      // Create uploads directory if it doesn't exist
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
        console.log(`Created uploads directory: ${uploadsDir}`);
      }
      
      // Instead of saving with the original name, directly save with the expense file format
      const uniqueTimestamp = new Date().getTime().toString(16); // Use hex timestamp for shorter name
      const filename = `project_comment${uniqueTimestamp}-${messageId}_${timestamp}.jpg`;
      const filepath = path.join(uploadsDir, filename);
      
      fs.writeFileSync(filepath, Buffer.from(imageContent));
      console.log(`Image saved locally: ${filepath}`);
      return filepath;
    } catch (error) {
      console.error('Error saving image locally:', error);
      throw error;
    }
  }
// === Handle New Follower ===
async function handleNewFollower(userId, userProfile) {
  try {
    // Check if user already exists in mapping table
    const [existingUsers] = await dbPool.query(
      'SELECT * FROM user_mappings WHERE line_user_id = ?',
      [userId]
    );

    if (existingUsers.length === 0) {
      // Try to find a matching rise_user
      const riseUserId = await findOrCreateRiseUser(userProfile);
      
      // Default nickname is the same as display name, can be updated later
      const nickname = userProfile.displayName;
      
      // Insert into user_mappings with nickname
      await dbPool.query(
        'INSERT INTO user_mappings (line_user_id, line_display_name, nick_name, rise_user_id) VALUES (?, ?, ?, ?)',
        [userId, userProfile.displayName, nickname, riseUserId]
      );
      
      console.log(`New follower mapped: LINE user ${userId} (${userProfile.displayName}) -> Rise user ${riseUserId}`);
    }
  } catch (error) {
    console.error('Error handling new follower:', error);
  }
}







async function getNickname(userId) {
  try {
    const [rows] = await dbPool.query(
      'SELECT nick_name FROM user_mappings WHERE line_user_id = ?',
      [userId]
    );
    
    if (rows.length > 0) {
      return rows[0].nick_name;
    } else {
      return null; // User not found
    }
  } catch (error) {
    console.error('Error getting nickname:', error);
    return null;
  }
}











// === Update User Nickname ===
async function updateUserNickname(lineUserId, nickname) {
  try {
    const [result] = await dbPool.query(
      'UPDATE user_mappings SET nick_name = ? WHERE line_user_id = ?',
      [nickname, lineUserId]
    );
    
    if (result.affectedRows > 0) {
      console.log(`Updated nickname for LINE user ${lineUserId} to "${nickname}"`);
      return true;
    } else {
      console.warn(`No user mapping found for LINE user ${lineUserId}`);
      return false;
    }
  } catch (error) {
    console.error('Error updating user nickname:', error);
    return false;
  }
}


// === Get User Info from LINE User ID ===
async function getUserInfoFromLineId(lineUserId) {
  try {
    // First check user_mappings table
    const [mappings] = await dbPool.query(
      'SELECT rise_user_id, nick_name, line_display_name FROM user_mappings WHERE line_user_id = ?',
      [lineUserId]
    );

    if (mappings.length > 0) {
      return {
        riseUserId: mappings[0].rise_user_id,
        nickname: mappings[0].nick_name || mappings[0].line_display_name, // Fallback to display name if nickname is null
        displayName: mappings[0].line_display_name
      };
    }

    // Then check line_user_map table (legacy)
    const [lineUserMap] = await dbPool.query(
      'SELECT rise_user_id FROM line_user_map WHERE line_user_id = ?',
      [lineUserId]
    );

    if (lineUserMap.length > 0) {
      // For legacy mappings, we don't have nickname
      return {
        riseUserId: lineUserMap[0].rise_user_id,
        nickname: null,
        displayName: null
      };
    }

    return null;
  } catch (err) {
    console.error('[DB] Error getting user info:', err.message);
    return null;
  }
}










// === Handle Text Message ===
async function handleTextMessage(replyToken, userId, text, timestamp, userProfile) {
  // Update this line to include #newtask in the commands array
  const commands = ['#create', '#update', '#delete', '#findmore', '#findall', '#newtask','#many','#close',"#hi"];
  const detected = commands.find(cmd => text.toLowerCase().startsWith(cmd));
  
  const nickname = await getNickname(userId);

  if (detected) {
    const command = detected.replace('#', '');
    const content = text.replace(detected, '').trim();

    // Save to local file
    saveToFile(`${command}_${timestamp.getTime()}.txt`, content);
    
    // Store in database
    await storeTextMessage(userId, text, command, content, timestamp);

    // Process command
    if (command === 'create') {
      // Extract title, description, and mentioned users
      let title = content;
      let description = "";
      let mentionedUsers = [];
      
      // Extract title and description (split by colon)
      if (content.includes(':')) {
        const parts = content.split(':');
        title = parts[0].trim();
        description = parts.slice(1).join(':').trim();
      }
      
      // Extract mentioned users (format: @username)
      const mentionRegex = /@(\S+)/g;
      let match;
      let descriptionWithoutMentions = description;
      
      while ((match = mentionRegex.exec(description)) !== null) {
        mentionedUsers.push(match[1]);
        // Remove mentions from description
        descriptionWithoutMentions = descriptionWithoutMentions.replace(match[0], '').trim();
      }
      
      // Create the project
      const projectResult = await createProject(title + ': ' + descriptionWithoutMentions, userId, userProfile);
      
      // Check if this is a duplicate project
      if (projectResult && typeof projectResult === 'object' && projectResult.isDuplicate) {
        await replyToUser(replyToken, projectResult.message);
        return;
      }
      
      if (!projectResult) {
        await replyToUser(replyToken, "ไม่สามารถสร้างโปรเจคได้ กรุณาลองใหม่อีกครั้ง");
        return;
      }
      
      const projectId = projectResult;
      
      // Get current date/time in Thai format
      const currentDate = new Date();
      const thaiDate = `${currentDate.getDate()}/${currentDate.getMonth() + 1}/${currentDate.getFullYear() + 543}`;
      
      // Format the reply message
      let replyMessage = `สร้างโปรเจค: ${title} ของ พี่ ${nickname || userProfile.displayName} เรียบร้อยแล้วค่ะ`;
      
      // Add description if available
      if (descriptionWithoutMentions) {
        replyMessage += `\n\nรายละเอียดดังนี้\n${descriptionWithoutMentions}`;
      }
      
      // Add responsible users
      replyMessage += `\n\nผู้รับผิดชอบ`;
      replyMessage += `\n1. ${nickname || userProfile.displayName} (เจ้าของโปรเจค)`;
      
      // Create tasks for mentioned users and add them to the reply
      if (mentionedUsers.length > 0) {
        const riseUserId = await getRiseUserIdFromLineId(userId);
        
        for (let i = 0; i < mentionedUsers.length; i++) {
          const mentionedUser = mentionedUsers[i];
          
          // Try to find the LINE user ID from the mention
          const mentionedLineUserId = mentionedUser;
          const mentionedNickname = await getNickname(mentionedLineUserId);
          const mentionedRiseUserId = await getRiseUserIdFromLineId(mentionedLineUserId);
          
          if (mentionedRiseUserId) {
            // Create a task for this user
            await dbPool.query(`
              INSERT INTO rise_tasks (
                title, 
                description, 
                project_id, 
                assigned_to, 
                status,
                status_id,
                priority_id,
                created_date,
                context
              ) VALUES (?, ?, ?, ?, 'to_do', 1, 1, CURDATE(), 'project')
            `, [title, `Task assigned by ${nickname || userProfile.displayName}: ${descriptionWithoutMentions}`, projectId, mentionedRiseUserId]);
            
            // Add to reply message
            replyMessage += `\n${i + 2}. @${mentionedUser} ${mentionedNickname || ''}`;
          }
        }
      }
      
      // Add start date
      replyMessage += `\n\nเริ่มงานวันที่ ${thaiDate} ค่ะ`;
      
      await replyToUser(replyToken, replyMessage);
    } else if (command === 'update') {
      // For update, first try to find the project by name
      if (!content.includes(':')) {
        await replyToUser(replyToken, "กรุณาระบุชื่อโปรเจคและรายละเอียดที่ต้องการอัพเดท เช่น #update ชื่อโปรเจค: รายละเอียดที่อัพเดท");
        return;
      }
      
      const parts = content.split(':');
      const projectName = parts[0].trim();
      const updateContent = parts.slice(1).join(':').trim();
      
      // Get rise_user_id
      const riseUserId = await getRiseUserIdFromLineId(userId);
      
      if (!riseUserId) {
        await replyToUser(replyToken, "ไม่พบข้อมูลผู้ใช้ของคุณ");
        return;
      }
      
      // Find project by name
      const [projects] = await dbPool.query(`
        SELECT id, title FROM rise_projects 
        WHERE title LIKE ? AND (created_by = ? OR client_id = ?) AND deleted = 0
        LIMIT 1
      `, [`%${projectName}%`, riseUserId, riseUserId]);
      
      if (projects.length === 0) {
        await replyToUser(replyToken, `ไม่พบโปรเจค "${projectName}" กรุณาพิมพ์ #findmore เพื่อค้นหาโปรเจคของคุณ`);
        return;
      }
      
      const projectId = projects[0].id;
      const exactProjectName = projects[0].title;
      
      // Update the project
      await dbPool.query(`
        UPDATE rise_projects 
        SET description = CONCAT(IFNULL(description, ''), '\n\nUpdate on ', NOW(), ':\n', ?)
        WHERE id = ?
      `, [updateContent, projectId]);
      
      // Create a task to track the update
      await dbPool.query(`
        INSERT INTO rise_tasks (
          title, 
          description, 
          project_id, 
          assigned_to, 
          status,
          status_id,
          priority_id,
          created_date,
          context
        ) VALUES (?, ?, ?, ?, 'to_do', 1, 1, CURDATE(), 'project')
      `, [`Update ${new Date().toLocaleDateString('th-TH')}`, updateContent, projectId, riseUserId]);
      
      await replyToUser(replyToken, `อัพเดทโปรเจค "${exactProjectName}" เรียบร้อยแล้วค่ะ\n\nรายละเอียดที่อัพเดท:\n${updateContent}`);
    } else if (command === 'delete') {
      const result = await deleteProject(content, userId);
      await replyToUser(replyToken, `Delete processed: ${result}`);
    } else if (command === 'findmore') {
      // Find user's projects
      const riseUserId = await getRiseUserIdFromLineId(userId);
      
      if (!riseUserId) {
        await replyToUser(replyToken, "ไม่พบข้อมูลผู้ใช้ของคุณ");
        return;
      }
      
      const [projects] = await dbPool.query(`
        SELECT id, title, created_date 
        FROM rise_projects 
        WHERE (created_by = ? OR client_id = ?) AND deleted = 0
        ORDER BY created_date DESC
        LIMIT 20
      `, [riseUserId, riseUserId]);
      
      if (projects.length === 0) {
        await replyToUser(replyToken, "คุณยังไม่มีโปรเจคใดๆ ลองสร้างโปรเจคใหม่ด้วยคำสั่ง #create");
        return;
      }
      
      // Format the reply
      let replyMessage = `โปรเจคของคุณ ${nickname || userProfile.displayName}\n\n`;
      
      projects.forEach((project, index) => {
        const createdDate = new Date(project.created_date);
        const thaiDate = `${createdDate.getDate()}/${createdDate.getMonth() + 1}/${createdDate.getFullYear() + 543}`;
        replyMessage += `${index + 1}. ${project.title}: created ${thaiDate}\n`;
      });
      
      replyMessage += "\nคุณสามารถอัพเดทโปรเจคด้วยคำสั่ง #update ชื่อโปรเจค: รายละเอียดที่อัพเดท";
      
      await replyToUser(replyToken, replyMessage);
    } else if (command === 'findall') {
      // Find all active projects (limit to recent ones)
      const [projects] = await dbPool.query(`
        SELECT p.id, p.title, p.created_date, u.first_name, u.last_name, um.nick_name
        FROM rise_projects p
        JOIN rise_users u ON p.created_by = u.id
        LEFT JOIN user_mappings um ON p.created_by = um.rise_user_id
        WHERE p.deleted = 0
        ORDER BY p.created_date DESC
        LIMIT 20
      `);
      
      if (projects.length === 0) {
        await replyToUser(replyToken, "ไม่พบโปรเจคใดๆ ในระบบ");
        return;
      }
      
      // Format the reply
      let replyMessage = "โปรเจคทั้งหมดในระบบ\n\n";
      
      projects.forEach((project, index) => {
        const createdDate = new Date(project.created_date);
        const thaiDate = `${createdDate.getDate()}/${createdDate.getMonth() + 1}/${createdDate.getFullYear() + 543}`;
        const ownerName = project.nick_name || `${project.first_name} ${project.last_name}`;
        replyMessage += `${index + 1}. ${project.title} (${ownerName}): created ${thaiDate}\n`;
      });
      
      await replyToUser(replyToken, replyMessage);
    } else if (command === 'newtask') {
      // Extract project name, task title, and description
      if (!content.includes(':')) {
        await replyToUser(replyToken, "กรุณาระบุชื่อโปรเจคและรายละเอียดงาน เช่น #newtask ชื่อโปรเจค: หัวข้องาน: รายละเอียดงาน");
        return;
      }
      
      const parts = content.split(':');
      if (parts.length < 3) {
        await replyToUser(replyToken, "กรุณาระบุให้ครบถ้วน เช่น #newtask ชื่อโปรเจค: หัวข้องาน: รายละเอียดงาน");
        return;
      }
      
      const projectName = parts[0].trim();
      const taskTitle = parts[1].trim();
      const taskDescription = parts.slice(2).join(':').trim();
      
      // Get rise_user_id
      const riseUserId = await getRiseUserIdFromLineId(userId);
      
      if (!riseUserId) {
        await replyToUser(replyToken, "ไม่พบข้อมูลผู้ใช้ของคุณ");
        return;
      }
      
      // Find project by name
      const [projects] = await dbPool.query(`
        SELECT id, title FROM rise_projects 
        WHERE title LIKE ? AND deleted = 0
        LIMIT 1
      `, [`%${projectName}%`]);
      
      if (projects.length === 0) {
        await replyToUser(replyToken, `ไม่พบโปรเจค "${projectName}" กรุณาสร้างโปรเจคก่อน หรือค้นหาโปรเจคของคุณ`);
        return;
      }
      
      const projectId = projects[0].id;
      const exactProjectName = projects[0].title;
      
      // Extract mentioned users (format: @username with possible spaces and special characters)
      let collaborators = [];
      let descriptionWithoutMentions = taskDescription;
      
      // First, find all potential mentions starting with @
      const mentionMatches = taskDescription.match(/@[^\s@]+(\s+[^@]+?)(?=\s+@|\s*$)/g) || [];
      
      for (const mention of mentionMatches) {
        // Remove the @ symbol
        const username = mention.substring(1).trim();
        collaborators.push(username);
        
        // Remove this mention from the description
        descriptionWithoutMentions = descriptionWithoutMentions.replace(mention, '').trim();
      }
      
      // Format collaborators for the database (comma-separated list of rise_user_ids)
      let collaboratorIds = [];
      let collaboratorNames = [];
      
      for (const collaborator of collaborators) {
        // Look up the LINE user ID based on the display name
        const [matchingUsers] = await dbPool.query(`
          SELECT line_user_id, nick_name, line_display_name 
          FROM user_mappings 
          WHERE line_display_name LIKE ?
        `, [`%${collaborator}%`]);
        
        if (matchingUsers.length > 0) {
          // Use the first matching user
          const matchedUser = matchingUsers[0];
          const collaboratorLineUserId = matchedUser.line_user_id;
          const collaboratorNickname = matchedUser.nick_name || '';
          const collaboratorDisplayName = matchedUser.line_display_name || '';
          const collaboratorRiseUserId = await getRiseUserIdFromLineId(collaboratorLineUserId);
          
          if (collaboratorRiseUserId) {
            collaboratorIds.push(collaboratorRiseUserId);
            collaboratorNames.push({
              id: collaboratorRiseUserId,
              lineUserId: collaboratorLineUserId,
              nickname: collaboratorNickname,
              displayName: collaboratorDisplayName,
              mentionText: collaborator // The text used in the mention
            });
          }
        } else {
          // If no match found, still keep the mention for display purposes
          collaboratorNames.push({
            id: null,
            lineUserId: null,
            nickname: null,
            displayName: collaborator,
            mentionText: collaborator
          });
        }
      }
      
      // Create the task
      const [taskResult] = await dbPool.query(`
        INSERT INTO rise_tasks (
          title, 
          description, 
          project_id, 
          assigned_to, 
          collaborators,
          status,
          status_id,
          priority_id,
          created_date,
          context
        ) VALUES (?, ?, ?, ?, ?, 'to_do', 1, 1, CURDATE(), 'project')
      `, [taskTitle, descriptionWithoutMentions, projectId, riseUserId, collaboratorIds.join(',')]);
      
      // Format the reply message
      let replyMessage = `สร้างงาน "${taskTitle}" ในโปรเจค "${exactProjectName}" เรียบร้อยแล้วค่ะ`;
      
      // Add description if available
      if (descriptionWithoutMentions) {
        replyMessage += `\n\nรายละเอียด:\n${descriptionWithoutMentions}`;
      }
      
      // Add collaborators if any
      if (collaboratorNames.length > 0) {
        replyMessage += `\n\nผู้ร่วมงาน:`;
        collaboratorNames.forEach((collab, index) => {
          replyMessage += `\n${index + 1}. @${collaborators[index]} ${collab.name || ''}`;
        });
      }
      
      await replyToUser(replyToken, replyMessage);
    }




   // In the handleTextMessage function, add this new command handler after the other command handlers:

else if (command === 'many') {
  // This command creates multiple tasks for different users in the default monthly project
  
  // First, check if the content has the required format
  if (!content.includes(':')) {
    await replyToUser(replyToken, "กรุณาระบุชื่อโปรเจคและรายละเอียดงาน เช่น #many งานรายวัน: รายละเอียดงานของคุณ @user1 งานของ user1 @user2 งานของ user2");
    return;
  }
  
  const parts = content.split(':');
  const projectName = parts[0].trim();
  const taskContent = parts.slice(1).join(':').trim();
  
  // Get the current user's info
  const riseUserId = await getRiseUserIdFromLineId(userId);
  const nickname = await getNickname(userId);
  
  if (!riseUserId) {
    await replyToUser(replyToken, "ไม่พบข้อมูลผู้ใช้ของคุณ");
    return;
  }
  
  // Get or create the monthly project
  const projectId = await getOrCreateMonthlyProject(userId, userProfile);
  
  if (!projectId) {
    await replyToUser(replyToken, "ไม่สามารถสร้างหรือค้นหาโปรเจคได้");
    return;
  }
  
  // Split the content by @ to get tasks for different users
  // First part is for the main user
  const taskParts = taskContent.split('@');
  const mainUserTask = taskParts[0].trim();
  
  // Create a task for the main user
  let tasksCreated = 0;
  
  if (mainUserTask) {
    const [mainTaskResult] = await dbPool.query(`
      INSERT INTO rise_tasks (
        title, 
        description, 
        project_id, 
        assigned_to, 
        status,
        status_id,
        priority_id,
        created_date,
        context
      ) VALUES (?, ?, ?, ?, 'to_do', 1, 1, CURDATE(), 'project')
    `, [`งานรายวัน ${userProfile.displayName} ${nickname ? `|| ${nickname}` : ''}`, mainUserTask, projectId, riseUserId]);
    
    tasksCreated++;
  }
  
  // Process tasks for other users
  const otherUserTasks = [];
  
  for (let i = 1; i < taskParts.length; i++) {
    const userTaskPart = taskParts[i].trim();
    
    // Find the first space to separate username from task
    const firstSpaceIndex = userTaskPart.indexOf(' ');
    if (firstSpaceIndex === -1) continue; // Skip if no space found
    
    const mentionedUser = userTaskPart.substring(0, firstSpaceIndex).trim();
    const userTaskDescription = userTaskPart.substring(firstSpaceIndex + 1).trim();
    
    // Look up the user in the database
    const [matchingUsers] = await dbPool.query(`
      SELECT line_user_id, nick_name, line_display_name, rise_user_id
      FROM user_mappings 
      WHERE line_display_name LIKE ?
    `, [`%${mentionedUser}%`]);
    
    if (matchingUsers.length > 0) {
      const matchedUser = matchingUsers[0];
      const userLineId = matchedUser.line_user_id;
      const userRiseId = matchedUser.rise_user_id;
      const userNickname = matchedUser.nick_name || '';
      const userDisplayName = matchedUser.line_display_name || '';
      
      if (userRiseId) {
        // Create a task for this user
        const [userTaskResult] = await dbPool.query(`
          INSERT INTO rise_tasks (
            title, 
            description, 
            project_id, 
            assigned_to, 
            status,
            status_id,
            priority_id,
            created_date,
            context
          ) VALUES (?, ?, ?, ?, 'to_do', 1, 1, CURDATE(), 'project')
        `, [`งานรายวัน ${userDisplayName} ${userNickname ? `|| ${userNickname}` : ''}`, userTaskDescription, projectId, userRiseId]);
        
        otherUserTasks.push({
          displayName: userDisplayName,
          nickname: userNickname,
          description: userTaskDescription
        });
        
        tasksCreated++;
      }
    }
  }
  
  // Format the reply message
  let replyMessage = `สร้างงานรายวันในโปรเจค "${projectName}" เรียบร้อยแล้วค่ะ\n\nสร้างทั้งหมด ${tasksCreated} งาน:`;
  
  // Add main user's task
  if (mainUserTask) {
    replyMessage += `\n\n1. ${userProfile.displayName} ${nickname ? `(${nickname})` : ''}:\n${mainUserTask}`;
  }
  
  // Add other users' tasks
  otherUserTasks.forEach((task, index) => {
    replyMessage += `\n\n${index + 2}. ${task.displayName} ${task.nickname ? `(${task.nickname})` : ''}:\n${task.description}`;
  });
  
  await replyToUser(replyToken, replyMessage);
}





// In the handleTextMessage function, add this new command handler after the other command handlers:

else if (command === 'close') {
  // This command creates a final task and closes the project
  
  // First, check if the content has the required format
  if (!content.includes(':')) {
    await replyToUser(replyToken, "กรุณาระบุชื่อโปรเจคและรายละเอียดการปิดงาน เช่น #close ชื่อโปรเจค: รายละเอียดการปิดงาน");
    return;
  }
  
  const parts = content.split(':');
  const projectName = parts[0].trim();
  const closeDescription = parts.slice(1).join(':').trim();
  
  // Get rise_user_id
  const riseUserId = await getRiseUserIdFromLineId(userId);
  
  if (!riseUserId) {
    await replyToUser(replyToken, "ไม่พบข้อมูลผู้ใช้ของคุณ");
    return;
  }
  
  // Find project by name
  const [projects] = await dbPool.query(`
    SELECT id, title FROM rise_projects 
    WHERE title LIKE ? AND deleted = 0
    LIMIT 1
  `, [`%${projectName}%`]);
  
  if (projects.length === 0) {
    await replyToUser(replyToken, `ไม่พบโปรเจค "${projectName}" กรุณาตรวจสอบชื่อโปรเจคอีกครั้ง`);
    return;
  }
  
  const projectId = projects[0].id;
  const exactProjectName = projects[0].title;
  
  // Create a final task to mark project completion
  const [taskResult] = await dbPool.query(`
    INSERT INTO rise_tasks (
      title, 
      description, 
      project_id, 
      assigned_to, 
      status,
      status_id,
      priority_id,
      created_date,
      context
    ) VALUES (?, ?, ?, ?, 'done', 3, 1, CURDATE(), 'project')
  `, [`โปรเจค ${exactProjectName} สำเร็จ`, closeDescription, projectId, riseUserId]);
  
  // Update project status to completed
  await dbPool.query(`
    UPDATE rise_projects 
    SET status = 'completed', status_id = 2
    WHERE id = ?
  `, [projectId]);
  
  // Get current date in Thai format
  const currentDate = new Date();
  const thaiDate = `${currentDate.getDate()}/${currentDate.getMonth() + 1}/${currentDate.getFullYear() + 543}`;
  
  // Format the reply message
  let replyMessage = `ปิดโปรเจค "${exactProjectName}" เรียบร้อยแล้วค่ะ\n\nรายละเอียดการปิดงาน:\n${closeDescription}\n\nวันที่ปิดงาน: ${thaiDate}`;
  
  // Add a note about project status
  replyMessage += `\n\nสถานะโปรเจคได้ถูกเปลี่ยนเป็น "completed" และบันทึกรายละเอียดการปิดงานเรียบร้อยแล้ว`;
  
  await replyToUser(replyToken, replyMessage);
}










// In the handleTextMessage function, add this new command handler after the other command handlers:

else if (command === 'hi') {
  // This command shows a help guide for all available commands
  
  // Get user's nickname for personalized greeting
  const nickname = await getNickname(userId);
  const greeting = nickname ? `สวัสดีค่ะ คุณ${nickname}` : `สวัสดีค่ะ คุณ${userProfile.displayName}`;
  
  // Create a comprehensive help message
  let helpMessage = `${greeting}\n\nคำสั่งที่สามารถใช้งานได้:`;
  
  // Basic commands
  helpMessage += `\n\n📝 *รายงานประจำวัน*\nพิมพ์ข้อความปกติ หรือส่งรูปภาพ ระบบจะบันทึกเป็นงานรายวันโดยอัตโนมัติ`;
  
  // Project management commands
  helpMessage += `\n\n📋 *การจัดการโปรเจค\n`;
  helpMessage += `สร้างโปรเจคใหม่ =>  #create ชื่อโปรเจค: รายละเอียด\n  `;
  helpMessage += `อัพเดทรายละเอียดของโปรเจค => #update รหัสโปรเจค: รายละเอียดที่อัพเดท\n  `;
  helpMessage += `ลบโปรเจค => #delete รหัสโปรเจค\n  `;
  helpMessage += `ปิดโปรเจคและบันทึกรายละเอียดการปิดงาน => #close ชื่อโปรเจค: รายละเอียดการปิดงาน\n  `;
  
  // Task management commands
  helpMessage += `\n\n✅ *การจัดการงาน*`;
  helpMessage += `\nสร้างงานใหม่ในโปรเจคที่มีอยู่แล้ว\n• #newtask ชื่อโปรเจค: หัวข้องาน: รายละเอียดงาน @ผู้ร่วมงาน\n  `;
  helpMessage += `\nสร้างงานหลายงานให้หลายคนในคราวเดียว\n• #many ชื่อโปรเจค: งานของคุณ @เพื่อน1 งานของเพื่อน1 @เพื่อน2 งานของ เพื่อน2\n  `;
  
  // Search commands
  helpMessage += `\n\n🔍 *การค้นหา*`;
  helpMessage += `\n• #findall\n  ค้นหาโปรเจคทั้งหมดของคุณ`;
  helpMessage += `\n• #findmore คำค้นหา\n  ค้นหาโปรเจคตามคำที่ระบุ`;
  
  // Other commands
  helpMessage += `\n\n🔧 *คำสั่งอื่นๆ*`;
  helpMessage += `\n• #hi\n  แสดงคำแนะนำการใช้งานคำสั่งต่างๆ`;
  
  // Examples
  helpMessage += `\n\n📚 *ตัวอย่างการใช้งาน*`;
  helpMessage += `\n• #create ซ่อมเครื่องยนต์: ซ่อมเครื่องยนต์ให้ลูกค้า คุณ คิดจะพักคิดถึงคิทแคท `;
  helpMessage += `\n• #newtask ซ่อมเครื่องพ่นปูน 30L: ถอดมอเตอร์: ถอดมอเตอร์เพื่อตรวจสอบ @พี่คนส้วยสวย @ช่าง1 @ช่าง2`;
  helpMessage += `\n• #close ซ่อมเครื่องพ่นสี RB-899: ซ่อมเสร็จแล้ว ลูกค้าจ่ายเงิน 10,000 บาท`;
  
  // Send the help message
  await replyToUser(replyToken, helpMessage);
}













  } else {
    // Process as regular message (create task in default project)
    await processNonCommandMessage(userId, userProfile, text, null, timestamp);
    await replyToUser(replyToken, `บันทึกรายงานประจำวันของ พี่ ${nickname || userProfile.displayName} เรียบร้อยแล้วค่ะ`);
  }
}


// === Process Non-Command Message ===
// async function processNonCommandMessage(userId, userProfile, text, imagePath, timestamp,) {
//   try {
//     // Get or create the default monthly project
//     const projectId = await getOrCreateMonthlyProject(userId, userProfile);
//     const combinedUserInfo = await getCombinedUserInfo(userId, userProfile);
//     // Create a task with the message content
//     const taskTitle = text || 'Image task';
//     const taskDescription = text ? text : (imagePath ? `Image uploaded: ${path.basename(imagePath)}` : '');
//     const displayName = userProfile.displayName || '';
//     const timeStamp = storeTextMessage.timeStamp || '';
//     const sum = `งานรายวัน ${displayName},${timeStamp},` || '';
//     const combinedUserInfolog = `LINE Name: ${combinedUserInfo.lineDisplayName} Rise Name: ${combinedUserInfo.fullName}`  || '';
//     // Get rise_user_id from mapping
//     const riseUserId = await getRiseUserIdFromLineId(userId);
    
//     if (!riseUserId) {
//       console.warn(`Cannot find Rise user for LINE user ${userId}`);
//       return;
//     }
    
//     // Insert task
//     const [result] = await dbPool.query(`
//       INSERT INTO rise_tasks (
//         title, 
//         description, 
//         project_id, 
//         assigned_to, 
//         status,
//         status_id,
//         priority_id,
//         created_date,
//         context
//       ) VALUES (?, ?, ?, ?, 'to_do', 1, 1, CURDATE(), 'project')
//     `, [combinedUserInfolog, taskDescription, projectId, riseUserId]);
    
//     console.log(`Created task ID ${result.insertId} in project ${projectId} for user ${riseUserId}`);
    
//     // If there's an image, link it to the project
//     if (imagePath) {
//       const fileSize = fs.statSync(imagePath).size;
//       await dbPool.query(`
//         INSERT INTO rise_project_files (
//           file_name,
//           file_id,
//           service_type,
//           description,
//           file_size,
//           created_at,
//           project_id,
//           uploaded_by
//         ) VALUES (?, ?, 'local', ?, ?, NOW(), ?, ?)
//       `, [path.basename(imagePath), path.basename(imagePath), 'Uploaded via LINE', fileSize, projectId, riseUserId]);
//     }
    
//     return result.insertId;
//   } catch (error) {
//     console.error('Error processing non-command message:', error);
//     throw error;
//   }
// }





// Update the processQueuedMessages function to add comments with images
async function processQueuedMessages(userId, userProfile) {
  if (!messageQueue.has(userId)) return;
  
  const userQueue = messageQueue.get(userId);
  const { replyToken, messages } = userQueue;
  
  try {
    // Get or create monthly project
    const projectId = await getOrCreateMonthlyProject(userId, userProfile);
    const nickname = await getNickname(userId);
    
    // Combine all text messages
    const allText = messages
      .filter(msg => msg.type === 'text')
      .map(msg => msg.text)
      .join("\n\n");
    
    // Get all image paths
    const imagePaths = messages
      .filter(msg => msg.type === 'image')
      .map(msg => msg.imagePath);
    
    // Process the combined message
    if (allText || imagePaths.length > 0) {
      let taskId = null;
      
      // Process text if available
      if (allText) {
        const result = await processNonCommandMessage(userId, userProfile, allText, null, new Date());
        taskId = result; // Store the task ID for later use with comments
      }
      
      // Process each image
      for (const imagePath of imagePaths) {
        // If we don't have a task yet (no text was sent), create one for the images
        if (!taskId) {
          const result = await processNonCommandMessage(userId, userProfile, null, imagePath, new Date());
          taskId = result;
        } else {
          // We already have a task, so just process the image
          await processImageForExistingTask(userId, userProfile, imagePath, taskId, projectId);
        }
      }
      
      // If we have images and a task, add a comment with the images
      if (imagePaths.length > 0 && taskId) {
        await addCommentWithImages(userId, taskId, imagePaths, projectId);
      }
      
      // Reply to user
      let replyMessage = `บันทึกรายงานประจำวันของ พี่ ${nickname || userProfile.displayName} เรียบร้อยแล้วค่ะ`;
      
      // Add summary of what was processed
      if (allText && imagePaths.length > 0) {
        replyMessage += `\n\nบันทึก ${imagePaths.length} รูปภาพ และข้อความเรียบร้อยแล้ว`;
      } else if (imagePaths.length > 0) {
        replyMessage += `\n\nบันทึก ${imagePaths.length} รูปภาพเรียบร้อยแล้ว`;
      }
      
      await replyToUser(replyToken, replyMessage);
    }
  } catch (error) {
    console.error('Error processing queued messages:', error);
    await replyToUser(replyToken, "เกิดข้อผิดพลาดในการบันทึกข้อมูล กรุณาลองใหม่อีกครั้ง");
  } finally {
    // Remove from queue
    messageQueue.delete(userId);
  }
}

// Function to process an image for an existing task
async function processImageForExistingTask(userId, userProfile, imagePath, taskId, projectId) {
  try {
    // Get rise_user_id from mapping
    const riseUserId = await getRiseUserIdFromLineId(userId);
    
    if (!riseUserId) {
      console.warn(`Cannot find Rise user for LINE user ${userId}`);
      return;
    }
    
    // Add the image to project_files
    const fileSize = fs.statSync(imagePath).size;
    const [fileResult] = await dbPool.query(`
      INSERT INTO rise_project_files (
        file_name,
        file_id,
        service_type,
        description,
        file_size,
        created_at,
        project_id,
        uploaded_by
      ) VALUES (?, ?, 'local', ?, ?, NOW(), ?, ?)
    `, [path.basename(imagePath), path.basename(imagePath), 'Uploaded via LINE', fileSize, projectId, riseUserId]);
    
    const fileId = fileResult.insertId;
    
    // Return the file ID for use in comments
    return fileId;
  } catch (error) {
    console.error('Error processing image for existing task:', error);
    throw error;
  }
}








// Function to add a comment with images to a task
async function addCommentWithImages(userId, taskId, imagePaths, projectId) {
  try {
    // Get rise_user_id from mapping
    const riseUserId = await getRiseUserIdFromLineId(userId);
    
    if (!riseUserId) {
      console.warn(`Cannot find Rise user for LINE user ${userId}`);
      return;
    }
    
    // First, add all images to project_files and collect their IDs
    const fileIds = [];
    for (const imagePath of imagePaths) {
      const fileSize = fs.statSync(imagePath).size;
      const [fileResult] = await dbPool.query(`
        INSERT INTO rise_project_files (
          file_name,
          file_id,
          service_type,
          description,
          file_size,
          created_at,
          project_id,
          uploaded_by
        ) VALUES (?, ?, 'local', ?, ?, NOW(), ?, ?)
      `, [path.basename(imagePath), path.basename(imagePath), 'Uploaded via LINE', fileSize, projectId, riseUserId]);
      
      fileIds.push(fileResult.insertId);
    }
    
    // Create a files JSON structure for the comment
    const filesJson = JSON.stringify(fileIds.map(id => ({
      file_name: `file_${id}.jpg`,
      file_size: fs.statSync(imagePaths[fileIds.indexOf(id)]).size,
      file_id: id,
      service_type: "local"
    })));
    
    // Add a comment to the task with the images
    await dbPool.query(`
      INSERT INTO rise_project_comments (
        created_by,
        created_at,
        description,
        project_id,
        task_id,
        file_id,
        files,
        deleted
      ) VALUES (?, NOW(), ?, ?, ?, ?, ?, 0)
    `, [riseUserId, 'รูปภาพเพิ่มเติมสำหรับงานรายวัน', projectId, taskId, fileIds[0] || 0, filesJson]);
    
    console.log(`Added comment with ${fileIds.length} images to task ${taskId}`);
  } catch (error) {
    console.error('Error adding comment with images:', error);
    throw error;
  }
}














// Helper function to convert JSON to PHP serialized array format for files
// function createPHPSerializedFilesArray(files) {
//     try {
//       // Format: a:N:{i:0;a:4:{s:9:"file_name";s:LENGTH:"FILENAME";s:9:"file_size";s:LENGTH:"SIZE";s:7:"file_id";N;s:12:"service_type";N;}}
      
//       const filesCount = files.length;
//       let serialized = `a:${filesCount}:{`;
      
//       files.forEach((file, index) => {
//         const fileName = file.file_name;
//         const fileSize = String(file.file_size);
        
//         serialized += `i:${index};a:4:{`;
//         serialized += `s:9:"file_name";s:${fileName.length}:"${fileName}";`;
//         serialized += `s:9:"file_size";s:${fileSize.length}:"${fileSize}";`;
//         serialized += `s:7:"file_id";N;`;
//         serialized += `s:12:"service_type";N;`;
//         serialized += `}`;
//       });
      
//       serialized += `}`;
//       return serialized;
//     } catch (error) {
//       console.error('Error creating PHP serialized array:', error);
//       // Return a minimal valid serialized array in case of error
//       return 'a:0:{}';
//     }
//   }
  
  
  









  
  




// Update the processNonCommandMessage function to return the task ID
async function processNonCommandMessage(userId, userProfile, text, imagePath, timestamp) {
  try {
    // Get or create the default monthly project
    const projectId = await getOrCreateMonthlyProject(userId, userProfile);
    
    // Create a task with the message content
    const taskTitle = text || 'Image task';
    const taskDescription = text ? text : (imagePath ? `Image uploaded: ${path.basename(imagePath)}` : '');
    
    // Get rise_user_id from mapping
    const riseUserId = await getRiseUserIdFromLineId(userId);
    
    if (!riseUserId) {
      console.warn(`Cannot find Rise user for LINE user ${userId}`);
      return null;
    }
    
    // Insert task
    const [result] = await dbPool.query(`
      INSERT INTO rise_tasks (
        title, 
        description, 
        project_id, 
        assigned_to, 
        status,
        status_id,
        priority_id,
        created_date,
        context
      ) VALUES (?, ?, ?, ?, 'to_do', 1, 1, CURDATE(), 'project')
    `, [taskTitle, taskDescription, projectId, riseUserId]);
    
    const taskId = result.insertId;
    console.log(`Created task ID ${taskId} in project ${projectId} for user ${riseUserId}`);
    
   
    // If there's an image, process it as a comment with files
    if (imagePath) {
        try {
          // Process the image and add it as a comment to the task
          const fileInfo = await processImageForExistingTask(userId, userProfile, imagePath, taskId, projectId);
          
          if (fileInfo) {
            // Create a comment with the file
            const fileInfoArray = [fileInfo];
            const serializedFiles = createPHPSerializedFilesArray(fileInfoArray);
            
            // Add a comment to the task with the image
            const [commentResult] = await dbPool.query(`
              INSERT INTO rise_project_comments (
                created_by,
                created_at,
                description,
                project_id,
                task_id,
                file_id,
                files,
                deleted
              ) VALUES (?, NOW(), ?, ?, ?, 0, ?, 0)
            `, [riseUserId, "", projectId, taskId, serializedFiles]);
            
            const commentId = commentResult.insertId;
            
            // Log the comment creation activity
            await logActivity(
              riseUserId,
              'created',
              'project_comment',
              '',
              commentId,
              null,
              'project',
              projectId,
              'task',
              taskId
            );
            
            console.log(`Added comment with image to task ${taskId}`);
          }
        } catch (imageError) {
          console.error('Error processing image for task:', imageError);
          // Continue even if image processing fails
        }
      }
      
      return taskId;


    
  } catch (error) {
    console.error('Error processing non-command message:', error);
    throw error;
  }
}












// === Get or Create Monthly Project ===
async function getOrCreateMonthlyProject(userId, userProfile) {
    try {
      const currentDate = new Date();
      
      // Get month in Thai
      const thaiMonths = [
        'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 
        'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
      ];
      
      // Get current month (0-11) and year
      const month = currentDate.getMonth();
      const gregorianYear = currentDate.getFullYear();
      
      // Convert to Thai year (Buddhist Era)
      const thaiYear = gregorianYear + 543;
      
      // Create Thai format title
      const projectTitle = `งานรายวัน เดือน${thaiMonths[month]} ${thaiYear}`;
      
      // Get user info including nickname
      const userInfo = await getUserInfoFromLineId(userId);
      
      if (!userInfo || !userInfo.riseUserId) {
        console.warn(`Cannot find Rise user for LINE user ${userId}`);
        return null;
      }
      
      const riseUserId = userInfo.riseUserId;
      // Use nickname if available, otherwise fall back to LINE display name
      const userName = userInfo.nickname || userProfile.displayName;
      
      // Check if monthly project already exists
      const [existingProjects] = await dbPool.query(`
        SELECT id FROM rise_projects 
        WHERE title = ? AND created_by = ? AND deleted = 0
      `, [projectTitle, riseUserId]);
      
      if (existingProjects.length > 0) {
        return existingProjects[0].id;
      }
      
      // Create new monthly project
      const [result] = await dbPool.query(`
        INSERT INTO rise_projects (
          title,
          description,
          project_type,
          start_date,
          client_id,
          created_date,
          created_by,
          status,
          status_id
        ) VALUES (?, ?, 'internal_project', CURDATE(), ?, CURDATE(), ?, 'open', 1)
      `, [projectTitle, `บันทึกรายงานประจำวันของ ${userName}`, riseUserId, riseUserId]);
      
      const projectId = result.insertId;
      
      // Log the project creation activity
      await logActivity(
        riseUserId,
        'created',
        'project',
        projectTitle,
        projectId,
        null,
        'client',
        riseUserId
      );
      
      // Add the "งานรายวัน" label to the project
      // First, get the label ID
      const [labels] = await dbPool.query(`
        SELECT id FROM rise_labels 
        WHERE title = 'งานรายวัน' AND context = 'project' AND deleted = 0
      `);
      
      if (labels.length > 0) {
        const labelId = labels[0].id;
        
        // Add label to project
        await dbPool.query(`
          UPDATE rise_projects 
          SET labels = ? 
          WHERE id = ?
        `, [labelId.toString(), projectId]);
        
        // Log the label update activity
        await logActivity(
          riseUserId,
          'updated',
          'project',
          projectTitle,
          projectId,
          JSON.stringify({
            labels: {
              from: "",
              to: labelId.toString()
            }
          }),
          'client',
          riseUserId
        );
      }
      
      console.log(`Created monthly project ID ${projectId} for user ${userName} (${riseUserId})`);
      return projectId;
    } catch (error) {
      console.error('Error getting/creating monthly project:', error);
      throw error;
    }
  }
  
  
  



// === Save to Local File ===
function saveToFile(filename, content) {
  const filepath = path.join(uploadsDir, filename);
  fs.writeFileSync(filepath, content, 'utf8');
  console.log(`Saved to file: ${filepath}`);
  return filepath;
}

// === Store to line_messages table ===
async function storeTextMessage(userId, fullText, command, content, timestamp) {
  try {
    const sql = `
      INSERT INTO line_messages (user_id, message, command, content, created_at)
      VALUES (?, ?, ?, ?, ?)
    `;
    await dbPool.query(sql, [userId, fullText, command, content, timestamp]);
    console.log(`Stored message from user ${userId}`);
  } catch (err) {
    console.error('[DB] Error storing text message:', err.message);
  }
}

// === Store image ===
async function storeImageMessage(userId, imageId, timestamp) {
  try {
    const sql = `
      INSERT INTO line_images (user_id, image_id, created_at)
      VALUES (?, ?, ?)
    `;
    await dbPool.query(sql, [userId, imageId, timestamp]);
    console.log(`Stored image ${imageId} from user ${userId}`);
  } catch (err) {
    console.error('[DB] Error storing image:', err.message);
  }
}




// === Create Project ===
async function createProject(title, lineUserId, userProfile) {
    try {
      const riseUserId = await getRiseUserIdFromLineId(lineUserId);
  
      if (!riseUserId) {
        console.warn(`[WARN] Cannot map LINE user: ${lineUserId}`);
        return null;
      }
  
      // Extract title and description if format is "Title: Description"
      let description = null;
      let projectTitle = title;
      
      if (title.includes(':')) {
        const parts = title.split(':');
        projectTitle = parts[0].trim();
        description = parts.slice(1).join(':').trim();
      }
  
      // Check if a project with the same title already exists
      const [existingProjects] = await dbPool.query(`
        SELECT p.id, p.title, p.created_date, p.status, 
               u.first_name, u.last_name, 
               um.nick_name, um.line_display_name
        FROM rise_projects p
        LEFT JOIN rise_users u ON p.created_by = u.id
        LEFT JOIN user_mappings um ON u.id = um.rise_user_id
        WHERE p.title LIKE ? AND p.deleted = 0
        LIMIT 1
      `, [`%${projectTitle}%`]);
  
      if (existingProjects.length > 0) {
        const project = existingProjects[0];
        const createdDate = new Date(project.created_date);
        const thaiDate = `${createdDate.getDate()}/${createdDate.getMonth() + 1}/${createdDate.getFullYear() + 543}`;
        
        // Get creator's display name or nickname
        const creatorName = project.nick_name || project.line_display_name || `${project.first_name} ${project.last_name}`;
        
        // Format the error message
        const errorMessage = `มี ${project.title} นี้แล้ว กรุณาสร้างโปรเจคชื่ออื่น หรือแก้ไขโปรเจคนี้\n\nรายละเอียดโปรเจค\n${project.title}: สร้างโดย ${creatorName} เมื่อวันที่ ${thaiDate} สถานะโปรเจค ${project.status}`;
        
        // Return a special object to indicate this is a duplicate project
        return {
          isDuplicate: true,
          message: errorMessage,
          projectId: project.id
        };
      }
  
      const sql = `
        INSERT INTO rise_projects (
          title,
          description,
          project_type,
          start_date,
          client_id,
          created_date,
          created_by,
          status,
          status_id
        ) VALUES (?, ?, 'client_project', CURDATE(), ?, CURDATE(), ?, 'open', 1)
      `;
  
      const [result] = await dbPool.query(sql, [projectTitle, description, riseUserId, riseUserId]);
      const projectId = result.insertId;
      console.log(`[DB] Created project ID ${projectId} for user ${riseUserId}`);
      
      // Log the project creation activity
      await logActivity(
        riseUserId,
        'created',
        'project',
        projectTitle,
        projectId,
        null,
        'client',
        riseUserId
      );
      
      // Create initial task with project title as task title
      const [taskResult] = await dbPool.query(`
        INSERT INTO rise_tasks (
          title, 
          description, 
          project_id, 
          assigned_to, 
          status,
          status_id,
          priority_id,
          created_date,
          context
        ) VALUES (?, ?, ?, ?, 'to_do', 1, 1, CURDATE(), 'project')
      `, [projectTitle, `Initial task for project: ${projectTitle}`, projectId, riseUserId]);
      
      const taskId = taskResult.insertId;
      
      // Log the task creation activity
      await logActivity(
        riseUserId,
        'created',
        'task',
        projectTitle,
        taskId,
        null,
        'project',
        projectId
      );
      
      return projectId;
    } catch (err) {
      console.error('[DB] Error creating project:', err.message);
      return null;
    }
  }
  











// === Update Project ===
async function updateProject(content, lineUserId) {
  try {
    const riseUserId = await getRiseUserIdFromLineId(lineUserId);

    if (!riseUserId) {
      return "Cannot find your user account";
    }

       // Format should be "ProjectID: Updated content"
    if (!content.includes(':')) {
      return "Format should be 'ProjectID: Updated content'";
    }

    const parts = content.split(':');
    const projectId = parseInt(parts[0].trim());
    const updatedContent = parts.slice(1).join(':').trim();

    if (isNaN(projectId)) {
      return "Invalid project ID";
    }

    // Check if project exists and user has access
    const [projects] = await dbPool.query(`
      SELECT * FROM rise_projects 
      WHERE id = ? AND (created_by = ? OR client_id = ?) AND deleted = 0
    `, [projectId, riseUserId, riseUserId]);

    if (projects.length === 0) {
      return "Project not found or you don't have access";
    }

    // Update project description
    await dbPool.query(`
      UPDATE rise_projects 
      SET description = ? 
      WHERE id = ?
    `, [updatedContent, projectId]);

    // Create a task to track the update
    await dbPool.query(`
      INSERT INTO rise_tasks (
        title, 
        description, 
        project_id, 
        assigned_to, 
        status,
        status_id,
        priority_id,
        created_date,
        context
      ) VALUES (?, ?, ?, ?, 'to_do', 1, 1, CURDATE(), 'project')
    `, [`Update ${new Date().toISOString()}`, updatedContent, projectId, riseUserId]);

    return `Project ${projectId} updated successfully`;
  } catch (err) {
    console.error('[DB] Error updating project:', err.message);
    return "Error updating project: " + err.message;
  }
}

// === Delete Project ===
async function deleteProject(content, lineUserId) {
  try {
    const riseUserId = await getRiseUserIdFromLineId(lineUserId);

    if (!riseUserId) {
      return "Cannot find your user account";
    }

    // Content should be project ID
    const projectId = parseInt(content.trim());

    if (isNaN(projectId)) {
      return "Invalid project ID";
    }

    // Check if project exists and user has access
    const [projects] = await dbPool.query(`
      SELECT * FROM rise_projects 
      WHERE id = ? AND (created_by = ? OR client_id = ?) AND deleted = 0
    `, [projectId, riseUserId, riseUserId]);

    if (projects.length === 0) {
      return "Project not found or you don't have access";
    }

    // Soft delete the project
    await dbPool.query(`
      UPDATE rise_projects 
      SET deleted = 1 
      WHERE id = ?
    `, [projectId]);

    return `Project ${projectId} deleted successfully`;
  } catch (err) {
    console.error('[DB] Error deleting project:', err.message);
    return "Error deleting project: " + err.message;
  }
}

// === Get Rise User ID from LINE User ID ===
async function getRiseUserIdFromLineId(lineUserId) {
  try {
    // First check user_mappings table
    const [mappings] = await dbPool.query(
      'SELECT rise_user_id FROM user_mappings WHERE line_user_id = ?',
      [lineUserId]
    );

    if (mappings.length > 0 && mappings[0].rise_user_id) {
      return mappings[0].rise_user_id;
    }

    // Then check line_user_map table
    const [lineUserMap] = await dbPool.query(
      'SELECT rise_user_id FROM line_user_map WHERE line_user_id = ?',
      [lineUserId]
    );

    if (lineUserMap.length > 0) {
      return lineUserMap[0].rise_user_id;
    }

    // If not found in either table, try to create a mapping
    const userProfile = await getLineUserProfile(lineUserId);
    const riseUserId = await findOrCreateRiseUser(userProfile);

    if (riseUserId) {
      // Insert into user_mappings
      await dbPool.query(
        'INSERT INTO user_mappings (line_user_id, line_display_name, rise_user_id) VALUES (?, ?, ?)',
        [lineUserId, userProfile.displayName, riseUserId]
      );
    }

    return riseUserId;
  } catch (err) {
    console.error('[DB] Error getting Rise user ID:', err.message);
    return null;
  }
}

// === Find or Create Rise User ===
async function findOrCreateRiseUser(userProfile) {
  try {
    const displayName = userProfile.displayName || '';
    let firstName = displayName;
    let lastName = '';

    // Split display name into first and last name if possible
    if (displayName.includes(' ')) {
      const nameParts = displayName.split(' ');
      firstName = nameParts[0];
      lastName = nameParts.slice(1).join(' ');
    }

    // Generate email from display name
    const email = `${displayName.toLowerCase().replace(/\s+/g, '.')}@line.user`;

    // Check if user already exists by email
    const [existingUsers] = await dbPool.query(
      'SELECT id FROM rise_users WHERE email = ? AND deleted = 0',
      [email]
    );

    if (existingUsers.length > 0) {
      return existingUsers[0].id;
    }

    // Create new rise_user
    const [result] = await dbPool.query(`
      INSERT INTO rise_users (
        first_name,
        last_name,
        user_type,
        email,
        status,
        job_title,
        language,
        created_at
      ) VALUES (?, ?, 'client', ?, 'active', 'LINE User', 'english', NOW())
    `, [firstName, lastName, email]);

    console.log(`Created new rise_user ID ${result.insertId} for LINE user ${userProfile.userId}`);
    return result.insertId;
  } catch (err) {
    console.error('[DB] Error finding/creating Rise user:', err.message);
    return null;
  }
}

// === LINE Bot Reply ===
async function replyToUser(replyToken, message) {
  const url = 'https://api.line.me/v2/bot/message/reply';
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${LINE_ACCESS_TOKEN}`
  };

  const body = {
    replyToken,
    messages: [{ type: 'text', text: message }]
  };

  try {
    await axios.post(url, body, { headers });
    console.log(`Replied to ${replyToken}: ${message}`);
  } catch (err) {
    console.error('[LINE] Reply error:', err.response?.data || err.message);
  }
}




























// === API Endpoints for Development ===






// Get all projects
app.get('/api/activity', async (req, res) => {
  try {
    const [projects] = await dbPool.query('SELECT * FROM rise_activity_logs WHERE deleted = 0 ORDER BY id DESC LIMIT 100');
    res.json(projects);
  } catch (error) {
    console.error('Error fetching rise_activity_logs:', error);
    res.status(500).json({ error: error.message });
  }
});



app.get('/api/comments', async (req, res) => {
  try {
    const [projects] = await dbPool.query('SELECT * FROM rise_project_comments WHERE deleted = 0 ORDER BY id DESC LIMIT 100');
    res.json(projects);
  } catch (error) {
    console.error('Error fetching rise_activity_logs:', error);
    res.status(500).json({ error: error.message });
  }
});






// Get all projects
app.get('/api/labels', async (req, res) => {
  try {
    const [projects] = await dbPool.query('SELECT * FROM rise_labels WHERE deleted = 0 ORDER BY id DESC LIMIT 100');
    res.json(projects);
  } catch (error) {
    console.error('Error fetching rise_labels:', error);
    res.status(500).json({ error: error.message });
  }
});



// Get all projects
app.get('/api/projects', async (req, res) => {
  try {
    const [projects] = await dbPool.query('SELECT * FROM rise_projects WHERE deleted = 0 ORDER BY id DESC LIMIT 100');
    res.json(projects);
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({ error: error.message });
  }
});



app.get('/api/projectfiles', async (req, res) => {
  try {
    const [projects] = await dbPool.query('SELECT * FROM rise_project_files WHERE deleted = 0 ORDER BY id DESC LIMIT 100');
    res.json(projects);
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({ error: error.message });
  }
});


// Get project by ID
app.get('/api/projects/:id', async (req, res) => {
  try {
    const [projects] = await dbPool.query('SELECT * FROM rise_projects WHERE id = ? AND deleted = 0', [req.params.id]);
    if (projects.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }
    res.json(projects[0]);
  } catch (error) {
    console.error('Error fetching project:', error);
    res.status(500).json({ error: error.message });
  }
});



// Get all tasks
app.get('/api/tasks', async (req, res) => {
  try {
    const [tasks] = await dbPool.query('SELECT * FROM rise_tasks ORDER BY id DESC LIMIT 100');
    res.json(tasks);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get tasks by project ID
app.get('/api/projects/:id/tasks', async (req, res) => {
  try {
    const [tasks] = await dbPool.query('SELECT * FROM rise_tasks WHERE project_id = ? ORDER BY id DESC', [req.params.id]);
    res.json(tasks);
  } catch (error) {
    console.error('Error fetching project tasks:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get all users  
app.get('/api/users', async (req, res) => {
  try {
    const [users] = await dbPool.query('SELECT * FROM rise_users WHERE deleted = 0 ORDER BY id DESC LIMIT 100');
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get user mappings
app.get('/api/user-mappings', async (req, res) => {
  try {
    const [mappings] = await dbPool.query(`
      SELECT um.*, ru.first_name, ru.last_name, ru.email 
      FROM user_mappings um
      LEFT JOIN rise_users ru ON um.rise_user_id = ru.id
      ORDER BY um.id DESC
    `);
    res.json(mappings);
  } catch (error) {
    console.error('Error fetching user mappings:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get LINE messages
app.get('/api/line-messages', async (req, res) => {
  try {
    const [messages] = await dbPool.query('SELECT * FROM line_messages ORDER BY created_at DESC LIMIT 100');
    res.json(messages);
  } catch (error) {
    console.error('Error fetching LINE messages:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get LINE images
app.get('/api/line-images', async (req, res) => {
  try {
    const [images] = await dbPool.query('SELECT * FROM line_images ORDER BY created_at DESC LIMIT 100');
    res.json(images);
  } catch (error) {
    console.error('Error fetching LINE images:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get project files
app.get('/api/project-files', async (req, res) => {
  try {
    const [files] = await dbPool.query('SELECT * FROM rise_project_files ORDER BY created_at DESC LIMIT 100');
    res.json(files);
  } catch (error) {
    console.error('Error fetching project files:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get files by project ID
app.get('/api/projects/:id/files', async (req, res) => {
  try {
    const [files] = await dbPool.query('SELECT * FROM rise_project_files WHERE project_id = ? ORDER BY created_at DESC', [req.params.id]);
    res.json(files);
  } catch (error) {
    console.error('Error fetching project files:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get database tables
app.get('/api/tables', async (req, res) => {
  try {
    const [tables] = await dbPool.query('SHOW TABLES');
    res.json(tables.map(table => Object.values(table)[0]));
  } catch (error) {
    console.error('Error fetching database tables:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get table structure
app.get('/api/tables/:name', async (req, res) => {
  try {
    const [columns] = await dbPool.query(`DESCRIBE ${req.params.name}`);
    res.json(columns);
  } catch (error) {
    console.error(`Error fetching table structure for ${req.params.name}:`, error);
    res.status(500).json({ error: error.message });
  }
});

// Serve uploaded files statically
app.use('/uploads', express.static(uploadsDir));






























// Add this function to check and create next month's projects
async function checkAndCreateNextMonthProjects() {
  try {
    const currentDate = new Date();
    const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
    
    // Check if today is the last day of the month
    if (currentDate.getDate() === lastDayOfMonth) {
      console.log('End of month detected, creating next month projects for all users');
      
      // Get all active users
      const [users] = await dbPool.query(`
        SELECT DISTINCT um.line_user_id, um.line_display_name, um.rise_user_id
        FROM user_mappings um
        JOIN rise_users ru ON um.rise_user_id = ru.id
        WHERE ru.status = 'active' AND ru.deleted = 0
      `);
      
      // For each user, create next month's project
      for (const user of users) {
        // Get user profile
        const userProfile = {
          userId: user.line_user_id,
          displayName: user.line_display_name
        };
        
        // Set date to next month
        const nextMonthDate = new Date(currentDate);
        nextMonthDate.setMonth(nextMonthDate.getMonth() + 1);
        
        // Create project with next month's date
        await createNextMonthProject(user.line_user_id, userProfile, nextMonthDate);
      }
    }
  } catch (error) {
    console.error('Error checking for end of month projects:', error);
  }
}

// Function to create next month's project
async function createNextMonthProject(userId, userProfile, targetDate) {
  try {
    // Get month in Thai
    const thaiMonths = [
      'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 
      'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
    ];
    
    // Get target month and year
    const month = targetDate.getMonth();
    const gregorianYear = targetDate.getFullYear();
    const thaiYear = gregorianYear + 543;
    
    // Create Thai format title
    const projectTitle = `งานรายวัน เดือน${thaiMonths[month]} ${thaiYear}`;
    
    // Get user info
    const userInfo = await getUserInfoFromLineId(userId);
    
    if (!userInfo || !userInfo.riseUserId) {
      console.warn(`Cannot find Rise user for LINE user ${userId}`);
      return null;
    }
    
    const riseUserId = userInfo.riseUserId;
    const userName = userInfo.nickname || userProfile.displayName;
    
    // Check if project already exists
    const [existingProjects] = await dbPool.query(`
      SELECT id FROM rise_projects 
      WHERE title = ? AND created_by = ? AND deleted = 0
    `, [projectTitle, riseUserId]);
    
    if (existingProjects.length > 0) {
      console.log(`Next month project already exists for user ${userName}`);
      return existingProjects[0].id;
    }
    
    // Create new project for next month
    const [result] = await dbPool.query(`
      INSERT INTO rise_projects (
        title,
        description,
        project_type,
        start_date,
        client_id,
        created_date,
        created_by,
        status,
        status_id
      ) VALUES (?, ?, 'internal_project', ?, ?, CURDATE(), ?, 'open', 1)
    `, [
      projectTitle, 
      `บันทึกรายงานประจำวันของ ${userName}`, 
      `${targetDate.getFullYear()}-${(targetDate.getMonth() + 1).toString().padStart(2, '0')}-01`, // First day of next month
      riseUserId, 
      riseUserId
    ]);
    
    const projectId = result.insertId;
    
    // Add the "งานรายวัน" label
    const [labels] = await dbPool.query(`
      SELECT id FROM rise_labels 
      WHERE title = 'งานรายวัน' AND context = 'project' AND deleted = 0
    `);
    
    if (labels.length > 0) {
      const labelId = labels[0].id;
      await dbPool.query(`
        UPDATE rise_projects 
        SET labels = ? 
        WHERE id = ?
      `, [labelId.toString(), projectId]);
    }
    
    console.log(`Created next month project ID ${projectId} for user ${userName}`);
    return projectId;
  } catch (error) {
    console.error('Error creating next month project:', error);
    return null;
  }
}







// Function to send daily work reminder
async function sendDailyWorkReminder() {
  try {
    const currentDate = new Date();
    const dayOfWeek = currentDate.getDay(); // 0 = Sunday, 1 = Monday, etc.
    
    // Only send on Monday-Saturday (not Sunday)
    if (dayOfWeek === 0) {
      return;
    }
    
    // Format date in Thai format
    const thaiDate = `${currentDate.getDate()}/${currentDate.getMonth() + 1}/${currentDate.getFullYear() + 543}`;
    
    // Get all active users
    const [users] = await dbPool.query(`
      SELECT DISTINCT um.line_user_id, um.line_display_name, um.nick_name
      FROM user_mappings um
      JOIN rise_users ru ON um.rise_user_id = ru.id
      WHERE ru.status = 'active' AND ru.deleted = 0
    `);
    
    // Send message to each user
    for (const user of users) {
      const nickname = user.nick_name || user.line_display_name;
      const message = `สวัสดีตอนเช้า พี่${nickname}\nวันที่ทำงาน ${thaiDate}\nอย่าลืมรายงานงานประจำวันนะคะ`;
      
      // Send message via LINE API
      await sendLineMessage(user.line_user_id, message);
    }
    
    console.log(`Sent daily work reminders to ${users.length} users`);
  } catch (error) {
    console.error('Error sending daily work reminders:', error);
  }
}

// Function to send a LINE message to a specific user
async function sendLineMessage(userId, message) {
  const url = 'https://api.line.me/v2/bot/message/push';
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${LINE_ACCESS_TOKEN}`
  };

  const body = {
    to: userId,
    messages: [{ type: 'text', text: message }]
  };

  try {
    await axios.post(url, body, { headers });
    console.log(`Sent message to ${userId}: ${message}`);
  } catch (err) {
    console.error('[LINE] Push message error:', err.response?.data || err.message);
  }
}

// Function to get user info from LINE user ID
async function getUserInfoFromLineId(lineUserId) {
  try {
    // First check user_mappings table
    const [mappings] = await dbPool.query(
      'SELECT rise_user_id, nick_name, line_display_name FROM user_mappings WHERE line_user_id = ?',
      [lineUserId]
    );

    if (mappings.length > 0) {
      return {
        riseUserId: mappings[0].rise_user_id,
        nickname: mappings[0].nick_name || mappings[0].line_display_name, // Fallback to display name if nickname is null
        displayName: mappings[0].line_display_name
      };
    }

    // Then check line_user_map table (legacy)
    const [lineUserMap] = await dbPool.query(
      'SELECT rise_user_id FROM line_user_map WHERE line_user_id = ?',
      [lineUserId]
    );

    if (lineUserMap.length > 0) {
      // For legacy mappings, we don't have nickname
      return {
        riseUserId: lineUserMap[0].rise_user_id,
        nickname: null,
        displayName: null
      };
    }

    return null;
  } catch (err) {
    console.error('[DB] Error getting user info:', err.message);
    return null;
  }
}




// Add this near the end of your file, after starting the server

// Schedule daily tasks
function scheduleDaily() {
  const now = new Date();
  
  // Schedule end-of-month check (run once a day at midnight)
  const midnightCheck = new Date(now);
  midnightCheck.setHours(0, 0, 0, 0);
  if (now > midnightCheck) {
    midnightCheck.setDate(midnightCheck.getDate() + 1);
  }
  
  const timeUntilMidnight = midnightCheck.getTime() - now.getTime();
  setTimeout(() => {
    checkAndCreateNextMonthProjects();
    // Schedule next check for tomorrow
    setInterval(checkAndCreateNextMonthProjects, 24 * 60 * 60 * 1000);
  }, timeUntilMidnight);
  
  // Schedule daily reminder (8:00 AM)
  const morningReminder = new Date(now);
  morningReminder.setHours(8, 0, 0, 0);
  if (now > morningReminder) {
    morningReminder.setDate(morningReminder.getDate() + 1);
  }
  
  const timeUntilMorning = morningReminder.getTime() - now.getTime();
  setTimeout(() => {
    sendDailyWorkReminder();
    // Schedule next reminder for tomorrow
    setInterval(sendDailyWorkReminder, 24 * 60 * 60 * 1000);
  }, timeUntilMorning);
}

// Start scheduling after server is running
// app.listen(port, () => {
//   console.log(`🚀 LINE Webhook API running at http://localhost:${port}`);
//   scheduleDaily();
// });



// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).send('Internal Server Error');
});

// Start the server
app.listen(port, () => {
  console.log(`🚀 LINE Webhook API running at http://localhost:${port}`);
});

// Graceful shutdown
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

async function shutdown() {
  console.log('Shutting down gracefully...');
  
  try {
    await dbPool.end();
    console.log('Database connections closed');
    process.exit(0);
  } catch (err) {
    console.error('Error during shutdown:', err);
    process.exit(1);
  }
}