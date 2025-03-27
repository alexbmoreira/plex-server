const APPS = ['plex', 'deluge', 'radarr', 'sonarr', 'prowlarr', 'overseerr'];

const iconForStatus = status => {
  switch (status) {
    case 'success':
      return 'fa-circle-check';
    case 'error':
      return 'fa-circle-xmark';
    case 'warning':
      return 'fa-triangle-exclamation';
    default:
      throw new Error(`Invalid status ${status}`);
  }
}

async function getStatus(app) {
  const response = await fetch(`/api/status/${app}`);
  return await response.json();
}

async function getStatuses() {
  for (const appName of APPS) {
    const app = document.getElementById(appName)
    app.innerHTML = '<i class="fa-solid fa-spinner animate-spin"></i>';
  }

  const statusPromises = APPS.map(async appName => {
    try {
      const appStatus = await getStatus(appName);

      const appElement = document.getElementById(appName)
      appElement.innerHTML = `<i class="fa-solid ${iconForStatus(appStatus.status)} text-${appStatus.status}"></i>`;

      return appStatus;
    } catch {
      const appElement = document.getElementById(appName)
      appElement.innerHTML = '<i class="fa-solid fa-circle-exclamation text-error"></i>';
    }
  });


  await Promise.all(statusPromises);
}

document.addEventListener('DOMContentLoaded', () => {
  const button = document.getElementById('restartButton');
  const password = document.getElementById('password');
  let showInput = false;

  async function restartApps() {
    if (showInput) {
      try {      
        button.disabled = true;
        button.innerHTML = '<i class="fa-solid fa-spinner animate-spin"></i>';

        await fetch('/api/status/restart', {
          headers: {
            "x-auth-password": password.value,
          },
          method: 'POST'
        });

        button.classList.remove('w-1/3');
        button.classList.add('w-full');
        password.classList.remove('w-2/3', 'p-4');
        password.classList.add('w-0');
        showInput = false;

        await getStatuses();

        button.innerHTML = 'Restart Apps';
      } catch (error) {
        console.error('Error:', error);
      } finally {
        button.disabled = false;
      }
    } else {
      button.classList.remove('w-full');
      button.classList.add('w-1/3');
      button.innerHTML = '<i class="fa-solid fa-arrow-right"></i>';
      password.classList.remove('w-0');
      password.classList.add('w-2/3', 'p-4');
      showInput = true;
    }
  }

  getStatuses();

  button.addEventListener('click', restartApps);
});
