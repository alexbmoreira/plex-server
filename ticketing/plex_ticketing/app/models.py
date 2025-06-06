from plexapi.server import PlexServer

class Movie():
    def __init__(self, movie):
        self.guid = movie.guids[0].id.replace('imdb://', '')
        self.title = movie.title
        self.summary = movie.summary
        self.image = movie.posterUrl
        self.runtime = movie.media[0].duration
        self.plex_object = movie

    def to_dict(self):
        return {
            'guid': self.guid,
            'title': self.title,
            'summary': self.summary,
            'image': self.image,
            'runtime': self.runtime
        }

class PlexConnection():
    def __init__(self, baseUrl, token):
        self.server = self.__connect(baseUrl, token)

    def list_movies(self, search):
        return [Movie(movie) for movie in self.__library().search(title=search)]

    def find_movie(self, guid):
        movie = self.__library().getGuid(f'imdb://{guid}')
        return Movie(movie)

    def __library(self):
        return self.server.library.section('Movies')

    def __connect(self, baseUrl, token):
        return PlexServer(baseUrl, token)
