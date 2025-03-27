from plexapi.server import PlexServer

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
