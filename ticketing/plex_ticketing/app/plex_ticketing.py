from plexapi.server import PlexServer
import zeroconf
import pychromecast
from pychromecast.controllers.plex import PlexController

class Movie():
    def __init__(self, guid, title, summary, image, runtime):
        self.guid = guid.replace('imdb://', '')
        self.title = title
        self.summary = summary
        self.image = image
        self.runtime = runtime

    def to_dict(self):
        return {
            'guid': self.guid,
            'title': self.title,
            'summary': self.summary,
            'image': self.image,
            'runtime': self.runtime
        }

class Server():
    def __init__(self, baseUrl, token):
        self.server = self.__connect(baseUrl, token)

    def list_movies(self, search):
        return [Movie(movie.guids[0].id, movie.title, movie.summary, movie.posterUrl, movie.media[0].duration) for movie in self.__movies().search(title=search)]

    def find_movie(self, guid):
        movie = self.__movies().getGuid(f'imdb://{guid}')
        return Movie(movie.guids[0].id, movie.title, movie.summary, movie.posterUrl, movie.media[0].duration)

    def __connect(self, baseUrl, token):
        return PlexServer(baseUrl, token)

    def __movies(self):
        return self.server.library.section('Movies')


class Cast():
    def __init__(self, baseUrl, token, chromecastName):
        self.__discoverDevice()

        self.server = self.__connect(baseUrl, token)
        self.plexController = self.__plex_controller(chromecastName)

    def play_movie(self, guid):
        movie = self.__movies().getGuid(f'imdb://{guid}')
        self.plexController.block_until_playing(movie)

        return Movie(movie.guids[0].id, movie.title, movie.posterUrl, movie.media[0].duration)

    def __connect(self, baseUrl, token):
        return PlexServer(baseUrl, token)

    def __movies(self):
        return self.server.library.section('Movies')
    
    def __plex_controller(self, chromecastName):
        chromecasts, browser = pychromecast.get_listed_chromecasts(friendly_names=[chromecastName])

        plexController = PlexController()
        cast = chromecasts[0]

        cast.register_handler(plexController)
        cast.wait()

        return plexController
    
    def __discoverDevice(self):
        zconf = zeroconf.Zeroconf()
        browser = pychromecast.CastBrowser(pychromecast.SimpleCastListener(lambda uuid, service: print(browser.devices[uuid].friendly_name)), zconf)
        browser.start_discovery()
        pychromecast.discovery.stop_discovery(browser)
