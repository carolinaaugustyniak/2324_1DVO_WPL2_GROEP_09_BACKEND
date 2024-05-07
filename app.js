const { createClient } = require('@supabase/supabase-js');
require('dotenv').config()
const jwt = require('jsonwebtoken');
var token = require('crypto-token');
const env = process.env





// Create a single supabase client for interacting with your database
const supabase = createClient('https://gynfpfexzufkpwgdtxzf.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5bmZwZmV4enVma3B3Z2R0eHpmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcxMTQ0ODAwNiwiZXhwIjoyMDI3MDI0MDA2fQ.78C98bwq3Uudzko9sNLlOzDclD89kzoK30b5Qne4UjE')
const express = require('express')
const app = express()
const port = 3000

import { Resend } from 'resend';

const resend = new Resend('re_9GddQPFC_HFX1zwm5gqw86CX3LJVqy7Ri');

resend.emails.send({
  from: 'onboarding@resend.dev',
  to: 'carolina.augustyniak@student.pxl.be',
  subject: 'Hello World',
  html: '<p>Congrats on sending your <strong>first email</strong>!</p>'
});








app.get('/', (req, res) => {
 res.send('Hello World!')
})


app.get('/api/subscriptions', (req, res) => {
    // Logic to fetch all e-mails
    supabase
    .from('subscriptions')
    .select('*')
    .then(response => {
    console.log(response);
    // Assuming you want to send this data back to the client
    res.status(200).json(response.data);
    })
    .catch(error => {
    console.log(error);
    res.status(500).json({message: 'Error reading from Database: ' +
   error.message});
    });
   });
app.listen(port, () => {
 console.log(`Example app listening on port ${port}`)
});