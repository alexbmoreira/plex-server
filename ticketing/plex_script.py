from plexapi.server import PlexServer
from dotenv import load_dotenv
import os
import subprocess
import pychromecast
from pychromecast.controllers.plex import PlexController
import zeroconf
from time import sleep

load_dotenv()

baseurl = os.environ.get('PLEX_URL')
token = os.environ.get('PLEX_TOKEN')
client = os.environ.get('PLEX_CLIENT')
chromecast_name = os.environ.get('CHROMECAST_NAME')

def find_movie_on_plex(title='12 Angry Men'):
    plex_server = PlexServer(baseurl, token)
    movies = plex_server.library.section('Movies')

    return movies.get(title)

def launch_plex_on_chromecast():
    zconf = zeroconf.Zeroconf()
    browser = pychromecast.CastBrowser(pychromecast.SimpleCastListener(lambda uuid, service: print(browser.devices[uuid].friendly_name)), zconf)
    browser.start_discovery()
    pychromecast.discovery.stop_discovery(browser)

    chromecasts, browser = pychromecast.get_listed_chromecasts(friendly_names=[chromecast_name])

    if not chromecasts:
        print("No Chromecast devices found.")
        return

    cast = chromecasts[0]
    plex_controller = PlexController()
    cast.register_handler(plex_controller)

    cast.wait()

    movie = find_movie_on_plex()

    print(f"Playing {movie.title}")
    plex_controller.block_until_playing(find_movie_on_plex())

def turn_on_projector():
    try:
        subprocess.run(["cec-client", "-s", "-d", "1"], input="on 0\n", text=True, check=True)
        sleep(15)
        print("Turned on projector")
    except subprocess.CalledProcessError as e:
        print(f"Failed to turn on projector: {e}")

turn_on_projector()
launch_plex_on_chromecast()
