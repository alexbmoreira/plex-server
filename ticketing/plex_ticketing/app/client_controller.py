import zeroconf
import pychromecast
from pychromecast.controllers.plex import PlexController
from time import sleep
import paramiko

def play_on_chromecast(movie, device_name):
    chromecasts, browser = pychromecast.get_listed_chromecasts(friendly_names=[device_name])
    cast = chromecasts[0]

    plex_controller = PlexController()

    cast.register_handler(plex_controller)
    cast.wait()

    plex_controller.block_until_playing(movie)

def cec_power_on(device_address, device_username, device_password):
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    try:
        client.connect(device_address, username=device_username, password=device_password)

        stdin, stdout, stderr = client.exec_command("cec-client -s -d 1")
        stdin.write("on 0\n")
        stdin.flush()

        stdout.channel.recv_exit_status()

        sleep(15)
    finally:
        client.close()

def anthem_receiver_power_on():
    return None

def pj_projector_power_on():
    return None
