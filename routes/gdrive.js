const authorization = require('../middleware/authorization');
const artist = require('../middleware/artist');
const jwt = require('jsonwebtoken');
const config = require('config');
const _ = require('lodash');
const bcrypt = require('bcrypt');
const {validatePassword } = require('../models/user');
const {validateArtist} = require('../models/artist');
const express = require('express');
const router = express.Router();
const multer = require('multer');
const { google } = require('googleapis');
const { Readable } = require('stream');

const storage = multer.memoryStorage(); 
const upload = multer({ storage });

const credentials = {
    client_email: 'kinemusic@continual-bay-401412.iam.gserviceaccount.com',
    private_key: '-----BEGIN PRIVATE KEY-----\nMIIEuwIBADANBgkqhkiG9w0BAQEFAASCBKUwggShAgEAAoIBAQCeFZmFIx44UQo+\nhHbmTXcCxnGtJzbCepfiorD23itwXKZSqwLRpL14TGvLXvCDSBWTsGdhotO7TpPM\nK4QNGsB+S9GIt1ulOb73INGVBkhg5tkFyBEjDqjZRjalqHfwyUrDQGBcUk9UsGn8\nAnDhB7kaZN2BKZhxjzahOxeo0q6+1OnjhJ6Es9jMPZ2apSQ8Ii4JX/OR2cQGI9X3\nmtzCNbqaAMp4xhXRQyAkMpTtNutnK/etaLxS5Fb0Ofkey/n0rR7FqkdVZkqL8ou/\n9o6IFNocfG89v/F3SPYRw2kUG46FxeP/969Ow5kgnlRfunpgVZNrLVkp64kqWyMe\nVyQPgjT5AgMBAAECgf8Fevo3g2Ao06ZnRHBay5S0o+yM9C8Rzu41DS7VYB5hZtTd\nSNBwNCXdZcjW5BOyeW1GEXeECwEMHU1CZr/NNIA34KkC9FhZAgd8ycZ6RB1+PoKH\nkMgHTxrLbYO3en+t+Ux+OF0e1jup0/PYqL0BECN6psSHFcoTJcPfEw1e7O7h7rG6\nH+IwpeDRahR0TRBLWN9x5b2jxFMM2j3OUcWv0WNtSytRQyqwrmYEQIoHkmIVLqXZ\n4B85/ul1qxjSK0Ic8/LzYawsKvor+fkWkbnntOJavFCAhscMHeOs238ML1YATp/d\nE4rAMjyvA34dgcj/v44KdzxqrWpB7AloOqPuYGECgYEAyx7S/7rjD6hWWluP4gnk\nC4QYGt1sglwdgqzyIc+fLmENQcGO//BKjmHaHHt1z95fvw1xGcAJZGkb1KtPHvSO\nY6q7JX668n2AuyiPRULf+Tiqs2Suf6RsDyW/1P2l1pinzB/rhPf0pCF0+Cr/mivF\nccNmim6+pP/ot4H2jnp8BRkCgYEAxz1NE+lbb/sDck1VpGdLV2Q+4nNN1ypUcscZ\n2zgZyaqv3AweTVUhR4uFvAmYW5VVy37X9iqAatDqB+oDlZF3FGuKOYS8qGZQyx8y\n83mf6fJkTG3ht86zde+2hMy5+qux56783GWSA0dBHswtheRGdw++0h8Ged/SfvYP\n4+PcyuECgYEAsESSpPxg2ZCjR4yX43fj356FcKLg7IvVzDYbdf4ATLZKU9sOJss3\nWDJQnlEBnx+ChYC7urXtMKcKUNdNNTbTbmiWOeatg4woL8L1+gwb4+IqOL3RtNFS\nOR7wR3zK8tzNGRZGQ8EOG3UxVb+yyu7bTGtezBlo9jVilgWBmoluoNkCgYB7m5F9\nP/KFh7J8sHPomlkIr92/ug9Z5R4dU168PZLqJaYTG8WU7rLF406l+UH3168xn9E2\nHOos2s3G+S0eFvBMz+cihjJRO6D2U7XVjehjSQlmzWkTEv8NtRmETEs5tFmcRlkE\nF1O+Cu/gvoWjopsA9NjLHYp0BCNgtyHmnZB2oQKBgDEy6XNPnzWHOgdKNtqfdIwF\nDyn4/sJqkAQzoJ+2q0YA/NLijhZ/sMXEJhXMuoAB0Y5JUPilQ6LFNWtLGVW/VPNk\nJ1EqHbeDrW2ttEyUzBSKlQNBSChlQwR7EU098LhKrC+a9liVhrLFGjOqGL/Y6Op1\nimZAAEmyj6fqd6Kvu+Uj\n-----END PRIVATE KEY-----\n',
};

const drive = google.drive({
  version: 'v3',
  auth: new google.auth.JWT(
      credentials.client_email,
      null,
      credentials.private_key,
      ['https://www.googleapis.com/auth/drive.file'],
      null
    ),
});

module.exports = (db) => {

  router.post('/', upload.single('file'), async (req, res) => {
    try {
      const { originalname, buffer } = req.file;
  
      const bufferStream = new Readable();
      bufferStream.push(buffer);
      bufferStream.push(null);

      const fileMetadata = {
        name: originalname,
      };

      const media = {
        mimeType: 'application/octet-stream',
        body: bufferStream,
      };

      const uploadToGoogleDrive = () => {
        return new Promise((resolve, reject) => {
          drive.files.create(
            {
              resource: fileMetadata,
              media,
              fields: 'id',
            },
            (err, file) => {
              if (err) {
                  console.error('Error uploading file to Google Drive:', err);
                  reject(err);
              } else {
                  console.log('File uploaded successfully');
                  resolve(file);
                }
              }
            );
          });
        };
        
      const fileUrl = await uploadToGoogleDrive(originalname, buffer);
      console.log(`file id ${fileUrl.data.id}`)
      
      return res.send(fileUrl.data.id)
    } catch {
      console.error(error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  router.get('/:id', async (req, res) => {
    const fileId = req.params.id;
  
    try {
      // Fetch file metadata from Google Drive
      const response = await drive.files.get({ fileId, alt: 'media' }, { responseType: 'stream' });
  
      // Set the appropriate headers for the response
      res.set('Content-Type', response.headers['content-type']);
      res.set('Content-Length', response.headers['content-length']);
      res.set('Content-Disposition', `attachment; filename="${response.data.name}"`);
  
      // Stream the file data to the response
      response.data.on('end', () => {
        res.end();
      });
      response.data.on('error', (err) => {
        console.error(err);
        res.status(500).send('An error occurred while fetching the file.');
      });
      response.data.pipe(res);
    } catch (err) {
      console.error(err);
      res.status(500).send('An error occurred while fetching the file.');
    }
  });

  return router
}