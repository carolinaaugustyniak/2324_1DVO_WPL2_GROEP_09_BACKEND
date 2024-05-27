// Create a single supabase client for interacting with your database
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://gynfpfexzufkpwgdtxzf.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5bmZwZmV4enVma3B3Z2R0eHpmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcxMTQ0ODAwNiwiZXhwIjoyMDI3MDI0MDA2fQ.78C98bwq3Uudzko9sNLlOzDclD89kzoK30b5Qne4UjE')
const databaseName = 'subscriptions';
const frontEndUrl = 'http://localhost:5173'
// const frontEndUrl = 'https://wpl2-groep9.netlify.app'


const { Resend } = require('resend');
const resend = new Resend('re_c6cNBVFm_FqAu6zirMp5EUeGK9XnLWFyg');

const cors = require('cors');

const express = require('express')

const app = express()
const port = 8000

app.use(cors())
app.use(express.json())


// FUNCTIONS

// Function for determining the smallest unused id
function findAvailableId(existingData) {
  // Check which id's are already in the supabase
  const existingIds = existingData.map(record => record.id);
  let id = 1;
  // Find the smallest unused integer for the id
  while (existingIds.includes(id)) {
      id++;
  }
  return id;
}

// Function for checking email validity
function isValidEmail(userEmail) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(userEmail);
}

// Function for getting a user's data from their email
async function getUserByEmail(email) {
  // Select a row based on the email address
  const { data, error } = await supabase
    .from(databaseName)
    .select('*')
    .eq('email', email);

  if (error) {
    // Handle error
    console.error('Error fetching user:', error.message);
    return null;
  }

  // Return the user data if found
  if (data) {
    return data[0];
  } else {
    return null;
  }
}

// Function to remove user from supabase by token
async function deleteUser(verification_token) {
  try {
      const { data, error } = await supabase
          .from(databaseName)
          .delete()
          .eq('verification_token', verification_token);

      if (error) {
          throw error;
      }

      // Check if no rows were deleted
      if (data && data.length === 0) {
          throw new Error('No rows deleted');
      }

      console.log('User deleted successfully');
      return { success: true };
  } catch (error) {
      console.error('Error deleting user:', error.message);
      return { success: false, error: error.message };
  }
}

// Function to define mailoptions  defineMailOptions
async function sendEmail(userEmail, subject, emailContent) {
    resend.emails.send({
      from: 'onboarding@resend.dev',
      to: userEmail,
      subject: subject,
      html: emailContent
    });
}

// HTTP REQUESTS


// NEWSLETTER FORM SUBMIT 
app.post('/api/new', async (req, res) => {
  console.log("tetS")
    const userData = req.body;
    const userEmail = userData.email;

     // define user token
    const verification_token = Math.floor(Math.random() * 100000000);

    // existingData selects all id's in the supabase
    const { data: existingData, error } = await supabase.from(databaseName).select('id');

    // define data to send to Supabase
    const dataToSend = {
      confirmed: false,
      email: userEmail,
      id: findAvailableId(existingData),
      verification_token: verification_token
    }; 
    console.log(dataToSend);

    // Check for valid email
    if (isValidEmail(userEmail) === true) {
        console.log('Email is valid: '+userEmail);
        console.log("token is: "+verification_token);
        // Insert data into supabase
        try {
          const { data, error } = await supabase
            .from(databaseName)
            .insert(dataToSend);
          if (error) {
            throw error;
          }  
          console.log('Data inserted successfully');
          res.status(200).json({ message: 'Data inserted successfully' });
        } catch (error) {
          console.error('Error inserting data to Supabase:', error.message);
          res.status(500).json({ error: 'Error inserting data to Supabase' });
        }
        const request_type = "add";
        // Define mail content
        const emailContent = `
            <p>Thank you for signing up!</p>
            <p>Please click the following link to verify your email:</p>
            <a href="${frontEndUrl}/?token=${verification_token}&type=${request_type}">Verify Email here</a>
        `;  

        // Send verification mail
        sendEmail(userEmail, "Verify your email", emailContent);
        console.log("Sent verification email to "+userEmail);
    } else {
        console.log('Email is invalid');
        res.status(422).json({ message: 'Email is invalid' });
    }
});

// UNSUBSCRIBE FORM SUBMIT
app.delete('/api/unsubscribe', async (req, res) => {
  const verification_token = req.query.token;
  console.log("Received DELETE request with token:", verification_token);

  if (verification_token) {
    try {
      const deletedUser = await deleteUser(verification_token);
      if (deletedUser) {
        console.log("User deleted successfully:", deletedUser);
        res.status(200).json({ message: 'User deleted successfully', data: deletedUser });
      } else {
        console.log("No user found with the provided token.");
        res.status(404).json({ message: 'User not found' });
      }
    } catch (error) {
      console.error('Error deleting user:', error.message);
      res.status(500).json({ error: 'Error deleting user', message: error.message });
    }
  } else {
    const userEmail = req.body.email;
    console.log("Received DELETE request with email:", userEmail);

    getUserByEmail(userEmail)
      .then(user => {
        if (user) {
          console.log('User found with email:', user);

          if (user.confirmed === true) {
            const request_type = "remove";
            const emailContent = `
              <p>Click the following link to unsubscribe from our newsletter</p>
              <a href="${frontEndUrl}/?token=${user.verification_token}&type=${request_type}">Verify Email here</a>
            `;
            sendEmail(userEmail, "Confirm unsubscription", emailContent);
            console.log("Unsubscription email sent to user:", userEmail);
            res.status(200).json({ message: 'Confirmation email sent for unsubscription' });
          } else {
            deleteUser(user.verification_token)
              .then(deletedUser => {
                console.log("User deleted without confirmation:", deletedUser);
                res.status(200).json({ message: 'User deleted without confirmation', data: deletedUser });
              })
              .catch(error => {
                console.error('Error deleting user:', error.message);
                res.status(500).json({ error: 'Error deleting user', message: error.message });
              });
          }
        } else {
          console.log('User not found with email:', userEmail);
          res.status(404).json({ message: 'User not found' });
        }
      })
      .catch(error => {
        console.error('Error fetching user by email:', error);
        res.status(500).json({ error: 'Error fetching user by email', message: error.message });
      });
  }
});

// VERIFY EMAIL (LINK)
app.patch('/api/confirm', async (req, res) => {
  const verification_token = req.query.token;

  try {
    // Check if the row exists
    const { data: existingData, error: fetchError } = await supabase
        .from(databaseName)
        .select('confirmed')
        .eq('verification_token', verification_token)
        .single();
    
    if (fetchError) {
      throw fetchError;
    }

    if (!existingData) {
      return res.status(404).json({ error: 'Row not found', message: 'No row found with the provided token' });
    }
    
    // If user is not confirmed, confirm them
    if (existingData.confirmed === false) {
      const { error: updateError } = await supabase
          .from(databaseName)
          .update({ confirmed: true })
          .eq('verification_token', verification_token);

      if (updateError) {
        // Handle database update error
        return res.status(500).json({ error: 'Error updating record', message: updateError.message });
      }
      
      return res.status(200).json({ success: true, message: 'User confirmed successfully' });
    } else {
      console.log("This user is already confirmed");
      return res.status(200).json({ message: 'User is already confirmed' });
    }
  } 
  catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'An unexpected error occurred', message: error.message });
  }
});


// Alle emails fetchen op render
app.get('/api/subscriptions', (req, res) => {
  // Logic to fetch all e-mails
  supabase
    .from(databaseName)
    .select('*')
    .then(response => {
      //console.log(response);
      // Assuming you want to send this data back to the client
      res.status(200).json(response.data);
    })
    .catch(error => {
      console.log(error);
      res.status(500).json({message: 'Error reading from Database: ' + error.message});
    });
});


app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})