// server.js
const express = require('express');
const crypto = require('crypto');
const Docker = require('dockerode');

const app = express();

app.use(express.static('public'));

const PLEX_TOKEN = process.env.PLEX_TOKEN;
const AUTH_HASH = process.env.AUTH_HASH;
const AUTH_KEY = process.env.AUTH_KEY;
const IP_ADDRESS = process.env.IP_ADDRESS;
const RADARR_API_KEY = process.env.RADARR_API_KEY;
const SONARR_API_KEY = process.env.SONARR_API_KEY;
const PROWLARR_API_KEY = process.env.PROWLARR_API_KEY;

const APPS = ['deluge', 'radarr', 'sonarr', 'prowlarr', 'overseerr'];

async function plexStatus() {
  try {
    const response = await fetch(`http://${IP_ADDRESS}:32400/identity`, {
      headers: {
        'Accept': 'application/json',
        'X-Plex-Token': PLEX_TOKEN
      }
    });

    return { status: response.ok ? 'success' : 'error', data: {} };
  } catch (error) {
    console.log(error);
    return { status: 'error', data: {} };
  }
}

async function delugeStatus() {
  try {
    const response = await fetch(`http://${IP_ADDRESS}:8112`);

    return { status: response.ok ? 'success' : 'error', data: {} };
  } catch (error) {
    console.log(error);
    return { status: 'error', data: {} };
  }
}

async function arrStatus(port, version, apiKey) {
  try {
    const response = await fetch(`http://${IP_ADDRESS}:${port}/api/${version}/indexer/testall`, {
        headers: {
          'X-Api-Key': apiKey,
        },
        method: 'POST'
      }
    )

    const data = await response.json();

    if (response.status === 400) {
      return { status: 'warning', data };
    } else if (response.ok) {
      return { status: 'success', data };
    } else {
      return { status: 'error', data };
    }
  } catch (error) {
    console.log(error);
    return { status: 'error', data: {} };
  }
}

async function overseerrStatus() {
  try {
    const response = await fetch(`http://${IP_ADDRESS}:5055/api/v1/status`)
    const data = await response.json();

    if (!response.ok) {
      return { status: 'error', data };
    } else if (data.restarRequired) {
      return { status: 'error', data };
    }

    return { status: 'success', data };
  } catch (error) {
    console.log(error);
    return { status: 'error', data: {} };
  }
}

async function restartContainers() {
  const docker = new Docker({ socketPath: '/var/run/docker.sock' });

  for (const containerName of APPS) {
    const container = docker.getContainer(containerName);
    await container.restart();
    console.log(`Restarted container: ${containerName}`);
  }
  await new Promise(res => setTimeout(res, 5000));
}

const authenticateRequest = (req, res, next) => {
  const providedPassword = req.headers['x-auth-password'];
  
  if (!providedPassword) {
    return res.status(403).json({ error: 'Authentication required' });
  }

  const providedHash = crypto.createHmac('sha256', AUTH_KEY)
    .update(providedPassword)
    .digest('hex');

  if (!crypto.timingSafeEqual(Buffer.from(AUTH_HASH), Buffer.from(providedHash))) {
    return res.status(403).json({ error: 'Invalid authentication' });
  }

  next();
};

app.get('/api/status/:appName', async (req, res) => {
  const { appName } = req.params;

  switch (appName) {
    case 'plex':
      return res.json({ appName: 'plex', ...(await plexStatus()) })
    case 'deluge':
      return res.json({ appName: 'deluge', ...(await delugeStatus()) })
    case 'radarr':
      return res.json({ appName: 'radarr', ...(await arrStatus(7878, 'v3', RADARR_API_KEY)) })
    case 'sonarr':
      return res.json({ appName: 'sonarr', ...(await arrStatus(8989, 'v3', SONARR_API_KEY)) })
    case 'prowlarr':
      return res.json({ appName: 'prowlarr', ...(await arrStatus(9696, 'v1', PROWLARR_API_KEY)) })
    case 'overseerr':
      return res.json({ appName: 'overseerr', ...(await overseerrStatus()) })
    default:
      return res.status(404).json({ error: 'Invalid app name' });
  }
});

app.post('/api/status/restart', authenticateRequest, async (_req, res) => {    
  try {
    await restartContainers();

    return res.json({ message: 'Containers restarted successfully' });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: 'Failed to restart containers' });
  }
});

app.listen(8080, '0.0.0.0', () => {
  console.log('Server running on port 8080');
});
